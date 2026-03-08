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
import WidgetEditorModal, { getDefaultConfig } from "@/components/builder/WidgetEditorModal";
import { Eye, EyeOff, Edit2, Trash2, Copy, GripVertical, Save, ArrowLeft, LayoutTemplate, Maximize, Plus, X, ChevronLeft, ChevronRight, Sparkles, Shuffle, Menu } from "lucide-react";

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
    const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
    const [pendingChanges, setPendingChanges] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeId, setActiveId] = useState(null); // For DragOverlay
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
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

    const [bannerGroups, setBannerGroups] = useState([]);

    useEffect(() => {
        fetchPages();
        fetchCategories();
        fetchCollections();
        fetchAttributes();
        fetchBannerGroups();
    }, []);

    const fetchBannerGroups = async () => {
        try {
            const res = await api.get('/modules/banner/groups');
            if (res.data.success) {
                setBannerGroups(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch banner groups', error);
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

    const handleDuplicateWidget = (originalWidget) => {
        const createDuplicates = (widgetToClone, newParentId = null) => {
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // Find children of THIS widget in the CURRENT state
            const children = widgets.filter(w => w.parent_id === widgetToClone.id);

            // Create the duplicate of current widget
            const { id, created_at, updated_at, ...cleanWidget } = widgetToClone;
            const duplicate = {
                ...cleanWidget,
                id: tempId,
                parent_id: newParentId,
            };

            // Recursive step for children
            const childDuplicates = children.flatMap(child => createDuplicates(child, tempId));

            return [duplicate, ...childDuplicates];
        };

        const duplicatedSet = createDuplicates(originalWidget, originalWidget.parent_id);

        // Add to main state
        setWidgets(prev => [...prev, ...duplicatedSet]);

        // Track in pending changes
        const changes = duplicatedSet.map(w => ({
            type: 'create',
            tempId: w.id,
            data: {
                widget_type: w.widget_type,
                config: w.config,
                page_type: w.page_type,
                is_active: w.is_active,
                parent_id: w.parent_id,
                layout_id: layoutId
            }
        }));
        setPendingChanges(prev => [...prev, ...changes]);
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
                return newItems;
            });
        }

        setActiveId(null);
    };

    const handleMoveWidget = (widgetId, direction) => {
        setWidgets((prev) => {
            const widget = prev.find(w => w.id === widgetId);
            if (!widget) return prev;

            const siblings = prev.filter(w => w.parent_id === widget.parent_id);
            const indexInSiblings = siblings.findIndex(w => w.id === widgetId);

            const siblingIndexToSwap = direction === 'up' ? indexInSiblings - 1 : indexInSiblings + 1;

            if (siblingIndexToSwap < 0 || siblingIndexToSwap >= siblings.length) return prev;

            const targetSibling = siblings[siblingIndexToSwap];

            const oldIndex = prev.findIndex(w => w.id === widgetId);
            const newIndex = prev.findIndex(w => w.id === targetSibling.id);

            const newWidgets = [...prev];
            [newWidgets[oldIndex], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[oldIndex]];
            return newWidgets;
        });
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
            const orderPayload = widgets.reduce((acc, w, index) => {
                let id = w.id;
                // If it's a temp ID, try to find the real ID from our recent creates
                if (id.toString().startsWith('temp_')) {
                    id = tempIdMap[id];
                }

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
        <div className="h-screen flex flex-col bg-gray-50/50">
            {/* Header - Glassmorphism */}
            <div className="bg-white/80 backdrop-blur-md border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm z-20 sticky top-0">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="md:hidden p-2 hover:bg-gray-100/50 rounded-xl text-gray-600 transition-all border border-transparent active:scale-95"
                            title="Toggle Library"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <span className="bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">⚡ Be3</span>
                                <span className="hidden sm:inline text-gray-900">Builder</span>
                            </h1>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wider">Visual Editor</p>
                                {pendingChanges.length > 0 && (
                                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded-full border border-amber-100">
                                        <Sparkles size={10} /> Unsaved
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Device Switcher - Center */}
                <div className="hidden lg:flex items-center bg-gray-100/50 p-1 rounded-2xl border border-gray-200/50">
                    {[
                        { id: 'desktop', icon: <Maximize size={16} />, label: 'Desktop' },
                        { id: 'tablet', icon: <LayoutTemplate size={16} />, label: 'Tablet' },
                        { id: 'mobile', icon: <Plus size={16} />, label: 'Mobile' },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setPreviewMode(mode.id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${previewMode === mode.id ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {mode.icon}
                            {mode.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="hidden sm:block">
                        <select
                            value={selectedPage}
                            onChange={(e) => setSelectedPage(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl bg-gray-50/50 font-bold text-xs text-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                            disabled={pendingChanges.length > 0}
                        >
                            {pages.map((page) => (
                                <option key={page.id} value={page.slug}>
                                    {page.title.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="flex-1 md:flex-none px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-black text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-gray-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {isSaving ? 'Processing...' : 'Publish'}
                    </button>

                    <Link
                        href="/dashboard/storefront/pages"
                        className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors border border-transparent hover:border-gray-100"
                        title="Exit Builder"
                    >
                        <X size={20} />
                    </Link>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Sidebar Library */}
                <div className={`
                    fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-80 bg-white border-r shadow-xl md:shadow-none
                `}>
                    <SidebarLibrary
                        onAddWidget={handleAddWidget}
                        widgets={widgets}
                        onEdit={handleEditWidget}
                        onDelete={handleDeleteWidget}
                        onDuplicate={handleDuplicateWidget}
                        onToggleVisibility={handleToggleVisibility}
                        onMoveWidget={handleMoveWidget}
                        dirtyWidgetIds={dirtyWidgetIds}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </div>

                {/* Mobile Backdrop */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Center: Canvas */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <BuilderCanvas widgets={widgets} previewMode={previewMode}>
                        {widgets.filter(w => !w.parent_id).map((widget) => (
                            <DraggableBlock
                                key={widget.id}
                                widget={widget}
                                widgets={widgets}
                                onEdit={handleEditWidget}
                                onDelete={handleDeleteWidget}
                                onDuplicate={handleDuplicateWidget}
                                onToggleVisibility={handleToggleVisibility}
                                onMoveWidget={handleMoveWidget}
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
                    bannerGroups={bannerGroups}
                    widgets={widgets}
                />
            )}
        </div>
    );
}
