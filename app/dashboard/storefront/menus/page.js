"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import {
    Plus, Trash2, Edit2, MoveUp, MoveDown, Save, ExternalLink,
    Loader2, Check, ChevronRight, ChevronDown, CornerDownRight,
    Layers, Navigation, Link as LinkIcon, Tag, Folder, FolderTree,
    Zap, Star, RefreshCw, X, Search, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_MENU_LOCATIONS = [
    { location: "header", name: "Main Header Menu" },
    { location: "footer", name: "Footer Navigation Menu" },
    { location: "sidebar", name: "Sidebar Category Menu" },
];

const ITEM_TYPES = [
    { value: "custom", label: "Custom Link", icon: LinkIcon, color: "text-gray-500" },
    { value: "category", label: "Category (Static)", icon: Folder, color: "text-blue-500" },
    { value: "dynamic_category", label: "Category (Dynamic Tree)", icon: FolderTree, color: "text-purple-500" },
    { value: "clause", label: "Smart Filter (Clause)", icon: Zap, color: "text-amber-500" },
];

const TYPE_BADGE = {
    custom: { label: "Link", cls: "bg-gray-100 text-gray-600" },
    category: { label: "Category", cls: "bg-blue-50 text-blue-600" },
    dynamic_category: { label: "Dynamic", cls: "bg-purple-50 text-purple-600" },
    clause: { label: "Clause", cls: "bg-amber-50 text-amber-600" },
};

function ItemTypeBadge({ type }) {
    const badge = TYPE_BADGE[type] || TYPE_BADGE.custom;
    return (
        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide", badge.cls)}>
            {badge.label}
        </span>
    );
}

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function MenusManagementPage() {
    const [menus, setMenus] = useState([]);
    const [selectedMenuId, setSelectedMenuId] = useState(null);
    const [currentMenu, setCurrentMenu] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Catalog suggestions (categories + clauses from backend)
    const [catalog, setCatalog] = useState({ categories: [], tree: [] });
    const [catalogLoading, setCatalogLoading] = useState(false);

    // Modal state
    const [editingItem, setEditingItem] = useState(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isCreateMenuModalOpen, setIsCreateMenuModalOpen] = useState(false);
    const [newMenuForm, setNewMenuForm] = useState({ name: "", location: "header" });

    // Item form state
    const [itemForm, setItemForm] = useState({
        id: null,
        label: "",
        url: "/",
        parent_id: "",
        target: "_self",
        type: "custom",
        reference_id: null,
        dropdown_mode: "auto",
        color: "",
    });

    // Clause/Category picker sub-state
    const [selectedCatalogCategory, setSelectedCatalogCategory] = useState(null);
    const [clauseSearch, setClauseSearch] = useState("");
    const [catSearch, setCatSearch] = useState("");

    useEffect(() => { fetchMenus(); fetchCatalog(); }, []);

    const fetchCatalog = async () => {
        setCatalogLoading(true);
        try {
            // 1. Primary: /menus/catalog-suggestions
            try {
                const res = await api.get("/menus/catalog-suggestions");
                if (res.data?.success && Array.isArray(res.data?.data?.categories) && res.data.data.categories.length > 0) {
                    setCatalog(res.data.data);
                    return;
                }
            } catch (err) {
                console.warn("Primary /menus/catalog-suggestions failed, falling back:", err);
            }

            // 2. Fallback: /products/categories/all
            try {
                const fallbackRes = await api.get("/products/categories/all");
                const rawCats = fallbackRes.data?.categories || fallbackRes.data?.data || (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
                if (rawCats.length > 0) {
                    const catMap = new Map();
                    rawCats.forEach(c => catMap.set(c.id, { ...c, subcategories: [], clauses: [] }));
                    rawCats.forEach(c => {
                        if (c.parent_id && catMap.has(c.parent_id)) {
                            catMap.get(c.parent_id).subcategories.push(catMap.get(c.id));
                        }
                    });
                    setCatalog({
                        categories: Array.from(catMap.values()),
                        tree: rawCats.filter(c => !c.parent_id).map(c => catMap.get(c.id))
                    });
                    return;
                }
            } catch (err2) {
                console.warn("Fallback /products/categories/all failed, trying /products/categories:", err2);
            }

            // 3. Fallback: /products/categories
            try {
                const fallback2Res = await api.get("/products/categories");
                const rawCats2 = fallback2Res.data?.categories || fallback2Res.data?.data || (Array.isArray(fallback2Res.data) ? fallback2Res.data : []);
                if (rawCats2.length > 0) {
                    const catMap = new Map();
                    rawCats2.forEach(c => catMap.set(c.id, { ...c, subcategories: [], clauses: [] }));
                    setCatalog({
                        categories: Array.from(catMap.values()),
                        tree: rawCats2.filter(c => !c.parent_id)
                    });
                }
            } catch (err3) {
                console.error("All category fetch attempts failed:", err3);
            }
        } finally {
            setCatalogLoading(false);
        }
    };

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const res = await api.get("/menus");
            if (res.data.success) {
                const fetchedMenus = res.data.data || [];
                setMenus(fetchedMenus);
                if (fetchedMenus.length > 0) {
                    const firstMenuId = fetchedMenus[0].id;
                    setSelectedMenuId(firstMenuId);
                    fetchMenuDetails(firstMenuId);
                } else {
                    createDefaultMenu("Main Header Menu", "header");
                }
            }
        } catch (err) {
            console.error("Failed to fetch menus", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuDetails = async (menuId) => {
        try {
            const res = await api.get(`/menus/${menuId}`);
            if (res.data.success) {
                setCurrentMenu(res.data.data);
                setItems(res.data.data.items || []);
            }
        } catch (err) {
            console.error("Failed to fetch menu details", err);
        }
    };

    const createDefaultMenu = async (name, location) => {
        try {
            const res = await api.post("/menus", { name, location });
            if (res.data.success) {
                const created = res.data.data;
                setMenus([created]);
                setSelectedMenuId(created.id);
                setCurrentMenu(created);
                const defaultItems = [
                    { label: "Home", url: "/", target: "_self", position: 0 },
                    { label: "Shop All", url: "/products", target: "_self", position: 1 },
                    { label: "Categories", url: "/categories", target: "_self", position: 2 },
                ];
                const syncRes = await api.put(`/menus/${created.id}/items/sync`, { items: defaultItems });
                if (syncRes.data.success) setItems(syncRes.data.data || []);
            }
        } catch (err) {
            console.error("Failed to create default menu", err);
        }
    };

    const handleSelectMenu = (menuId) => {
        setSelectedMenuId(menuId);
        fetchMenuDetails(menuId);
    };

    const resetItemForm = () => ({
        id: null, label: "", url: "/", parent_id: "", target: "_self", type: "custom", reference_id: null, dropdown_mode: "auto", color: ""
    });

    const handleOpenItemModal = (item = null) => {
        setSelectedCatalogCategory(null);
        setClauseSearch("");
        setCatSearch("");
        if (item) {
            setEditingItem(item);
            setItemForm({
                id: item.id,
                label: item.label,
                url: item.url || "/",
                parent_id: item.parent_id || "",
                target: item.target || "_self",
                type: item.type || "custom",
                reference_id: item.reference_id || null,
                dropdown_mode: item.dropdown_mode || "auto",
                color: item.color || "",
            });
            // Pre-select category for clause/category types
            if (item.reference_id && (item.type === "category" || item.type === "dynamic_category")) {
                const cat = catalog.categories.find(c => c.id === item.reference_id);
                if (cat) setSelectedCatalogCategory(cat);
            }
        } else {
            setEditingItem(null);
            setItemForm(resetItemForm());
        }
        setIsItemModalOpen(true);
    };

    const persistItems = async (itemsToSave) => {
        if (!selectedMenuId) return;
        setSaving(true);
        try {
            const formattedItems = (itemsToSave || items).map((it, idx) => ({
                id: it.id || generateUUID(),
                label: it.label || "Untitled",
                url: it.url || '/',
                parent_id: it.parent_id || null,
                target: it.target || "_self",
                type: it.type || "custom",
                reference_id: it.reference_id || null,
                dropdown_mode: it.dropdown_mode || "auto",
                color: it.color || null,
                position: idx
            }));

            const res = await api.put(`/menus/${selectedMenuId}/items/sync`, { items: formattedItems });
            if (res.data.success) {
                setItems(res.data.data);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
            }
        } catch (err) {
            console.error("Failed to save menu items", err);
            alert("Failed to save menu changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveItem = () => {
        if (!itemForm.label.trim()) return;
        let updatedList;
        if (editingItem) {
            updatedList = items.map(item =>
                item.id === editingItem.id
                    ? { ...item, ...itemForm, parent_id: itemForm.parent_id || null }
                    : item
            );
        } else {
            const newItem = {
                id: generateUUID(),
                ...itemForm,
                parent_id: itemForm.parent_id || null,
                position: items.length
            };
            updatedList = [...items, newItem];
        }
        setItems(updatedList);
        setIsItemModalOpen(false);
        // Persist immediately to backend
        persistItems(updatedList);
    };

    const handleDeleteItem = (itemId) => {
        const updated = items.filter(item => item.id !== itemId && item.parent_id !== itemId);
        setItems(updated);
        persistItems(updated);
    };

    const moveItem = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= items.length) return;
        const newItems = [...items];
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
        const updated = newItems.map((it, i) => ({ ...it, position: i }));
        setItems(updated);
        persistItems(updated);
    };

    const handleSyncMenu = async () => {
        await persistItems(items);
    };

    const handleCreateMenuSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/menus", newMenuForm);
            if (res.data.success) {
                const created = res.data.data;
                setMenus(prev => [...prev, created]);
                setSelectedMenuId(created.id);
                setCurrentMenu(created);
                setItems([]);
                setIsCreateMenuModalOpen(false);
                setNewMenuForm({ name: "", location: "header" });
            }
        } catch (err) {
            console.error("Failed to create menu", err);
            alert("Failed to create menu.");
        }
    };

    const handleDeleteMenu = async () => {
        if (!selectedMenuId) return;
        if (!confirm(`Delete the menu "${currentMenu?.name}"?`)) return;
        try {
            await api.delete(`/menus/${selectedMenuId}`);
            const remaining = menus.filter(m => m.id !== selectedMenuId);
            setMenus(remaining);
            if (remaining.length > 0) {
                setSelectedMenuId(remaining[0].id);
                fetchMenuDetails(remaining[0].id);
            } else {
                setSelectedMenuId(null);
                setCurrentMenu(null);
                setItems([]);
            }
        } catch (err) {
            console.error("Failed to delete menu", err);
        }
    };

    // Auto-import: bulk-add subcategories as children under a parent item
    const autoImportSubcategories = (parentItemId, category) => {
        const cat = catalog.categories.find(c => c.id === category.id);
        if (!cat) return;
        const subs = cat.subcategories || [];
        if (subs.length === 0) { alert("No subcategories found for this category."); return; }
        const toAdd = subs.map((sub, i) => ({
            id: generateUUID(),
            label: sub.name,
            url: `/categories/${sub.slug}`,
            parent_id: parentItemId,
            target: "_self",
            type: "category",
            reference_id: sub.id,
            dropdown_mode: "auto",
            position: items.length + i
        }));
        const updated = [...items, ...toAdd];
        setItems(updated);
        persistItems(updated);
    };

    // Auto-import: bulk-add clause items under a parent item
    const autoImportClauses = (parentItemId, category) => {
        const cat = catalog.categories.find(c => c.id === category.id);
        if (!cat || !cat.clauses?.length) { alert("No smart filters (clauses) found for this category."); return; }
        const toAdd = cat.clauses.map((cl, i) => ({
            id: generateUUID(),
            label: cl.display_label,
            url: cl.pretty_url,
            parent_id: parentItemId,
            target: "_self",
            type: "clause",
            reference_id: cl.attribute_id,
            dropdown_mode: "auto",
            position: items.length + i
        }));
        const updated = [...items, ...toAdd];
        setItems(updated);
        persistItems(updated);
    };

    // Pick a single category from the catalog picker inside the modal
    const pickCategory = (cat, asDynamic = false) => {
        setItemForm(prev => ({
            ...prev,
            label: prev.label || cat.name,
            url: `/categories/${cat.slug}`,
            type: asDynamic ? "dynamic_category" : "category",
            reference_id: cat.id
        }));
        setSelectedCatalogCategory(cat);
    };

    // Pick a single clause from the catalog picker inside the modal
    const pickClause = (cat, cl) => {
        setItemForm(prev => ({
            ...prev,
            label: prev.label || cl.display_label,
            url: cl.pretty_url,
            type: "clause",
            reference_id: cl.attribute_id
        }));
    };

    const parentCandidates = items.filter(it => !it.parent_id && (!editingItem || it.id !== editingItem.id));
    const filteredCatalogCats = (catalog?.categories || []).filter(c =>
        !catSearch || c?.name?.toLowerCase().includes(catSearch.toLowerCase())
    );
    const currentFormType = itemForm.type;
    const showCategoryPicker = currentFormType === "category" || currentFormType === "dynamic_category";
    const showClausePicker = currentFormType === "clause";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Loading Menus...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Navigation className="w-6 h-6 text-blue-600" />
                        Navigation Menus
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Build dynamic menus with categories, subcategories, and smart attribute filters.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateMenuModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                    >
                        <Plus className="w-4 h-4" /> New Menu
                    </button>
                    <button
                        onClick={handleSyncMenu}
                        disabled={saving || !selectedMenuId}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md",
                            saveSuccess ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                            saveSuccess ? <Check className="w-4 h-4" /> :
                                <Save className="w-4 h-4" />}
                        {saveSuccess ? "Saved!" : "Save Menu Changes"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Menu List Sidebar */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2">Your Menus</p>
                    <div className="space-y-1">
                        {menus.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => handleSelectMenu(m.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left transition",
                                    selectedMenuId === m.id
                                        ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                        : "text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                <span className="truncate">{m.name}</span>
                                <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">
                                    {m.location}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Catalog Info Card */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 mb-2">Catalog</p>
                        {catalogLoading ? (
                            <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                            </div>
                        ) : (
                            <div className="space-y-1 px-2 text-xs text-gray-500">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Folder className="w-3 h-3 text-blue-400" /> Categories</span>
                                    <span className="font-bold text-gray-700">{catalog.categories.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> Smart Filters</span>
                                    <span className="font-bold text-gray-700">
                                        {catalog.categories.reduce((sum, c) => sum + (c.clauses?.length || 0), 0)}
                                    </span>
                                </div>
                                <button onClick={fetchCatalog} className="flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-700 font-bold mt-1">
                                    <RefreshCw className="w-2.5 h-2.5" /> Refresh Catalog
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Menu Builder */}
                <div className="md:col-span-3 space-y-4">
                    {currentMenu ? (
                        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
                            {/* Card Top */}
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">{currentMenu.name}</h2>
                                    <p className="text-xs text-gray-500">
                                        Location: <span className="font-mono font-semibold text-blue-600">{currentMenu.location}</span> · {items.length} items
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenItemModal()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Item
                                    </button>
                                    <button
                                        onClick={handleDeleteMenu}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete Menu"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Menu Items Tree / List */}
                            <div className="p-5">
                                {items.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-gray-700">No navigation items yet</p>
                                        <p className="text-xs text-gray-400 mt-1 mb-4">Add links, categories, or dynamic smart filters.</p>
                                        <button
                                            onClick={() => handleOpenItemModal()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                                        >
                                            + Add First Item
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {items.map((item, index) => {
                                            const isChild = !!item.parent_id;
                                            const parentItem = isChild ? items.find(it => it.id === item.parent_id) : null;
                                            const hasDynamicExpansion = item.type === "dynamic_category" || item.type === "category";
                                            const catData = item.reference_id ? catalog.categories.find(c => c.id === item.reference_id) : null;

                                            return (
                                                <div key={item.id}>
                                                    <div
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-xl border transition-all group",
                                                            isChild
                                                                ? "ml-8 bg-gray-50/60 border-gray-200/60"
                                                                : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {isChild ? (
                                                                <CornerDownRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                            ) : (
                                                                (() => {
                                                                    const T = ITEM_TYPES.find(t => t.value === item.type) || ITEM_TYPES[0];
                                                                    return <T.icon className={cn("w-4 h-4 flex-shrink-0", T.color)} />;
                                                                })()
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span 
                                                                        className="text-sm font-bold truncate"
                                                                        style={{ color: item.color || undefined }}
                                                                    >
                                                                        {item.label}
                                                                    </span>
                                                                    {item.color && (
                                                                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200" title={`Custom Color: ${item.color}`}>
                                                                            <span className="w-2 h-2 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                                            {item.color}
                                                                        </span>
                                                                    )}
                                                                    <ItemTypeBadge type={item.type} />
                                                                    {hasDynamicExpansion && item.dropdown_mode && item.dropdown_mode !== "auto" && (
                                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tracking-wide">
                                                                            Dropdown: {item.dropdown_mode}
                                                                        </span>
                                                                    )}
                                                                    {isChild && parentItem && (
                                                                        <span className="text-[10px] text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded">
                                                                            under {parentItem.label}
                                                                        </span>
                                                                    )}
                                                                    {item.target === "_blank" && (
                                                                        <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-mono text-gray-400 truncate">{item.url}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {/* Auto-import subcategories button (only for top-level category/dynamic items with a reference) */}
                                                            {hasDynamicExpansion && catData && !isChild && (
                                                                <div className="relative group/import">
                                                                    <button
                                                                        onClick={() => autoImportSubcategories(item.id, catData)}
                                                                        className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded text-[10px] font-bold transition"
                                                                        title="Auto-import subcategories"
                                                                    >
                                                                        <FolderOpen className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {hasDynamicExpansion && catData && catData.clauses?.length > 0 && !isChild && (
                                                                <button
                                                                    onClick={() => autoImportClauses(item.id, catData)}
                                                                    className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                                                                    title="Auto-import smart filters (clauses)"
                                                                >
                                                                    <Zap className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                                                                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                                                                title="Move up">
                                                                <MoveUp className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}
                                                                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                                                                title="Move down">
                                                                <MoveDown className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleOpenItemModal(item)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                                title="Edit">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => handleDeleteItem(item.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                                title="Delete">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="px-5 pb-5">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium border-t border-gray-100 pt-3">
                                    <span className="font-bold text-gray-500">Legend:</span>
                                    <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3 text-purple-400" /> Auto-import subcategories</span>
                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Auto-import smart filters</span>
                                    <span className="flex items-center gap-1"><FolderTree className="w-3 h-3 text-purple-500" /> Dynamic = live-expanded at render time</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <p className="text-sm font-bold text-gray-700">No menu selected</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                Modal: Add / Edit Menu Item
            ════════════════════════════════════════════════════ */}
            {isItemModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
                            <h3 className="text-base font-bold text-gray-900">
                                {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                            </h3>
                            <button onClick={() => setIsItemModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                            {/* Item Type Tabs */}
                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase tracking-wide mb-2">Item Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ITEM_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setItemForm(prev => {
                                                const isCatSwitch = (prev.type === 'category' || prev.type === 'dynamic_category') && (t.value === 'category' || t.value === 'dynamic_category');
                                                return {
                                                    ...prev,
                                                    type: t.value,
                                                    reference_id: isCatSwitch ? prev.reference_id : null,
                                                };
                                            })}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition",
                                                itemForm.type === t.value
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                            )}
                                        >
                                            <t.icon className={cn("w-3.5 h-3.5", t.color)} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                                {itemForm.type === "dynamic_category" && (
                                    <p className="mt-1.5 text-[11px] text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5">
                                        <strong>Dynamic Tree:</strong> Subcategories and smart filters auto-expand live from your catalog at render time. No manual child items needed.
                                    </p>
                                )}
                                {itemForm.type === "clause" && (
                                    <p className="mt-1.5 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                                        <strong>Smart Filter:</strong> Links directly to a branded SEO landing page or faceted search result driven by an attribute clause.
                                    </p>
                                )}
                            </div>

                            {/* Label + URL */}
                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase mb-1">Navigation Label *</label>
                                <input
                                    type="text"
                                    value={itemForm.label}
                                    onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                                    placeholder="e.g. Electronics, Apple MacBooks, Summer Sale"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-600 uppercase mb-1">Destination URL *</label>
                                <input
                                    type="text"
                                    value={itemForm.url}
                                    onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                                    placeholder="/products, /categories/electronics, /apple-macbooks"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                />
                            </div>

                            {/* ── Custom Item Color Override ── */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                                            Custom Item Text Color
                                        </label>
                                        <p className="text-[11px] text-slate-500">
                                            Persistent color for this item across all headers, menus, and themes.
                                        </p>
                                    </div>
                                    {itemForm.color && (
                                        <button
                                            type="button"
                                            onClick={() => setItemForm(prev => ({ ...prev, color: "" }))}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition"
                                        >
                                            Reset to Theme Default
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Color Picker & Hex Input */}
                                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                                        <input
                                            type="color"
                                            value={itemForm.color || "#000000"}
                                            onChange={(e) => setItemForm(prev => ({ ...prev, color: e.target.value }))}
                                            className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={itemForm.color || ""}
                                            onChange={(e) => setItemForm(prev => ({ ...prev, color: e.target.value }))}
                                            placeholder="#ef4444 or default"
                                            className="w-28 text-xs font-mono font-semibold text-gray-800 outline-none bg-transparent"
                                        />
                                    </div>

                                    {/* Preview Box */}
                                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200/80 rounded-xl overflow-hidden">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex-shrink-0">Preview:</span>
                                        <span
                                            className="text-xs font-black tracking-wide truncate"
                                            style={{ color: itemForm.color || '#374151' }}
                                        >
                                            {itemForm.label || "Sample Link"}
                                        </span>
                                        {!itemForm.color && (
                                            <span className="text-[10px] text-gray-400 italic font-normal flex-shrink-0">(Theme Default)</span>
                                        )}
                                    </div>
                                </div>

                                {/* Preset Swatches */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 mr-1">Presets:</span>
                                    {[
                                        { label: "Red (Sale)", hex: "#ef4444" },
                                        { label: "Orange (Deals)", hex: "#f97316" },
                                        { label: "Amber (Gold)", hex: "#f59e0b" },
                                        { label: "Emerald (New)", hex: "#10b981" },
                                        { label: "Cyan", hex: "#06b6d4" },
                                        { label: "Blue", hex: "#3b82f6" },
                                        { label: "Indigo", hex: "#6366f1" },
                                        { label: "Purple", hex: "#8b5cf6" },
                                        { label: "Pink", hex: "#ec4899" },
                                        { label: "Dark Slate", hex: "#0f172a" },
                                    ].map((p) => (
                                        <button
                                            key={p.hex}
                                            type="button"
                                            onClick={() => setItemForm(prev => ({ ...prev, color: p.hex }))}
                                            title={p.label}
                                            className={cn(
                                                "w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-125 focus:outline-none",
                                                itemForm.color === p.hex && "ring-2 ring-blue-500 ring-offset-1 scale-110"
                                            )}
                                            style={{ backgroundColor: p.hex }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* ── Category Picker ── */}
                            {showCategoryPicker && (
                                <div>
                                    <label className="block text-xs font-black text-gray-600 uppercase mb-2">
                                        {itemForm.type === "dynamic_category" ? "Pick Category (Dynamic Expansion)" : "Pick Category"}
                                    </label>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={catSearch}
                                            onChange={e => setCatSearch(e.target.value)}
                                            placeholder="Search categories..."
                                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2 bg-gray-50">
                                        {filteredCatalogCats.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-4">No categories found</p>
                                        ) : filteredCatalogCats.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => pickCategory(cat, itemForm.type === "dynamic_category")}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition text-left",
                                                    itemForm.reference_id === cat.id
                                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                        : "bg-white hover:bg-gray-100 text-gray-700 border border-transparent"
                                                )}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Folder className="w-3 h-3 text-blue-400" />
                                                    {cat.name}
                                                    {cat.parent_id && <span className="text-[9px] text-gray-400 font-normal">subcategory</span>}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                    {cat.subcategories?.length > 0 && (
                                                        <span>{cat.subcategories.length} subs</span>
                                                    )}
                                                    {cat.clauses?.length > 0 && (
                                                        <span className="text-amber-500">{cat.clauses.length} filters</span>
                                                    )}
                                                    {itemForm.reference_id === cat.id && (
                                                        <Check className="w-3 h-3 text-blue-600" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedCatalogCategory && (
                                        <p className="mt-1.5 text-[11px] text-blue-600">
                                            Selected: <strong>{selectedCatalogCategory.name}</strong>
                                            {selectedCatalogCategory.clauses?.length > 0 && ` · ${selectedCatalogCategory.clauses.length} smart filters available`}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── Clause Picker ── */}
                            {showClausePicker && (
                                <div>
                                    <label className="block text-xs font-black text-gray-600 uppercase mb-2">Pick Smart Filter (Clause)</label>

                                    {/* First pick the category */}
                                    <p className="text-[11px] text-gray-500 mb-1">Step 1: Choose a category</p>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={catSearch}
                                            onChange={e => setCatSearch(e.target.value)}
                                            placeholder="Search categories..."
                                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="max-h-32 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2 bg-gray-50 mb-3">
                                        {filteredCatalogCats.filter(c => c.clauses?.length > 0).map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCatalogCategory(cat)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition text-left",
                                                    selectedCatalogCategory?.id === cat.id
                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                        : "bg-white hover:bg-gray-100 text-gray-700 border border-transparent"
                                                )}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Folder className="w-3 h-3 text-blue-400" /> {cat.name}
                                                </span>
                                                <span className="text-[10px] text-amber-500 font-bold">{cat.clauses.length} filters</span>
                                            </button>
                                        ))}
                                        {filteredCatalogCats.filter(c => c.clauses?.length > 0).length === 0 && (
                                            <p className="text-xs text-gray-400 text-center py-3">No categories with smart filters</p>
                                        )}
                                    </div>

                                    {/* Then pick the clause */}
                                    {selectedCatalogCategory && selectedCatalogCategory.clauses?.length > 0 && (
                                        <>
                                            <p className="text-[11px] text-gray-500 mb-1">Step 2: Choose a smart filter from <strong>{selectedCatalogCategory.name}</strong></p>
                                            <div className="relative mb-2">
                                                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={clauseSearch}
                                                    onChange={e => setClauseSearch(e.target.value)}
                                                    placeholder="Search filters..."
                                                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2 bg-gray-50">
                                                {selectedCatalogCategory.clauses
                                                    .filter(cl => !clauseSearch || cl.display_label.toLowerCase().includes(clauseSearch.toLowerCase()))
                                                    .map((cl, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => pickClause(selectedCatalogCategory, cl)}
                                                            className={cn(
                                                                "w-full flex items-start justify-between px-3 py-2 rounded-lg text-left transition border",
                                                                itemForm.url === cl.pretty_url
                                                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                                                    : "bg-white border-transparent hover:bg-gray-100 text-gray-700"
                                                            )}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                                                                <span>
                                                                    <span className="text-xs font-bold block">{cl.display_label}</span>
                                                                    <span className="text-[10px] font-mono text-gray-400">{cl.pretty_url}</span>
                                                                </span>
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 mt-0.5">{cl.attribute_label}</span>
                                                        </button>
                                                    ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── Dropdown Generation Mode (For Category & Dynamic Category Items) ── */}
                            {(itemForm.type === "dynamic_category" || itemForm.type === "category") && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wide">
                                        Dropdown Content Mode
                                    </label>
                                    <p className="text-[11px] text-slate-500 mb-2">
                                        Choose what child items are automatically populated in the navigation dropdown.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { value: 'auto', label: 'Auto (Recommended)', desc: 'Subcategories if they exist, otherwise smart filters' },
                                            { value: 'subcategories', label: 'Subcategories Only', desc: 'Only show real direct subcategories' },
                                            { value: 'clauses', label: 'Smart Filters Only', desc: 'Only show verified attribute clauses' },
                                            { value: 'both', label: 'Both (Mega Menu)', desc: 'Show subcategories and smart filters together' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setItemForm(prev => ({ ...prev, dropdown_mode: opt.value }))}
                                                className={cn(
                                                    "flex flex-col items-start p-2.5 rounded-lg border text-left transition text-xs",
                                                    (itemForm.dropdown_mode || 'auto') === opt.value
                                                        ? "border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-600"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                                )}
                                            >
                                                <span className="font-bold flex items-center gap-1.5">
                                                    {(itemForm.dropdown_mode || 'auto') === opt.value && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                                                    {opt.label}
                                                </span>
                                                <span className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Parent + Target */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-black text-gray-600 uppercase mb-1">Parent (For Dropdown)</label>
                                    <select
                                        value={itemForm.parent_id}
                                        onChange={(e) => setItemForm({ ...itemForm, parent_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white"
                                    >
                                        <option value="">None (Top-Level)</option>
                                        {parentCandidates.map((cand) => (
                                            <option key={cand.id} value={cand.id}>{cand.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-600 uppercase mb-1">Target</label>
                                    <select
                                        value={itemForm.target}
                                        onChange={(e) => setItemForm({ ...itemForm, target: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white"
                                    >
                                        <option value="_self">Same Tab</option>
                                        <option value="_blank">New Tab</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                            <button
                                onClick={() => setIsItemModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveItem}
                                disabled={!itemForm.label.trim()}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                            >
                                {editingItem ? "Update Item" : "Add Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Create Menu */}
            {isCreateMenuModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleCreateMenuSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">Create New Menu</h3>
                            <button type="button" onClick={() => setIsCreateMenuModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Menu Name *</label>
                                <input
                                    type="text"
                                    value={newMenuForm.name}
                                    onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                                    placeholder="e.g. Header Main Menu"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Menu Location *</label>
                                <select
                                    value={newMenuForm.location}
                                    onChange={(e) => setNewMenuForm({ ...newMenuForm, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                >
                                    {DEFAULT_MENU_LOCATIONS.map((loc) => (
                                        <option key={loc.location} value={loc.location}>
                                            {loc.name} ({loc.location})
                                        </option>
                                    ))}
                                    <option value="custom">Custom Location</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsCreateMenuModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={!newMenuForm.name.trim()}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition">
                                Create Menu
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
