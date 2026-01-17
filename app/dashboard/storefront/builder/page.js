"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";

import SidebarLibrary, { WIDGET_GROUPS } from "@/components/builder/SidebarLibrary";
import BuilderCanvas from "@/components/builder/BuilderCanvas";
import DraggableBlock from "@/components/builder/DraggableBlock";
import { Eye, EyeOff, Edit2, Trash2, GripVertical, Save, ArrowLeft } from "lucide-react";

// Visual Configuration Components
import ColorPicker from "@/components/config/ColorPicker";
import IconSelector from "@/components/config/IconSelector";
import ImageUploader from "@/components/config/ImageUploader";
import GradientBuilder from "@/components/config/GradientBuilder";
import FeaturesArrayEditor from "@/components/config/FeaturesArrayEditor";
import StatsArrayEditor from "@/components/config/StatsArrayEditor";
import PricingPlansEditor from "@/components/config/PricingPlansEditor";
import { AccordionItemsEditor, TabsEditor } from "@/components/config/ContentArrayEditors";
import CTAsArrayEditor from "@/components/config/CTAsArrayEditor";
import AnnouncementMessagesEditor from "@/components/config/AnnouncementMessagesEditor";

// Flatten groups for lookups
const ALL_WIDGET_TYPES = WIDGET_GROUPS.flatMap(g => g.widgets);

export default function PageBuilderPage() {
    const searchParams = useSearchParams();
    const initialPage = searchParams.get('page') || 'home';
    const layoutId = searchParams.get('layoutId'); // Get layoutId from URL
    const [selectedPage, setSelectedPage] = useState(initialPage);
    const [widgets, setWidgets] = useState([]);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingWidget, setEditingWidget] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [activeId, setActiveId] = useState(null); // For DragOverlay

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchPages();
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchWidgets();
        setPendingChanges([]);
    }, [selectedPage]);

    const fetchPages = async () => {
        try {
            const res = await api.get('/page-builder/pages?includeUnpublished=true');
            if (res.data.success) {
                const systemPages = [
                    { id: 'header', slug: 'header', title: 'Global Header' },
                    { id: 'footer', slug: 'footer', title: 'Global Footer' },
                ];
                setPages([...systemPages, ...res.data.pages]);
            }
        } catch (error) {
            console.error('Failed to fetch pages', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories');
            if (res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const fetchWidgets = async () => {
        setLoading(true);
        try {
            let url = `/page-builder/widgets?page=${selectedPage}&includeInactive=true`;
            if (layoutId) {
                url += `&layoutId=${layoutId}`;
            }
            const res = await api.get(url);
            if (res.data.success) {
                setWidgets(res.data.widgets);
            }
        } catch (error) {
            console.error('Failed to fetch widgets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWidget = (widgetType) => {
        setEditingWidget({
            widget_type: widgetType,
            config: getDefaultConfig(widgetType),
            page_type: selectedPage,
            is_active: true,
            sort_order: widgets.length,
            parent_id: null
        });
        setIsModalOpen(true);
    };

    const handleEditWidget = (widget) => {
        setEditingWidget(widget);
        setIsModalOpen(true);
    };

    const handleDeleteWidget = async (widgetId) => {
        if (!confirm('Delete this widget?')) return;

        setWidgets(prev => prev.filter(w => w.id !== widgetId));

        if (widgetId.toString().startsWith('temp_')) {
            setPendingChanges(prev => prev.filter(c => c.tempId !== widgetId && c.id !== widgetId));
        } else {
            setPendingChanges(prev => [
                ...prev.filter(c => c.id !== widgetId),
                { type: 'delete', id: widgetId }
            ]);
        }
    };

    const handleToggleVisibility = async (widget) => {
        setWidgets(prev => prev.map(w =>
            w.id === widget.id ? { ...w, is_active: !w.is_active } : w
        ));

        if (widget.id.toString().startsWith('temp_')) {
            setPendingChanges(prev => prev.map(c =>
                (c.type === 'create' && c.tempId === widget.id)
                    ? { ...c, data: { ...c.data, is_active: !widget.is_active } }
                    : c
            ));
        } else {
            setPendingChanges(prev => [...prev, {
                type: 'update',
                id: widget.id,
                data: { is_active: !widget.is_active }
            }]);
        }
    };

    const handleSaveWidget = async (widgetData) => {
        if (editingWidget.id) {
            // Update existing
            setWidgets(prev => prev.map(w =>
                w.id === editingWidget.id ? { ...editingWidget, ...widgetData } : w
            ));

            if (editingWidget.id.toString().startsWith('temp_')) {
                setPendingChanges(prev => prev.map(c =>
                    (c.type === 'create' && c.tempId === editingWidget.id)
                        ? { ...c, data: { ...c.data, ...widgetData } }
                        : c
                ));
            } else {
                setPendingChanges(prev => [...prev, {
                    type: 'update',
                    id: editingWidget.id,
                    data: widgetData
                }]);
            }
        } else {
            // Create new
            const tempId = `temp_${Date.now()}`;
            const newWidget = {
                ...editingWidget,
                ...widgetData,
                id: tempId
            };
            setWidgets(prev => [...prev, newWidget]);

            setPendingChanges(prev => [...prev, {
                type: 'create',
                tempId,
                data: widgetData
            }]);
        }

        setIsModalOpen(false);
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setWidgets((items) => {
                const oldIndex = items.findIndex(w => w.id === active.id);
                const newIndex = items.findIndex(w => w.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Track reordering as updates
                // Optimization: We could batch this, but for now let's just create updates
                // Note: This logic is tricky. In a real app we'd send a "reorder" API call.
                // PageWidget.reorder expects { id, sort_order }.
                // We should probably rely on a "Save Order" button or implicit save.

                // Let's add all items to pending changes with new sort_order? 
                // That might be too many requests. 
                // Better approach: Calculate changed orders on Save.
                // For now, let's just update local state. The user has to click Save.

                // We need to mark that order changed.
                setPendingChanges(prev => {
                    // Check if we already have a 'reorder' type? No, we stick to update.
                    // We'll figure out sort orders during handleSaveChanges
                    return prev;
                });

                return newItems;
            });
        }

        setActiveId(null);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const tempIdMap = {}; // Map temp_id -> real_uuid

        try {
            // 1. Process explicit CRUD
            for (const change of pendingChanges) {
                if (change.type === 'create') {
                    // Find current index
                    const currentIdx = widgets.findIndex(w => w.id === change.tempId);

                    // Resolve parent_id if it's a temp ID
                    let parentId = change.data.parent_id;
                    if (parentId && parentId.toString().startsWith('temp_')) {
                        parentId = tempIdMap[parentId] || null; // Fallback to null if not found (shouldn't happen if parent created first)
                    }

                    const data = {
                        ...change.data,
                        sort_order: currentIdx,
                        parent_id: parentId,
                        layout_id: layoutId // Attach layout ID
                    };

                    const res = await api.post('/page-builder/widgets', data);

                    // Store mapping
                    if (res.data.success) {
                        tempIdMap[change.tempId] = res.data.widget.id;
                    }

                } else if (change.type === 'update') {
                    // Resolve parent_id if updated to a new temp widget (rare but possible)
                    let data = { ...change.data };
                    if (data.parent_id && data.parent_id.toString().startsWith('temp_')) {
                        data.parent_id = tempIdMap[data.parent_id] || null;
                    }

                    await api.put(`/page-builder/widgets/${change.id}`, data);

                } else if (change.type === 'delete') {
                    await api.delete(`/page-builder/widgets/${change.id}`);
                }
            }

            // 2. Process Reordering
            // We need to use the CURRENT widgets list, but with temp IDs replaced by real IDs
            // The 'widgets' state still has temp IDs. We can map them using tempIdMap.

            const orderPayload = widgets.reduce((acc, w, index) => {
                let id = w.id;
                // If it's a temp ID, try to find the real ID from our recent creates
                if (id.toString().startsWith('temp_')) {
                    id = tempIdMap[id];
                }

                // If we have a valid ID (either original or resolved), add to payload
                if (id) {
                    acc.push({ id, sort_order: index });
                }
                return acc;
            }, []);

            if (orderPayload.length > 0) {
                await api.put('/page-builder/widgets/reorder', { widgets: orderPayload });
            }

            setPendingChanges([]);
            await fetchWidgets();
            alert('Changes saved successfully!');
        } catch (error) {
            alert('Failed to save changes: ' + (error.response?.data?.error || error.message));
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscardChanges = () => {
        if (!confirm('Discard all unsaved changes?')) return;
        setPendingChanges([]);
        fetchWidgets();
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-20">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-blue-600">⚡</span> Storefront Builder
                    </h1>
                    <p className="text-sm text-gray-500">Drag & Drop visual editor</p>
                    {pendingChanges.length > 0 && (
                        <p className="text-sm text-orange-600 font-medium mt-1">
                            ⚠ Unsaved changes
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedPage}
                        onChange={(e) => setSelectedPage(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-gray-50 font-medium text-gray-700"
                        disabled={pendingChanges.length > 0}
                    >
                        {pages.map((page) => (
                            <option key={page.id} value={page.slug}>
                                {page.title}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-sm font-medium disabled:opacity-50 shadow-sm transition-all"
                    >
                        {isSaving ? 'Saving...' : 'Publish Changes'}
                    </button>

                    <Link
                        href="/dashboard/storefront/pages"
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Exit"
                    >
                        <EyeOff size={20} />
                    </Link>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Sidebar Library */}
                <SidebarLibrary onAddWidget={handleAddWidget} />

                {/* Center: Canvas */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <BuilderCanvas widgets={widgets}>
                        {widgets.map((widget) => (
                            <DraggableBlock
                                key={widget.id}
                                widget={widget}
                                onEdit={handleEditWidget}
                                onDelete={handleDeleteWidget}
                                onToggleVisibility={handleToggleVisibility}
                            />
                        ))}
                    </BuilderCanvas>

                    <DragOverlay>
                        {activeId ? (
                            <div className="opacity-90">
                                <DraggableBlock
                                    widget={widgets.find(w => w.id === activeId)}
                                    onEdit={() => { }}
                                    onDelete={() => { }}
                                    onToggleVisibility={() => { }}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Widget Editor Modal */}
            {isModalOpen && (
                <WidgetEditorModal
                    widget={editingWidget}
                    onSave={handleSaveWidget}
                    onClose={() => setIsModalOpen(false)}
                    categories={categories}
                    widgets={widgets}
                />
            )}
        </div>
    );
}

// Widget Editor Modal Component
function WidgetEditorModal({ widget, onSave, onClose, categories = [], widgets = [] }) {
    const [formData, setFormData] = useState(widget);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const updateConfig = (key, value) => {
        setFormData(prev => ({
            ...prev,
            config: { ...prev.config, [key]: value }
        }));
    };

    // Helper to safely update nested config like title.fontSize.desktop
    const updateNestedConfig = (path, value) => {
        setFormData(prev => {
            const config = { ...prev.config };
            const keys = path.split('.');
            let current = config;

            // Navigate to parent of target key
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                // Ensure object exists and preserve existing data
                if (typeof current[key] === 'string') {
                    current[key] = { text: current[key] }; // Convert string to object
                } else if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }

            // Set the final value
            current[keys[keys.length - 1]] = value;

            return {
                ...prev,
                config
            };
        });
    };


    const widgetDef = ALL_WIDGET_TYPES.find(w => w.type === widget.widget_type);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex items-center gap-3 bg-gray-50">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        {widgetDef?.icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {widget.id ? 'Edit' : 'Add'} {widgetDef?.name}
                        </h3>
                        <p className="text-xs text-gray-500">{widgetDef?.description}</p>
                    </div>
                </div>


                <div className="p-6 overflow-y-auto flex-1">
                    <form id="widget-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Parent Selector */}
                        {widgets.some(w => ['container', 'columns'].includes(w.widget_type) && w.id !== widget.id) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Container</label>
                                <select
                                    value={formData.parent_id || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value || null }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                >
                                    <option value="">None (Root Level)</option>
                                    {widgets
                                        .filter(w => ['container', 'columns'].includes(w.widget_type) && w.id !== widget.id)
                                        .map(w => (
                                            <option key={w.id} value={w.id}>
                                                {w.config?.title || w.widget_type} (ID: {w.id.toString().slice(-4)})
                                            </option>
                                        ))}
                                </select>
                            </div>
                        )}

                        {/* Widget Configuration Form */}
                        {renderWidgetForm(widget.widget_type, formData.config, updateConfig, updateNestedConfig, categories)}
                    </form>
                </div>

                <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-5 py-2 hover:bg-gray-200 rounded-lg font-medium text-gray-600 transition-colors">
                        Cancel
                    </button>
                    <button
                        form="widget-form"
                        type="submit"
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}

// Helper: Input Component
function Input({ label, value, onChange, type = "text", ...props }) {
    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <input
                type={type}
                value={value !== undefined && value !== null ? value : ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...props}
            />
        </div>
    );
}


function Textarea({ label, value, onChange, rows = 3 }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={rows}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
        </div>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// Helper: Get default config for widget type
function getDefaultConfig(widgetType) {
    const defaults = {
        container: { padding: '40px', backgroundColor: '', width: 'container' },
        columns: { count: 3, gap: '4' },
        divider: { style: 'solid', color: '#e5e7eb', height: '1px' },
        spacer: { height: '32px' },
        heading: { text: 'Your Title Here', tag: 'h2', align: 'center' },
        text: { content: 'Lorem ipsum dolor sit amet...', size: '1rem', color: '' },
        quote: { text: 'Outstanding service!', author: 'John Doe' },
        image: { url: '', alt: '', caption: '' },

        // ... (Keep existing defaults for commerce widgets)
        header_logo: { height: '32', altText: 'Store Logo' },
        header_nav: { align: 'center', menuLocation: 'header' },
        header_actions: { showCart: true, showAccount: true, showSearch: false },
        footer_column: { title: 'Quick Links', menuLocation: 'footer_1', width: 'col-span-1' },
        hero: { title: 'Welcome', subtitle: 'Shop with us', ctaText: 'Shop Now', ctaLink: '/products', backgroundImage: '' },
        product_grid: { title: 'Featured', limit: 8, columns: 4 },
        product_carousel: { title: 'Best Sellers', limit: 8 },
        category_grid: { title: 'Shop by Category', style: 'grid' },
        featured_product: { productId: '', title: 'Product of the Month' },
        promo_banner: { title: 'Sale', backgroundColor: '#3b82f6', textColor: '#ffffff' },
        testimonials: { testimonials: [{ name: 'John', content: 'Great!', rating: 5 }] },
        features: { features: [{ icon: '✨', title: 'Feature 1', description: 'Desc' }] },
        newsletter: { title: 'Subscribe', buttonText: 'Join' },
        faq: { faqs: [{ question: 'Q?', answer: 'A' }] },
        about: { title: 'Our Story', content: 'We are...' },
        stats: { stats: [{ label: 'Sales', value: '1000+' }] },
        blog_grid: { limit: 3 },
        trust_badges: { style: 'simple' },
        custom_html: { html: '<div>Your HTML here</div>' },
        video: { url: '', title: '' },
        gallery: { images: [] },

        // New Interactive Widgets
        countdown_timer: {
            targetDate: '2026-12-31T23:59:59',
            title: 'Limited Time Offer',
            showDays: true,
            showHours: true,
            showMinutes: true,
            showSeconds: true
        },
        before_after_slider: {
            beforeImage: { url: '', label: 'Before' },
            afterImage: { url: '', label: 'After' },
            defaultPosition: 50
        },
        pricing_table: {
            plans: [
                {
                    name: 'Basic',
                    price: 9.99,
                    currency: 'USD',
                    features: [
                        { text: 'Feature 1', included: true },
                        { text: 'Feature 2', included: true },
                        { text: 'Feature 3', included: false }
                    ],
                    ctaText: 'Get Started',
                    ctaLink: '/signup'
                }
            ]
        },
        accordion: {
            items: [
                { title: 'Question 1', content: 'Answer 1', defaultOpen: true },
                { title: 'Question 2', content: 'Answer 2' }
            ]
        },
        tabs: {
            tabs: [
                { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
                { id: 'tab2', label: 'Tab 2', content: 'Content 2' }
            ]
        },
        announcement_bar: {
            message: 'Free shipping on orders over $50!',
            link: '',
            position: 'top',
            backgroundColor: '#3b82f6',
            textColor: '#ffffff'
        },
    };
    return defaults[widgetType] || {};
}

// Helper: Render form fields based on widget type
function renderWidgetForm(widgetType, config, updateConfig, updateNestedConfig, categories = []) {
    // New Atomic Blocks
    if (widgetType === 'container') return (
        <>
            <Select label="Width" value={config.width || 'container'} onChange={v => updateConfig('width', v)} options={[{ value: 'container', label: 'Fixed Container' }, { value: 'full', label: 'Full Width' }]} />
            <Input label="Padding (e.g. 40px)" value={config.padding || ''} onChange={v => updateConfig('padding', v)} />
            <Input label="Background Color" type="color" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
        </>
    );
    if (widgetType === 'heading') return (
        <>
            <Input label="Heading Text" value={config.text || ''} onChange={v => updateConfig('text', v)} />
            <Select label="Tag" value={config.tag || 'h2'} onChange={v => updateConfig('tag', v)} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(t => ({ value: t, label: t.toUpperCase() }))} />
            <Select label="Alignment" value={config.align || 'left'} onChange={v => updateConfig('align', v)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
        </>
    );
    if (widgetType === 'text') return (
        <>
            <Textarea label="Content" value={config.content || ''} onChange={v => updateConfig('content', v)} rows={5} />
            <Input label="Text Color" type="color" value={config.color || '#000000'} onChange={v => updateConfig('color', v)} />
        </>
    );
    if (widgetType === 'image') return (
        <>
            <Input label="Image URL" value={config.url || ''} onChange={v => updateConfig('url', v)} />
            <Input label="Alt Text" value={config.alt || ''} onChange={v => updateConfig('alt', v)} />
            <Input label="Caption (optional)" value={config.caption || ''} onChange={v => updateConfig('caption', v)} />
        </>
    );

    // ... (Keep existing renderers for commerce widgets)
    // Simplify for brevity - fallback to generic config dumper if needed but better to keep the old switch
    // Re-paste logic from previous file? Yes.

    // Layout Widgets
    if (widgetType === 'divider') return (
        <>
            <Select label="Style" value={config.style || 'solid'} onChange={v => updateConfig('style', v)} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
            <Input label="Color" type="color" value={config.color || '#e5e7eb'} onChange={v => updateConfig('color', v)} />
            <Input label="Height (px)" type="number" value={parseInt(config.height) || 1} onChange={v => updateConfig('height', `${v}px`)} />
            <Select label="Width" value={config.width || '100%'} onChange={v => updateConfig('width', v)} options={[{ value: '100%', label: 'Full (100%)' }, { value: '75%', label: 'Wide (75%)' }, { value: '50%', label: 'Half (50%)' }, { value: '25%', label: 'Quarter (25%)' }]} />
        </>
    );
    if (widgetType === 'spacer') return (
        <>
            <Input label="Height (px)" type="number" value={parseInt(config.height) || 32} onChange={v => updateConfig('height', `${v}px`)} />
            <p className="text-xs text-gray-400 mt-1">Adjust vertical spacing between widgets.</p>
        </>
    );
    if (widgetType === 'columns') return (
        <>
            <Select label="Columns" value={config.count || 3} onChange={v => updateConfig('count', parseInt(v))} options={[2, 3, 4, 5, 6].map(n => ({ value: n, label: `${n} Columns` }))} />
            <Select label="Gap" value={config.gap || '4'} onChange={v => updateConfig('gap', v)} options={[{ value: '0', label: 'None' }, { value: '2', label: 'Small' }, { value: '4', label: 'Medium' }, { value: '8', label: 'Large' }, { value: '12', label: 'Huge' }]} />
            <Select label="Vertical Align" value={config.align || 'start'} onChange={v => updateConfig('align', v)} options={[{ value: 'start', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }]} />
        </>
    );

    // Commerce Widgets
    switch (widgetType) {
        case 'product_carousel':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Limit" type="number" value={config.limit || 8} onChange={v => updateConfig('limit', parseInt(v))} />
                        {widgetType === 'product_grid' && <Input label="Columns" type="number" value={config.columns || 4} onChange={v => updateConfig('columns', parseInt(v))} />}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category (Optional)</label>
                        <select
                            value={config.categoryId || ''}
                            onChange={e => updateConfig('categoryId', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="">All Products</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <Select label="Sort Order" value={config.sort || 'newest'} onChange={v => updateConfig('sort', v)} options={[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'oldest', label: 'Oldest First' },
                        { value: 'price_asc', label: 'Price: Low to High' },
                        { value: 'price_desc', label: 'Price: High to Low' },
                        { value: 'name_asc', label: 'Name: A-Z' },
                        { value: 'name_desc', label: 'Name: Z-A' },
                    ]} />
                </>
            );
        case 'category_grid':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Select label="Style" value={config.style || 'grid'} onChange={v => updateConfig('style', v)} options={[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }]} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Category (Optional)</label>
                        <select
                            value={config.parentCategoryId || ''}
                            onChange={e => updateConfig('parentCategoryId', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                            <option value="">All Top-Level Categories</option>
                            {categories.filter(c => !c.parent_id).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </>
            );
        case 'featured_product':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Input label="Product ID" value={config.productId || ''} onChange={v => updateConfig('productId', v)} />
                </>
            );
        case 'hero':
            return (
                <>
                    {/* Layout */}
                    <Select
                        label="Layout"
                        value={config.layout || 'centered'}
                        onChange={v => updateConfig('layout', v)}
                        options={[
                            { value: 'centered', label: '🎯 Centered' },
                            { value: 'left', label: '⬅️ Left Aligned' },
                            { value: 'right', label: '➡️ Right Aligned' },
                            { value: 'split', label: '⚡ Split Screen' },
                            { value: 'fullscreen', label: '📺 Fullscreen' }
                        ]}
                    />

                    <Select
                        label="CTA Alignment"
                        value={config.ctaAlignment || ''}
                        onChange={v => updateConfig('ctaAlignment', v)}
                        options={[
                            { value: '', label: 'Auto (Follow Layout)' },
                            { value: 'left', label: '⬅️ Left' },
                            { value: 'center', label: '🎯 Center' },
                            { value: 'right', label: '➡️ Right' }
                        ]}
                    />

                    {/* Title */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm">Title Settings</h4>
                        <Input
                            label="Title Text"
                            value={config.title?.text || config.title || ''}
                            onChange={v => {
                                if (typeof config.title === 'string') {
                                    updateConfig('title', { text: v });
                                } else {
                                    updateNestedConfig('title.text', v);
                                }
                            }}
                        />
                        <ColorPicker
                            label="Title Color"
                            value={config.title?.color || '#ffffff'}
                            onChange={v => updateNestedConfig('title.color', v)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <Input label="Desktop Size" value={config.title?.fontSize?.desktop || ''} onChange={v => updateNestedConfig('title.fontSize.desktop', v)} placeholder="4.5rem" />
                            <Input label="Tablet Size" value={config.title?.fontSize?.tablet || ''} onChange={v => updateNestedConfig('title.fontSize.tablet', v)} placeholder="3rem" />
                            <Input label="Mobile Size" value={config.title?.fontSize?.mobile || ''} onChange={v => updateNestedConfig('title.fontSize.mobile', v)} placeholder="2rem" />
                        </div>
                        <Select
                            label="Font Weight"
                            value={config.title?.fontWeight || '700'}
                            onChange={v => updateNestedConfig('title.fontWeight', v)}
                            options={[
                                { value: '400', label: 'Normal' },
                                { value: '500', label: 'Medium' },
                                { value: '600', label: 'Semibold' },
                                { value: '700', label: 'Bold' },
                                { value: '800', label: 'Extra Bold' }
                            ]}
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <Select
                                label="Animation"
                                value={config.title?.animation?.type || 'fade-up'}
                                onChange={v => updateNestedConfig('title.animation.type', v)}
                                options={[
                                    { value: 'fade-up', label: 'Fade Up' },
                                    { value: 'fade-down', label: 'Fade Down' },
                                    { value: 'fade', label: 'Fade' },
                                    { value: 'slide-up', label: 'Slide Up' },
                                    { value: 'slide-left', label: 'Slide Left' },
                                    { value: 'slide-right', label: 'Slide Right' },
                                    { value: 'zoom', label: 'Zoom' },
                                    { value: 'none', label: 'None' }
                                ]}
                            />
                            <Input
                                label="Duration (ms)"
                                type="number"
                                value={config.title?.animation?.duration || ''}
                                onChange={v => updateNestedConfig('title.animation.duration', v ? parseInt(v) : '')}
                                placeholder="800"
                            />
                            <Input
                                label="Delay (ms)"
                                type="number"
                                value={config.title?.animation?.delay || ''}
                                onChange={v => updateNestedConfig('title.animation.delay', v ? parseInt(v) : '')}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm">Subtitle Settings</h4>
                        <Input
                            label="Subtitle"
                            value={config.subtitle?.text || config.subtitle || ''}
                            onChange={v => {
                                if (typeof config.subtitle === 'string') {
                                    updateConfig('subtitle', { text: v });
                                } else {
                                    updateNestedConfig('subtitle.text', v);
                                }
                            }}
                        />
                        <ColorPicker
                            label="Subtitle Color"
                            value={config.subtitle?.color || '#ffffff'}
                            onChange={v => updateNestedConfig('subtitle.color', v)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <Input label="Desktop Size" value={config.subtitle?.fontSize?.desktop || ''} onChange={v => updateNestedConfig('subtitle.fontSize.desktop', v)} placeholder="1.5rem" />
                            <Input label="Tablet Size" value={config.subtitle?.fontSize?.tablet || ''} onChange={v => updateNestedConfig('subtitle.fontSize.tablet', v)} placeholder="1.25rem" />
                            <Input label="Mobile Size" value={config.subtitle?.fontSize?.mobile || ''} onChange={v => updateNestedConfig('subtitle.fontSize.mobile', v)} placeholder="1rem" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Select
                                label="Animation"
                                value={config.subtitle?.animation?.type || 'fade-up'}
                                onChange={v => updateNestedConfig('subtitle.animation.type', v)}
                                options={[
                                    { value: 'fade-up', label: 'Fade Up' },
                                    { value: 'fade-down', label: 'Fade Down' },
                                    { value: 'fade', label: 'Fade' },
                                    { value: 'slide-up', label: 'Slide Up' },
                                    { value: 'slide-left', label: 'Slide Left' },
                                    { value: 'slide-right', label: 'Slide Right' },
                                    { value: 'zoom', label: 'Zoom' },
                                    { value: 'none', label: 'None' }
                                ]}
                            />
                            <Input
                                label="Duration (ms)"
                                type="number"
                                value={config.subtitle?.animation?.duration || ''}
                                onChange={v => updateNestedConfig('subtitle.animation.duration', v ? parseInt(v) : '')}
                                placeholder="800"
                            />
                            <Input
                                label="Delay (ms)"
                                type="number"
                                value={config.subtitle?.animation?.delay || ''}
                                onChange={v => updateNestedConfig('subtitle.animation.delay', v ? parseInt(v) : '')}
                                placeholder="200"
                            />
                        </div>
                    </div>

                    {/* Background Type */}
                    <Select
                        label="Background Type"
                        value={config.backgroundType || 'image'}
                        onChange={v => updateConfig('backgroundType', v)}
                        options={[
                            { value: 'image', label: '🖼️ Image' },
                            { value: 'video', label: '🎬 Video' },
                            { value: 'gradient', label: '🌈 Gradient' },
                            { value: 'particles', label: '✨ Particles' },
                            { value: 'solid', label: '🎨 Solid Color' }
                        ]}
                    />

                    {/* Background Image */}
                    {(config.backgroundType === 'image' || !config.backgroundType) && (
                        <ImageUploader
                            label="Background Image"
                            value={config.backgroundImage || ''}
                            onChange={v => updateConfig('backgroundImage', v)}
                            aspectRatio="16/9"
                        />
                    )}

                    {/* Background Video */}
                    {config.backgroundType === 'video' && (
                        <Input label="Video URL (MP4)" value={config.videoUrl || ''} onChange={v => updateConfig('videoUrl', v)} />
                    )}

                    {/* Gradient */}
                    {config.backgroundType === 'gradient' && (
                        <GradientBuilder
                            label="Background Gradient"
                            value={config.gradient || {}}
                            onChange={v => updateConfig('gradient', v)}
                        />
                    )}

                    {/* Solid Color */}
                    {config.backgroundType === 'solid' && (
                        <ColorPicker
                            label="Background Color"
                            value={config.backgroundColor || '#1e3a8a'}
                            onChange={v => updateConfig('backgroundColor', v)}
                        />
                    )}

                    {/* Particles Settings */}
                    {config.backgroundType === 'particles' && (
                        <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-sm text-purple-900">✨ Particle Settings</h4>
                            <Input label="Particle Count" type="number" value={config.particles?.count || 80} onChange={v => updateConfig('particles', { ...config.particles, count: parseInt(v) })} />
                            <ColorPicker label="Particle Color" value={config.particles?.color || '#ffffff'} onChange={v => updateConfig('particles', { ...config.particles, color: v })} />
                            <Input label="Particle Speed" type="number" step="0.1" value={config.particles?.speed || 2} onChange={v => updateConfig('particles', { ...config.particles, speed: parseFloat(v) })} />
                        </div>
                    )}

                    {/* Overlay */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.overlay?.enabled || false} onChange={e => updateConfig('overlay', { ...config.overlay, enabled: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="font-medium text-sm">Enable Overlay</span>
                        </label>
                        {config.overlay?.enabled && (
                            <>
                                <ColorPicker label="Overlay Color" value={config.overlay?.color || '#000000'} onChange={v => updateConfig('overlay', { ...config.overlay, color: v })} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Opacity: {config.overlay?.opacity || 0.5}</label>
                                    <input type="range" min="0" max="1" step="0.1" value={config.overlay?.opacity || 0.5} onChange={e => updateConfig('overlay', { ...config.overlay, opacity: parseFloat(e.target.value) })} className="w-full" />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Parallax */}
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.parallax?.enabled || false}
                            onChange={e => updateConfig('parallax', { ...config.parallax, enabled: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium">✨ Enable Parallax Scrolling</span>
                    </label>

                    {/* Multiple CTAs */}
                    <CTAsArrayEditor
                        value={config.ctas || (config.ctaText ? [{ text: config.ctaText, link: config.ctaLink || '', style: 'primary' }] : [])}
                        onChange={v => updateConfig('ctas', v)}
                    />

                    {/* Height */}
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Height Desktop" value={config.height?.desktop || config.height || '600px'} onChange={v => updateConfig('height', typeof config.height === 'object' ? { ...config.height, desktop: v } : { desktop: v, tablet: '500px', mobile: '400px' })} placeholder="600px" />
                        <Input label="Height Tablet" value={config.height?.tablet || '500px'} onChange={v => updateConfig('height', typeof config.height === 'object' ? { ...config.height, tablet: v } : { desktop: '600px', tablet: v, mobile: '400px' })} placeholder="500px" />
                        <Input label="Height Mobile" value={config.height?.mobile || '400px'} onChange={v => updateConfig('height', typeof config.height === 'object' ? { ...config.height, mobile: v } : { desktop: '600px', tablet: '500px', mobile: v })} placeholder="400px" />
                    </div>
                </>
            );
        case 'promo_banner':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Input label="Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Background Color" type="color" value={config.backgroundColor || '#3b82f6'} onChange={v => updateConfig('backgroundColor', v)} />
                        <Input label="Text Color" type="color" value={config.textColor || '#ffffff'} onChange={v => updateConfig('textColor', v)} />
                    </div>
                    <Input label="Link URL" value={config.link || ''} onChange={v => updateConfig('link', v)} />
                </>
            );
        case 'newsletter':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Input label="Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} />
                    <Input label="Placeholder" value={config.placeholder || ''} onChange={v => updateConfig('placeholder', v)} />
                    <Input label="Button Text" value={config.buttonText || ''} onChange={v => updateConfig('buttonText', v)} />

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Layout" value={config.layout || 'inline'} onChange={v => updateConfig('layout', v)} options={[
                            { value: 'inline', label: 'Inline' },
                            { value: 'stacked', label: 'Stacked' },
                            { value: 'minimal', label: 'Minimal' }
                        ]} />
                        <Input label="Button Loading Text" value={config.loadingText || 'Sending...'} onChange={v => updateConfig('loadingText', v)} />
                    </div>

                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm">Background</h4>
                        <ColorPicker label="Section Background" value={config.backgroundColor || '#f3f4f6'} onChange={v => updateConfig('backgroundColor', v)} />
                        <ColorPicker label="Text Color" value={config.textColor || '#1f2937'} onChange={v => updateConfig('textColor', v)} />
                    </div>

                    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                        <h4 className="font-medium text-sm">⌨️ Input Style</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Input Bg" value={config.inputStyle?.backgroundColor || '#ffffff'} onChange={v => updateNestedConfig('inputStyle.backgroundColor', v)} />
                            <ColorPicker label="Border" value={config.inputStyle?.borderColor || '#e5e7eb'} onChange={v => updateNestedConfig('inputStyle.borderColor', v)} />
                            <ColorPicker label="Text" value={config.inputStyle?.textColor || '#1f2937'} onChange={v => updateNestedConfig('inputStyle.textColor', v)} />
                            <Input label="Radius" value={config.inputStyle?.borderRadius || '8px'} onChange={v => updateNestedConfig('inputStyle.borderRadius', v)} />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-900 text-white rounded-lg space-y-3">
                        <h4 className="font-medium text-sm">🔘 Button Style</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Button Bg" value={config.buttonStyle?.backgroundColor || '#111827'} onChange={v => updateNestedConfig('buttonStyle.backgroundColor', v)} />
                            <ColorPicker label="Text Color" value={config.buttonStyle?.textColor || '#ffffff'} onChange={v => updateNestedConfig('buttonStyle.textColor', v)} />
                            <Input label="Radius" value={config.buttonStyle?.borderRadius || '8px'} onChange={v => updateNestedConfig('buttonStyle.borderRadius', v)} className="text-black" />
                        </div>
                    </div>
                </>
            );

        case 'testimonials':
            return (
                <>
                    <Input label="Section Title" value={config.title || 'What Our Customers Say'} onChange={v => updateConfig('title', v)} />
                    <ColorPicker label="Title Color" value={config.titleColor || '#111827'} onChange={v => updateConfig('titleColor', v)} />

                    <TestimonialsListEditor
                        value={config.testimonials || []}
                        onChange={v => updateConfig('testimonials', v)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Layout" value={config.layout || 'carousel'} onChange={v => updateConfig('layout', v)} options={[
                            { value: 'carousel', label: 'Carousel' },
                            { value: 'grid', label: 'Grid' }
                        ]} />
                        <Input label="Autoplay Interval (ms)" type="number" value={config.interval || 5000} onChange={v => updateConfig('interval', parseInt(v))} />
                    </div>

                    <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.autoPlay !== false} onChange={e => updateConfig('autoPlay', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Auto Play</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showImage !== false} onChange={e => updateConfig('showImage', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Image</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showRole !== false} onChange={e => updateConfig('showRole', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Role</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showDate !== false} onChange={e => updateConfig('showDate', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Date</span>
                        </label>
                    </div>

                    <ColorPicker label="Section Background" value={config.backgroundColor || '#f9fafb'} onChange={v => updateConfig('backgroundColor', v)} />

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3">
                        <h4 className="font-medium text-sm">🎨 Card Style</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Card Bg" value={config.cardStyle?.backgroundColor || '#ffffff'} onChange={v => updateNestedConfig('cardStyle.backgroundColor', v)} />
                            <ColorPicker label="Text Color" value={config.cardStyle?.textColor || '#374151'} onChange={v => updateNestedConfig('cardStyle.textColor', v)} />
                            <ColorPicker label="Star Color" value={config.cardStyle?.starColor || '#facc15'} onChange={v => updateNestedConfig('cardStyle.starColor', v)} />
                        </div>
                        <Select label="Shadow" value={config.cardStyle?.shadow || 'xl'} onChange={v => updateNestedConfig('cardStyle.shadow', v)} options={[
                            { value: 'none', label: 'None' },
                            { value: 'sm', label: 'Small' },
                            { value: 'xl', label: 'Soft Large' }
                        ]} />
                    </div>
                </>
            );
        case 'about':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Textarea label="Content" value={config.content || ''} onChange={v => updateConfig('content', v)} rows={5} />
                    <Input label="Image URL" value={config.image || ''} onChange={v => updateConfig('image', v)} />
                </>
            );
        case 'video':
            return (
                <>
                    <Input label="Video URL (YouTube/Vimeo)" value={config.url || ''} onChange={v => updateConfig('url', v)} />
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={config.autoplay || false} onChange={e => updateConfig('autoplay', e.target.checked)} /> Autoplay (Muted)</label>
                </>
            );
        case 'custom_html':
            return (
                <Textarea label="HTML Content" value={config.html || ''} onChange={v => updateConfig('html', v)} rows={12} className="font-mono text-xs" />
            );
        case 'trust_badges':
            const badges = config.badges || [];
            const addBadge = () => {
                const newBadges = [...badges, { name: 'New Badge', icon: 'secure', text: '' }];
                updateConfig('badges', newBadges);
            };
            const removeBadge = (index) => {
                const newBadges = badges.filter((_, i) => i !== index);
                updateConfig('badges', newBadges);
            };
            const updateBadge = (index, field, value) => {
                const newBadges = [...badges];
                newBadges[index] = { ...newBadges[index], [field]: value };
                updateConfig('badges', newBadges);
            };

            return (
                <>
                    <Select
                        label="Style"
                        value={config.style || 'simple'}
                        onChange={v => updateConfig('style', v)}
                        options={[
                            { value: 'simple', label: 'Simple Icons' },
                            { value: 'cards', label: 'Cards with Text' }
                        ]}
                    />

                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Badges</label>
                            <button
                                type="button"
                                onClick={addBadge}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                + Add Badge
                            </button>
                        </div>

                        {badges.length === 0 && (
                            <p className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded border border-dashed">
                                No badges configured. Will use defaults (Secure Payment, Free Shipping, Returns, Authenticity).
                            </p>
                        )}

                        <div className="space-y-3">
                            {badges.map((badge, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded border space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-600">Badge #{index + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeBadge(index)}
                                            className="text-red-600 hover:text-red-700 text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <Input
                                        label="Name"
                                        value={badge.name || ''}
                                        onChange={v => updateBadge(index, 'name', v)}
                                        placeholder="e.g., Secure Payment"
                                    />
                                    <Select
                                        label="Icon"
                                        value={badge.icon || 'secure'}
                                        onChange={v => updateBadge(index, 'icon', v)}
                                        options={[
                                            { value: 'secure', label: '🔒 Secure/Lock' },
                                            { value: 'shipping', label: '🚚 Shipping/Delivery' },
                                            { value: 'returns', label: '↻ Returns/Refund' },
                                            { value: 'guarantee', label: '🛡️ Guarantee/Shield' },
                                            { value: 'visa', label: '💳 Visa/Card' },
                                            { value: 'mastercard', label: '💳 Mastercard' },
                                            { value: 'paypal', label: '💳 PayPal' },
                                            { value: 'amex', label: '💳 Amex' }
                                        ]}
                                    />
                                    <Input
                                        label="Image URL (Overrides Icon)"
                                        value={badge.image || ''}
                                        onChange={v => updateBadge(index, 'image', v)}
                                        placeholder="https://example.com/logo.png"
                                    />
                                    <Input
                                        label="Subtitle (optional)"
                                        value={badge.text || ''}
                                        onChange={v => updateBadge(index, 'text', v)}
                                        placeholder="e.g., 256-bit SSL Encrypted"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            );

        // Header & Footer
        case 'header_logo':
            return (
                <>
                    <Input label="Height (px)" value={config.height || '32'} onChange={v => updateConfig('height', v)} />
                    <Input label="Alt Text" value={config.altText || ''} onChange={v => updateConfig('altText', v)} />
                </>
            );
        case 'header_nav':
            return (
                <Select label="Alignment" value={config.align || 'center'} onChange={v => updateConfig('align', v)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
            );
        case 'header_actions':
            return (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium text-gray-700">Display Options</p>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={config.showCart !== false} onChange={e => updateConfig('showCart', e.target.checked)} /> Show Cart Icon</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={config.showAccount !== false} onChange={e => updateConfig('showAccount', e.target.checked)} /> Show Account Icon</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={config.showSearch !== false} onChange={e => updateConfig('showSearch', e.target.checked)} /> Show Search Bar</label>
                </div>
            );
        case 'footer_column':
            return (
                <>
                    <Input label="Column Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Select label="Width" value={config.width || 'col-span-1'} onChange={v => updateConfig('width', v)} options={[{ value: 'col-span-1', label: '1 Column' }, { value: 'col-span-2', label: '2 Columns' }]} />
                    {/* Future: Add menu selector here */}
                </>
            );

        // Complex Lists (JSON Fallback for now)
        case 'testimonials':
        case 'faq':
        case 'gallery':
        case 'blog_grid':
            // Try to identify the key
            const key = widgetType === 'faq' ? 'faqs' : widgetType; // or same name
            const val = config[key] || config[widgetType] || [];
            return (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Data Items (JSON)</label>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Advanced</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Configure individual items via JSON array structure.</p>
                    <Textarea
                        label=""
                        value={JSON.stringify(config, null, 2)}
                        onChange={v => {
                            try {
                                const parsed = JSON.parse(v);
                                Object.keys(parsed).forEach(k => updateConfig(k, parsed[k]));
                            } catch (e) { }
                        }}
                        rows={12}
                        className="font-mono text-xs"
                    />
                </div>
            );

        // Enhanced Existing Widgets with Visual Editors
        case 'features':
            return (
                <>
                    <Input label="Section Title (optional)" value={config.title || ''} onChange={v => updateConfig('title', v)} />

                    <Select
                        label="Layout"
                        value={config.layout || 'grid'}
                        onChange={v => updateConfig('layout', v)}
                        options={[
                            { value: 'grid', label: '📊 Grid' },
                            { value: 'carousel', label: '🎠 Carousel' },
                            { value: 'masonry', label: '🧱 Masonry' },
                            { value: 'timeline', label: '⏳ Timeline' }
                        ]}
                    />

                    <FeaturesArrayEditor
                        value={config.features || []}
                        onChange={v => updateConfig('features', v)}
                    />

                    <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-sm">✨ Animations & Effects</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Hover Effect" value={config.hoverEffect || 'lift'} onChange={v => updateConfig('hoverEffect', v)} options={[
                                { value: 'none', label: 'None' },
                                { value: 'lift', label: 'Lift' },
                                { value: 'scale', label: 'Scale' },
                                { value: 'glow', label: 'Glow' },
                                { value: 'tilt', label: 'Tilt' }
                            ]} />
                            <Select label="Entrance Animation" value={config.entranceAnimation || 'slide-up'} onChange={v => updateConfig('entranceAnimation', v)} options={[
                                { value: 'none', label: 'None' },
                                { value: 'fade', label: 'Fade In' },
                                { value: 'slide-up', label: 'Slide Up' },
                                { value: 'zoom', label: 'Zoom' }
                            ]} />
                        </div>
                        <Input label="Stagger Delay (ms)" type="number" value={config.staggerDelay || 100} onChange={v => updateConfig('staggerDelay', parseInt(v))} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Columns (Desktop)" type="number" value={config.columns?.desktop || 4} onChange={v => updateConfig('columns', { ...config.columns, desktop: parseInt(v) })} />
                        <Input label="Columns (Tablet)" type="number" value={config.columns?.tablet || 2} onChange={v => updateConfig('columns', { ...config.columns, tablet: parseInt(v) })} />
                        <Input label="Columns (Mobile)" type="number" value={config.columns?.mobile || 1} onChange={v => updateConfig('columns', { ...config.columns, mobile: parseInt(v) })} />
                    </div>
                </>
            );

        case 'stats':
            return (
                <>
                    <Select
                        label="Layout"
                        value={config.layout || 'horizontal'}
                        onChange={v => updateConfig('layout', v)}
                        options={[
                            { value: 'horizontal', label: 'Horizontal' },
                            { value: 'vertical', label: 'Vertical' }
                        ]}
                    />

                    <StatsArrayEditor
                        value={config.stats || []}
                        onChange={v => updateConfig('stats', v)}
                    />

                    <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-sm">🎨 Background</h4>
                        <Select label="Background Type" value={config.background?.type || 'solid'} onChange={v => updateConfig('background', { ...config.background, type: v })} options={[
                            { value: 'solid', label: 'Solid Color' },
                            { value: 'gradient', label: 'Gradient' }
                        ]} />
                        {config.background?.type === 'gradient' ? (
                            <GradientBuilder
                                label="Background  Gradient"
                                value={config.background?.gradient || {}}
                                onChange={v => updateConfig('background', { ...config.background, gradient: v })}
                            />
                        ) : (
                            <ColorPicker label="Background Color" value={config.background?.color || '#3b82f6'} onChange={v => updateConfig('background', { ...config.background, color: v })} />
                        )}
                    </div>

                    <ColorPicker
                        label="Text Color"
                        value={config.textColor || '#ffffff'}
                        onChange={v => updateConfig('textColor', v)}
                    />

                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Value Size (Desktop)" value={config.valueSize?.desktop || '4rem'} onChange={v => updateConfig('valueSize', { ...config.valueSize, desktop: v })} placeholder="4rem" />
                        <Input label="Value Size (Tablet)" value={config.valueSize?.tablet || '3rem'} onChange={v => updateConfig('valueSize', { ...config.valueSize, tablet: v })} placeholder="3rem" />
                        <Input label="Value Size (Mobile)" value={config.valueSize?.mobile || '2.5rem'} onChange={v => updateConfig('valueSize', { ...config.valueSize, mobile: v })} placeholder="2.5rem" />
                    </div>

                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.separator?.enabled || false} onChange={e => updateConfig('separator', { ...config.separator, enabled: e.target.checked })} className="w-4 h-4" />
                            <span className="text-sm font-medium">Show Separators</span>
                        </label>
                        {config.separator?.enabled && (
                            <div className="grid grid-cols-2 gap-2">
                                <ColorPicker label="Separator Color" value={config.separator?.color || 'rgba(255,255,255,0.2)'} onChange={v => updateConfig('separator', { ...config.separator, color: v })} />
                                <Input label="Width (px)" type="number" value={config.separator?.width || 1} onChange={v => updateConfig('separator', { ...config.separator, width: parseInt(v) })} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Columns (Desktop)" type="number" value={config.columns?.desktop || 4} onChange={v => updateConfig('columns', { ...config.columns, desktop: parseInt(v) })} />
                        <Input label="Columns (Tablet)" type="number" value={config.columns?.tablet || 2} onChange={v => updateConfig('columns', { ...config.columns, tablet: parseInt(v) })} />
                        <Input label="Columns (Mobile)" type="number" value={config.columns?.mobile || 2} onChange={v => updateConfig('columns', { ...config.columns, mobile: parseInt(v) })} />
                    </div>
                </>
            );

        // New Interactive Widgets
        case 'countdown_timer':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} placeholder="🔥 Flash Sale Ends In" />
                    <Input label="Subtitle (optional)" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} placeholder="Hurry up! Don't miss out" />

                    <Input label="Target Date" type="datetime-local" value={config.targetDate?.slice(0, 16) || ''} onChange={v => updateConfig('targetDate', v + ':00')} />

                    <Select label="Timezone" value={config.timezone || 'UTC'} onChange={v => updateConfig('timezone', v)} options={[
                        { value: 'UTC', label: 'UTC' },
                        { value: 'America/New_York', label: 'Eastern (US)' },
                        { value: 'America/Chicago', label: 'Central (US)' },
                        { value: 'America/Denver', label: 'Mountain (US)' },
                        { value: 'America/Los_Angeles', label: 'Pacific (US)' }
                    ]} />

                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="col-span-2 font-medium text-sm">Display Options</h4>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={config.showDays !== false} onChange={e => updateConfig('showDays', e.target.checked)} className="w-4 h-4" /> Show Days</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={config.showHours !== false} onChange={e => updateConfig('showHours', e.target.checked)} className="w-4 h-4" /> Show Hours</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={config.showMinutes !== false} onChange={e => updateConfig('showMinutes', e.target.checked)} className="w-4 h-4" /> Show Minutes</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={config.showSeconds !== false} onChange={e => updateConfig('showSeconds', e.target.checked)} className="w-4 h-4" /> Show Seconds</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Layout" value={config.layout || 'horizontal'} onChange={v => updateConfig('layout', v)} options={[
                            { value: 'horizontal', label: 'Horizontal' },
                            { value: 'vertical', label: 'Vertical' },
                            { value: 'circular', label: 'Circular' }
                        ]} />
                        <Select label="Size" value={config.size || 'md'} onChange={v => updateConfig('size', v)} options={[
                            { value: 'sm', label: 'Small' },
                            { value: 'md', label: 'Medium' },
                            { value: 'lg', label: 'Large' }
                        ]} />
                    </div>

                    <Select label="Digit Style" value={config.digitStyle || 'static'} onChange={v => updateConfig('digitStyle', v)} options={[
                        { value: 'static', label: 'Static' },
                        { value: 'flip', label: 'Flip Animation' },
                        { value: 'rotate', label: 'Rotate' },
                        { value: 'slide', label: 'Slide' }
                    ]} />

                    <Select label="Color Scheme" value={config.colorScheme || 'primary'} onChange={v => updateConfig('colorScheme', v)} options={[
                        { value: 'primary', label: '🔵 Primary (Blue)' },
                        { value: 'danger', label: '🔴 Danger (Red)' },
                        { value: 'success', label: '🟢 Success (Green)' },
                        { value: 'warning', label: '🟡 Warning (Yellow)' },
                        { value: 'custom', label: '🎨 Custom' }
                    ]} />

                    {config.colorScheme === 'custom' && (
                        <ColorPicker label="Custom Color" value={config.customColor || '#3b82f6'} onChange={v => updateConfig('customColor', v)} />
                    )}

                    <label className="flex items-center gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer">
                        <input type="checkbox" checked={config.pulseWhenLow || false} onChange={e => updateConfig('pulseWhenLow', e.target.checked)} className="w-4 h-4 text-red-600 rounded" />
                        <span className="text-sm font-medium">⚡ Pulse When Time is Low</span>
                    </label>

                    {config.pulseWhenLow && (
                        <>
                            <Input label="Low Threshold (days)" type="number" value={config.lowThreshold?.days || 1} onChange={v => updateConfig('lowThreshold', { ...config.lowThreshold, days: parseInt(v) })} />
                            <ColorPicker label="Urgent Color" value={config.urgentColor || '#ef4444'} onChange={v => updateConfig('urgentColor', v)} />
                        </>
                    )}
                </>
            );
        case 'product_grid':
            return (
                <>
                    <Input label="Title" value={config.title || 'Products'} onChange={v => updateConfig('title', v)} />
                    <Input label="Result Limit" type="number" value={config.limit || 8} onChange={v => updateConfig('limit', parseInt(v))} />

                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Cols (PC)" type="number" value={config.columns?.desktop || 4} onChange={v => updateNestedConfig('columns.desktop', parseInt(v))} />
                        <Input label="Cols (Tab)" type="number" value={config.columns?.tablet || 2} onChange={v => updateNestedConfig('columns.tablet', parseInt(v))} />
                        <Input label="Cols (Mob)" type="number" value={config.columns?.mobile || 1} onChange={v => updateNestedConfig('columns.mobile', parseInt(v))} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showAddToCart !== false} onChange={e => updateConfig('showAddToCart', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">🛒 Add to Cart</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showPrice !== false} onChange={e => updateConfig('showPrice', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">💰 Show Price</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showFeaturedBadge !== false} onChange={e => updateConfig('showFeaturedBadge', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">⭐ Featured Badge</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showViewDetails !== false} onChange={e => updateConfig('showViewDetails', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">👁️ View Button</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showTags || false} onChange={e => updateConfig('showTags', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">🏷️ Show Tags</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showAttributes || false} onChange={e => updateConfig('showAttributes', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">✨ Show Attributes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showDescription || false} onChange={e => updateConfig('showDescription', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">📝 Description</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showSocialProof || false} onChange={e => updateConfig('showSocialProof', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">❤️ Social Proof</span>
                        </label>
                    </div>


                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                        <h4 className="font-medium text-sm">🎨 Card Styling</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker
                                label="Card Background"
                                value={config.cardStyle?.backgroundColor || '#ffffff'}
                                onChange={v => updateNestedConfig('cardStyle.backgroundColor', v)}
                            />
                            <ColorPicker
                                label="Border Color"
                                value={config.cardStyle?.borderColor || '#e5e7eb'}
                                onChange={v => updateNestedConfig('cardStyle.borderColor', v)}
                            />
                        </div>
                        <Select label="Shadow" value={config.cardStyle?.shadow || 'md'} onChange={v => updateNestedConfig('cardStyle.shadow', v)} options={[
                            { value: 'none', label: 'None' },
                            { value: 'sm', label: 'Small' },
                            { value: 'md', label: 'Medium' },
                            { value: 'lg', label: 'Large' },
                            { value: 'xl', label: 'Extra Large' }
                        ]} />
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                        <h4 className="font-medium text-sm">🌈 Colors</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Text" value={config.colors?.text || '#111827'} onChange={v => updateNestedConfig('colors.text', v)} />
                            <ColorPicker label="Price" value={config.colors?.price || '#111827'} onChange={v => updateNestedConfig('colors.price', v)} />
                            <ColorPicker label="Accent/Button" value={config.colors?.accent || '#3b82f6'} onChange={v => updateNestedConfig('colors.accent', v)} />
                            <ColorPicker label="Badge Bg" value={config.colors?.badgeBackground || '#fbbf24'} onChange={v => updateNestedConfig('colors.badgeBackground', v)} />
                        </div>
                    </div>
                </>
            );
        case 'before_after_slider':
            return (
                <>
                    <ImageUploader
                        label="Before Image"
                        value={config.beforeImage?.url || ''}
                        onChange={v => updateConfig('beforeImage', { ...config.beforeImage, url: v })}
                        aspectRatio="16/9"
                    />
                    <Input label="Before Label" value={config.beforeImage?.label || 'Before'} onChange={v => updateConfig('beforeImage', { ...config.beforeImage, label: v })} />

                    <ImageUploader
                        label="After Image"
                        value={config.afterImage?.url || ''}
                        onChange={v => updateConfig('afterImage', { ...config.afterImage, url: v })}
                        aspectRatio="16/9"
                    />
                    <Input label="After Label" value={config.afterImage?.label || 'After'} onChange={v => updateConfig('afterImage', { ...config.afterImage, label: v })} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Slider Position: {config.defaultPosition || 50}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.defaultPosition || 50}
                            onChange={e => updateConfig('defaultPosition', parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </>
            );
        case 'pricing_table':
            return (
                <>
                    <PricingPlansEditor
                        value={config.plans || []}
                        onChange={v => updateConfig('plans', v)}
                    />

                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-sm">💰 Billing Toggle</h4>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.billingToggle?.enabled || false} onChange={e => updateConfig('billingToggle', { enabled: e.target.checked, options: ['monthly', 'yearly'], yearlyDiscount: config.billingToggle?.yearlyDiscount || 20 })} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Enable Monthly/Yearly Toggle</span>
                        </label>
                        {config.billingToggle?.enabled && (
                            <Input label="Yearly Discount (%)" type="number" value={config.billingToggle?.yearlyDiscount || 20} onChange={v => updateConfig('billingToggle', { ...config.billingToggle, yearlyDiscount: parseInt(v) })} />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.showComparison || false} onChange={e => updateConfig('showComparison', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">📊 Show Comparison Table</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.tooltipsEnabled || false} onChange={e => updateConfig('tooltipsEnabled', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">💬 Enable Tooltips</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Columns (Desktop)" type="number" value={config.columns?.desktop || 3} onChange={v => updateConfig('columns', { ...config.columns, desktop: parseInt(v) })} />
                        <Input label="Columns (Tablet)" type="number" value={config.columns?.tablet || 2} onChange={v => updateConfig('columns', { ...config.columns, tablet: parseInt(v) })} />
                        <Input label="Columns (Mobile)" type="number" value={config.columns?.mobile || 1} onChange={v => updateConfig('columns', { ...config.columns, mobile: parseInt(v) })} />
                    </div>

                    <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-sm">🎨 Theme Customization</h4>

                        <div className="space-y-3">
                            <Select label="Background Type" value={config.theme?.background?.type || 'solid'} onChange={v => updateNestedConfig('theme.background.type', v)} options={[
                                { value: 'solid', label: 'Solid Color' },
                                { value: 'gradient', label: 'Gradient' }
                            ]} />

                            {config.theme?.background?.type === 'gradient' ? (
                                <GradientBuilder
                                    label="Background Gradient"
                                    value={config.theme?.background?.gradient || {}}
                                    onChange={v => updateNestedConfig('theme.background.gradient', v)}
                                />
                            ) : (
                                <ColorPicker label="Background Color" value={config.theme?.background?.color || '#f9fafb'} onChange={v => updateNestedConfig('theme.background.color', v)} />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Card Background" value={config.theme?.cardBackground || '#ffffff'} onChange={v => updateNestedConfig('theme.cardBackground', v)} />
                            <ColorPicker label="Card Border" value={config.theme?.cardBorder || '#e5e7eb'} onChange={v => updateNestedConfig('theme.cardBorder', v)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Primary Accent" value={config.theme?.primaryAccent || '#3b82f6'} onChange={v => updateNestedConfig('theme.primaryAccent', v)} />
                            <ColorPicker label="Text Color" value={config.theme?.textColor || '#111827'} onChange={v => updateNestedConfig('theme.textColor', v)} />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600">Feature Colors</label>
                            <div className="grid grid-cols-2 gap-2">
                                <ColorPicker label="Included" value={config.theme?.featureIncluded || '#10b981'} onChange={v => updateNestedConfig('theme.featureIncluded', v)} />
                                <ColorPicker label="Excluded" value={config.theme?.featureExcluded || '#9ca3af'} onChange={v => updateNestedConfig('theme.featureExcluded', v)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Card Shadow" value={config.theme?.cardShadow || 'xl'} onChange={v => updateNestedConfig('theme.cardShadow', v)} placeholder="xl" />
                            <Input label="Border Radius" value={config.theme?.borderRadius || '16px'} onChange={v => updateNestedConfig('theme.borderRadius', v)} placeholder="16px" />
                        </div>
                    </div>
                </>
            );
        case 'accordion':
            return (
                <>
                    <AccordionItemsEditor
                        value={config.items || []}
                        onChange={v => updateConfig('items', v)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.allowMultipleOpen || false} onChange={e => updateConfig('allowMultipleOpen', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Allow Multiple Open</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.closeOthersOnOpen !== false} onChange={e => updateConfig('closeOthersOnOpen', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Close Others On Open</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Select label="Style" value={config.style || 'bordered'} onChange={v => updateConfig('style', v)} options={[
                            { value: 'minimal', label: 'Minimal' },
                            { value: 'bordered', label: 'Bordered' },
                            { value: 'filled', label: 'Filled' }
                        ]} />
                        <Select label="Icon Position" value={config.iconPosition || 'right'} onChange={v => updateConfig('iconPosition', v)} options={[
                            { value: 'left', label: 'Left' },
                            { value: 'right', label: 'Right' }
                        ]} />
                    </div>

                    <Select label="Animation" value={config.animation || 'smooth'} onChange={v => updateConfig('animation', v)} options={[
                        { value: 'smooth', label: 'Smooth' },
                        { value: 'instant', label: 'Instant' }
                    ]} />

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-sm mb-3">🎨 Color Customization</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <ColorPicker label="Background" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
                            <ColorPicker label="Border Color" value={config.borderColor || '#e5e7eb'} onChange={v => updateConfig('borderColor', v)} />
                            <ColorPicker label="Accent Color" value={config.accentColor || '#3b82f6'} onChange={v => updateConfig('accentColor', v)} />
                        </div>
                    </div>
                </>
            );
        case 'tabs':
            return (
                <>
                    <TabsEditor
                        value={config.tabs || []}
                        onChange={v => updateConfig('tabs', v)}
                    />

                    <Select label="Default Tab" value={config.defaultTab || (config.tabs?.[0]?.id || '')} onChange={v => updateConfig('defaultTab', v)} options={(config.tabs || []).map(tab => ({ value: tab.id, label: tab.label }))} />

                    <div className="grid grid-cols-2 gap-3">
                        <Select label="Tab Position" value={config.tabPosition || 'top'} onChange={v => updateConfig('tabPosition', v)} options={[
                            { value: 'top', label: 'Top' },
                            { value: 'left', label: 'Left' },
                            { value: 'right', label: 'Right' }
                        ]} />
                        <Select label="Tab Style" value={config.tabStyle || 'pills'} onChange={v => updateConfig('tabStyle', v)} options={[
                            { value: 'underline', label: 'Underline' },
                            { value: 'pills', label: 'Pills' },
                            { value: 'boxed', label: 'Boxed' }
                        ]} />
                    </div>

                    <Select label="Animation" value={config.animation || 'fade'} onChange={v => updateConfig('animation', v)} options={[
                        { value: 'fade', label: 'Fade' },
                        { value: 'slide', label: 'Slide' },
                        { value: 'none', label: 'None' }
                    ]} />

                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <input type="checkbox" checked={config.rememberSelection || false} onChange={e => updateConfig('rememberSelection', e.target.checked)} className="w-4 h-4" />
                        <span className="text-sm">Remember User's Tab Selection</span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <ColorPicker label="Accent Color" value={config.accentColor || '#3b82f6'} onChange={v => updateConfig('accentColor', v)} />
                        <ColorPicker label="Background" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
                    </div>
                </>
            );
        case 'announcement_bar':
            return (
                <>
                    <AnnouncementMessagesEditor
                        value={config.messages || (config.message ? [{ text: config.message, link: config.link || '', linkText: 'Learn More' }] : [])}
                        onChange={v => updateConfig('messages', v)}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.autoRotate !== false} onChange={e => updateConfig('autoRotate', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">🔄 Auto-Rotate Messages</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.sticky || false} onChange={e => updateConfig('sticky', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">📌 Sticky (Fixed Position)</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.dismissible !== false} onChange={e => updateConfig('dismissible', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">❌ Dismissible</span>
                        </label>
                        <Input label="Rotate Interval (ms)" type="number" value={config.rotateInterval || 3000} onChange={v => updateConfig('rotateInterval', parseInt(v))} disabled={!config.autoRotate} />
                    </div>

                    <Input label="Dismiss Cookie Duration (days)" type="number" value={config.dismissCookieDuration || 7} onChange={v => updateConfig('dismissCookieDuration', parseInt(v))} />

                    <Select label="Position" value={config.position || 'top'} onChange={v => updateConfig('position', v)} options={[
                        { value: 'top', label: '⬆️ Top of page' },
                        { value: 'bottom', label: '⬇️ Bottom of page' }
                    ]} />

                    <IconSelector label="Icon (optional)" value={config.icon || ''} onChange={v => updateConfig('icon', v)} />

                    <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                            label="Background Color"
                            value={config.backgroundColor || '#3b82f6'}
                            onChange={v => updateConfig('backgroundColor', v)}
                        />
                        <ColorPicker
                            label="Text Color"
                            value={config.textColor || '#ffffff'}
                            onChange={v => updateConfig('textColor', v)}
                        />
                    </div>
                </>
            );

        default:
            return <p className="text-gray-500">No specific configuration available.</p>;
    }
}
// Helper: Testimonials List Editor
function TestimonialsListEditor({ value = [], onChange }) {
    const addTestimonial = () => {
        onChange([
            ...value,
            { id: Date.now(), name: 'Happy Client', role: 'Customer', content: 'Great service and quality products!', rating: 5, date: new Date().toISOString().split('T')[0] }
        ]);
    };

    const updateTestimonial = (index, field, val) => {
        const newTestimonials = [...value];
        newTestimonials[index] = { ...newTestimonials[index], [field]: val };
        onChange(newTestimonials);
    };

    const removeTestimonial = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Testimonials List</label>
                <button
                    type="button"
                    onClick={addTestimonial}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                    + Add Testimonial
                </button>
            </div>

            <div className="space-y-3">
                {value.map((item, index) => (
                    <div key={item.id || index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testimonial {index + 1}</h5>
                            <button onClick={() => removeTestimonial(index)} className="text-red-500 hover:text-red-700">
                                <span className="sr-only">Delete</span>
                                🗑️
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Name" value={item.name} onChange={v => updateTestimonial(index, 'name', v)} placeholder="John Doe" />
                            <Input label="Role" value={item.role} onChange={v => updateTestimonial(index, 'role', v)} placeholder="Verified Buyer" />
                        </div>

                        <Textarea label="Content" value={item.content} onChange={v => updateTestimonial(index, 'content', v)} rows={2} />

                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Image URL" value={item.image || ''} onChange={v => updateTestimonial(index, 'image', v)} placeholder="https://..." />
                            <Input label="Date" type="date" value={item.date || ''} onChange={v => updateTestimonial(index, 'date', v)} />
                        </div>

                        <Select label="Rating" value={item.rating || 5} onChange={v => updateTestimonial(index, 'rating', parseInt(v))} options={[5, 4, 3, 2, 1].map(r => ({ value: r, label: '⭐'.repeat(r) }))} />
                    </div>
                ))}
                {value.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4 border-2 border-dashed rounded-lg">No testimonials yet. Add one to get started!</p>
                )}
            </div>
        </div>
    );
}
