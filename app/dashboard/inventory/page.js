"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import api from "@/lib/axios";
import PremiumImageUpload from "@/components/ui/PremiumImageUpload";
import {
    Package, Plus, Upload, Globe, AlertTriangle, TrendingDown, RefreshCw,
    Search, ChevronDown, BarChart2, X, CheckCircle, Loader2, Boxes,
    ClipboardList, MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight,
    ArrowUpDown, Eye, EyeOff, ShoppingBag, Monitor, Tag, DollarSign,
    Hash, FileText, ChevronRight, Layers, Star, Check, Sparkles, Image as ImageIcon, Truck, ShieldCheck, Download
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

function downloadCSV(filename, headers, rows) {
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => {
            const str = (val === null || val === undefined) ? "" : String(val);
            return `"${str.replace(/"/g, '""')}"`;
        }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function InlineThreshold({ value, onSave }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value || 5);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await onSave(parseInt(val) || 0);
            setEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <span className="inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input
                    type="number"
                    min="0"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    className="w-14 px-1 py-0.5 border border-emerald-400 rounded text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); save(); }
                        if (e.key === "Escape") setEditing(false);
                    }}
                    autoFocus
                />
                <button onClick={save} disabled={saving} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold px-1">
                    {saving ? "…" : "✓"}
                </button>
            </span>
        );
    }

    return (
        <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            className="text-[11px] text-gray-400 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 group text-left"
            title="Click to edit threshold"
        >
            <span>Threshold:</span>
            <span className="font-semibold text-gray-600 group-hover:text-emerald-700">{value || 5}</span>
            <Pencil size={9} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
        </button>
    );
}

function StockPill({ status, qty }) {
    const map = {
        out_of_stock: "bg-red-50 text-red-700 ring-red-200",
        low_stock: "bg-amber-50 text-amber-700 ring-amber-200",
        in_stock: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
    const label = {
        out_of_stock: "Out of Stock",
        low_stock: `Low · ${qty}`,
        in_stock: `${qty} in stock`,
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${map[status] || "bg-gray-50 text-gray-600 ring-gray-200"}`}>
            {label[status] ?? qty}
        </span>
    );
}

function ToggleSwitch({ checked, onChange, disabled }) {
    return (
        <button
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-emerald-500" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-1"}`} />
        </button>
    );
}

// ── Metrics Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color = "text-gray-900", icon }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            {icon && (
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                    {icon}
                </div>
            )}
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ── Import Modal ───────────────────────────────────────────────────────────────
function ImportModal({ onClose, onDone }) {
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [selected, setSelected] = useState([]);
    const [initialQty, setInitialQty] = useState(0);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState(null);
    const searchRef = useRef();

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/products?per_page=200&search=${encodeURIComponent(search)}&is_variant=false`);
            const all = res.data.data || [];
            setProducts(all.filter(p => !p.is_variant && !p.track_inventory));
        } catch (err) {
            setError("Failed to load catalog products.");
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    const toggleAll = () => setSelected(s => s.length === products.length ? [] : products.map(p => p.id));

    const handleImport = async () => {
        if (!selected.length) return;
        setImporting(true);
        setError(null);
        try {
            const res = await api.post("/inventory/import-from-catalog", {
                product_ids: selected,
                initial_quantity: parseInt(initialQty) || 0
            });
            if (res.data.success && (res.data.imported > 0 || res.data.products?.length > 0)) {
                onDone(res.data);
            } else if (res.data.success && res.data.imported === 0) {
                setError("No products were imported. They may already be tracked or you may not have permission.");
            } else {
                setError(res.data.error || "Import failed");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Import failed. Please try again.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Upload size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Import from Catalog</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Enable stock tracking on existing products</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchRef}
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Select All */}
                {products.length > 0 && (
                    <div className="px-6 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={selected.length === products.length && products.length > 0}
                                onChange={toggleAll}
                                className="rounded accent-blue-600 w-3.5 h-3.5"
                            />
                            <span className="font-medium">Select all <span className="text-gray-400 font-normal">({products.length})</span></span>
                        </label>
                        {selected.length > 0 && (
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{selected.length} selected</span>
                        )}
                    </div>
                )}

                {/* Product List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-16 text-gray-400">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                                <Boxes size={28} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">
                                {search ? "No matching products" : "Nothing left to import"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {search ? "Try a different search term" : "All your catalog products already have inventory tracking enabled"}
                            </p>
                        </div>
                    ) : (
                        products.map(p => (
                            <label
                                key={p.id}
                                className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${selected.includes(p.id) ? "bg-blue-50/60" : "hover:bg-gray-50"}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(p.id)}
                                    onChange={() => toggle(p.id)}
                                    className="rounded accent-blue-600 w-3.5 h-3.5 flex-shrink-0"
                                />
                                {p.image_url
                                    ? <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                                    : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Package size={13} className="text-gray-400" /></div>
                                }
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                    {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                                </div>
                                <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{fmt(p.price)}</span>
                            </label>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    {error && <p className="text-xs text-red-600 mb-3 flex items-center gap-1"><AlertTriangle size={12} />{error}</p>}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Opening stock</label>
                            <input
                                type="number"
                                min="0"
                                value={initialQty}
                                onChange={e => setInitialQty(e.target.value)}
                                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!selected.length || importing}
                                onClick={handleImport}
                            >
                                {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                {importing ? "Importing..." : `Import${selected.length > 0 ? ` (${selected.length})` : ""}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Create Inventory Product Modal (Full Catalog & Marketplace Details) ───────
function CreateInventoryProductModal({ onClose, onDone }) {
    const [activeTab, setActiveTab] = useState("general");
    const [form, setForm] = useState({
        name: "",
        sku: "",
        price: "",
        compare_at_price: "",
        category_id: "",
        status: "active",
        is_featured: false,
        initial_quantity: 0,
        low_stock_threshold: 5,
        is_pos_visible: true,
        is_marketplace_published: true,
        image_url: "",
        description: "",
        handle: "",
        delivery_type: "normal",
        tags: [],
        attributes: {},
    });
    const [manualHandle, setManualHandle] = useState(false);
    const [categories, setCategories] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [loadingAttrs, setLoadingAttrs] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/products/categories')
            .then(res => {
                if (res.data?.categories) setCategories(res.data.categories);
                else api.get('/categories?per_page=100').then(r => setCategories(r.data?.data || [])).catch(() => {});
            })
            .catch(() => {
                api.get('/categories?per_page=100').then(r => setCategories(r.data?.data || [])).catch(() => {});
            });
    }, []);

    useEffect(() => {
        if (!form.category_id) {
            setAttributes([]);
            return;
        }
        setLoadingAttrs(true);
        api.get(`/products/categories/${form.category_id}/admin`)
            .then(res => {
                if (res.data?.category?.attributes) {
                    setAttributes(res.data.category.attributes.filter(a => !a.is_ignored));
                } else {
                    setAttributes([]);
                }
            })
            .catch(() => setAttributes([]))
            .finally(() => setLoadingAttrs(false));
    }, [form.category_id]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const generateSKU = () => {
        const prefix = form.name ? form.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PRD';
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        set("sku", `${prefix || 'PRD'}-${rand}`);
    };

    const handleNameChange = (name) => {
        const autoHandle = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        setForm(f => ({
            ...f,
            name,
            handle: manualHandle ? f.handle : autoHandle,
            sku: !f.sku && name.trim().length >= 3 
                ? `${name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRD'}-${Math.random().toString(36).substring(2, 7).toUpperCase()}` 
                : f.sku
        }));
    };

    const handleAttrChange = (code, val) => {
        setForm(f => ({ ...f, attributes: { ...f.attributes, [code]: val } }));
    };

    const addTag = () => {
        const clean = tagInput.trim();
        if (clean && !form.tags.includes(clean)) {
            setForm(f => ({ ...f, tags: [...f.tags, clean] }));
        }
        setTagInput("");
    };

    const removeTag = (t) => {
        setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!form.name.trim()) {
            setError("Product name is required");
            setActiveTab("general");
            return;
        }
        if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
            setError("Valid price is required");
            setActiveTab("general");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const payload = {
                name: form.name.trim(),
                price: parseFloat(form.price),
                compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
                sku: form.sku.trim() || undefined,
                category_id: form.category_id || undefined,
                category_ids: form.category_id ? [form.category_id] : [],
                image_url: form.image_url || undefined,
                description: form.description.trim() || undefined,
                handle: form.handle.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                tags: form.tags,
                attributes: form.attributes,
                delivery_type: form.delivery_type || 'normal',
                status: form.status,
                is_featured: form.is_featured,
                track_inventory: true,
                inventory_quantity: parseInt(form.initial_quantity) || 0,
                low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
                is_pos_visible: form.is_pos_visible,
                is_marketplace_published: form.is_marketplace_published,
            };

            const res = await api.post("/products", payload);
            if (res.data?.id || res.data?.product?.id || res.data?.success) {
                onDone(res.data?.product || res.data);
            } else {
                setError(res.data?.error || res.data?.message || "Failed to create product");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to create product. Check details.");
        } finally {
            setSaving(false);
        }
    };

    const TABS = [
        { id: "general", label: "Essentials", icon: <DollarSign size={13} />, badge: form.name && form.price ? "✓" : null },
        { id: "inventory", label: "Stock & Channels", icon: <Boxes size={13} />, badge: form.initial_quantity > 0 ? `${form.initial_quantity} in stock` : null },
        { id: "media", label: "Media Asset", icon: <ImageIcon size={13} />, badge: form.image_url ? "✓" : null },
        { id: "attributes", label: "Attributes", icon: <Tag size={13} />, badge: attributes.length > 0 ? `${attributes.length}` : null },
        { id: "seo", label: "Logistics & SEO", icon: <Truck size={13} /> },
    ];

    const currentTabIndex = TABS.findIndex(t => t.id === activeTab);
    const nextTab = () => {
        if (currentTabIndex < TABS.length - 1) {
            setActiveTab(TABS[currentTabIndex + 1].id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-6" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Boxes size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900">New Inventory Product</h3>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    <Sparkles size={10} /> Marketplace Ready
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Complete catalog specs and stock tracking in one fast modal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-100 bg-gray-50/60 flex gap-1 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "border-emerald-600 text-emerald-700 bg-white shadow-sm"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    activeTab === tab.id ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                            <AlertTriangle size={15} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── TAB 1: ESSENTIALS ── */}
                    {activeTab === "general" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Minimalist Titanium Chronograph Watch"
                                    value={form.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category *</label>
                                    <select
                                        value={form.category_id}
                                        onChange={e => set("category_id", e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                    >
                                        <option value="">— Select Category —</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1">Loads category-specific marketplace attributes automatically</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">SKU Identity</label>
                                    <div className="relative">
                                        <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="SKU-XXXXX"
                                            value={form.sku}
                                            onChange={e => set("sku", e.target.value.toUpperCase())}
                                            className="w-full pl-8 pr-20 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={generateSKU}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors shadow-xs"
                                        >
                                            Auto 🧬
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Retail Price (₦) *</label>
                                    <div className="relative">
                                        <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={form.price}
                                            onChange={e => set("price", e.target.value)}
                                            className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Compare-at Price (₦) <span className="text-gray-400 font-normal">(Strike-through)</span></label>
                                    <div className="relative">
                                        <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={form.compare_at_price}
                                            onChange={e => set("compare_at_price", e.target.value)}
                                            className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-center pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Availability Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => set("status", e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="active">Active (Public on Marketplace)</option>
                                        <option value="draft">Draft (Private / Inactive)</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 pt-5">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={form.is_featured}
                                            onChange={e => set("is_featured", e.target.checked)}
                                            className="rounded accent-emerald-600 w-4 h-4"
                                        />
                                        <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                                            <Star size={13} className={form.is_featured ? "text-amber-500 fill-amber-500" : "text-gray-300"} />
                                            Featured on Home / Category Showcase
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: INVENTORY & CHANNELS ── */}
                    {activeTab === "inventory" && (
                        <div className="space-y-5">
                            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center gap-3">
                                <Boxes size={24} className="text-emerald-600 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-emerald-900">Inventory Tracking is Activated</p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">This product is managed by the inventory ledger. Stock will auto-deduct on online sales and POS checkouts.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <label className="block text-xs font-bold text-gray-800 mb-1">Opening Stock Quantity</label>
                                    <p className="text-[11px] text-gray-400 mb-2">Available physical units ready for sale right now</p>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={form.initial_quantity}
                                        onChange={e => set("initial_quantity", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <label className="block text-xs font-bold text-gray-800 mb-1">Low Stock Alert Threshold</label>
                                    <p className="text-[11px] text-gray-400 mb-2">Triggers low stock badge and dashboard alert</p>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="5"
                                        value={form.low_stock_threshold}
                                        onChange={e => set("low_stock_threshold", e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Multi-Channel Visibility</h4>
                                
                                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Globe size={18} className="text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Publish to Online Marketplace</p>
                                            <p className="text-[11px] text-gray-400">Makes the product visible on your web storefront and public marketplace feeds</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        checked={form.is_marketplace_published}
                                        onChange={() => set("is_marketplace_published", !form.is_marketplace_published)}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Monitor size={18} className="text-indigo-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Enable on POS Registers</p>
                                            <p className="text-[11px] text-gray-400">Makes the product searchable and barcode-scannable in the POS Terminal</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch
                                        checked={form.is_pos_visible}
                                        onChange={() => set("is_pos_visible", !form.is_pos_visible)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 3: MEDIA ASSET ── */}
                    {activeTab === "media" && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1.5">Primary Digital Asset (Cover Image) *</label>
                                <p className="text-xs text-gray-400 mb-4">High-resolution cover image displayed across catalog, storefront cards, and search results</p>
                                
                                <PremiumImageUpload
                                    label="Upload Product Cover"
                                    value={form.image_url}
                                    onChange={url => set("image_url", url)}
                                    folder="products"
                                />
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Direct Image URL Fallback</label>
                                <input
                                    type="text"
                                    placeholder="https://images.example.com/item.jpg"
                                    value={form.image_url}
                                    onChange={e => set("image_url", e.target.value)}
                                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── TAB 4: ATTRIBUTES ── */}
                    {activeTab === "attributes" && (
                        <div className="space-y-4">
                            {!form.category_id ? (
                                <div className="text-center py-12 px-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <Tag size={28} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-gray-700">No Category Selected Yet</p>
                                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Please pick a category on the Essentials tab to load the relevant attributes schema (e.g. Brand, Size, Specifications).</p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("general")}
                                        className="mt-4 px-4 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        Go to Essentials
                                    </button>
                                </div>
                            ) : loadingAttrs ? (
                                <div className="flex items-center justify-center py-12 text-gray-400">
                                    <Loader2 size={22} className="animate-spin mr-2" />
                                    <span className="text-xs">Loading category attributes...</span>
                                </div>
                            ) : attributes.length === 0 ? (
                                <div className="text-center py-12 px-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <ShieldCheck size={28} className="text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-gray-700">Standard Category</p>
                                    <p className="text-xs text-gray-400 mt-1">This category does not require custom dynamic attributes. Standard product details are sufficient.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {attributes.map(attr => (
                                        <div key={attr.code} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <label className="block text-xs font-bold text-gray-800 mb-1">
                                                {attr.label}
                                                {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            
                                            {attr.type === 'select' ? (
                                                <select
                                                    value={form.attributes[attr.code] || ''}
                                                    onChange={e => handleAttrChange(attr.code, e.target.value)}
                                                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="">— Select {attr.label} —</option>
                                                    {attr.options?.map((opt, i) => (
                                                        <option key={i} value={opt.value || opt.label}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : attr.type === 'number' ? (
                                                <input
                                                    type="number"
                                                    value={form.attributes[attr.code] || ''}
                                                    onChange={e => handleAttrChange(attr.code, e.target.value)}
                                                    placeholder={`Enter ${attr.label}`}
                                                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={form.attributes[attr.code] || ''}
                                                    onChange={e => handleAttrChange(attr.code, e.target.value)}
                                                    placeholder={`e.g. ${attr.placeholder || attr.label}`}
                                                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 5: LOGISTICS & SEO ── */}
                    {activeTab === "seo" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Description / Highlights</label>
                                <textarea
                                    rows={3}
                                    placeholder="Detailed product specifications and highlights for customer viewing..."
                                    value={form.description}
                                    onChange={e => set("description", e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Delivery Type</label>
                                    <select
                                        value={form.delivery_type}
                                        onChange={e => set("delivery_type", e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="normal">Normal / In-Store (Standard)</option>
                                        <option value="express">Express Delivery ⚡</option>
                                        <option value="shipped_from_abroad">Shipped from Abroad ✈️</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Marketplace URL Slug Handle</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="product-url-slug"
                                            value={form.handle}
                                            onChange={e => {
                                                setManualHandle(true);
                                                set("handle", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                                            }}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Accessible at /products/{form.handle || '...'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Tags</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add tag and press Enter (e.g. organic, flagship, summer)"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                                {form.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {form.tags.map(t => (
                                            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                                #{t}
                                                <button type="button" onClick={() => removeTag(t)} className="hover:text-red-600"><X size={11} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold text-gray-800">{form.name || "Draft Product"}</span>
                        <span>·</span>
                        <span className="font-bold text-emerald-600">{form.price ? fmt(form.price) : "₦0.00"}</span>
                        <span>·</span>
                        <span className="text-gray-400">{form.initial_quantity || 0} units</span>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        
                        {currentTabIndex < TABS.length - 1 && (
                            <button
                                type="button"
                                onClick={nextTab}
                                className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                                Next <ChevronRight size={13} />
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={saving || !form.name || !form.price}
                            onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                            {saving ? "Creating Product..." : "Create & Track"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}



// ── Adjust Stock Modal ─────────────────────────────────────────────────────────
function AdjustModal({ product, onClose, onDone }) {
    const [type, setType] = useState("restock");
    const [quantity, setQuantity] = useState("");
    const [supplierName, setSupplierName] = useState("");
    const [poRef, setPoRef] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async () => {
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 0) { setError("Enter a valid quantity"); return; }
        setSaving(true);
        setError(null);
        try {
            const res = await api.patch(`/inventory/${product.id}/stock`, {
                adjustment_type: type,
                quantity: qty,
                notes: notes.trim() || undefined,
                supplier_name: type === "restock" ? (supplierName.trim() || undefined) : undefined,
                purchase_order_ref: type === "restock" ? (poRef.trim() || undefined) : undefined
            });
            if (res.data.success) { onDone(); onClose(); }
            else setError(res.data.error || "Adjustment failed");
        } catch (err) {
            setError(err.response?.data?.error || "Adjustment failed");
        } finally {
            setSaving(false);
        }
    };

    const adjustTypes = [
        { value: "restock", label: "Restock", icon: "➕", desc: "Add units received" },
        { value: "recount", label: "Recount", icon: "🔄", desc: "Set exact qty" },
        { value: "damage", label: "Damage", icon: "⚠️", desc: "Remove lost/damaged" },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Adjust Stock</h3>
                        <p className="text-sm text-gray-400 mt-0.5 truncate max-w-xs">{product.name} {product.variant_label ? `(${product.variant_label})` : ""}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Current stock banner */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-sm text-gray-500">Current stock</span>
                        <span className="text-2xl font-bold text-gray-900">{product.inventory_quantity}</span>
                    </div>

                    {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} />{error}</p>}

                    <div className="grid grid-cols-3 gap-2">
                        {adjustTypes.map(t => (
                            <button
                                key={t.value}
                                className={`p-3 rounded-xl border-2 text-left transition-all ${type === t.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                                onClick={() => setType(t.value)}
                            >
                                <div className="text-lg mb-1">{t.icon}</div>
                                <div className="text-xs font-bold text-gray-800">{t.label}</div>
                                <div className="text-xs text-gray-400 leading-tight">{t.desc}</div>
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {type === "recount" ? "Set New Quantity" : "Quantity"}
                        </label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            autoFocus
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {type === "restock" && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier <span className="font-normal text-gray-400">(opt)</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={supplierName}
                                    onChange={e => setSupplierName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">PO / Ref # <span className="font-normal text-gray-400">(opt)</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. PO-8492"
                                    value={poRef}
                                    onChange={e => setPoRef(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                        <input
                            type="text"
                            placeholder="e.g. Received shipment"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" onClick={onClose}>Cancel</button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            disabled={saving}
                            onClick={handleSave}
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Ledger Tab ─────────────────────────────────────────────────────────────────
function LedgerTab() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    const REASON_META = {
        restock:           { label: "Restock",      color: "bg-emerald-50 text-emerald-700 ring-emerald-200", sign: "+" },
        recount:           { label: "Recount",      color: "bg-blue-50 text-blue-700 ring-blue-200",           sign: "±" },
        damage:            { label: "Damage",        color: "bg-amber-50 text-amber-700 ring-amber-200",        sign: "−" },
        online_sale:       { label: "Online Sale",   color: "bg-red-50 text-red-700 ring-red-200",             sign: "−" },
        pos_sale:          { label: "POS Sale",      color: "bg-red-50 text-red-700 ring-red-200",             sign: "−" },
        order_cancel:      { label: "Restocked",     color: "bg-emerald-50 text-emerald-700 ring-emerald-200", sign: "+" },
        catalog_import:    { label: "Import",        color: "bg-purple-50 text-purple-700 ring-purple-200",    sign: "+" },
        tracking_disabled: { label: "Tracking Off",  color: "bg-gray-100 text-gray-500 ring-gray-200",         sign: "×" },
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await api.get("/inventory/ledger?per_page=100");
                setEntries(res.data.data || []);
            } catch (err) {
                console.error("Failed to load ledger:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const exportLedgerCSV = () => {
        const headers = ["Product", "Change", "Previous Qty", "New Qty", "Reason", "Notes", "Date"];
        const rows = entries.map(e => [
            e.product_name || "",
            e.change_quantity,
            e.previous_quantity,
            e.new_quantity,
            e.reason,
            e.notes || "",
            new Date(e.created_at).toLocaleString("en-NG")
        ]);
        downloadCSV(`inventory_ledger_${Date.now()}.csv`, headers, rows);
    };

    if (loading) return (
        <div className="flex justify-center items-center py-24 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
        </div>
    );

    if (entries.length === 0) return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <ClipboardList size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No ledger entries yet</p>
            <p className="text-sm text-gray-400 mt-1">All stock movements will be recorded here</p>
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">{entries.length} movements recorded</span>
                <button
                    onClick={exportLedgerCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                >
                    <Download size={13} /> Export Ledger CSV
                </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                        <tr>
                            <th className="px-5 py-3">Product</th>
                            <th className="px-5 py-3">Change</th>
                            <th className="px-5 py-3">Before</th>
                            <th className="px-5 py-3">After</th>
                            <th className="px-5 py-3">Type</th>
                            <th className="px-5 py-3">Notes</th>
                            <th className="px-5 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {entries.map(e => {
                            const meta = REASON_META[e.reason] || { label: e.reason, color: "bg-gray-50 text-gray-600 ring-gray-200", sign: "" };
                            return (
                                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            {e.image_url
                                                ? <img src={e.image_url} alt={e.product_name} className="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                                                : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Package size={12} className="text-gray-400" /></div>
                                            }
                                            <span className="font-medium text-gray-800">{e.product_name}</span>
                                        </div>
                                    </td>
                                    <td className={`px-5 py-3.5 font-bold text-base ${e.change_quantity >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                        {e.change_quantity >= 0 ? "+" : ""}{e.change_quantity}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-400">{e.previous_quantity}</td>
                                    <td className="px-5 py-3.5 font-bold text-gray-900">{e.new_quantity}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-400 text-xs max-w-32 truncate">{e.notes || "—"}</td>
                                    <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                                        {new Date(e.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
}

// ── Row Actions Menu ───────────────────────────────────────────────────────────
function RowMenu({ product, onAdjust, onRemove }) {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
                <MoreVertical size={15} />
            </button>
            {open && (
                <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                    <button
                        onClick={() => { setOpen(false); onAdjust(); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <BarChart2 size={14} className="text-blue-500" /> Adjust Stock
                    </button>
                    <div className="h-px bg-gray-100 mx-2 my-1" />
                    <button
                        onClick={() => { setOpen(false); onRemove(); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={14} /> Remove Tracking
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function InventoryPage() {
    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("stock");
    const [modal, setModal] = useState(null); // "import" | "create" | null
    const [adjustProduct, setAdjustProduct] = useState(null);
    const [bulkPublishing, setBulkPublishing] = useState(false);
    const [marketplaceOn, setMarketplaceOn] = useState(true);
    const [expandedProducts, setExpandedProducts] = useState({});

    const toggleExpand = (id) => {
        setExpandedProducts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleQuickAdjust = async (id, delta) => {
        try {
            const res = await api.patch(`/inventory/${id}/quick-adjust`, { delta });
            if (res.data.success) {
                fetchInventory();
            }
        } catch (err) {
            console.error("Failed to quick adjust stock:", err);
        }
    };

    const handleSaveThreshold = async (id, threshold) => {
        try {
            await api.patch(`/inventory/${id}/threshold`, { low_stock_threshold: threshold });
            fetchInventory();
        } catch (err) {
            console.error("Failed to save threshold:", err);
        }
    };

    const exportStockCSV = () => {
        const headers = ["Product Name", "Type", "SKU", "Variant Label", "Price", "Stock Qty", "Threshold", "Stock Status", "Marketplace Live", "POS Visible"];
        const rows = [];
        products.forEach(p => {
            rows.push([
                p.name,
                p.has_variants ? "Parent Product" : "Standard Product",
                p.sku || "",
                "",
                p.price,
                p.inventory_quantity,
                p.low_stock_threshold || 5,
                p.stock_status,
                p.is_marketplace_published ? "Yes" : "No",
                p.is_pos_visible ? "Yes" : "No"
            ]);
            if (p.variants && p.variants.length > 0) {
                p.variants.forEach(v => {
                    rows.push([
                        `${p.name} - ${v.variant_label || v.name || "Variant"}`,
                        "Variant",
                        v.sku || "",
                        v.variant_label || "",
                        v.price,
                        v.inventory_quantity,
                        v.low_stock_threshold || 5,
                        v.inventory_quantity === 0 ? "out_of_stock" : (v.inventory_quantity <= (v.low_stock_threshold || 5) ? "low_stock" : "in_stock"),
                        v.is_marketplace_published ? "Yes" : "No",
                        v.is_pos_visible ? "Yes" : "No"
                    ]);
                });
            }
        });
        downloadCSV(`inventory_stock_${Date.now()}.csv`, headers, rows);
    };

    const fetchInventory = useCallback(async (filterOverride, searchOverride) => {
        setLoading(true);
        const f = filterOverride !== undefined ? filterOverride : filter;
        const s = searchOverride !== undefined ? searchOverride : search;
        try {
            const [invRes, sumRes] = await Promise.all([
                api.get(`/inventory?per_page=200&filter=${f}&search=${encodeURIComponent(s)}`),
                api.get("/inventory/summary")
            ]);
            setProducts(invRes.data.data || []);
            setSummary(sumRes.data.summary || null);
        } catch (err) {
            console.error("Failed to load inventory:", err);
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    const toggleMarketplace = async (id) => {
        try {
            await api.patch(`/inventory/${id}/toggle-marketplace`);
            setProducts(ps => ps.map(p => p.id === id ? { ...p, is_marketplace_published: !p.is_marketplace_published } : p));
        } catch (err) {
            console.error("Failed to toggle marketplace:", err);
        }
    };

    const togglePOS = async (id) => {
        try {
            await api.patch(`/inventory/${id}/toggle-pos`);
            setProducts(ps => ps.map(p => p.id === id ? { ...p, is_pos_visible: !p.is_pos_visible } : p));
        } catch (err) {
            console.error("Failed to toggle POS:", err);
        }
    };

    const handleBulkPublish = async (publish) => {
        setBulkPublishing(true);
        try {
            await api.post("/inventory/bulk-publish", { publish });
            setMarketplaceOn(publish);
            fetchInventory();
        } catch (err) {
            console.error("Failed to bulk publish:", err);
        } finally {
            setBulkPublishing(false);
        }
    };

    const handleRemoveTracking = async (product) => {
        if (!confirm(`Remove inventory tracking from "${product.name}"? Stock count will be reset to 0.`)) return;
        try {
            await api.post("/inventory/remove", { product_id: product.id });
            fetchInventory();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to remove tracking");
        }
    };

    const FILTERS = [
        { key: "all", label: "All" },
        { key: "in_stock", label: "In Stock" },
        { key: "low_stock", label: "Low Stock" },
        { key: "out_of_stock", label: "Out of Stock" },
    ];

    const TABS = [
        { key: "stock", label: "Stock Levels", icon: <Boxes size={14} /> },
        { key: "ledger", label: "Audit Ledger", icon: <ClipboardList size={14} /> },
    ];

    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Manage stock levels, visibility, and audit history</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Bulk marketplace toggle — single switch instead of two buttons */}
                    <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl">
                        <Globe size={13} className="text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600">All Marketplace</span>
                        <ToggleSwitch
                            checked={marketplaceOn}
                            onChange={() => handleBulkPublish(!marketplaceOn)}
                            disabled={bulkPublishing}
                        />
                    </div>

                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        onClick={() => setModal("import")}
                    >
                        <Upload size={14} /> Import Catalog
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                        onClick={() => setModal("create")}
                    >
                        <Plus size={15} /> New Product
                    </button>
                </div>
            </div>

            {/* ── Metrics ── */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <MetricCard icon={<Boxes size={18} />} label="Tracked Items" value={summary.tracked_items || 0} />
                    <MetricCard icon={<Layers size={18} />} label="Total Units" value={(summary.total_units || 0).toLocaleString()} color="text-blue-600" />
                    <MetricCard icon={<DollarSign size={18} />} label="Stock Value" value={fmt(summary.inventory_value)} />
                    <MetricCard icon={<AlertTriangle size={18} />} label="Low Stock" value={summary.low_stock || 0} color={summary.low_stock > 0 ? "text-amber-600" : "text-gray-900"} />
                    <MetricCard icon={<TrendingDown size={18} />} label="Out of Stock" value={summary.out_of_stock || 0} color={summary.out_of_stock > 0 ? "text-red-600" : "text-gray-900"} />
                </div>
            )}

            {/* ── Low Stock Alert Banner ── */}
            {summary && summary.low_stock > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-amber-900">
                                {summary.low_stock} product{summary.low_stock > 1 ? "s are" : " is"} running low on stock!
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Units are below threshold. Restock soon to prevent missed sales on the storefront or POS.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setFilter("low_stock"); setActiveTab("stock"); }}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow-xs"
                    >
                        Filter Low Stock
                    </button>
                </div>
            )}

            {/* ── Tabs ── */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-0.5">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                                activeTab === t.key
                                    ? "border-emerald-600 text-emerald-700"
                                    : "border-transparent text-gray-400 hover:text-gray-700"
                            }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ── Tab Content ── */}
            {activeTab === "ledger" ? <LedgerTab /> : (
                <>
                    {/* Toolbar */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-52">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                placeholder="Search products, SKUs, or variants..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                            {FILTERS.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        filter === f.key
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={exportStockCSV}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                            title="Export Stock Levels to CSV"
                        >
                            <Download size={13} /> Export Stock CSV
                        </button>
                        <button
                            className="p-2.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
                            onClick={fetchInventory}
                            title="Refresh"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Stock Table */}
                    {loading ? (
                        <div className="flex justify-center items-center py-24 text-gray-400">
                            <Loader2 size={28} className="animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-gray-100">
                            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                                <Boxes size={36} className="text-gray-200" />
                            </div>
                            <p className="text-base font-bold text-gray-600 mb-1">No inventory yet</p>
                            <p className="text-sm text-gray-400 mb-6">Add products to start tracking stock</p>
                            <div className="flex gap-2">
                                <button
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                    onClick={() => setModal("import")}
                                >
                                    <Upload size={14} /> Import from Catalog
                                </button>
                                <button
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
                                    onClick={() => setModal("create")}
                                >
                                    <Plus size={14} /> Create Product
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Marketplace</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">POS</th>
                                        <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {products.map(p => (
                                        <Fragment key={p.id}>
                                            <tr className="hover:bg-gray-50/50 transition-colors group">
                                                {/* Product */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {p.has_variants && (
                                                            <button
                                                                onClick={() => toggleExpand(p.id)}
                                                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                                                title="Toggle Variants"
                                                            >
                                                                <ChevronRight size={15} className={`transition-transform duration-200 ${expandedProducts[p.id] ? "rotate-90 text-emerald-600" : ""}`} />
                                                            </button>
                                                        )}
                                                        {p.image_url
                                                            ? <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                                                            : <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><Package size={14} className="text-gray-400" /></div>
                                                        }
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                                                                {p.has_variants && (
                                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] font-bold rounded-full">
                                                                        {p.variants?.length || 0} variants
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {p.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {p.sku}</p>}
                                                            {p.vendor_name && <p className="text-xs text-gray-400">{p.vendor_name}</p>}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Stock */}
                                                <td className="px-5 py-4">
                                                    {p.has_variants ? (
                                                        <div className="flex flex-col gap-1">
                                                            <StockPill status={p.stock_status} qty={p.inventory_quantity} />
                                                            <p className="text-[11px] text-gray-400">{p.inventory_quantity} units total</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <StockPill status={p.stock_status} qty={p.inventory_quantity} />
                                                                <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
                                                                    <button
                                                                        onClick={() => handleQuickAdjust(p.id, -1)}
                                                                        disabled={p.inventory_quantity <= 0}
                                                                        className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                                                        title="Quick decrease by 1"
                                                                    >−</button>
                                                                    <button
                                                                        onClick={() => handleQuickAdjust(p.id, 1)}
                                                                        className="px-2 py-0.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                                                                        title="Quick increase by 1"
                                                                    >+</button>
                                                                </div>
                                                            </div>
                                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${p.inventory_quantity === 0 ? "bg-red-400" : p.stock_status === "low_stock" ? "bg-amber-400" : "bg-emerald-400"}`}
                                                                    style={{ width: `${Math.min((p.inventory_quantity / Math.max((p.low_stock_threshold || 5) * 4, p.inventory_quantity, 20)) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                            <InlineThreshold
                                                                value={p.low_stock_threshold || 5}
                                                                onSave={(thresh) => handleSaveThreshold(p.id, thresh)}
                                                            />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Price */}
                                                <td className="px-5 py-4 font-semibold text-gray-900">{fmt(p.price)}</td>

                                                {/* Marketplace toggle */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <ToggleSwitch
                                                            checked={p.is_marketplace_published}
                                                            onChange={() => toggleMarketplace(p.id)}
                                                        />
                                                        <span className={`text-xs font-medium ${p.is_marketplace_published ? "text-emerald-600" : "text-gray-400"}`}>
                                                            {p.is_marketplace_published ? "Live" : "Hidden"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* POS toggle */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <ToggleSwitch
                                                            checked={p.is_pos_visible}
                                                            onChange={() => togglePOS(p.id)}
                                                        />
                                                        <span className={`text-xs font-medium ${p.is_pos_visible ? "text-blue-600" : "text-gray-400"}`}>
                                                            {p.is_pos_visible ? "Visible" : "Hidden"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4">
                                                    <RowMenu
                                                        product={p}
                                                        onAdjust={() => setAdjustProduct(p)}
                                                        onRemove={() => handleRemoveTracking(p)}
                                                    />
                                                </td>
                                            </tr>

                                            {/* Child Variants Rows */}
                                            {p.has_variants && expandedProducts[p.id] && p.variants?.map(v => (
                                                <tr key={v.id} className="bg-slate-50/70 border-l-4 border-emerald-500 hover:bg-slate-100/60 transition-colors">
                                                    <td className="px-5 py-3 pl-12">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-900 text-xs">{v.variant_label || v.name}</span>
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-700">variant</span>
                                                                </div>
                                                                {v.sku && <p className="text-[11px] text-gray-400 mt-0.5">SKU: {v.sku}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <StockPill
                                                                    status={v.inventory_quantity === 0 ? "out_of_stock" : v.inventory_quantity <= (v.low_stock_threshold || 5) ? "low_stock" : "in_stock"}
                                                                    qty={v.inventory_quantity}
                                                                />
                                                                <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
                                                                    <button
                                                                        onClick={() => handleQuickAdjust(v.id, -1)}
                                                                        disabled={v.inventory_quantity <= 0}
                                                                        className="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                                                                        title="Quick decrease by 1"
                                                                    >−</button>
                                                                    <button
                                                                        onClick={() => handleQuickAdjust(v.id, 1)}
                                                                        className="px-2 py-0.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                                                                        title="Quick increase by 1"
                                                                    >+</button>
                                                                </div>
                                                            </div>
                                                            <InlineThreshold
                                                                value={v.low_stock_threshold || 5}
                                                                onSave={(thresh) => handleSaveThreshold(v.id, thresh)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 font-semibold text-gray-900 text-xs">{fmt(v.price)}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <ToggleSwitch
                                                                checked={v.is_marketplace_published}
                                                                onChange={() => toggleMarketplace(v.id)}
                                                            />
                                                            <span className={`text-xs font-medium ${v.is_marketplace_published ? "text-emerald-600" : "text-gray-400"}`}>
                                                                {v.is_marketplace_published ? "Live" : "Hidden"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <ToggleSwitch
                                                                checked={v.is_pos_visible}
                                                                onChange={() => togglePOS(v.id)}
                                                            />
                                                            <span className={`text-xs font-medium ${v.is_pos_visible ? "text-blue-600" : "text-gray-400"}`}>
                                                                {v.is_pos_visible ? "Visible" : "Hidden"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <RowMenu
                                                            product={v}
                                                            onAdjust={() => setAdjustProduct(v)}
                                                            onRemove={() => handleRemoveTracking(v)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── Modals ── */}
            {modal === "import" && (
                <ImportModal
                    onClose={() => setModal(null)}
                    onDone={() => {
                        setModal(null);
                        setFilter("all");
                        setSearch("");
                        fetchInventory("all", "");
                    }}
                />
            )}

            {modal === "create" && (
                <CreateInventoryProductModal
                    onClose={() => setModal(null)}
                    onDone={() => {
                        setModal(null);
                        setFilter("all");
                        setSearch("");
                        fetchInventory("all", "");
                    }}
                />
            )}

            {adjustProduct && (
                <AdjustModal
                    product={adjustProduct}
                    onClose={() => setAdjustProduct(null)}
                    onDone={() => { setAdjustProduct(null); fetchInventory(); }}
                />
            )}
        </div>
    );
}
