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
import { Eye, EyeOff, Edit2, Trash2, Copy, GripVertical, Save, ArrowLeft, LayoutTemplate, Maximize, Plus, X, ChevronLeft, ChevronRight, Sparkles, Shuffle, Menu, Palette, Settings } from "lucide-react";

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
    const [isPageSettingsOpen, setIsPageSettingsOpen] = useState(false);
    const [savingPageSettings, setSavingPageSettings] = useState(false);
    const [activeTheme, setActiveTheme] = useState(null);
    const [pageSettingsForm, setPageSettingsForm] = useState({
        title: '',
        slug: '',
        meta_description: '',
        theme_overrides: {
            background: '',
            primary: '',
            fontHeading: '',
            fontBody: ''
        }
    });

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
                const apiPages = res.data.pages || [];
                const systemPages = [];
                if (!apiPages.some(p => p.slug === 'header')) {
                    systemPages.push({ id: 'header', slug: 'header', title: 'Global Header', is_system: true, theme_overrides: {} });
                }
                if (!apiPages.some(p => p.slug === 'footer')) {
                    systemPages.push({ id: 'footer', slug: 'footer', title: 'Global Footer', is_system: true, theme_overrides: {} });
                }
                setPages([...systemPages, ...apiPages]);
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
    const [menus, setMenus] = useState([]);

    useEffect(() => {
        fetchPages();
        fetchCategories();
        fetchCollections();
        fetchAttributes();
        fetchBannerGroups();
        fetchMenus();
        fetchActiveTheme();
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

    const fetchMenus = async () => {
        try {
            const res = await api.get('/menus');
            if (res.data.success) {
                setMenus(res.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch menus', error);
        }
    };

    const fetchActiveTheme = async () => {
        try {
            const res = await api.get('/page-builder/storefront/theme');
            if (res.data.theme) setActiveTheme(res.data.theme);
        } catch (_) {}
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
                let fetchedWidgets = res.data.widgets || [];

                // Ensure Header has Stock Header component if missing
                if (selectedPage === 'header') {
                    const hasStockHeader = fetchedWidgets.some(w => w.widget_type === 'header_stock_content' || w.widget_type === 'stock_content');
                    if (!hasStockHeader) {
                        const stockHeader = {
                            id: `temp_stock_header_${Date.now()}`,
                            widget_type: 'header_stock_content',
                            page_type: 'header',
                            is_active: true,
                            sort_order: fetchedWidgets.length,
                            is_core: true,
                            config: {
                                adminLabel: 'Stock Header (Logo, Search, Nav, Cart)',
                                description: 'Core storefront header bar with dynamic navigation.'
                            }
                        };
                        fetchedWidgets = [stockHeader, ...fetchedWidgets];
                    }
                }

                // Ensure Footer has Stock Footer component if missing
                if (selectedPage === 'footer') {
                    const hasStockFooter = fetchedWidgets.some(w => w.widget_type === 'footer_stock_content' || w.widget_type === 'stock_content');
                    if (!hasStockFooter) {
                        const stockFooter = {
                            id: `temp_stock_footer_${Date.now()}`,
                            widget_type: 'footer_stock_content',
                            page_type: 'footer',
                            is_active: true,
                            sort_order: fetchedWidgets.length,
                            is_core: true,
                            config: {
                                adminLabel: 'Stock Footer (Brand, Nav Columns, Social, Copyright)',
                                description: 'Core storefront footer with columns and copyright.'
                            }
                        };
                        fetchedWidgets = [...fetchedWidgets, stockFooter];
                    }
                }

                setWidgets(fetchedWidgets);
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
        const target = widgets.find(w => w.id === widgetId);
        if (target && (target.widget_type === 'header_stock_content' || target.widget_type === 'footer_stock_content' || target.widget_type === 'stock_content' || target.is_core)) {
            alert('The Stock Content component cannot be deleted. You can hide it using the Eye icon if you want to replace it with custom components.');
            return;
        }

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

    const handleThemeConformAll = () => {
        if (widgets.length === 0) return;
        if (!confirm('Make all widgets on this page conform to your store\'s active Layout Theme? This will reset custom color overrides so widgets inherit theme colors.')) return;

        const updatedWidgets = widgets.map(w => {
            const updatedConfig = {
                ...(w.config || {}),
                useThemeColors: true,
                titleColor: '',
                titleBackgroundColor: 'transparent',
                categoryTitleColor: '#ffffff',
                colors: {
                    ...(w.config?.colors || {}),
                    text: '',
                    price: 'var(--primary)',
                    accent: 'var(--primary)'
                },
                cardStyle: {
                    ...(w.config?.cardStyle || {}),
                    backgroundColor: '',
                    borderColor: ''
                },
                sectionBackground: {
                    color: '#ffffff'
                }
            };
            return {
                ...w,
                config: updatedConfig
            };
        });

        setWidgets(updatedWidgets);

        // Queue pending update changes for all existing widgets
        const newChanges = updatedWidgets
            .filter(w => !w.id.toString().startsWith('temp_'))
            .map(w => ({
                type: 'update',
                id: w.id,
                data: { config: w.config }
            }));

        setPendingChanges(prev => {
            const nonUpdated = prev.filter(c => !newChanges.some(nc => nc.id === c.id));
            return [...nonUpdated, ...newChanges];
        });

        alert('Theme conformance applied to all widgets! Click "Publish" to save changes live.');
    };

    const handleOpenPageSettings = () => {
        const currentPage = pages.find(p => p.slug === selectedPage) || {
            title: selectedPage === 'header' ? 'Global Header' : (selectedPage === 'footer' ? 'Global Footer' : selectedPage),
            slug: selectedPage,
            theme_overrides: {}
        };

        const rawOverrides = currentPage.theme_overrides || {};
        const theme_overrides = typeof rawOverrides === 'string' ? JSON.parse(rawOverrides || '{}') : rawOverrides;

        // Fallback to active theme header/footer color if theme_overrides background/text is not set
        let currentBg = theme_overrides.background;
        let currentTextColor = theme_overrides.textColor || theme_overrides.text;
        if (!currentBg && (selectedPage === 'header' || selectedPage === 'footer')) {
            currentBg = activeTheme?.variables?.[selectedPage]?.backgroundColor || '';
        }
        if (!currentTextColor && (selectedPage === 'header' || selectedPage === 'footer')) {
            currentTextColor = activeTheme?.variables?.[selectedPage]?.textColor || '';
        }

        setPageSettingsForm({
            id: currentPage.id,
            title: currentPage.title || selectedPage,
            slug: currentPage.slug || selectedPage,
            meta_description: currentPage.meta_description || '',
            theme_overrides: {
                background: currentBg || '',
                textColor: currentTextColor || '',
                primary: theme_overrides.primary || '',
                fontHeading: theme_overrides.fontHeading || '',
                fontBody: theme_overrides.fontBody || '',
            }
        });
        setIsPageSettingsOpen(true);
    };

    const handleSavePageSettings = async (e) => {
        e.preventDefault();
        setSavingPageSettings(true);
        try {
            const currentPage = pages.find(p => p.slug === selectedPage);
            const payload = {
                title: pageSettingsForm.title,
                slug: pageSettingsForm.slug,
                meta_description: pageSettingsForm.meta_description,
                theme_overrides: pageSettingsForm.theme_overrides,
                is_published: true
            };

            if (currentPage && currentPage.id && currentPage.id !== 'header' && currentPage.id !== 'footer') {
                await api.put(`/page-builder/pages/${currentPage.id}`, payload);
            } else {
                // Check if page exists by slug on server
                try {
                    const slugRes = await api.get(`/page-builder/pages/by-slug/${selectedPage}`);
                    if (slugRes.data?.page?.id) {
                        await api.put(`/page-builder/pages/${slugRes.data.page.id}`, payload);
                    } else {
                        await api.post('/page-builder/pages', payload);
                    }
                } catch {
                    await api.post('/page-builder/pages', payload);
                }
            }

            // ── SYNC: also write the colors back to theme variables so the
            //    Header/Footer Settings page stays in sync with Page Settings ──
            const bgColor = pageSettingsForm.theme_overrides?.background;
            const txtColor = pageSettingsForm.theme_overrides?.textColor;
            if (activeTheme?.id && (selectedPage === 'header' || selectedPage === 'footer')) {
                const currentVars = activeTheme.variables || {};
                const sectionKey = selectedPage; // 'header' or 'footer'
                const updatedSection = {
                    ...(currentVars[sectionKey] || {}),
                    ...(bgColor ? { backgroundColor: bgColor } : {}),
                    ...(txtColor ? { textColor: txtColor } : {}),
                };
                try {
                    await api.put(`/page-builder/themes/${activeTheme.id}`, {
                        variables: { ...currentVars, [sectionKey]: updatedSection }
                    });
                    // Refresh theme cache
                    fetchActiveTheme();
                } catch (themeErr) {
                    console.warn('[PageSettings] Could not sync colors to theme vars:', themeErr.message);
                }
            }

            await fetchPages();
            setIsPageSettingsOpen(false);
        } catch (err) {
            console.error('Failed to save page settings:', err);
            alert('Failed to save page settings');
        } finally {
            setSavingPageSettings(false);
        }
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
            // 1. Process explicit CRUD from pendingChanges
            for (const change of pendingChanges) {
                if (change.type === 'create') {
                    // Find current index
                    const currentIdx = widgets.findIndex(w => w.id === change.tempId);

                    // Resolve parent_id if it's a temp ID
                    let parentId = change.data.parent_id;
                    if (parentId && parentId.toString().startsWith('temp_')) {
                        parentId = tempIdMap[parentId] || null;
                    }

                    const data = {
                        ...change.data,
                        sort_order: currentIdx >= 0 ? currentIdx : 0,
                        parent_id: parentId,
                        layout_id: layoutId
                    };

                    const res = await api.post('/page-builder/widgets', data);

                    // Store mapping
                    if (res.data.success) {
                        tempIdMap[change.tempId] = res.data.widget.id;
                    }

                } else if (change.type === 'update') {
                    let data = { ...change.data };
                    if (data.parent_id && data.parent_id.toString().startsWith('temp_')) {
                        data.parent_id = tempIdMap[data.parent_id] || null;
                    }

                    await api.put(`/page-builder/widgets/${change.id}`, data);

                } else if (change.type === 'delete') {
                    await api.delete(`/page-builder/widgets/${change.id}`);
                }
            }

            // 2. Ensure any unpersisted temp widget (like auto-injected stock header/footer) is also created
            for (let i = 0; i < widgets.length; i++) {
                const w = widgets[i];
                if (w.id.toString().startsWith('temp_') && !tempIdMap[w.id]) {
                    const data = {
                        widget_type: w.widget_type,
                        config: w.config || {},
                        page_type: selectedPage,
                        is_active: w.is_active !== false,
                        sort_order: i,
                        parent_id: w.parent_id && w.parent_id.toString().startsWith('temp_') ? (tempIdMap[w.parent_id] || null) : w.parent_id,
                        layout_id: layoutId
                    };
                    const res = await api.post('/page-builder/widgets', data);
                    if (res.data.success) {
                        tempIdMap[w.id] = res.data.widget.id;
                    }
                }
            }

            // 3. Process Reordering for all widgets
            const orderPayload = widgets.reduce((acc, w, index) => {
                let id = w.id;
                // If it's a temp ID, find the real ID from our recent creates
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
                    <button
                        type="button"
                        onClick={handleThemeConformAll}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                        title="Make all components on this page conform to your store layout theme styling"
                    >
                        <Palette size={15} />
                        <span>Theme Conform All</span>
                    </button>

                    <div className="hidden sm:flex items-center gap-1.5">
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

                        <button
                            type="button"
                            onClick={handleOpenPageSettings}
                            className="p-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-100 rounded-xl text-gray-600 transition-all"
                            title="Page Settings (Background Color, Fonts, SEO)"
                        >
                            <Settings size={16} />
                        </button>
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
                    menus={menus}
                    widgets={widgets}
                />
            )}

            {/* Page Settings Modal */}
            {isPageSettingsOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSavePageSettings} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Page Settings</h3>
                                <p className="text-xs text-gray-400">Custom background & styling for <strong>{pageSettingsForm.title}</strong></p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPageSettingsOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase mb-1">Page Title</label>
                                <input
                                    type="text"
                                    value={pageSettingsForm.title}
                                    onChange={(e) => setPageSettingsForm({ ...pageSettingsForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            {/* Background Color */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                                    Background Color
                                </label>
                                <p className="text-[11px] text-slate-500">
                                    Applies to the entire page region ({selectedPage === 'header' ? 'Global Header bar' : (selectedPage === 'footer' ? 'Global Footer section' : 'Page background')}).
                                </p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={pageSettingsForm.theme_overrides?.background || '#ffffff'}
                                        onChange={(e) => setPageSettingsForm({
                                            ...pageSettingsForm,
                                            theme_overrides: { ...pageSettingsForm.theme_overrides, background: e.target.value }
                                        })}
                                        className="w-10 h-10 p-0.5 border border-gray-300 rounded-xl cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={pageSettingsForm.theme_overrides?.background || ''}
                                        onChange={(e) => setPageSettingsForm({
                                            ...pageSettingsForm,
                                            theme_overrides: { ...pageSettingsForm.theme_overrides, background: e.target.value }
                                        })}
                                        placeholder="#ffffff or transparent"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    />
                                    {pageSettingsForm.theme_overrides?.background && (
                                        <button
                                            type="button"
                                            onClick={() => setPageSettingsForm({
                                                ...pageSettingsForm,
                                                theme_overrides: { ...pageSettingsForm.theme_overrides, background: '' }
                                            })}
                                            className="px-2.5 py-2 text-xs font-bold text-gray-500 hover:text-red-600 bg-white border border-gray-200 rounded-xl"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Text Color */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                                    Text Color
                                </label>
                                <p className="text-[11px] text-slate-500">
                                    Controls navigation links, logo text, labels, and icon colors in {selectedPage === 'header' ? 'the Header' : (selectedPage === 'footer' ? 'the Footer' : 'this page')}.
                                </p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={pageSettingsForm.theme_overrides?.textColor || '#111827'}
                                        onChange={(e) => setPageSettingsForm({
                                            ...pageSettingsForm,
                                            theme_overrides: { ...pageSettingsForm.theme_overrides, textColor: e.target.value }
                                        })}
                                        className="w-10 h-10 p-0.5 border border-gray-300 rounded-xl cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={pageSettingsForm.theme_overrides?.textColor || ''}
                                        onChange={(e) => setPageSettingsForm({
                                            ...pageSettingsForm,
                                            theme_overrides: { ...pageSettingsForm.theme_overrides, textColor: e.target.value }
                                        })}
                                        placeholder="#111827 (Dark) or #ffffff (Light)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    />
                                    {pageSettingsForm.theme_overrides?.textColor && (
                                        <button
                                            type="button"
                                            onClick={() => setPageSettingsForm({
                                                ...pageSettingsForm,
                                                theme_overrides: { ...pageSettingsForm.theme_overrides, textColor: '' }
                                            })}
                                            className="px-2.5 py-2 text-xs font-bold text-gray-500 hover:text-red-600 bg-white border border-gray-200 rounded-xl"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Primary Accent Color */}
                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase mb-1">Primary Accent Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={pageSettingsForm.theme_overrides?.primary || '#2563eb'}
                                        onChange={(e) => setPageSettingsForm({
                                            ...pageSettingsForm,
                                            theme_overrides: { ...pageSettingsForm.theme_overrides, primary: e.target.value }
                                        })}
                                        className="w-10 h-10 p-0.5 border border-gray-300 rounded-xl cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={pageSettingsForm.theme_overrides?.primary || ''}
                                        onChange={(e) => setPageSettingsForm({
                                            ...pageSettingsForm,
                                            theme_overrides: { ...pageSettingsForm.theme_overrides, primary: e.target.value }
                                        })}
                                        placeholder="Theme Default (#2563eb)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsPageSettingsOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={savingPageSettings}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                {savingPageSettings ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
