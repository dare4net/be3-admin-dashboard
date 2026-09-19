"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
    Save, Loader2, Check, Plus, Trash2, ChevronDown, ChevronUp,
    PanelTop, PanelBottom, Link as LinkIcon, Eye, EyeOff,
    AlignLeft, Mail, Phone, MapPin, GripVertical, Edit2, X, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
    { id: "header", label: "Header", icon: PanelTop },
    { id: "footer", label: "Footer", icon: PanelBottom },
];

const DEFAULT_FOOTER_COLUMNS = [
    {
        id: "col-shop",
        title: "Shop",
        links: [
            { label: "All Products", url: "/products" },
            { label: "Categories", url: "/categories" },
            { label: "Deals & Offers", url: "/search?q=deals" },
            { label: "Featured", url: "/collections/featured" },
        ]
    },
    {
        id: "col-support",
        title: "Support",
        links: [
            { label: "Track Order", url: "/account/orders" },
            { label: "Returns & Exchanges", url: "/returns" },
            { label: "FAQs", url: "/faq" },
            { label: "Contact Us", url: "/contact" },
        ]
    },
    {
        id: "col-legal",
        title: "Company",
        links: [
            { label: "About Us", url: "/about" },
            { label: "Privacy Policy", url: "/privacy" },
            { label: "Terms of Service", url: "/terms" },
        ]
    }
];

function ToggleSwitch({ checked, onChange, label }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer">
            <div
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0",
                    checked ? "bg-blue-600" : "bg-gray-200"
                )}
            >
                <span className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                    checked ? "translate-x-5" : "translate-x-0"
                )} />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </label>
    );
}

function LinkEditor({ links, onChange }) {
    const addLink = () => onChange([...links, { label: "", url: "/" }]);
    const updateLink = (i, field, val) => {
        const updated = [...links];
        updated[i] = { ...updated[i], [field]: val };
        onChange(updated);
    };
    const removeLink = (i) => onChange(links.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-2">
            {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={link.label}
                        onChange={e => updateLink(i, "label", e.target.value)}
                        placeholder="Label"
                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                        type="text"
                        value={link.url}
                        onChange={e => updateLink(i, "url", e.target.value)}
                        placeholder="/url or https://..."
                        className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button onClick={() => removeLink(i)} className="p-1 text-gray-400 hover:text-red-600 rounded transition">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <button
                onClick={addLink}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-1"
            >
                <Plus className="w-3.5 h-3.5" /> Add Link
            </button>
        </div>
    );
}

export default function HeaderFooterSettingsPage() {
    const [activeTab, setActiveTab] = useState("header");
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [editingColIdx, setEditingColIdx] = useState(null);
    const [menus, setMenus] = useState([]);
    const [addColModal, setAddColModal] = useState(false);

    // ── Header Settings ──────────────────────────────────────
    const [headerSettings, setHeaderSettings] = useState({
        sticky: true,
        showSearch: true,
        showWishlist: true,
        showCartCount: true,
        showAccountMenu: true,
        showNotifications: true,
        transparentOnTop: false,
        backgroundColor: '#ffffff',
        textColor: '#111827',
        borderColor: '#f3f4f6',
    });

    // ── Footer Settings ───────────────────────────────────────
    const [footerSettings, setFooterSettings] = useState({
        aboutText: "Premium quality products for your lifestyle. Designed for excellence.",
        contactEmail: "",
        contactPhone: "",
        contactAddress: "",
        showNewsletter: true,
        showSocialLinks: true,
        showPaymentIcons: true,
        showTrustBadges: true,
        copyrightText: "",
        bottomLinks: [
            { label: "Privacy Policy", url: "/privacy" },
            { label: "Terms of Service", url: "/terms" },
        ],
        columns: DEFAULT_FOOTER_COLUMNS,
        backgroundColor: "#111827",
        textColor: "#9ca3af",
    });

    useEffect(() => {
        fetchTheme();
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            const res = await api.get("/menus");
            if (res.data.success) setMenus(res.data.data || []);
        } catch (_) {}
    };

    const fetchTheme = async () => {
        try {
            const res = await api.get("/page-builder/storefront/theme");
            if (res.data.theme) {
                setTheme(res.data.theme);
                const vars = res.data.theme.variables || {};

                if (vars.header) {
                    setHeaderSettings(prev => ({ ...prev, ...vars.header }));
                }
                if (vars.footer) {
                    setFooterSettings(prev => ({
                        ...prev,
                        ...vars.footer,
                        columns: vars.footer.columns || DEFAULT_FOOTER_COLUMNS,
                        bottomLinks: vars.footer.bottomLinks || prev.bottomLinks,
                    }));
                }
            }

            // Also check page overrides for header & footer to ensure full alignment
            try {
                const [hRes, fRes] = await Promise.all([
                    api.get('/page-builder/pages/by-slug/header').catch(() => null),
                    api.get('/page-builder/pages/by-slug/footer').catch(() => null),
                ]);
                const hBg = hRes?.data?.page?.theme_overrides?.background;
                const fBg = fRes?.data?.page?.theme_overrides?.background;
                if (hBg) setHeaderSettings(prev => ({ ...prev, backgroundColor: hBg }));
                if (fBg) setFooterSettings(prev => ({ ...prev, backgroundColor: fBg }));
            } catch (_) {}
        } catch (err) {
            console.error("Failed to fetch theme:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!theme) return;
        setSaving(true);
        try {
            const currentVars = theme.variables || {};
            await api.put(`/page-builder/themes/${theme.id}`, {
                variables: {
                    ...currentVars,
                    header: headerSettings,
                    footer: footerSettings,
                }
            });

            // ── SYNC: write backgroundColor and textColor to page theme_overrides so Page Settings
            //    panel shows the exact same values. Update both header + footer pages unconditionally.
            const syncPageColors = async (slug, bgColor, txtColor) => {
                const overrides = {};
                if (bgColor) overrides.background = bgColor;
                if (txtColor) overrides.textColor = txtColor;
                const payload = { theme_overrides: overrides, is_published: true };
                try {
                    const slugRes = await api.get(`/page-builder/pages/by-slug/${slug}`);
                    if (slugRes.data?.page?.id) {
                        const existingOverrides = slugRes.data.page.theme_overrides || {};
                        const merged = { ...existingOverrides, ...overrides };
                        await api.put(`/page-builder/pages/${slugRes.data.page.id}`, { ...payload, theme_overrides: merged });
                    } else {
                        await api.post('/page-builder/pages', { slug, title: slug === 'header' ? 'Global Header' : 'Global Footer', ...payload });
                    }
                } catch (err) {
                    if (err.response?.status !== 404) console.warn('[HeaderFooter] Could not sync page overrides:', err.message);
                    try { await api.post('/page-builder/pages', { slug, title: slug === 'header' ? 'Global Header' : 'Global Footer', ...payload }); } catch (_) {}
                }
            };

            await syncPageColors('header', headerSettings.backgroundColor, headerSettings.textColor);
            await syncPageColors('footer', footerSettings.backgroundColor, footerSettings.textColor);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
            fetchTheme();
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const updateCol = (idx, field, val) => {
        const updated = [...footerSettings.columns];
        updated[idx] = { ...updated[idx], [field]: val };
        setFooterSettings(prev => ({ ...prev, columns: updated }));
    };

    const addColumn = (type = "manual") => {
        const newCol = type === "menu"
            ? { id: `col-${Date.now()}`, title: "Linked Menu", type: "menu", menu_id: "", links: [] }
            : { id: `col-${Date.now()}`, title: "New Column", type: "manual", links: [] };
        setFooterSettings(prev => ({ ...prev, columns: [...prev.columns, newCol] }));
        setEditingColIdx(footerSettings.columns.length);
        setAddColModal(false);
    };

    const removeColumn = (idx) => {
        const updated = footerSettings.columns.filter((_, i) => i !== idx);
        setFooterSettings(prev => ({ ...prev, columns: updated }));
        setEditingColIdx(null);
    };

    const setH = (key, val) => setHeaderSettings(prev => ({ ...prev, [key]: val }));
    const setF = (key, val) => setFooterSettings(prev => ({ ...prev, [key]: val }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!theme) {
        return (
            <div className="text-center py-20">
                <PanelTop className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-gray-700 mb-2">No Active Theme</h2>
                <p className="text-sm text-gray-500 mb-4">Initialize your storefront theme first in <strong>Global Settings</strong>.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <PanelTop className="w-6 h-6 text-blue-600" />
                        Header & Footer Settings
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Configure layout, visibility, links, and content for your storefront header and footer.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md",
                        saveSuccess ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                    )}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        saveSuccess ? <Check className="w-4 h-4" /> :
                            <Save className="w-4 h-4" />}
                    {saveSuccess ? "Saved!" : "Save Changes"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition",
                            activeTab === tab.id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════
                HEADER TAB
            ════════════════════════════════════ */}
            {activeTab === "header" && (
                <div className="space-y-4">
                    {/* Behaviour */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Header Behaviour</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ToggleSwitch
                                checked={headerSettings.sticky}
                                onChange={v => setH("sticky", v)}
                                label="Sticky header (stays visible on scroll)"
                            />
                            <ToggleSwitch
                                checked={headerSettings.transparentOnTop}
                                onChange={v => setH("transparentOnTop", v)}
                                label="Transparent header at top of page"
                            />
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Show / Hide Elements</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ToggleSwitch
                                checked={headerSettings.showSearch}
                                onChange={v => setH("showSearch", v)}
                                label="Search bar"
                            />
                            <ToggleSwitch
                                checked={headerSettings.showWishlist}
                                onChange={v => setH("showWishlist", v)}
                                label="Wishlist icon"
                            />
                            <ToggleSwitch
                                checked={headerSettings.showCartCount}
                                onChange={v => setH("showCartCount", v)}
                                label="Cart count badge"
                            />
                            <ToggleSwitch
                                checked={headerSettings.showAccountMenu}
                                onChange={v => setH("showAccountMenu", v)}
                                label="Account / profile menu"
                            />
                            <ToggleSwitch
                                checked={headerSettings.showNotifications}
                                onChange={v => setH("showNotifications", v)}
                                label="Notification bell"
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Header Colors</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Background Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={headerSettings.backgroundColor || '#ffffff'}
                                        onChange={e => setH('backgroundColor', e.target.value)}
                                        className="w-10 h-9 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={headerSettings.backgroundColor || '#ffffff'}
                                        onChange={e => setH('backgroundColor', e.target.value)}
                                        placeholder="#ffffff or var(--primary)"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Text / Icon Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={headerSettings.textColor || '#111827'}
                                        onChange={e => setH('textColor', e.target.value)}
                                        className="w-10 h-9 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={headerSettings.textColor || '#111827'}
                                        onChange={e => setH('textColor', e.target.value)}
                                        placeholder="#111827"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Border / Separator Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={headerSettings.borderColor || '#f3f4f6'}
                                        onChange={e => setH('borderColor', e.target.value)}
                                        className="w-10 h-9 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={headerSettings.borderColor || '#f3f4f6'}
                                        onChange={e => setH('borderColor', e.target.value)}
                                        placeholder="#f3f4f6"
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">You can use CSS variables like <code className="bg-gray-100 px-1 rounded">var(--primary)</code> for theme-linked colors.</p>
                    </div>

                    {/* Navigation */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <LinkIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-blue-900">Header Navigation is managed in Menu Builder</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Go to <strong>Storefront → Navigation Menus</strong> to add categories, subcategories, dynamic dropdowns, and smart filter links to your main navigation bar.
                                </p>
                                <a
                                    href="/dashboard/storefront/menus"
                                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                                >
                                    Open Menu Builder →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════
                FOOTER TAB
            ════════════════════════════════════ */}
            {activeTab === "footer" && (
                <div className="space-y-4">

                    {/* Brand / About */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Brand Column</h2>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">About / Tagline Text</label>
                            <textarea
                                value={footerSettings.aboutText}
                                onChange={e => setF("aboutText", e.target.value)}
                                rows={3}
                                placeholder="Premium quality products for your lifestyle..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                                    <Mail className="w-3 h-3 inline mr-1" />Contact Email
                                </label>
                                <input
                                    type="email"
                                    value={footerSettings.contactEmail}
                                    onChange={e => setF("contactEmail", e.target.value)}
                                    placeholder="support@yourstore.com"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                                    <Phone className="w-3 h-3 inline mr-1" />Contact Phone
                                </label>
                                <input
                                    type="text"
                                    value={footerSettings.contactPhone}
                                    onChange={e => setF("contactPhone", e.target.value)}
                                    placeholder="+1 (800) 123-4567"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                                <MapPin className="w-3 h-3 inline mr-1" />Address
                            </label>
                            <input
                                type="text"
                                value={footerSettings.contactAddress}
                                onChange={e => setF("contactAddress", e.target.value)}
                                placeholder="123 Main St, Lagos, Nigeria"
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Footer Columns (Link Groups) */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Link Columns</h2>
                            <button
                                onClick={() => setAddColModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Column
                            </button>
                        </div>

                        <div className="space-y-3">
                            {footerSettings.columns.map((col, idx) => (
                                <div key={col.id || idx} className="border border-gray-200 rounded-xl overflow-hidden">
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                                        <button
                                            onClick={() => setEditingColIdx(editingColIdx === idx ? null : idx)}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-800 flex-1 text-left"
                                        >
                                            {editingColIdx === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            <span className="flex items-center gap-1.5">
                                                {col.type === "menu" && <Navigation className="w-3.5 h-3.5 text-purple-500" />}
                                                {col.title || `Column ${idx + 1}`}
                                            </span>
                                            {col.type === "menu" ? (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                    Linked Menu
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-normal">({col.links?.length || 0} links)</span>
                                            )}
                                        </button>
                                        <button onClick={() => removeColumn(idx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Column Editor */}
                                    {editingColIdx === idx && (
                                        <div className="px-4 py-4 space-y-4 border-t border-gray-100">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Column Title</label>
                                                <input
                                                    type="text"
                                                    value={col.title}
                                                    onChange={e => updateCol(idx, "title", e.target.value)}
                                                    placeholder="e.g. Shop, Support, Company"
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>

                                            {col.type === "menu" ? (
                                                /* ── Menu Picker Mode ── */
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Link to Menu</label>
                                                    {menus.length === 0 ? (
                                                        <p className="text-xs text-gray-400 italic">No menus found. <a href="/dashboard/storefront/menus" className="text-blue-600 underline">Create one →</a></p>
                                                    ) : (
                                                        <select
                                                            value={col.menu_id || ""}
                                                            onChange={e => {
                                                                const m = menus.find(m => m.id === e.target.value);
                                                                updateCol(idx, "menu_id", e.target.value);
                                                                if (m && !col.title) updateCol(idx, "title", m.name);
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                        >
                                                            <option value="">— Select a menu —</option>
                                                            {menus.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name} ({m.location})</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                                        Footer will automatically display the items from the selected menu as links in this column.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCol(idx, "type", "manual")}
                                                        className="mt-2 text-[11px] text-gray-500 hover:text-red-500 font-bold"
                                                    >
                                                        Switch to manual links instead
                                                    </button>
                                                </div>
                                            ) : (
                                                /* ── Manual Links Mode ── */
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Links</label>
                                                    <LinkEditor
                                                        links={col.links || []}
                                                        onChange={links => updateCol(idx, "links", links)}
                                                    />
                                                    {menus.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCol(idx, "type", "menu")}
                                                            className="mt-2 text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
                                                        >
                                                            <Navigation className="w-3 h-3" /> Link to an existing menu instead
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Column Type Modal */}
                    {addColModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-gray-900">Add Footer Column</h3>
                                    <button onClick={() => setAddColModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">Choose how you want to populate this column's links:</p>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => addColumn("manual")}
                                        className="flex items-start gap-3 p-4 border-2 border-gray-200 hover:border-blue-400 rounded-xl text-left transition group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <LinkIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Manual Links</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Enter custom label + URL pairs for this column.</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => addColumn("menu")}
                                        className="flex items-start gap-3 p-4 border-2 border-gray-200 hover:border-purple-400 rounded-xl text-left transition group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                            <Navigation className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Link to a Menu</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Pick an existing navigation menu — its items auto-populate as footer links.</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Elements Visibility */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Show / Hide Elements</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ToggleSwitch
                                checked={footerSettings.showNewsletter}
                                onChange={v => setF("showNewsletter", v)}
                                label="Newsletter signup"
                            />
                            <ToggleSwitch
                                checked={footerSettings.showSocialLinks}
                                onChange={v => setF("showSocialLinks", v)}
                                label="Social media links"
                            />
                            <ToggleSwitch
                                checked={footerSettings.showPaymentIcons}
                                onChange={v => setF("showPaymentIcons", v)}
                                label="Payment method icons"
                            />
                            <ToggleSwitch
                                checked={footerSettings.showTrustBadges}
                                onChange={v => setF("showTrustBadges", v)}
                                label="Trust / security badges"
                            />
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Bottom Bar</h2>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Copyright Text</label>
                            <input
                                type="text"
                                value={footerSettings.copyrightText}
                                onChange={e => setF("copyrightText", e.target.value)}
                                placeholder={`© ${new Date().getFullYear()} Your Store. All rights reserved.`}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate from your store name.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Bottom Bar Links (e.g. Privacy, Terms)</label>
                            <LinkEditor
                                links={footerSettings.bottomLinks}
                                onChange={links => setF("bottomLinks", links)}
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Footer Colors</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Background Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={footerSettings.backgroundColor}
                                        onChange={e => setF("backgroundColor", e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={footerSettings.backgroundColor}
                                        onChange={e => setF("backgroundColor", e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Text Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={footerSettings.textColor}
                                        onChange={e => setF("textColor", e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={footerSettings.textColor}
                                        onChange={e => setF("textColor", e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
