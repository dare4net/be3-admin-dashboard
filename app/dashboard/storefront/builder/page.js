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
import { Eye, EyeOff, Edit2, Trash2, GripVertical, Save, ArrowLeft, LayoutTemplate, Maximize, Plus, X, ChevronLeft, ChevronRight, Sparkles, Shuffle } from "lucide-react";

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
    const [pages, setPages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingWidget, setEditingWidget] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingChanges, setPendingChanges] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
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
        fetchCollections();
        fetchAttributes();
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

    const fetchCollections = async () => {
        try {
            const res = await api.get('/products/collections');
            if (res.data.success) {
                setCollections(res.data.collections);
            }
        } catch (error) {
            console.error('Failed to fetch collections', error);
        }
    };

    const fetchAttributes = async () => {
        try {
            const res = await api.get('/products/attributes/all');
            if (res.data.success) {
                setAttributes(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch attributes', error);
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

    const dirtyWidgetIds = new Set(
        pendingChanges
            .filter(c => c.type === 'update' || c.type === 'create')
            .map(c => c.id || c.tempId)
    );

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
                <SidebarLibrary
                    onAddWidget={handleAddWidget}
                    widgets={widgets}
                    onEdit={handleEditWidget}
                    onDelete={handleDeleteWidget}
                    onToggleVisibility={handleToggleVisibility}
                    dirtyWidgetIds={dirtyWidgetIds}
                />

                {/* Center: Canvas */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <BuilderCanvas widgets={widgets}>
                        {widgets.filter(w => !w.parent_id).map((widget) => (
                            <DraggableBlock
                                key={widget.id}
                                widget={widget}
                                widgets={widgets}
                                onEdit={handleEditWidget}
                                onDelete={handleDeleteWidget}
                                onToggleVisibility={handleToggleVisibility}
                                dirtyWidgetIds={dirtyWidgetIds}
                            />
                        ))}
                    </BuilderCanvas>

                    <DragOverlay>
                        {activeId ? (
                            <div className="opacity-90">
                                <DraggableBlock
                                    widget={widgets.find(w => w.id === activeId)}
                                    widgets={widgets}
                                    onEdit={() => { }}
                                    onDelete={() => { }}
                                    onToggleVisibility={() => { }}
                                    dirtyWidgetIds={dirtyWidgetIds}
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
                    collections={collections}
                    attributes={attributes}
                    widgets={widgets}
                />
            )}
        </div>
    );
}

// Collapsible Section Component
function CollapsibleSection({ title, children, isOpen, onToggle, icon }) {
    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4 bg-white shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {icon}
                    </div>
                    <span className={`font-bold text-sm ${isOpen ? 'text-blue-900' : 'text-gray-700'}`}>{title}</span>
                </div>
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </button>
            {isOpen && (
                <div className="p-5 border-t border-gray-100 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}

// Carousel Image List Editor
function CarouselImageEditor({ images = [], onChange }) {
    const handleAdd = () => onChange([...images, { url: '', alt: '' }]);
    const handleRemove = (index) => onChange(images.filter((_, i) => i !== index));
    const handleUpdate = (index, field, value) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], [field]: value };
        onChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase">Carousel Images</label>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    ADD IMAGE
                </button>
            </div>
            {images.map((img, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 relative group animate-in slide-in-from-right-2">
                    <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200"
                    >
                        <Trash2 size={12} />
                    </button>
                    <div className="space-y-3">
                        <ImageUploader
                            label={`Image ${index + 1}`}
                            value={img.url}
                            onChange={(v) => handleUpdate(index, 'url', v)}
                        />
                        <Input
                            label="Alt Text"
                            placeholder="e.g. Summer Collection Banner"
                            value={img.alt || ''}
                            onChange={(v) => handleUpdate(index, 'alt', v)}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Widget Editor Modal Component
function WidgetEditorModal({ widget, onSave, onClose, categories = [], collections = [], attributes = [], widgets = [] }) {
    const [formData, setFormData] = useState(widget);
    const [activeDevice, setActiveDevice] = useState('desktop'); // 'desktop' or 'mobile'
    const [openSections, setOpenSections] = useState({
        randomization: false,
        content: true,
        background: false,
        overlay: false,
        buttons: false,
        layout: false,
        interaction: false,
        styling: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const parentWidget = widgets.find(w => w.id === formData.parent_id);
    const parentType = parentWidget?.widget_type;

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
                        {widgets.some(w => ['container', 'columns', 'grid', 'carousel_container', 'randomizer'].includes(w.widget_type) && w.id !== widget.id) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Container</label>
                                <select
                                    value={formData.parent_id || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value || null }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                >
                                    <option value="">None (Root Level)</option>
                                    {widgets
                                        .filter(w => ['container', 'columns', 'grid', 'carousel_container', 'randomizer'].includes(w.widget_type) && w.id !== widget.id)
                                        .map(w => {
                                            const wDef = ALL_WIDGET_TYPES.find(d => d.type === w.widget_type);
                                            const titleText = typeof w.config?.title === 'object' ? w.config.title.text : w.config?.title;
                                            const label = w.config?.adminLabel || titleText || wDef?.name || w.widget_type;
                                            return (
                                                <option key={w.id} value={w.id}>
                                                    {label} (ID: {w.id.toString().slice(-4)})
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>
                        )}

                        {/* Grid Placement (Contextual - if parent is a grid) */}
                        {parentType === 'grid' && (
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                                            <LayoutTemplate size={16} /> Grid Placement
                                        </h4>
                                        <div className="flex bg-orange-200/50 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setActiveDevice('desktop')}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeDevice === 'desktop' ? 'bg-white text-orange-800 shadow-sm' : 'text-orange-600 hover:text-orange-800'}`}
                                            >
                                                DESKTOP
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveDevice('mobile')}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeDevice === 'mobile' ? 'bg-white text-orange-800 shadow-sm' : 'text-orange-600 hover:text-orange-800'}`}
                                            >
                                                MOBILE
                                            </button>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full uppercase tracking-wider">
                                        Parent: {activeDevice === 'desktop' ? (parentWidget?.config?.columnCount || 3) : (parentWidget?.config?.mobileColumnCount || 1)}x{parentWidget?.config?.rowCount || 1}
                                    </span>
                                </div>

                                {activeDevice === 'desktop' ? (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <Input
                                            label="Column Start"
                                            type="number"
                                            value={formData.config?.gridColStart || ''}
                                            onChange={v => updateConfig('gridColStart', parseInt(v))}
                                            placeholder="Auto"
                                            min={1}
                                            max={parentWidget?.config?.columnCount || 12}
                                        />
                                        <Input
                                            label="Column Span"
                                            type="number"
                                            value={formData.config?.gridColSpan || 1}
                                            onChange={v => updateConfig('gridColSpan', parseInt(v))}
                                            min={1}
                                            max={parentWidget?.config?.columnCount || 12}
                                        />
                                        <Input
                                            label="Row Start"
                                            type="number"
                                            value={formData.config?.gridRowStart || ''}
                                            onChange={v => updateConfig('gridRowStart', parseInt(v))}
                                            placeholder="Auto"
                                            min={1}
                                            max={parentWidget?.config?.rowCount || 12}
                                        />
                                        <Input
                                            label="Row Span"
                                            type="number"
                                            value={formData.config?.gridRowSpan || 1}
                                            onChange={v => updateConfig('gridRowSpan', parseInt(v))}
                                            min={1}
                                            max={parentWidget?.config?.rowCount || 12}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-2 duration-200">
                                        <Input
                                            label="Mobile Col Start"
                                            type="number"
                                            value={formData.config?.mobileGridColStart || ''}
                                            onChange={v => updateConfig('mobileGridColStart', parseInt(v))}
                                            placeholder="Auto"
                                            min={1}
                                            max={parentWidget?.config?.mobileColumnCount || 1}
                                        />
                                        <Input
                                            label="Mobile Col Span"
                                            type="number"
                                            value={formData.config?.mobileGridColSpan || 1}
                                            onChange={v => updateConfig('mobileGridColSpan', parseInt(v))}
                                            min={1}
                                            max={parentWidget?.config?.mobileColumnCount || 1}
                                        />
                                        <Input
                                            label="Mobile Row Start"
                                            type="number"
                                            value={formData.config?.mobileGridRowStart || ''}
                                            onChange={v => updateConfig('mobileGridRowStart', parseInt(v))}
                                            placeholder="Auto"
                                            min={1}
                                            max={parentWidget?.config?.rowCount || 12}
                                        />
                                        <Input
                                            label="Mobile Row Span"
                                            type="number"
                                            value={formData.config?.mobileGridRowSpan || 1}
                                            onChange={v => updateConfig('mobileGridRowSpan', parseInt(v))}
                                            min={1}
                                            max={parentWidget?.config?.rowCount || 12}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Widget Configuration Form */}
                        {renderWidgetForm(widget.widget_type, formData.config, updateConfig, updateNestedConfig, categories, collections, attributes, parentType, openSections, toggleSection)}
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
    const isNumeric = type === "number" || (typeof value === 'string' && /^-?\d*\.?\d+(px|em|rem|%|vh|vw)?$/.test(value)) || props.placeholder?.includes('px');

    const handleAdjust = (delta) => {
        if (!value && value !== 0) {
            onChange(delta > 0 ? '1' : '-1');
            return;
        }

        const match = String(value).match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
            const num = parseFloat(match[1]);
            const unit = match[2] || (props.placeholder?.includes('px') ? 'px' : '');
            onChange(`${num + delta}${unit}`);
        } else {
            onChange(String(delta));
        }
    };

    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <div className="relative group">
                <input
                    type={type === 'number' ? 'text' : type}
                    value={value !== undefined && value !== null ? value : ''}
                    onChange={(e) => {
                        let val = e.target.value;
                        // Auto-append px if it's a number and the field usually expects units
                        if (props.placeholder?.includes('px') && /^-?\d*\.?\d+$/.test(val)) {
                            // Don't append while typing if it's just a minus sign or decimal point
                            if (val !== '-' && val !== '.') {
                                // We'll append on blur for better UX, or let them type it
                            }
                        }
                        onChange(val);
                    }}
                    onBlur={(e) => {
                        let val = e.target.value;
                        if (props.placeholder?.includes('px') && /^-?\d*\.?\d+$/.test(val) && val !== '' && val !== '-' && val !== '.') {
                            onChange(`${val}px`);
                        }
                    }}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isNumeric ? 'pr-20' : ''}`}
                    {...props}
                />
                {isNumeric && (
                    <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                        <button
                            type="button"
                            onClick={() => handleAdjust(-1)}
                            className="px-2 h-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                        >
                            -
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAdjust(1)}
                            className="px-2 h-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                        >
                            +
                        </button>
                    </div>
                )}
            </div>
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
        container: { adminLabel: '', padding: '40px', backgroundColor: '', width: 'container' },
        columns: { adminLabel: '', count: 3, gap: '4' },
        grid: { adminLabel: '', columnCount: 3, rowCount: 2, gap: 16, mobileColumnCount: 1 },
        randomizer: { adminLabel: '', minDisplay: 1, maxDisplay: 3 },
        carousel_container: {
            adminLabel: '',
            itemsPerRowDesktop: 4,
            itemsPerRowTablet: 3,
            itemsPerRowMobile: 2,
            gap: 'md',
            infiniteLoop: true,
            autoPlay: false,
            autoPlayInterval: 3000,
            showArrows: 'hover',
            showDots: true,
            transitionDuration: 500,
            padding: 'py-8',
            backgroundColor: 'transparent',
            peekEffect: false
        },
        category_carousel: {
            sectionTitle: 'Shop by Category',
            showSectionTitle: true,
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            gap: 'md',
            gridGap: '12px',
            infiniteLoop: true,
            peekEffect: false,
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
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
        hero: {
            title: 'Welcome',
            subtitle: 'Shop with us',
            ctaText: 'Shop Now',
            ctaLink: '/products',
            backgroundImage: '',
            backgroundType: 'image',
            carousel: {
                images: [],
                transition: 'fade',
                interval: 5000
            },
            overlay: {
                enabled: true,
                type: 'solid',
                color: '#000000',
                opacity: 0.4,
                pattern: { preset: 'polygons', primaryColor: '#ffffff', secondaryColor: '#3b82f6', speed: 5, density: 50 },
                mesh: { color1: '#3b82f6', color2: '#8b5cf6', color3: '#ec4899', color4: '#f59e0b', speed: 10 }
            }
        },
        interactive_section: {
            title: 'Section Title',
            subtitle: 'Section Description',
            backgroundType: 'image',
            backgroundImage: '',
            carousel: { images: [], transition: 'fade', interval: 5000 },
            hoverEffect: 'none',
            sectionLink: '',
            titleTag: 'h2',
            overlay: {
                enabled: true,
                type: 'solid',
                color: '#000000',
                opacity: 0.4
            }
        },
        product_grid: {
            title: 'Featured',
            limit: 8,
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            gridGap: '12px',
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
        product_carousel: {
            title: 'Best Sellers',
            limit: 8,
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            peekEffect: false,
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
        category_grid: {
            title: 'Shop by Category',
            style: 'grid',
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            gridGap: '12px',
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
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
        // Search Widgets
        search_bar: {
            placeholder: 'Search products…',
            autocomplete: true,
            autocomplete_limit: 8,
            container: true
        },
        search_filters: {
            container: true,
            showTitle: true
        },
        search_results: {
            container: true,
            showHeader: true,
            columns: { desktop: 4, tablet: 2, mobile: 1 }
        },
        search_page_layout: {
            columns: { desktop: 4, tablet: 2, mobile: 1 },
            sidebarEnabled: true,
            showFilters: true
        }
    };
    return defaults[widgetType] || {};
}

// Helper: Render form fields based on widget type
function renderWidgetForm(widgetType, config, updateConfig, updateNestedConfig, categories = [], collections = [], attributes = [], parentType = null, openSections = {}, toggleSection = () => { }) {
    // New Atomic Blocks
    if (widgetType === 'container') return (
        <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <Input label="Admin Label (Optional identification)" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Hero Container" />
            </div>
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
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <Input label="Admin Label (Optional identification)" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Features Grid" />
            </div>
            <Select label="Columns" value={config.count || 3} onChange={v => updateConfig('count', parseInt(v))} options={[2, 3, 4, 5, 6].map(n => ({ value: n, label: `${n} Columns` }))} />
            <Select label="Gap" value={config.gap || '4'} onChange={v => updateConfig('gap', v)} options={[{ value: '0', label: 'None' }, { value: '2', label: 'Small' }, { value: '4', label: 'Medium' }, { value: '8', label: 'Large' }, { value: '12', label: 'Huge' }]} />
            <Select label="Vertical Align" value={config.align || 'start'} onChange={v => updateConfig('align', v)} options={[{ value: 'start', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }]} />
        </>
    );

    if (widgetType === 'grid') return (
        <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <Input label="Admin Label (Optional identification)" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Hero Grid" />
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Columns (Desktop)" type="number" value={config.columnCount || 3} onChange={v => updateConfig('columnCount', parseInt(v))} />
                    <Input label="Columns (Mobile)" type="number" value={config.mobileColumnCount || 1} onChange={v => updateConfig('mobileColumnCount', parseInt(v))} />
                </div>
                <Input label="Rows" type="number" value={config.rowCount || 1} onChange={v => updateConfig('rowCount', parseInt(v))} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Gap (px)" type="number" value={config.gap || 16} onChange={v => updateConfig('gap', parseInt(v))} />
                    <ColorPicker label="Background Color" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
                </div>
            </div>
        </>
    );

    if (widgetType === 'carousel_container') return (
        <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <Input label="Admin Label" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Testimonials Carousel" />
            </div>

            <CollapsibleSection
                title="Carousel Configuration"
                icon={<LayoutTemplate size={18} />}
                isOpen={openSections.layout}
                onToggle={() => toggleSection('layout')}
            >
                <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visible Items per Breakpoint</h5>
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Desktop" type="number" value={config.itemsPerRowDesktop || 4} onChange={v => updateConfig('itemsPerRowDesktop', parseInt(v))} />
                        <Input label="Tablet" type="number" value={config.itemsPerRowTablet || 3} onChange={v => updateConfig('itemsPerRowTablet', parseInt(v))} />
                        <Input label="Mobile" type="number" value={config.itemsPerRowMobile || 2} onChange={v => updateConfig('itemsPerRowMobile', parseInt(v))} />
                    </div>
                </div>

                <div className="pt-4 space-y-4 border-t border-gray-100">
                    <Select label="Gap Between Items" value={config.gap || 'md'} onChange={v => updateConfig('gap', v)} options={[
                        { value: 'sm', label: 'Small' },
                        { value: 'md', label: 'Medium' },
                        { value: 'lg', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' }
                    ]} />
                    <Input label="Padding (e.g. py-8)" value={config.padding || 'py-8'} onChange={v => updateConfig('padding', v)} />
                    <ColorPicker label="Background Color" value={config.backgroundColor || 'transparent'} onChange={v => updateConfig('backgroundColor', v)} />
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Playback & Controls"
                icon={<Eye size={18} />}
                isOpen={openSections.interaction}
                onToggle={() => toggleSection('interaction')}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Infinite Loop</span>
                            <button
                                type="button"
                                onClick={() => updateConfig('infiniteLoop', config.infiniteLoop === false ? true : false)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.infiniteLoop !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.infiniteLoop !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Show Dots</span>
                            <button
                                type="button"
                                onClick={() => updateConfig('showDots', config.showDots === false ? true : false)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showDots !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showDots !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-blue-900">Sneak Peek</span>
                                <span className="text-[10px] text-blue-700">Partially show next item</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateConfig('peekEffect', !config.peekEffect)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.peekEffect ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.peekEffect ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Autoplay</span>
                            <button
                                type="button"
                                onClick={() => updateConfig('autoPlay', !config.autoPlay)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.autoPlay ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        {config.autoPlay && (
                            <Input label="Interval (ms)" type="number" value={config.autoPlayInterval || 3000} onChange={v => updateConfig('autoPlayInterval', parseInt(v))} />
                        )}
                    </div>

                    <Select label="Navigation Arrows" value={config.showArrows || 'hover'} onChange={v => updateConfig('showArrows', v)} options={[
                        { value: 'always', label: 'Always Visible' },
                        { value: 'hover', label: 'Visible on Hover' },
                        { value: 'never', label: 'Hidden' }
                    ]} />

                    <Input label="Transition Speed (ms)" type="number" value={config.transitionDuration || 500} onChange={v => updateConfig('transitionDuration', parseInt(v))} />
                </div>
            </CollapsibleSection>
        </>
    );

    // Commerce Widgets
    switch (widgetType) {
        case 'product_carousel':
        case 'product_grid':
            return (
                <>
                    {/* Basic Settings */}
                    <div className="space-y-4">
                        <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Limit" type="number" value={config.limit || 8} onChange={v => updateConfig('limit', parseInt(v))} />
                            <Select label="Sort Order" value={config.sort || 'newest'} onChange={v => updateConfig('sort', v)} options={[
                                { value: 'newest', label: 'Newest First' },
                                { value: 'oldest', label: 'Oldest First' },
                                { value: 'price_asc', label: 'Price: Low to High' },
                                { value: 'price_desc', label: 'Price: High to Low' },
                                { value: 'name_asc', label: 'Name: A-Z' },
                                { value: 'name_desc', label: 'Name: Z-A' },
                                { value: 'random', label: 'Random' },
                            ]} />
                        </div>
                    </div>


                    {/* Source Configuration */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Content Source</h4>

                        <div className="grid grid-cols-1 gap-4">
                            <Select
                                label="Source Type"
                                value={config.sourceType || 'all'}
                                onChange={v => updateConfig('sourceType', v)}
                                options={[
                                    { value: 'all', label: 'All Products' },
                                    { value: 'category', label: 'Specific Category' },
                                    { value: 'collection', label: 'Specific Collection' },
                                    { value: 'clause', label: 'Attribute Clause' }
                                ]}
                            />

                            {config.sourceType === 'category' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Category</label>
                                    <select
                                        value={config.categoryId || ''}
                                        onChange={e => updateConfig('categoryId', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                    >
                                        <option value="">-- Choose Category --</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {config.sourceType === 'collection' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Collection</label>
                                    <select
                                        value={config.collectionId || ''}
                                        onChange={e => updateConfig('collectionId', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                    >
                                        <option value="">-- Choose Collection --</option>
                                        {collections.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {config.sourceType === 'clause' && (
                                <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-lg">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">1. Select Attribute</label>
                                        <select
                                            value={config.attributeClause?.split(':')[0] || ''}
                                            onChange={e => {
                                                const attrCode = e.target.value;
                                                // Reset clause when attribute changes
                                                updateConfig('attributeClause', attrCode ? `${attrCode}:` : '');
                                            }}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                                        >
                                            <option value="">-- Choose Attribute --</option>
                                            {attributes.map(attr => (
                                                <option key={attr.id} value={attr.code}>{attr.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {config.attributeClause?.split(':')[0] && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">2. Select Clause/Value</label>
                                            <select
                                                value={config.attributeClause?.split(':')[1] || ''}
                                                onChange={e => {
                                                    const attrCode = config.attributeClause.split(':')[0];
                                                    updateConfig('attributeClause', `${attrCode}:${e.target.value}`);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white text-sm"
                                            >
                                                <option value="">-- Choose Clause --</option>
                                                {(() => {
                                                    const selectedAttr = attributes.find(a => a.code === config.attributeClause.split(':')[0]);
                                                    if (!selectedAttr) return null;

                                                    // Try to get clauses from the attribute object
                                                    let clauses = [];
                                                    try {
                                                        clauses = typeof selectedAttr.clauses === 'string'
                                                            ? JSON.parse(selectedAttr.clauses)
                                                            : (selectedAttr.clauses || []);
                                                    } catch (e) {
                                                        console.error("Failed to parse clauses", e);
                                                    }

                                                    return (clauses || []).map((clause, idx) => (
                                                        <option key={idx} value={clause.name || clause.value}>{clause.label || clause.name || clause.value}</option>
                                                    ));
                                                })()}
                                            </select>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-gray-400 italic">
                                        Current Filter: <code className="bg-gray-100 px-1 rounded">{config.attributeClause || 'none'}</code>
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-700 font-medium">Filter by Featured Only</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateConfig('showFeaturedOnly', !config.showFeaturedOnly)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showFeaturedOnly ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showFeaturedOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid/Carousel Layout Config */}
                    {['product_grid', 'product_carousel'].includes(widgetType) && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                            <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Layout (Visible Columns)</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Desktop" type="number" value={config.columns?.desktop || 4} onChange={v => updateNestedConfig('columns.desktop', parseInt(v))} />
                                <Input label="Tablet" type="number" value={config.columns?.tablet || 2} onChange={v => updateNestedConfig('columns.tablet', parseInt(v))} />
                                <Input label="Mobile" type="number" value={config.columns?.mobile || 1} onChange={v => updateNestedConfig('columns.mobile', parseInt(v))} />
                            </div>
                            {widgetType === 'product_carousel' && (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-blue-900">Sneak Peek</span>
                                        <span className="text-[10px] text-blue-700">Show portion of next product</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateConfig('peekEffect', !config.peekEffect)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.peekEffect ? 'bg-blue-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.peekEffect ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Visibility Toggles */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                        <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Display Elements</h4>
                        {[
                            { key: 'showPrice', label: 'Show Price' },
                            { key: 'showAddToCart', label: 'Show "Add to Cart"' },
                            { key: 'showViewDetails', label: 'Show "View Details"' },
                            { key: 'showFeaturedBadge', label: 'Show "Featured" Badge' },
                            { key: 'showTags', label: 'Show Tags' },
                            { key: 'showDescription', label: 'Show Description' },
                            { key: 'showAttributes', label: 'Show Attributes' },
                            { key: 'showSocialProof', label: 'Show Social Proof' },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between py-1">
                                <label className="text-sm text-gray-600">{item.label}</label>
                                <button
                                    type="button"
                                    onClick={() => updateConfig(item.key, !config[item.key])}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config[item.key] !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config[item.key] !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <CollapsibleSection
                        title="Styling & Spacing"
                        icon={<Maximize size={18} />}
                        isOpen={openSections.styling}
                        onToggle={() => toggleSection('styling')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Show Title</span>
                                <button
                                    type="button"
                                    onClick={() => updateConfig('showTitle', config.showTitle === false ? true : false)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showTitle !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showTitle !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-blue-900">Full Width Title</span>
                                    <input
                                        type="checkbox"
                                        checked={config.fullWidthTitle || false}
                                        onChange={e => updateConfig('fullWidthTitle', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </label>
                                <p className="text-[10px] text-blue-700 leading-tight">
                                    Forces the title to ignore container padding. Highly recommended when using a <strong>Title Background Color</strong>.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Title Font Size" value={config.titleFontSize || ''} onChange={v => updateConfig('titleFontSize', v)} placeholder="1.875rem" />
                                <Input label="Title Font Weight" value={config.titleFontWeight || ''} onChange={v => updateConfig('titleFontWeight', v)} placeholder="700" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker label="Title Color" value={config.titleColor || '#111827'} onChange={v => updateConfig('titleColor', v)} />
                                <Select label="Title Align" value={config.titleAlign || 'center'} onChange={v => updateConfig('titleAlign', v)} options={[
                                    { value: 'left', label: 'Left' },
                                    { value: 'center', label: 'Center' },
                                    { value: 'right', label: 'Right' }
                                ]} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker label="Title Background" value={config.titleBackgroundColor || 'transparent'} onChange={v => updateConfig('titleBackgroundColor', v)} />
                                <Input label="Title Padding" value={config.titlePadding || ''} onChange={v => updateConfig('titlePadding', v)} placeholder="0" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Padding Top" value={config.sectionPaddingTop || ''} onChange={v => updateConfig('sectionPaddingTop', v)} placeholder="48px" />
                                <Input label="Padding Bottom" value={config.sectionPaddingBottom || ''} onChange={v => updateConfig('sectionPaddingBottom', v)} placeholder="48px" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Title Bottom Margin" value={config.titleBottomMargin || ''} onChange={v => updateConfig('titleBottomMargin', v)} placeholder="32px" />
                                <Input label="Grid Gap" value={config.gridGap || ''} onChange={v => updateConfig('gridGap', v)} placeholder="24px" />
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Section & Card Appearance</h5>
                                <Input label="Section Background" type="color" value={config.sectionBackground?.color || '#ffffff'} onChange={v => updateNestedConfig('sectionBackground.color', v)} />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Card Background" type="color" value={config.cardStyle?.backgroundColor || '#ffffff'} onChange={v => updateNestedConfig('cardStyle.backgroundColor', v)} />
                                    <Input label="Border Color" type="color" value={config.cardStyle?.borderColor || '#e5e7eb'} onChange={v => updateNestedConfig('cardStyle.borderColor', v)} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Select label="Shadow" value={config.cardStyle?.shadow || 'md'} onChange={v => updateNestedConfig('cardStyle.shadow', v)} options={[
                                        { value: 'none', label: 'None' },
                                        { value: 'sm', label: 'Small' },
                                        { value: 'md', label: 'Medium' },
                                        { value: 'lg', label: 'Large' },
                                        { value: 'xl', label: 'Extra Large' },
                                    ]} />
                                    <Input label="Border Radius" value={config.cardStyle?.borderRadius || '12px'} onChange={v => updateNestedConfig('cardStyle.borderRadius', v)} />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title & Linking</h5>
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-amber-900">Autogenerate Title</span>
                                            <span className="text-[10px] text-amber-700">Based on source name</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateConfig('autogenerateTitle', !config.autogenerateTitle)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.autogenerateTitle ? 'bg-amber-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.autogenerateTitle ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <Input label="Optional Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} placeholder="e.g. New Arrivals" />

                                    <div className="pt-2 border-t border-amber-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-amber-900">Show "See All" Button</span>
                                            <button
                                                type="button"
                                                onClick={() => updateConfig('showSeeAll', !config.showSeeAll)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showSeeAll ? 'bg-amber-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showSeeAll ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        {config.showSeeAll && (
                                            <Input label="Button Label" value={config.seeAllLabel || 'See All'} onChange={v => updateConfig('seeAllLabel', v)} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Randomization Section */}
                    <CollapsibleSection
                        title="Randomization"
                        icon={<Shuffle size={18} />}
                        isOpen={openSections.randomization}
                        onToggle={() => toggleSection('randomization')}
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-purple-900">Enable Randomization</span>
                                        <span className="text-[10px] text-purple-700">Make widget content dynamic by randomizing sources, sorts, and more</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!config.randomize) {
                                                updateNestedConfig('randomize', {
                                                    enabled: true,
                                                    interval: 'session',
                                                    randomizeSource: false,
                                                    allowedSourceTypes: ['all', 'category', 'collection', 'clause'],
                                                    allowedCategories: [],
                                                    allowedCollections: [],
                                                    allowedAttributes: [],
                                                    randomizeSort: false,
                                                    allowedSorts: ['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'random'],
                                                    randomizeLimit: false,
                                                    limitRange: { min: 4, max: 12 },
                                                    randomizeFeatured: false,
                                                    randomizeCategorySource: false,
                                                    allowedCategorySourceTypes: ['top-level', 'all-subcategories', 'random']
                                                });
                                            } else {
                                                updateNestedConfig('randomize.enabled', !config.randomize.enabled);
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize?.enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {config.randomize?.enabled && (
                                <>
                                    {/* Interval Selection */}
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Randomization Interval</label>
                                        <Select
                                            value={config.randomize.interval || 'session'}
                                            onChange={v => updateNestedConfig('randomize.interval', v)}
                                            options={[
                                                { value: 'page_load', label: 'Every Page Load' },
                                                { value: 'session', label: 'Once Per Session' },
                                                { value: 'hourly', label: 'Every Hour' },
                                                { value: 'daily', label: 'Once Per Day' }
                                            ]}
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {config.randomize.interval === 'page_load' && 'Content changes on every page refresh'}
                                            {config.randomize.interval === 'session' && 'Content stays same during user session (recommended for SEO)'}
                                            {config.randomize.interval === 'hourly' && 'Content changes every hour'}
                                            {config.randomize.interval === 'daily' && 'Content changes once per day'}
                                        </p>
                                    </div>

                                    {/* What to Randomize */}
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                        <h5 className="text-sm font-semibold text-gray-900 border-b pb-2">What to Randomize</h5>
                                        
                                        {/* Product Widgets */}
                                        {['product_grid', 'product_carousel'].includes(widgetType) && (
                                            <>
                                                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-700">Randomize Source</span>
                                                        <span className="text-[10px] text-gray-500">Randomly pick between source types (all, category, collection, clause)</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateNestedConfig('randomize.randomizeSource', !config.randomize.randomizeSource)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeSource ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeSource ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>

                                                {config.randomize.randomizeSource && (
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                                                        <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider">Allowed Source Types</label>
                                                        <div className="space-y-2">
                                                            {['all', 'category', 'collection', 'clause'].map(st => (
                                                                <label key={st} className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(config.randomize.allowedSourceTypes || []).includes(st)}
                                                                        onChange={e => {
                                                                            const current = config.randomize.allowedSourceTypes || [];
                                                                            const updated = e.target.checked
                                                                                ? [...current, st]
                                                                                : current.filter(t => t !== st);
                                                                            updateNestedConfig('randomize.allowedSourceTypes', updated.length > 0 ? updated : ['all']);
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700 capitalize">{st === 'all' ? 'All Products' : st === 'clause' ? 'Attribute Clause' : st}</span>
                                                                </label>
                                                            ))}
                                                        </div>

                                                        {/* Allowed Categories Filter */}
                                                        <div>
                                                            <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Filter Categories (Optional)</label>
                                                            <p className="text-[10px] text-blue-700 mb-2">Leave empty to use all categories, or select specific ones</p>
                                                            <select
                                                                multiple
                                                                value={config.randomize.allowedCategories || []}
                                                                onChange={e => {
                                                                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                                                                    updateNestedConfig('randomize.allowedCategories', selected);
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm max-h-32 overflow-y-auto"
                                                                size={Math.min(5, categories.length)}
                                                            >
                                                                {categories.map(cat => (
                                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Allowed Collections Filter */}
                                                        <div>
                                                            <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Filter Collections (Optional)</label>
                                                            <p className="text-[10px] text-blue-700 mb-2">Leave empty to use all collections, or select specific ones</p>
                                                            <select
                                                                multiple
                                                                value={config.randomize.allowedCollections || []}
                                                                onChange={e => {
                                                                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                                                                    updateNestedConfig('randomize.allowedCollections', selected);
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm max-h-32 overflow-y-auto"
                                                                size={Math.min(5, collections.length)}
                                                            >
                                                                {collections.map(col => (
                                                                    <option key={col.id} value={col.id}>{col.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Allowed Attributes Filter */}
                                                        <div>
                                                            <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Filter Attributes (Optional)</label>
                                                            <p className="text-[10px] text-blue-700 mb-2">Leave empty to use all attributes with clauses, or select specific ones</p>
                                                            <select
                                                                multiple
                                                                value={config.randomize.allowedAttributes || []}
                                                                onChange={e => {
                                                                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                                                                    updateNestedConfig('randomize.allowedAttributes', selected);
                                                                }}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm max-h-32 overflow-y-auto"
                                                                size={Math.min(5, attributes.filter(a => {
                                                                    const clauses = a.clauses || [];
                                                                    return Array.isArray(clauses) && clauses.length > 0;
                                                                }).length)}
                                                            >
                                                                {attributes.filter(a => {
                                                                    const clauses = a.clauses || [];
                                                                    return Array.isArray(clauses) && clauses.length > 0;
                                                                }).map(attr => (
                                                                    <option key={attr.id} value={attr.code}>{attr.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-700">Randomize Sort</span>
                                                        <span className="text-[10px] text-gray-500">Randomly pick sort order</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateNestedConfig('randomize.randomizeSort', !config.randomize.randomizeSort)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeSort ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeSort ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>

                                                {config.randomize.randomizeSort && (
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                        <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">Allowed Sort Orders</label>
                                                        <div className="space-y-2">
                                                            {['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'random'].map(sort => (
                                                                <label key={sort} className="flex items-center gap-2 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(config.randomize.allowedSorts || []).includes(sort)}
                                                                        onChange={e => {
                                                                            const current = config.randomize.allowedSorts || [];
                                                                            const updated = e.target.checked
                                                                                ? [...current, sort]
                                                                                : current.filter(s => s !== sort);
                                                                            updateNestedConfig('randomize.allowedSorts', updated.length > 0 ? updated : ['newest']);
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                    />
                                                                    <span className="text-sm text-gray-700">
                                                                        {sort === 'newest' ? 'Newest First' :
                                                                         sort === 'oldest' ? 'Oldest First' :
                                                                         sort === 'price_asc' ? 'Price: Low to High' :
                                                                         sort === 'price_desc' ? 'Price: High to Low' :
                                                                         sort === 'name_asc' ? 'Name: A-Z' :
                                                                         sort === 'name_desc' ? 'Name: Z-A' :
                                                                         'Random'}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-700">Randomize Limit</span>
                                                        <span className="text-[10px] text-gray-500">Randomly pick product count within range</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateNestedConfig('randomize.randomizeLimit', !config.randomize.randomizeLimit)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeLimit ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeLimit ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>

                                                {config.randomize.randomizeLimit && (
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                        <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">Limit Range</label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <Input
                                                                label="Min"
                                                                type="number"
                                                                value={config.randomize.limitRange?.min || 4}
                                                                onChange={v => updateNestedConfig('randomize.limitRange.min', parseInt(v) || 1)}
                                                            />
                                                            <Input
                                                                label="Max"
                                                                type="number"
                                                                value={config.randomize.limitRange?.max || 12}
                                                                onChange={v => updateNestedConfig('randomize.limitRange.max', parseInt(v) || 1)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-700">Randomize Featured Filter</span>
                                                        <span className="text-[10px] text-gray-500">Randomly toggle "Featured Only" filter</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateNestedConfig('randomize.randomizeFeatured', !config.randomize.randomizeFeatured)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeFeatured ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        {/* Category Widgets */}
                                        {['category_grid', 'category_carousel'].includes(widgetType) && (
                                            <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">Randomize Category Source Type</span>
                                                    <span className="text-[10px] text-gray-500">Randomly pick between top-level, subcategories, etc.</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => updateNestedConfig('randomize.randomizeCategorySource', !config.randomize.randomizeCategorySource)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeCategorySource ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeCategorySource ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        )}

                                        {['category_grid', 'category_carousel'].includes(widgetType) && config.randomize.randomizeCategorySource && (
                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">Allowed Category Source Types</label>
                                                <div className="space-y-2">
                                                    {['top-level', 'all-subcategories', 'random'].map(st => (
                                                        <label key={st} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={(config.randomize.allowedCategorySourceTypes || []).includes(st)}
                                                                onChange={e => {
                                                                    const current = config.randomize.allowedCategorySourceTypes || [];
                                                                    const updated = e.target.checked
                                                                        ? [...current, st]
                                                                        : current.filter(t => t !== st);
                                                                    updateNestedConfig('randomize.allowedCategorySourceTypes', updated.length > 0 ? updated : ['top-level']);
                                                                }}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700">
                                                                {st === 'top-level' ? 'Top-Level Categories' :
                                                                 st === 'all-subcategories' ? 'All Subcategories' :
                                                                 'Random Selection'}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </CollapsibleSection>
                </>
            );
        case 'category_grid':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Select label="Style" value={config.style || 'grid'} onChange={v => updateConfig('style', v)} options={[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }]} />

                    <div className="space-y-4 pt-4 border-t">
                        <Select
                            label="Source Type"
                            value={config.sourceType || 'top-level'}
                            onChange={v => updateConfig('sourceType', v)}
                            options={[
                                { value: 'top-level', label: 'All Top-Level Categories' },
                                { value: 'subcategories', label: 'Subcategories of Parent' },
                                { value: 'all-subcategories', label: 'All Subcategories' },
                                { value: 'random', label: 'Random Selection' },
                                { value: 'manual', label: 'Manual Selection' }
                            ]}
                        />

                        {config.sourceType === 'subcategories' && (
                            <Select
                                label="Parent Category"
                                value={config.parentCategoryId || ''}
                                onChange={v => updateConfig('parentCategoryId', v)}
                                options={[
                                    { value: '', label: 'Select Parent Category' },
                                    ...categories.map(c => ({ value: c.id, label: c.name }))
                                ]}
                            />
                        )}

                        {config.sourceType === 'manual' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-700 uppercase">Select Categories</label>
                                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-white space-y-1">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(config.manualCategoryIds || []).includes(cat.id)}
                                                onChange={e => {
                                                    const current = config.manualCategoryIds || [];
                                                    const newIds = e.target.checked
                                                        ? [...current, cat.id]
                                                        : current.filter(id => id !== cat.id);
                                                    updateConfig('manualCategoryIds', newIds);
                                                }}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">{(config.manualCategoryIds || []).length} categories selected</p>
                            </div>
                        )}

                        {config.sourceType === 'random' && (
                            <Input label="Random Count" type="number" value={config.randomCount || 6} onChange={v => updateConfig('randomCount', parseInt(v))} />
                        )}

                        <Select
                            label="Sort Order"
                            value={config.sortOrder || 'alphabetical'}
                            onChange={v => updateConfig('sortOrder', v)}
                            options={[
                                { value: 'alphabetical', label: 'Alphabetical' },
                                { value: 'random', label: 'Random' },
                                { value: 'manual', label: 'Manual' }
                            ]}
                        />

                        <Input label="Max Categories" type="number" value={config.maxCategories || 12} onChange={v => updateConfig('maxCategories', parseInt(v))} />
                    </div>

                    <CollapsibleSection
                        title="Styling & Spacing"
                        icon={<Maximize size={18} />}
                        isOpen={openSections.styling}
                        onToggle={() => toggleSection('styling')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Show Title</span>
                                <button
                                    type="button"
                                    onClick={() => updateConfig('showTitle', config.showTitle === false ? true : false)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showTitle !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showTitle !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-blue-900">Full Width Title</span>
                                    <input
                                        type="checkbox"
                                        checked={config.fullWidthTitle || false}
                                        onChange={e => updateConfig('fullWidthTitle', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </label>
                                <p className="text-[10px] text-blue-700 leading-tight">
                                    Forces the title to ignore container padding. Highly recommended when using a <strong>Title Background Color</strong>.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Title Font Size" value={config.titleFontSize || ''} onChange={v => updateConfig('titleFontSize', v)} placeholder="1.875rem" />
                                <Input label="Title Font Weight" value={config.titleFontWeight || ''} onChange={v => updateConfig('titleFontWeight', v)} placeholder="700" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker label="Title Color" value={config.titleColor || '#111827'} onChange={v => updateConfig('titleColor', v)} />
                                <Select label="Title Align" value={config.titleAlign || 'center'} onChange={v => updateConfig('titleAlign', v)} options={[
                                    { value: 'left', label: 'Left' },
                                    { value: 'center', label: 'Center' },
                                    { value: 'right', label: 'Right' }
                                ]} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker label="Title Background" value={config.titleBackgroundColor || 'transparent'} onChange={v => updateConfig('titleBackgroundColor', v)} />
                                <Input label="Title Padding" value={config.titlePadding || ''} onChange={v => updateConfig('titlePadding', v)} placeholder="0" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Padding Top" value={config.sectionPaddingTop || ''} onChange={v => updateConfig('sectionPaddingTop', v)} placeholder="48px" />
                                <Input label="Padding Bottom" value={config.sectionPaddingBottom || ''} onChange={v => updateConfig('sectionPaddingBottom', v)} placeholder="48px" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Title Bottom Margin" value={config.titleBottomMargin || ''} onChange={v => updateConfig('titleBottomMargin', v)} placeholder="32px" />
                                <Input label="Grid Gap" value={config.gridGap || ''} onChange={v => updateConfig('gridGap', v)} placeholder="24px" />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                                <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Grid Columns (Per Breakpoint)</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <Input label="Desktop" type="number" value={config.columns?.desktop || 4} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) || 4 })} min={1} max={6} />
                                    <Input label="Tablet" type="number" value={config.columns?.tablet || 3} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) || 3 })} min={1} max={6} />
                                    <Input label="Mobile" type="number" value={config.columns?.mobile || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) || 2 })} min={1} max={6} />
                                </div>
                                <p className="text-xs text-gray-500">Number of columns to display at each screen size breakpoint</p>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 space-y-4">
                                <h4 className="font-semibold text-sm text-purple-900 border-b pb-2">Category Text Sizing</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <Input label="Font Size (Desktop)" type="number" value={config.categoryTitleFontSizeDesktop || config.titleFontSizeDesktop || 18} onChange={v => updateConfig('categoryTitleFontSizeDesktop', parseInt(v))} />
                                    <Input label="Font Size (Tablet)" type="number" value={config.categoryTitleFontSizeTablet || config.titleFontSizeTablet || 16} onChange={v => updateConfig('categoryTitleFontSizeTablet', parseInt(v))} />
                                    <Input label="Font Size (Mobile)" type="number" value={config.categoryTitleFontSizeMobile || config.titleFontSizeMobile || 14} onChange={v => updateConfig('categoryTitleFontSizeMobile', parseInt(v))} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Font Weight" type="number" min="100" max="900" step="100" value={config.categoryTitleFontWeight || config.titleFontWeight || 600} onChange={v => updateConfig('categoryTitleFontWeight', parseInt(v))} />
                                    <ColorPicker label="Text Color" value={config.categoryTitleColor || config.titleColor || '#ffffff'} onChange={v => updateConfig('categoryTitleColor', v)} />
                                </div>
                                <Select
                                    label="Text Alignment"
                                    value={config.categoryTitleAlignment || config.titleAlignment || 'center'}
                                    onChange={v => updateConfig('categoryTitleAlignment', v)}
                                    options={[
                                        { value: 'left', label: 'Left' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'right', label: 'Right' }
                                    ]}
                                />
                            </div>

                            <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg border border-indigo-100 space-y-4">
                                <h4 className="font-semibold text-sm text-indigo-900 border-b pb-2">Overlay Gradient</h4>
                                <Select
                                    label="Overlay Type"
                                    value={config.overlayType || 'gradient'}
                                    onChange={v => updateConfig('overlayType', v)}
                                    options={[
                                        { value: 'none', label: 'None' },
                                        { value: 'gradient', label: 'Gradient' },
                                        { value: 'solid', label: 'Solid Color' }
                                    ]}
                                />
                                
                                {config.overlayType !== 'none' && (
                                    <>
                                        <ColorPicker label="Overlay Color" value={config.overlayColor || '#000000'} onChange={v => updateConfig('overlayColor', v)} />
                                        <Input label="Overlay Opacity (%)" type="number" min="0" max="100" value={config.overlayOpacity || 40} onChange={v => updateConfig('overlayOpacity', parseInt(v))} />
                                        
                                        {config.overlayType === 'gradient' && (
                                            <Select
                                                label="Gradient Direction"
                                                value={config.overlayGradientDirection || 'to-t'}
                                                onChange={v => updateConfig('overlayGradientDirection', v)}
                                                options={[
                                                    { value: 'to-t', label: 'To Top' },
                                                    { value: 'to-b', label: 'To Bottom' },
                                                    { value: 'to-l', label: 'To Left' },
                                                    { value: 'to-r', label: 'To Right' },
                                                    { value: 'to-tl', label: 'To Top Left' },
                                                    { value: 'to-tr', label: 'To Top Right' },
                                                    { value: 'to-bl', label: 'To Bottom Left' },
                                                    { value: 'to-br', label: 'To Bottom Right' }
                                                ]}
                                            />
                                        )}
                                    </>
                                )}
                                <p className="text-xs text-indigo-700">Customize the overlay gradient that appears over category images</p>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Randomization Section for Category Grid */}
                    <CollapsibleSection
                        title="Randomization"
                        icon={<Shuffle size={18} />}
                        isOpen={openSections.randomization}
                        onToggle={() => toggleSection('randomization')}
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-purple-900">Enable Randomization</span>
                                        <span className="text-[10px] text-purple-700">Make widget content dynamic by randomizing category source type</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!config.randomize) {
                                                updateNestedConfig('randomize', {
                                                    enabled: true,
                                                    interval: 'session',
                                                    randomizeCategorySource: false,
                                                    allowedCategorySourceTypes: ['top-level', 'all-subcategories', 'random']
                                                });
                                            } else {
                                                updateNestedConfig('randomize.enabled', !config.randomize.enabled);
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize?.enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {config.randomize?.enabled && (
                                <>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Randomization Interval</label>
                                        <Select
                                            value={config.randomize.interval || 'session'}
                                            onChange={v => updateNestedConfig('randomize.interval', v)}
                                            options={[
                                                { value: 'page_load', label: 'Every Page Load' },
                                                { value: 'session', label: 'Once Per Session' },
                                                { value: 'hourly', label: 'Every Hour' },
                                                { value: 'daily', label: 'Once Per Day' }
                                            ]}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">Randomize Category Source Type</span>
                                            <span className="text-[10px] text-gray-500">Randomly pick between top-level, subcategories, etc.</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateNestedConfig('randomize.randomizeCategorySource', !config.randomize.randomizeCategorySource)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeCategorySource ? 'bg-blue-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeCategorySource ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {config.randomize.randomizeCategorySource && (
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                            <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">Allowed Category Source Types</label>
                                            <div className="space-y-2">
                                                {['top-level', 'all-subcategories', 'random'].map(st => (
                                                    <label key={st} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={(config.randomize.allowedCategorySourceTypes || []).includes(st)}
                                                            onChange={e => {
                                                                const current = config.randomize.allowedCategorySourceTypes || [];
                                                                const updated = e.target.checked
                                                                    ? [...current, st]
                                                                    : current.filter(t => t !== st);
                                                                updateNestedConfig('randomize.allowedCategorySourceTypes', updated.length > 0 ? updated : ['top-level']);
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            {st === 'top-level' ? 'Top-Level Categories' :
                                                             st === 'all-subcategories' ? 'All Subcategories' :
                                                             'Random Selection'}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CollapsibleSection>
                </>
            );
        case 'randomizer':
            return (
                <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="text-purple-600" size={18} />
                            <h4 className="font-semibold text-sm text-purple-900">Randomizer Settings</h4>
                        </div>
                        <p className="text-xs text-purple-700 leading-relaxed">
                            This widget will randomly select and display a subset of its children on every page load.
                        </p>

                        <div className="bg-white/50 p-3 rounded-lg border border-purple-200">
                            <Input label="Admin Label" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Random Promotions" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <Input
                                label="Min Widgets"
                                type="number"
                                value={config.minDisplay || 1}
                                onChange={v => updateConfig('minDisplay', parseInt(v))}
                                min={1}
                            />
                            <Input
                                label="Max Widgets"
                                type="number"
                                value={config.maxDisplay || 3}
                                onChange={v => updateConfig('maxDisplay', parseInt(v))}
                                min={1}
                            />
                        </div>
                    </div>
                </div>
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
                <div className="space-y-4">
                    <CollapsibleSection
                        title="Hero Content & Layout"
                        icon={<LayoutTemplate size={18} />}
                        isOpen={openSections.content}
                        onToggle={() => toggleSection('content')}
                    >
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Title</h5>
                            <Input
                                label="Title Text"
                                value={config.title?.text || config.title || ''}
                                onChange={v => typeof config.title === 'string' ? updateConfig('title', { text: v }) : updateNestedConfig('title.text', v)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <ColorPicker label="Color" value={config.title?.color || '#ffffff'} onChange={v => updateNestedConfig('title.color', v)} />
                                <Select
                                    label="Weight"
                                    value={config.title?.fontWeight || '700'}
                                    onChange={v => updateNestedConfig('title.fontWeight', v)}
                                    options={[
                                        { value: '400', label: 'Normal' },
                                        { value: '700', label: 'Bold' },
                                        { value: '900', label: 'Black' }
                                    ]}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    label="Animation"
                                    value={config.title?.animation?.type || 'none'}
                                    onChange={v => updateNestedConfig('title.animation.type', v)}
                                    options={[
                                        { value: 'none', label: 'None' },
                                        { value: 'fade-up', label: '⬆️ Fade Up' },
                                        { value: 'fade-down', label: '⬇️ Fade Down' },
                                        { value: 'fade', label: '✨ Fade In' },
                                        { value: 'slide-left', label: '⬅️ Slide Left' },
                                        { value: 'slide-right', label: '➡️ Slide Right' },
                                        { value: 'zoom', label: '🔍 Zoom In' }
                                    ]}
                                />
                                <Input
                                    label="Delay (ms)"
                                    type="number"
                                    value={config.title?.animation?.delay || 0}
                                    onChange={v => updateNestedConfig('title.animation.delay', parseInt(v))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subtitle</h5>
                            <Input
                                label="Subtitle Text"
                                value={config.subtitle?.text || config.subtitle || ''}
                                onChange={v => typeof config.subtitle === 'string' ? updateConfig('subtitle', { text: v }) : updateNestedConfig('subtitle.text', v)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <ColorPicker label="Color" value={config.subtitle?.color || '#ffffff'} onChange={v => updateNestedConfig('subtitle.color', v)} />
                                <Input
                                    label="Delay (ms)"
                                    type="number"
                                    value={config.subtitle?.animation?.delay || 200}
                                    onChange={v => updateNestedConfig('subtitle.animation.delay', parseInt(v))}
                                />
                            </div>
                            <Select
                                label="Animation"
                                value={config.subtitle?.animation?.type || 'none'}
                                onChange={v => updateNestedConfig('subtitle.animation.type', v)}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'fade-up', label: '⬆️ Fade Up' },
                                    { value: 'fade-down', label: '⬇️ Fade Down' },
                                    { value: 'fade', label: '✨ Fade In' },
                                    { value: 'slide-left', label: '⬅️ Slide Left' },
                                    { value: 'slide-right', label: '➡️ Slide Right' },
                                    { value: 'slide-up', label: '🔝 Slide Up' },
                                    { value: 'zoom', label: '🔍 Zoom In' }
                                ]}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Background & Media"
                        icon={<Eye size={18} />}
                        isOpen={openSections.background}
                        onToggle={() => toggleSection('background')}
                    >
                        <Select
                            label="Background Type"
                            value={config.backgroundType || 'image'}
                            onChange={v => updateConfig('backgroundType', v)}
                            options={[
                                { value: 'image', label: '🖼️ Single Image' },
                                { value: 'carousel', label: '🎠 Image Carousel' },
                                { value: 'video', label: '🎬 Video' },
                                { value: 'gradient', label: '🌈 Gradient' },
                                { value: 'particles', label: '✨ Particles' },
                                { value: 'solid', label: '🎨 Solid Color' }
                            ]}
                        />

                        {config.backgroundType === 'carousel' && (
                            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <CarouselImageEditor
                                    images={config.carousel?.images || []}
                                    onChange={v => updateNestedConfig('carousel.images', v)}
                                />
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Select
                                        label="Transition"
                                        value={config.carousel?.transition || 'fade'}
                                        onChange={v => updateNestedConfig('carousel.transition', v)}
                                        options={[
                                            { value: 'fade', label: '✨ Soft Fade' },
                                            { value: 'slide', label: '↔️ Smooth Slide' }
                                        ]}
                                    />
                                    <Input
                                        label="Interval (ms)"
                                        type="number"
                                        value={config.carousel?.interval || 5000}
                                        onChange={v => updateNestedConfig('carousel.interval', parseInt(v))}
                                    />
                                </div>
                            </div>
                        )}

                        {(config.backgroundType === 'image' || !config.backgroundType) && (
                            <ImageUploader
                                label="Background Image"
                                value={config.backgroundImage || ''}
                                onChange={v => updateConfig('backgroundImage', v)}
                                aspectRatio="16/9"
                            />
                        )}

                        {config.backgroundType === 'video' && (
                            <Input label="Video URL (MP4)" value={config.videoUrl || ''} onChange={v => updateConfig('videoUrl', v)} />
                        )}

                        {config.backgroundType === 'gradient' && (
                            <GradientBuilder
                                label="Background Gradient"
                                value={config.gradient || {}}
                                onChange={v => updateConfig('gradient', v)}
                            />
                        )}

                        {config.backgroundType === 'solid' && (
                            <ColorPicker
                                label="Background Color"
                                value={config.backgroundColor || '#1e3a8a'}
                                onChange={v => updateConfig('backgroundColor', v)}
                            />
                        )}
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Advanced Overlay"
                        icon={<span>🎭</span>}
                        isOpen={openSections.overlay}
                        onToggle={() => toggleSection('overlay')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-700">Enable Overlay</span>
                            <button
                                type="button"
                                onClick={() => updateConfig('overlay', { ...config.overlay, enabled: !config.overlay?.enabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.overlay?.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.overlay?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {config.overlay?.enabled && (
                            <div className="space-y-4">
                                <Select
                                    label="Overlay Type"
                                    value={config.overlay?.type || 'solid'}
                                    onChange={v => updateConfig('overlay', { ...config.overlay, type: v })}
                                    options={[
                                        { value: 'solid', label: '🎨 Solid Color' },
                                        { value: 'gradient', label: '🌈 Custom Gradient' },
                                        { value: 'mesh', label: '🕸️ Mesh Gradient' },
                                        { value: 'pattern', label: '✨ Animated Pattern' }
                                    ]}
                                />

                                {config.overlay?.type === 'mesh' && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                                        <ColorPicker label="Color 1" value={config.overlay?.mesh?.color1 || '#3b82f6'} onChange={v => updateNestedConfig('overlay.mesh.color1', v)} />
                                        <ColorPicker label="Color 2" value={config.overlay?.mesh?.color2 || '#8b5cf6'} onChange={v => updateNestedConfig('overlay.mesh.color2', v)} />
                                        <ColorPicker label="Color 3" value={config.overlay?.mesh?.color3 || '#ec4899'} onChange={v => updateNestedConfig('overlay.mesh.color3', v)} />
                                        <ColorPicker label="Color 4" value={config.overlay?.mesh?.color4 || '#f59e0b'} onChange={v => updateNestedConfig('overlay.mesh.color4', v)} />
                                    </div>
                                )}

                                {config.overlay?.type === 'pattern' && (
                                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                        <Select
                                            label="Pattern Preset"
                                            value={config.overlay?.pattern?.preset || 'polygons'}
                                            onChange={v => updateNestedConfig('overlay.pattern.preset', v)}
                                            options={[
                                                { value: 'polygons', label: '📐 Floating Polygons' },
                                                { value: 'waves', label: '🌊 Liquid Waves' },
                                                { value: 'abstract', label: '☁️ Abstract Nebula' },
                                                { value: 'grid', label: '📏 Minimal Grid' }
                                            ]}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Overlay Opacity: {config.overlay?.opacity || 0.5}</label>
                                    <input type="range" min="0" max="1" step="0.1" value={config.overlay?.opacity || 0.5} onChange={e => updateConfig('overlay', { ...config.overlay, opacity: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Call to Actions"
                        icon={<Edit2 size={18} />}
                        isOpen={openSections.buttons}
                        onToggle={() => toggleSection('buttons')}
                    >
                        <CTAsArrayEditor
                            value={config.ctas || []}
                            onChange={v => updateConfig('ctas', v)}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Layout & Scaling"
                        icon={<Maximize size={18} />}
                        isOpen={openSections.layout}
                        onToggle={() => toggleSection('layout')}
                    >
                        {/* Parallax */}
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.parallax?.enabled || false}
                                onChange={e => updateNestedConfig('parallax.enabled', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Enable Parallax Effect</span>
                        </label>

                        {config.parallax?.enabled && (
                            <div className="space-y-2 pl-4 border-l-2 border-blue-500">
                                <label className="block text-xs font-bold text-gray-500 uppercase">Parallax Speed: {config.parallax?.speed || 0.5}</label>
                                <input type="range" min="0.1" max="1" step="0.1" value={config.parallax?.speed || 0.5} onChange={e => updateNestedConfig('parallax.speed', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                            <Input label="Height - Desktop (e.g. 600px)" value={config.height?.desktop || '600px'} onChange={v => updateNestedConfig('height.desktop', v)} />
                        </div>
                    </CollapsibleSection>
                </div>
            );
        case 'interactive_section':
            return (
                <div className="space-y-4">
                    <CollapsibleSection
                        title="Section Content"
                        icon={<LayoutTemplate size={18} />}
                        isOpen={openSections.content}
                        onToggle={() => toggleSection('content')}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Title Tag (SEO)"
                                value={config.titleTag || 'h2'}
                                onChange={v => updateConfig('titleTag', v)}
                                options={[
                                    { value: 'h1', label: 'H1 (Main Hero Only)' },
                                    { value: 'h2', label: 'H2 (Standard Section)' },
                                    { value: 'h3', label: 'H3 (Sub Section)' },
                                    { value: 'h4', label: 'H4 (Minor)' }
                                ]}
                            />
                            <Select
                                label="Layout"
                                value={config.layout || 'centered'}
                                onChange={v => updateConfig('layout', v)}
                                options={[
                                    { value: 'centered', label: '🎯 Centered' },
                                    { value: 'left', label: '⬅️ Left Aligned' },
                                    { value: 'right', label: '➡️ Right Aligned' },
                                    { value: 'split', label: '⚡ Split Screen' }
                                ]}
                            />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <Input
                                label="Title Text"
                                value={config.title?.text || config.title || ''}
                                onChange={v => typeof config.title === 'string' ? updateConfig('title', { text: v }) : updateNestedConfig('title.text', v)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <ColorPicker label="Color" value={config.title?.color || '#ffffff'} onChange={v => updateNestedConfig('title.color', v)} />
                                <Select
                                    label="Weight"
                                    value={config.title?.fontWeight || '700'}
                                    onChange={v => updateNestedConfig('title.fontWeight', v)}
                                    options={[
                                        { value: '400', label: 'Normal' },
                                        { value: '700', label: 'Bold' },
                                        { value: '900', label: 'Black' }
                                    ]}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    label="Animation"
                                    value={config.title?.animation?.type || 'none'}
                                    onChange={v => updateNestedConfig('title.animation.type', v)}
                                    options={[
                                        { value: 'none', label: 'None' },
                                        { value: 'fade-up', label: '⬆️ Fade Up' },
                                        { value: 'fade-down', label: '⬇️ Fade Down' },
                                        { value: 'fade', label: '✨ Fade In' },
                                        { value: 'slide-left', label: '⬅️ Slide Left' },
                                        { value: 'slide-right', label: '➡️ Slide Right' },
                                        { value: 'zoom', label: '🔍 Zoom In' }
                                    ]}
                                />
                                <Input
                                    label="Delay (ms)"
                                    type="number"
                                    value={config.title?.animation?.delay || 0}
                                    onChange={v => updateNestedConfig('title.animation.delay', parseInt(v))}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <Input
                                label="Subtitle Text"
                                value={config.subtitle?.text || config.subtitle || ''}
                                onChange={v => typeof config.subtitle === 'string' ? updateConfig('subtitle', { text: v }) : updateNestedConfig('subtitle.text', v)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <ColorPicker label="Color" value={config.subtitle?.color || '#ffffff'} onChange={v => updateNestedConfig('subtitle.color', v)} />
                                <Input
                                    label="Delay (ms)"
                                    type="number"
                                    value={config.subtitle?.animation?.delay || 200}
                                    onChange={v => updateNestedConfig('subtitle.animation.delay', parseInt(v))}
                                />
                            </div>
                            <Select
                                label="Animation"
                                value={config.subtitle?.animation?.type || 'none'}
                                onChange={v => updateNestedConfig('subtitle.animation.type', v)}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'fade-up', label: '⬆️ Fade Up' },
                                    { value: 'fade-down', label: '⬇️ Fade Down' },
                                    { value: 'fade', label: '✨ Fade In' },
                                    { value: 'slide-left', label: '⬅️ Slide Left' },
                                    { value: 'slide-right', label: '➡️ Slide Right' },
                                    { value: 'slide-up', label: '🔝 Slide Up' },
                                    { value: 'zoom', label: '🔍 Zoom In' }
                                ]}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Background & Media"
                        icon={<Eye size={18} />}
                        isOpen={openSections.background}
                        onToggle={() => toggleSection('background')}
                    >
                        <Select
                            label="Background Type"
                            value={config.backgroundType || 'image'}
                            onChange={v => updateConfig('backgroundType', v)}
                            options={[
                                { value: 'image', label: '🖼️ Single Image' },
                                { value: 'carousel', label: '🎠 Image Carousel' },
                                { value: 'video', label: '🎬 Video' },
                                { value: 'gradient', label: '🌈 Gradient' },
                                { value: 'particles', label: '✨ Particles' },
                                { value: 'solid', label: '🎨 Solid Color' }
                            ]}
                        />

                        {config.backgroundType === 'carousel' && (
                            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <CarouselImageEditor
                                    images={config.carousel?.images || []}
                                    onChange={v => updateNestedConfig('carousel.images', v)}
                                />
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Select
                                        label="Transition"
                                        value={config.carousel?.transition || 'fade'}
                                        onChange={v => updateNestedConfig('carousel.transition', v)}
                                        options={[
                                            { value: 'fade', label: '✨ Soft Fade' },
                                            { value: 'slide', label: '↔️ Smooth Slide' }
                                        ]}
                                    />
                                    <Input
                                        label="Interval (ms)"
                                        type="number"
                                        value={config.carousel?.interval || 5000}
                                        onChange={v => updateNestedConfig('carousel.interval', parseInt(v))}
                                    />
                                </div>
                            </div>
                        )}

                        {(config.backgroundType === 'image' || !config.backgroundType) && (
                            <ImageUploader
                                label="Background Image"
                                value={config.backgroundImage || ''}
                                onChange={v => updateConfig('backgroundImage', v)}
                                aspectRatio="16/9"
                            />
                        )}

                        {config.backgroundType === 'video' && (
                            <Input label="Video URL (MP4)" value={config.videoUrl || ''} onChange={v => updateConfig('videoUrl', v)} />
                        )}

                        {config.backgroundType === 'gradient' && (
                            <GradientBuilder
                                label="Background Gradient"
                                value={config.gradient || {}}
                                onChange={v => updateConfig('gradient', v)}
                            />
                        )}

                        {config.backgroundType === 'particles' && (
                            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                <Input label="Particle Count" type="number" value={config.particles?.count || 50} onChange={v => updateNestedConfig('particles.count', parseInt(v))} />
                                <ColorPicker label="Particle Color" value={config.particles?.color || '#ffffff'} onChange={v => updateNestedConfig('particles.color', v)} />
                                <Input label="Particle Speed" type="number" step="0.1" value={config.particles?.speed || 1} onChange={v => updateNestedConfig('particles.speed', parseFloat(v))} />
                            </div>
                        )}

                        {config.backgroundType === 'solid' && (
                            <ColorPicker
                                label="Background Color"
                                value={config.backgroundColor || '#1e3a8a'}
                                onChange={v => updateConfig('backgroundColor', v)}
                            />
                        )}
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Hover & Interaction"
                        icon={<span>⚡</span>}
                        isOpen={openSections.interaction}
                        onToggle={() => toggleSection('interaction')}
                    >
                        <Input
                            label="Section Click URL"
                            placeholder="e.g. /shop or https://..."
                            value={config.sectionLink || ''}
                            onChange={v => updateConfig('sectionLink', v)}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 italic">Makes the entire section clickable.</p>

                        <div className="pt-4 border-t">
                            <Select
                                label="Hover Animation"
                                value={config.hoverEffect || 'none'}
                                onChange={v => updateConfig('hoverEffect', v)}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'zoom', label: '🔍 Subtle Zoom' },
                                    { value: 'lift', label: '🚀 Floating Lift' },
                                    { value: 'brighten', label: '✨ Brighter Color' },
                                    { value: 'glass', label: '💎 Frosted Glass' }
                                ]}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Advanced Overlay"
                        icon={<span>🎭</span>}
                        isOpen={openSections.overlay}
                        onToggle={() => toggleSection('overlay')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-700">Enable Overlay</span>
                            <button
                                type="button"
                                onClick={() => updateConfig('overlay', { ...config.overlay, enabled: !config.overlay?.enabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.overlay?.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.overlay?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {config.overlay?.enabled && (
                            <div className="space-y-4">
                                <Select
                                    label="Overlay Type"
                                    value={config.overlay?.type || 'solid'}
                                    onChange={v => updateConfig('overlay', { ...config.overlay, type: v })}
                                    options={[
                                        { value: 'solid', label: '🎨 Solid Color' },
                                        { value: 'gradient', label: '🌈 Custom Gradient' },
                                        { value: 'mesh', label: '🕸️ Mesh Gradient' },
                                        { value: 'pattern', label: '✨ Animated Pattern' }
                                    ]}
                                />

                                {config.overlay?.type === 'mesh' && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                                        <ColorPicker label="Color 1" value={config.overlay?.mesh?.color1 || '#3b82f6'} onChange={v => updateNestedConfig('overlay.mesh.color1', v)} />
                                        <ColorPicker label="Color 2" value={config.overlay?.mesh?.color2 || '#8b5cf6'} onChange={v => updateNestedConfig('overlay.mesh.color2', v)} />
                                        <ColorPicker label="Color 3" value={config.overlay?.mesh?.color3 || '#ec4899'} onChange={v => updateNestedConfig('overlay.mesh.color3', v)} />
                                        <ColorPicker label="Color 4" value={config.overlay?.mesh?.color4 || '#f59e0b'} onChange={v => updateNestedConfig('overlay.mesh.color4', v)} />
                                    </div>
                                )}

                                {config.overlay?.type === 'pattern' && (
                                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                        <Select
                                            label="Pattern Preset"
                                            value={config.overlay?.pattern?.preset || 'polygons'}
                                            onChange={v => updateNestedConfig('overlay.pattern.preset', v)}
                                            options={[
                                                { value: 'polygons', label: '📐 Floating Polygons' },
                                                { value: 'waves', label: '🌊 Liquid Waves' },
                                                { value: 'abstract', label: '☁️ Abstract Nebula' },
                                                { value: 'grid', label: '📏 Minimal Grid' }
                                            ]}
                                        />
                                    </div>
                                )}

                                {config.overlay?.type === 'gradient' && (
                                    <GradientBuilder
                                        label="Overlay Gradient"
                                        value={config.overlay?.gradient || {}}
                                        onChange={v => updateNestedConfig('overlay.gradient', v)}
                                    />
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Opacity: {config.overlay?.opacity || 0.5}</label>
                                    <input type="range" min="0" max="1" step="0.1" value={config.overlay?.opacity || 0.5} onChange={e => updateConfig('overlay', { ...config.overlay, opacity: parseFloat(e.target.value) })} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Call to Actions"
                        icon={<Edit2 size={18} />}
                        isOpen={openSections.buttons}
                        onToggle={() => toggleSection('buttons')}
                    >
                        <CTAsArrayEditor
                            value={config.ctas || []}
                            onChange={v => updateConfig('ctas', v)}
                        />
                    </CollapsibleSection>
                </div>
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

                    <Select label="Sort Order" value={config.sort || 'newest'} onChange={v => updateConfig('sort', v)} options={[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'oldest', label: 'Oldest First' },
                        { value: 'price_asc', label: 'Price: Low to High' },
                        { value: 'price_desc', label: 'Price: High to Low' },
                        { value: 'name_asc', label: 'Name: A-Z' },
                        { value: 'name_desc', label: 'Name: Z-A' },
                        { value: 'random', label: 'Random' },
                    ]} />

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
        case 'category_carousel':
            return (
                <>
                    {/* Section Header */}
                    <div className="space-y-3 pb-4 border-b">
                        <Input label="Section Title" value={config.sectionTitle || 'Shop by Category'} onChange={v => updateConfig('sectionTitle', v)} />
                        <Input label="Section Subtitle" value={config.sectionSubtitle || ''} onChange={v => updateConfig('sectionSubtitle', v)} placeholder="Optional subtitle" />
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.showSectionTitle !== false} onChange={e => updateConfig('showSectionTitle', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Show Section Title</span>
                        </label>
                    </div>

                    {/* Category Selection */}
                    <details open className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                        <summary className="font-bold text-blue-900 cursor-pointer mb-3">📂 Category Selection</summary>
                        <Select
                            label="Source Type"
                            value={config.sourceType || 'top-level'}
                            onChange={v => updateConfig('sourceType', v)}
                            options={[
                                { value: 'top-level', label: 'All Top-Level Categories' },
                                { value: 'subcategories', label: 'Subcategories of Parent' },
                                { value: 'all-subcategories', label: 'All Subcategories' },
                                { value: 'random', label: 'Random Selection' },
                                { value: 'manual', label: 'Manual Selection' }
                            ]}
                        />

                        {config.sourceType === 'subcategories' && (
                            <Select
                                label="Parent Category"
                                value={config.parentCategoryId || ''}
                                onChange={v => updateConfig('parentCategoryId', v)}
                                options={[
                                    { value: '', label: 'Select Parent Category' },
                                    ...categories.map(c => ({ value: c.id, label: c.name }))
                                ]}
                            />
                        )}

                        {config.sourceType === 'manual' && (
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-700 uppercase">Select Categories</label>
                                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-white space-y-1">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(config.manualCategoryIds || []).includes(cat.id)}
                                                onChange={e => {
                                                    const current = config.manualCategoryIds || [];
                                                    const newIds = e.target.checked
                                                        ? [...current, cat.id]
                                                        : current.filter(id => id !== cat.id);
                                                    updateConfig('manualCategoryIds', newIds);
                                                }}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">{(config.manualCategoryIds || []).length} categories selected</p>
                            </div>
                        )}

                        {config.sourceType === 'random' && (
                            <Input label="Random Count" type="number" value={config.randomCount || 6} onChange={v => updateConfig('randomCount', parseInt(v))} />
                        )}

                        <Select
                            label="Sort Order"
                            value={config.sortOrder || 'alphabetical'}
                            onChange={v => updateConfig('sortOrder', v)}
                            options={[
                                { value: 'alphabetical', label: 'Alphabetical' },
                                { value: 'random', label: 'Random' },
                                { value: 'manual', label: 'Manual' }
                            ]}
                        />

                        <Input label="Max Categories" type="number" value={config.maxCategories || 12} onChange={v => updateConfig('maxCategories', parseInt(v))} />
                    </details>

                    {/* Layout & Structure */}
                    <details open className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
                        <summary className="font-bold text-purple-900 cursor-pointer mb-3">📐 Layout & Structure</summary>

                        <Select
                            label="Display Mode"
                            value={config.displayMode || 'carousel'}
                            onChange={v => updateConfig('displayMode', v)}
                            options={[
                                { value: 'carousel', label: '🎠 Carousel' },
                                { value: 'grid', label: '⚡ Grid' }
                            ]}
                        />

                        {/* Carousel Behavior - Always visible, but only functional when displayMode is carousel */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3 mt-4">
                            <h4 className="font-semibold text-sm text-blue-900 border-b pb-2">🎠 Carousel Behavior</h4>
                            <p className="text-xs text-blue-700 mb-2">These settings apply when Display Mode is set to Carousel</p>
                            
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-blue-900">Sneak Peek</span>
                                    <span className="text-[10px] text-blue-700">Show portion of next category</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateConfig('peekEffect', !config.peekEffect)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.peekEffect ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.peekEffect ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-blue-900">Autoplay</span>
                                    <span className="text-[10px] text-blue-700">Automatically move carousel</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateConfig('autoPlay', !config.autoPlay)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.autoPlay ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.autoPlay ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {config.autoPlay && (
                                <Input 
                                    label="Autoplay Interval (ms)" 
                                    type="number" 
                                    value={config.autoPlayInterval || 3000} 
                                    onChange={v => updateConfig('autoPlayInterval', parseInt(v))} 
                                    min={1000}
                                />
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100">
                                    <input type="checkbox" checked={config.infiniteLoop !== false} onChange={e => updateConfig('infiniteLoop', e.target.checked)} className="w-4 h-4" />
                                    <span className="text-sm font-medium">Infinite Loop</span>
                                </label>
                                <Input label="Items to Scroll" type="number" value={config.itemsToScroll || 1} onChange={v => updateConfig('itemsToScroll', parseInt(v))} min={1} />
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3 mt-4">
                            <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Grid Columns (Per Breakpoint)</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Desktop" type="number" value={config.columns?.desktop || 4} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) || 4 })} min={1} max={6} />
                                <Input label="Tablet" type="number" value={config.columns?.tablet || 3} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) || 3 })} min={1} max={6} />
                                <Input label="Mobile" type="number" value={config.columns?.mobile || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) || 2 })} min={1} max={6} />
                            </div>
                            <p className="text-xs text-gray-500">Number of columns to display at each screen size breakpoint</p>
                        </div>

                        <Input
                            label="⚖️ Global Scale (Multiplier)"
                            type="number"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={config.globalScale || 1.0}
                            onChange={v => updateConfig('globalScale', parseFloat(v))}
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Gap/Spacing (Carousel)"
                                value={config.gap || 'md'}
                                onChange={v => updateConfig('gap', v)}
                                options={[
                                    { value: 'sm', label: 'Small' },
                                    { value: 'md', label: 'Medium' },
                                    { value: 'lg', label: 'Large' },
                                    { value: 'xl', label: 'Extra Large' }
                                ]}
                            />
                            <Input 
                                label="Grid Gap (Grid Mode)" 
                                value={config.gridGap || ''} 
                                onChange={v => updateConfig('gridGap', v)} 
                                placeholder="12px" 
                            />
                        </div>
                        <p className="text-xs text-gray-500">Gap/Spacing applies to carousel mode, Grid Gap applies when display mode is set to Grid</p>
                    </details>

                    {/* Card Shape & Style */}
                    <details open className="p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl">
                        <summary className="font-bold text-green-900 cursor-pointer mb-3">🎨 Card Shape & Style</summary>

                        <Select
                            label="Card Shape"
                            value={config.cardShape || 'rounded-square'}
                            onChange={v => updateConfig('cardShape', v)}
                            options={[
                                { value: 'square', label: '⬜ Square' },
                                { value: 'circle', label: '⭕ Circle' },
                                { value: 'rounded-square', label: '▢ Rounded Square' },
                                { value: 'hexagon', label: '⬡ Hexagon' }
                            ]}
                        />

                        {config.cardShape === 'rounded-square' && (
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Radius (Desktop)" type="number" value={config.borderRadius || 16} onChange={v => updateConfig('borderRadius', parseInt(v))} />
                                <Input label="Radius (Mobile)" type="number" value={config.mobileBorderRadius !== undefined ? config.mobileBorderRadius : (config.borderRadius || 16) / 2} onChange={v => updateConfig('mobileBorderRadius', parseInt(v))} />
                            </div>
                        )}

                        <Select
                            label="Aspect Ratio"
                            value={config.aspectRatio || '1:1'}
                            onChange={v => updateConfig('aspectRatio', v)}
                            options={[
                                { value: '1:1', label: 'Square (1:1)' },
                                { value: '4:3', label: 'Standard (4:3)' },
                                { value: '16:9', label: 'Widescreen (16:9)' }
                            ]}
                        />

                        <Select
                            label="Card Style"
                            value={config.cardStyle || 'elevated'}
                            onChange={v => updateConfig('cardStyle', v)}
                            options={[
                                { value: 'flat', label: 'Flat' },
                                { value: 'bordered', label: 'Bordered' },
                                { value: 'elevated', label: 'Elevated' },
                                { value: 'glassmorphic', label: '✨ Glassmorphic' }
                            ]}
                        />

                        {config.cardStyle === 'bordered' && (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label="Width (Desktop)" type="number" value={config.borderWidth || 2} onChange={v => updateConfig('borderWidth', parseInt(v))} />
                                    <Input label="Width (Mobile)" type="number" value={config.borderWidthMobile !== undefined ? config.borderWidthMobile : (config.borderWidth || 2)} onChange={v => updateConfig('borderWidthMobile', parseInt(v))} />
                                </div>
                                <ColorPicker label="Border Color" value={config.borderColor || '#e5e7eb'} onChange={v => updateConfig('borderColor', v)} />
                            </>
                        )}

                        <label className="flex items-center gap-2 p-3 bg-white rounded-lg">
                            <input type="checkbox" checked={config.backgroundGradient || false} onChange={e => updateConfig('backgroundGradient', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Use Background Gradient</span>
                        </label>

                        {config.backgroundGradient ? (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorPicker label="Gradient Start" value={config.gradientStart || '#f9fafb'} onChange={v => updateConfig('gradientStart', v)} />
                                    <ColorPicker label="Gradient End" value={config.gradientEnd || '#e5e7eb'} onChange={v => updateConfig('gradientEnd', v)} />
                                </div>
                                <Select
                                    label="Gradient Direction"
                                    value={config.gradientDirection || 'to-br'}
                                    onChange={v => updateConfig('gradientDirection', v)}
                                    options={[
                                        { value: 'to-r', label: 'Left to Right' },
                                        { value: 'to-br', label: 'Top-Left to Bottom-Right' },
                                        { value: 'to-b', label: 'Top to Bottom' },
                                        { value: 'to-bl', label: 'Top-Right to Bottom-Left' }
                                    ]}
                                />
                            </>
                        ) : (
                            <ColorPicker label="Background Color" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
                        )}
                    </details>

                    {/* Shadow & Depth */}
                    <details open className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                        <summary className="font-bold text-yellow-900 cursor-pointer mb-3">🌟 Shadow & Depth</summary>

                        <Select
                            label="Shadow Style"
                            value={config.shadowStyle || 'medium'}
                            onChange={v => updateConfig('shadowStyle', v)}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'soft', label: 'Soft' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'hard', label: 'Hard' },
                                { value: 'custom', label: 'Custom' }
                            ]}
                        />

                        {config.shadowStyle === 'custom' && (
                            <>
                                <ColorPicker label="Shadow Color" value={config.shadowColor || 'rgba(0, 0, 0, 0.1)'} onChange={v => updateConfig('shadowColor', v)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label="Blur (px)" type="number" value={config.shadowBlur || 20} onChange={v => updateConfig('shadowBlur', parseInt(v))} />
                                    <Input label="Spread (px)" type="number" value={config.shadowSpread || 0} onChange={v => updateConfig('shadowSpread', parseInt(v))} />
                                    <Input label="Offset X (px)" type="number" value={config.shadowOffsetX || 0} onChange={v => updateConfig('shadowOffsetX', parseInt(v))} />
                                    <Input label="Offset Y (px)" type="number" value={config.shadowOffsetY || 8} onChange={v => updateConfig('shadowOffsetY', parseInt(v))} />
                                </div>
                            </>
                        )}
                    </details>

                    {/* Image & Overlay */}
                    <details className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                        <summary className="font-bold text-red-900 cursor-pointer mb-3">🖼️ Image & Overlay</summary>

                        <Select
                            label="Image Fit"
                            value={config.imageFit || 'cover'}
                            onChange={v => updateConfig('imageFit', v)}
                            options={[
                                { value: 'cover', label: 'Cover' },
                                { value: 'contain', label: 'Contain' },
                                { value: 'fill', label: 'Fill' }
                            ]}
                        />

                        <Select
                            label="Overlay Type"
                            value={config.overlayType || 'gradient'}
                            onChange={v => updateConfig('overlayType', v)}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'gradient', label: 'Gradient' },
                                { value: 'solid', label: 'Solid' }
                            ]}
                        />

                        {config.overlayType !== 'none' && (
                            <>
                                <ColorPicker label="Overlay Color" value={config.overlayColor || '#000000'} onChange={v => updateConfig('overlayColor', v)} />
                                <Input label="Overlay Opacity (%)" type="number" min="0" max="100" value={config.overlayOpacity || 40} onChange={v => updateConfig('overlayOpacity', parseInt(v))} />
                            </>
                        )}

                        <Input label="Image Zoom on Hover" type="number" min="1" max="2" step="0.1" value={config.imageZoomOnHover || 1.1} onChange={v => updateConfig('imageZoomOnHover', parseFloat(v))} />
                    </details>

                    {/* Category Name Typography */}
                    <details className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl">
                        <summary className="font-bold text-indigo-900 cursor-pointer mb-3">📝 Category Typography</summary>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <Select
                                label="Content Position (Desktop)"
                                value={config.contentPositionDesktop || 'overlay'}
                                onChange={v => updateConfig('contentPositionDesktop', v)}
                                options={[
                                    { value: 'overlay', label: '🖼️ Overlay' },
                                    { value: 'below', label: '⬇️ Below Image' }
                                ]}
                            />
                            <Select
                                label="Content Position (Mobile)"
                                value={config.contentPositionMobile || 'below'}
                                onChange={v => updateConfig('contentPositionMobile', v)}
                                options={[
                                    { value: 'overlay', label: '🖼️ Overlay' },
                                    { value: 'below', label: '⬇️ Below Image' }
                                ]}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Input label="Font (Desktop)" type="number" value={config.categoryTitleFontSizeDesktop || 18} onChange={v => updateConfig('categoryTitleFontSizeDesktop', parseInt(v))} />
                            <Input label="Font (Tablet)" type="number" value={config.categoryTitleFontSizeTablet || 16} onChange={v => updateConfig('categoryTitleFontSizeTablet', parseInt(v))} />
                            <Input label="Font (Mobile)" type="number" value={config.categoryTitleFontSizeMobile || 14} onChange={v => updateConfig('categoryTitleFontSizeMobile', parseInt(v))} />
                        </div>

                        <Input label="Category Font Weight" type="number" min="100" max="900" step="100" value={config.categoryTitleFontWeight || 600} onChange={v => updateConfig('categoryTitleFontWeight', parseInt(v))} />

                        <ColorPicker label="Category Text Color" value={config.categoryTitleColor || '#ffffff'} onChange={v => updateConfig('categoryTitleColor', v)} />

                        <Select
                            label="Category Text Alignment"
                            value={config.categoryTitleAlignment || 'center'}
                            onChange={v => updateConfig('categoryTitleAlignment', v)}
                            options={[
                                { value: 'left', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'right', label: 'Right' }
                            ]}
                        />

                        <label className="flex items-center gap-2 p-3 bg-white rounded-lg">
                            <input type="checkbox" checked={config.showProductCount !== false} onChange={e => updateConfig('showProductCount', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Show Product Count</span>
                        </label>
                    </details>

                    {/* Hover Effects */}
                    <details className="p-4 bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl">
                        <summary className="font-bold text-cyan-900 cursor-pointer mb-3">✨ Hover Effects</summary>

                        <Select
                            label="Hover Animation"
                            value={config.hoverAnimation || 'lift'}
                            onChange={v => updateConfig('hoverAnimation', v)}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'lift', label: '⬆️ Lift' },
                                { value: 'zoom', label: '🔍 Zoom' },
                                { value: 'tilt', label: '↗️ Tilt' },
                                { value: 'glow', label: '✨ Glow' },
                                { value: 'pulse', label: '💫 Pulse' }
                            ]}
                        />

                        {config.hoverAnimation === 'lift' && (
                            <Input label="Lift Height (px)" type="number" value={config.liftHeight || 8} onChange={v => updateConfig('liftHeight', parseInt(v))} />
                        )}

                        {config.hoverAnimation === 'zoom' && (
                            <Input label="Zoom Scale" type="number" min="1" max="1.5" step="0.05" value={config.zoomScale || 1.05} onChange={v => updateConfig('zoomScale', parseFloat(v))} />
                        )}

                        {config.hoverAnimation === 'tilt' && (
                            <Input label="Tilt Angle (deg)" type="number" value={config.tiltAngle || 5} onChange={v => updateConfig('tiltAngle', parseInt(v))} />
                        )}

                        <label className="flex items-center gap-2 p-3 bg-white rounded-lg">
                            <input type="checkbox" checked={config.hoverShadowEnhancement !== false} onChange={e => updateConfig('hoverShadowEnhancement', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Enhance Shadow on Hover</span>
                        </label>

                        <Input label="Overlay Opacity on Hover (%)" type="number" min="0" max="100" value={config.overlayOpacityOnHover || 20} onChange={v => updateConfig('overlayOpacityOnHover', parseInt(v))} />
                    </details>

                    {/* Animations & Transitions */}
                    <details className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                        <summary className="font-bold text-emerald-900 cursor-pointer mb-3">🎬 Animations</summary>

                        <Select
                            label="Entrance Animation"
                            value={config.entranceAnimation || 'fade'}
                            onChange={v => updateConfig('entranceAnimation', v)}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'fade', label: 'Fade In' },
                                { value: 'slide', label: 'Slide Up' },
                                { value: 'zoom', label: 'Zoom In' },
                                { value: 'bounce', label: 'Bounce In' }
                            ]}
                        />

                        <Input label="Stagger Delay (ms)" type="number" value={config.staggerDelay || 100} onChange={v => updateConfig('staggerDelay', parseInt(v))} />
                        <Input label="Transition Duration (ms)" type="number" value={config.transitionDuration || 300} onChange={v => updateConfig('transitionDuration', parseInt(v))} />
                    </details>

                    {/* Navigation Controls */}
                    {(config.displayMode === 'carousel' || !config.displayMode) && (
                        <details open className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                            <summary className="font-bold text-amber-900 cursor-pointer mb-3">🎮 Navigation</summary>

                            <Select
                                label="Show Arrows"
                                value={config.showArrows || 'hover'}
                                onChange={v => updateConfig('showArrows', v)}
                                options={[
                                    { value: 'always', label: 'Always Visible' },
                                    { value: 'hover', label: 'On Hover (Always on Mobile)' },
                                    { value: 'never', label: 'Never' }
                                ]}
                            />
                            <p className="text-xs text-amber-700 mt-1 mb-3">Note: Arrows are always visible on mobile devices for better touch navigation</p>
                            <p className="text-xs text-amber-700 mt-1">Note: Arrows are always visible on mobile devices for better touch navigation</p>

                            {config.showArrows !== 'never' && (
                                <>
                                    <Select
                                        label="Arrow Style"
                                        value={config.arrowStyle || 'modern'}
                                        onChange={v => updateConfig('arrowStyle', v)}
                                        options={[
                                            { value: 'classic', label: 'Classic' },
                                            { value: 'modern', label: 'Modern' },
                                            { value: 'minimal', label: 'Minimal' }
                                        ]}
                                    />

                                    <Select
                                        label="Arrow Shape"
                                        value={config.arrowShape || 'circle'}
                                        onChange={v => updateConfig('arrowShape', v)}
                                        options={[
                                            { value: 'circle', label: 'Circle' },
                                            { value: 'square', label: 'Square' },
                                            { value: 'none', label: 'None' }
                                        ]}
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <ColorPicker label="Arrow Color" value={config.arrowColor || '#ffffff'} onChange={v => updateConfig('arrowColor', v)} />
                                        <ColorPicker label="Arrow Background" value={config.arrowBackgroundColor || 'rgba(0, 0, 0, 0.5)'} onChange={v => updateConfig('arrowBackgroundColor', v)} />
                                    </div>
                                </>
                            )}

                            <label className="flex items-center gap-2 p-3 bg-white rounded-lg">
                                <input type="checkbox" checked={config.showDots !== false} onChange={e => updateConfig('showDots', e.target.checked)} className="w-4 h-4" />
                                <span className="text-sm">Show Pagination Dots</span>
                            </label>
                        </details>
                    )}

                    {/* Additional Settings */}
                    <details className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
                        <summary className="font-bold text-gray-900 cursor-pointer mb-3">⚙️ Additional Settings</summary>

                        <Input label="Empty State Message" value={config.emptyMessage || 'No categories available'} onChange={v => updateConfig('emptyMessage', v)} />

                        <label className="flex items-center gap-2 p-3 bg-white rounded-lg">
                            <input type="checkbox" checked={config.showExploreCTA !== false} onChange={e => updateConfig('showExploreCTA', e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm">Show "Explore Categories" CTA</span>
                        </label>

                        <Input label="Badge Label (optional)" value={config.badgeLabel || ''} onChange={v => updateConfig('badgeLabel', v)} placeholder="e.g., New, Featured" />

                        {config.badgeLabel && (
                            <Select
                                label="Badge Position"
                                value={config.badgePosition || 'top-right'}
                                onChange={v => updateConfig('badgePosition', v)}
                                options={[
                                    { value: 'top-left', label: 'Top Left' },
                                    { value: 'top-right', label: 'Top Right' },
                                    { value: 'bottom', label: 'Bottom' }
                                ]}
                            />
                        )}

                        <ColorPicker label="Section Background" value={config.sectionBackground || 'transparent'} onChange={v => updateConfig('sectionBackground', v)} />
                    </details>

                    <CollapsibleSection
                        title="Styling & Spacing"
                        icon={<Maximize size={18} />}
                        isOpen={openSections.styling}
                        onToggle={() => toggleSection('styling')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Show Title</span>
                                <button
                                    type="button"
                                    onClick={() => updateConfig('showSectionTitle', config.showSectionTitle === false ? true : false)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showSectionTitle !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showSectionTitle !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-blue-900">Full Width Title</span>
                                    <input
                                        type="checkbox"
                                        checked={config.fullWidthTitle || false}
                                        onChange={e => updateConfig('fullWidthTitle', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                </label>
                                <p className="text-[10px] text-blue-700 leading-tight">
                                    Forces the title to ignore container padding. Highly recommended when using a <strong>Title Background Color</strong>.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Section Title Size" value={config.sectionTitleFontSize || ''} onChange={v => updateConfig('sectionTitleFontSize', v)} placeholder="1.875rem" />
                                <Input label="Section Title Weight" value={config.sectionTitleFontWeight || ''} onChange={v => updateConfig('sectionTitleFontWeight', v)} placeholder="700" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker label="Section Title Color" value={config.sectionTitleColor || '#111827'} onChange={v => updateConfig('sectionTitleColor', v)} />
                                <Select label="Section Title Align" value={config.sectionTitleAlign || 'center'} onChange={v => updateConfig('sectionTitleAlign', v)} options={[
                                    { value: 'left', label: 'Left' },
                                    { value: 'center', label: 'Center' },
                                    { value: 'right', label: 'Right' }
                                ]} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker label="Section Title Background" value={config.sectionTitleBackgroundColor || 'transparent'} onChange={v => updateConfig('sectionTitleBackgroundColor', v)} />
                                <Input label="Section Title Padding" value={config.sectionTitlePadding || ''} onChange={v => updateConfig('sectionTitlePadding', v)} placeholder="0" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Section Padding Top" value={config.sectionPaddingTop || ''} onChange={v => updateConfig('sectionPaddingTop', v)} placeholder="48px" />
                                <Input label="Section Padding Bottom" value={config.sectionPaddingBottom || ''} onChange={v => updateConfig('sectionPaddingBottom', v)} placeholder="48px" />
                            </div>

                            <Input label="Section Title Bottom Margin" value={config.sectionTitleBottomMargin || ''} onChange={v => updateConfig('sectionTitleBottomMargin', v)} placeholder="32px" />
                        </div>
                    </CollapsibleSection>

                    {/* Randomization Section for Category Carousel */}
                    <CollapsibleSection
                        title="Randomization"
                        icon={<Shuffle size={18} />}
                        isOpen={openSections.randomization}
                        onToggle={() => toggleSection('randomization')}
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-purple-900">Enable Randomization</span>
                                        <span className="text-[10px] text-purple-700">Make widget content dynamic by randomizing category source type</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!config.randomize) {
                                                updateNestedConfig('randomize', {
                                                    enabled: true,
                                                    interval: 'session',
                                                    randomizeCategorySource: false,
                                                    allowedCategorySourceTypes: ['top-level', 'all-subcategories', 'random']
                                                });
                                            } else {
                                                updateNestedConfig('randomize.enabled', !config.randomize.enabled);
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize?.enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {config.randomize?.enabled && (
                                <>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Randomization Interval</label>
                                        <Select
                                            value={config.randomize.interval || 'session'}
                                            onChange={v => updateNestedConfig('randomize.interval', v)}
                                            options={[
                                                { value: 'page_load', label: 'Every Page Load' },
                                                { value: 'session', label: 'Once Per Session' },
                                                { value: 'hourly', label: 'Every Hour' },
                                                { value: 'daily', label: 'Once Per Day' }
                                            ]}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">Randomize Category Source Type</span>
                                            <span className="text-[10px] text-gray-500">Randomly pick between top-level, subcategories, etc.</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateNestedConfig('randomize.randomizeCategorySource', !config.randomize.randomizeCategorySource)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeCategorySource ? 'bg-blue-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeCategorySource ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {config.randomize.randomizeCategorySource && (
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                            <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">Allowed Category Source Types</label>
                                            <div className="space-y-2">
                                                {['top-level', 'all-subcategories', 'random'].map(st => (
                                                    <label key={st} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={(config.randomize.allowedCategorySourceTypes || []).includes(st)}
                                                            onChange={e => {
                                                                const current = config.randomize.allowedCategorySourceTypes || [];
                                                                const updated = e.target.checked
                                                                    ? [...current, st]
                                                                    : current.filter(t => t !== st);
                                                                updateNestedConfig('randomize.allowedCategorySourceTypes', updated.length > 0 ? updated : ['top-level']);
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            {st === 'top-level' ? 'Top-Level Categories' :
                                                             st === 'all-subcategories' ? 'All Subcategories' :
                                                             'Random Selection'}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CollapsibleSection>
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

                    {/* Randomization Section for Category Carousel */}
                    <CollapsibleSection
                        title="Randomization"
                        icon={<Shuffle size={18} />}
                        isOpen={openSections.randomization}
                        onToggle={() => toggleSection('randomization')}
                    >
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-purple-900">Enable Randomization</span>
                                        <span className="text-[10px] text-purple-700">Make widget content dynamic by randomizing category source type</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!config.randomize) {
                                                updateNestedConfig('randomize', {
                                                    enabled: true,
                                                    interval: 'session',
                                                    randomizeCategorySource: false,
                                                    allowedCategorySourceTypes: ['top-level', 'all-subcategories', 'random']
                                                });
                                            } else {
                                                updateNestedConfig('randomize.enabled', !config.randomize.enabled);
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize?.enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {config.randomize?.enabled && (
                                <>
                                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Randomization Interval</label>
                                        <Select
                                            value={config.randomize.interval || 'session'}
                                            onChange={v => updateNestedConfig('randomize.interval', v)}
                                            options={[
                                                { value: 'page_load', label: 'Every Page Load' },
                                                { value: 'session', label: 'Once Per Session' },
                                                { value: 'hourly', label: 'Every Hour' },
                                                { value: 'daily', label: 'Once Per Day' }
                                            ]}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">Randomize Category Source Type</span>
                                            <span className="text-[10px] text-gray-500">Randomly pick between top-level, subcategories, etc.</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateNestedConfig('randomize.randomizeCategorySource', !config.randomize.randomizeCategorySource)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.randomize.randomizeCategorySource ? 'bg-blue-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.randomize.randomizeCategorySource ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    {config.randomize.randomizeCategorySource && (
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                            <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2">Allowed Category Source Types</label>
                                            <div className="space-y-2">
                                                {['top-level', 'all-subcategories', 'random'].map(st => (
                                                    <label key={st} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={(config.randomize.allowedCategorySourceTypes || []).includes(st)}
                                                            onChange={e => {
                                                                const current = config.randomize.allowedCategorySourceTypes || [];
                                                                const updated = e.target.checked
                                                                    ? [...current, st]
                                                                    : current.filter(t => t !== st);
                                                                updateNestedConfig('randomize.allowedCategorySourceTypes', updated.length > 0 ? updated : ['top-level']);
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            {st === 'top-level' ? 'Top-Level Categories' :
                                                             st === 'all-subcategories' ? 'All Subcategories' :
                                                             'Random Selection'}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CollapsibleSection>
                </>
            );
        case 'search_bar':
            return (
                <>
                    <Input label="Placeholder Text" value={config.placeholder || 'Search products…'} onChange={v => updateConfig('placeholder', v)} />
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.autocomplete !== false} onChange={e => updateConfig('autocomplete', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Enable Autocomplete</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.container !== false} onChange={e => updateConfig('container', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Wrap in Container</span>
                        </label>
                    </div>
                    {config.autocomplete !== false && (
                        <Input label="Autocomplete Limit" type="number" value={config.autocomplete_limit || 8} onChange={v => updateConfig('autocomplete_limit', parseInt(v))} min={1} max={20} />
                    )}
                    <p className="text-xs text-gray-500 mt-2">This widget connects to the search API and shows autocomplete suggestions as users type.</p>
                </>
            );
        case 'search_filters':
            return (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.showTitle !== false} onChange={e => updateConfig('showTitle', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Title</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.container !== false} onChange={e => updateConfig('container', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Wrap in Container</span>
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Displays category, price, status, featured, and product attribute filters. Filters are automatically populated from your search index.</p>
                </>
            );
        case 'search_results':
            return (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.showHeader !== false} onChange={e => updateConfig('showHeader', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Header (count + sort)</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.container !== false} onChange={e => updateConfig('container', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Wrap in Container</span>
                        </label>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Grid Columns</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Desktop" type="number" value={config.columns?.desktop || 4} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) })} min={1} max={6} />
                            <Input label="Tablet" type="number" value={config.columns?.tablet || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) })} min={1} max={6} />
                            <Input label="Mobile" type="number" value={config.columns?.mobile || 1} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) })} min={1} max={6} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Displays search results with sorting and pagination. Works with Search Bar and Search Filters widgets on the same page.</p>
                </>
            );

        case 'search_page_layout':
            return (
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                        <h4 className="font-semibold text-sm text-blue-900 border-b pb-2">Layout Configuration</h4>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Display Sidebar Filters</label>
                            <button
                                type="button"
                                onClick={() => updateConfig('sidebarEnabled', !config.sidebarEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.sidebarEnabled !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.sidebarEnabled !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Show Mobile Filters</label>
                            <button
                                type="button"
                                onClick={() => updateConfig('showFilters', !config.showFilters)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.showFilters !== false ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showFilters !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Results Grid (Columns)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Desktop" type="number" value={config.columns?.desktop || 5} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) })} min={1} max={6} />
                            <Input label="Tablet" type="number" value={config.columns?.tablet || 3} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) })} min={1} max={6} />
                            <Input label="Mobile" type="number" value={config.columns?.mobile || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) })} min={1} max={6} />
                        </div>
                        <p className="text-xs text-gray-500 italic">Adjust how many products appear per row in the search results.</p>
                    </div>
                </div>
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
