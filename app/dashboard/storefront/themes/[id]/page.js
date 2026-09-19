"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
    ArrowLeft,
    Check,
    Save,
    ShoppingCart,
    Heart,
    Star,
    Eye,
    MessageCircle,
    Search,
    Sparkles,
    Smartphone,
    Monitor,
    Tablet,
    ShoppingBag,
    ShieldCheck,
    Zap
} from "lucide-react";
import Link from "next/link";

const PREVIEW_PRODUCTS = [
    {
        id: "prod-1",
        name: "Aura Sound Pro Wireless Noise-Cancelling Headphones",
        vendor: "Aura Audio",
        rating: "4.9",
        reviews: "128",
        price: "₦85,000",
        comparePrice: "₦110,000",
        badge: "20% OFF",
        views: "1.2k",
        likes: "318",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80"
    },
    {
        id: "prod-2",
        name: "Nordic Minimalist Automatic Chronograph Watch",
        vendor: "Nordic Time",
        rating: "5.0",
        reviews: "86",
        price: "₦145,000",
        comparePrice: "₦175,000",
        badge: "Top Seller",
        views: "890",
        likes: "215",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
    },
    {
        id: "prod-3",
        name: "Vanguard Heritage Handcrafted Leather Weekender Bag",
        vendor: "Vanguard Co.",
        rating: "4.8",
        reviews: "64",
        price: "₦95,000",
        badge: "New Arrival",
        views: "650",
        likes: "142",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80"
    }
];

function Inspectable({ name, tokens = [], children, className = "", style = {}, inspectorEnabled = true, activeToken, setActiveToken, ...props }) {
    const isHovered = activeToken?.name === name;

    const handlePointerOver = (e) => {
        if (!inspectorEnabled) return;
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const keys = tokens.map(t => t.key);

        setActiveToken({
            name,
            tokens,
            keys,
            rect: {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
                width: rect.width,
                height: rect.height
            }
        });

        // Real-time highlight & auto-scroll matching sidebar input field
        const primaryKey = keys[0];
        if (primaryKey && typeof document !== 'undefined') {
            const el = document.getElementById(`field-${primaryKey}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    };

    const handlePointerLeave = (e) => {
        if (!inspectorEnabled) return;
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setActiveToken(prev => (prev?.name === name ? null : prev));
    };

    return (
        <div
            className={`relative transition-all duration-150 ${inspectorEnabled ? 'cursor-help' : ''} ${className}`}
            style={{
                ...style,
                ...(isHovered && inspectorEnabled ? {
                    outline: '2px solid #2563eb',
                    outlineOffset: '2px',
                    borderRadius: style.borderRadius || 'inherit'
                } : {})
            }}
            onPointerOver={handlePointerOver}
            onPointerLeave={handlePointerLeave}
            {...props}
        >
            {children}
        </div>
    );
}

export default function ThemeEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [previewDevice, setPreviewDevice] = useState("desktop"); // 'desktop' | 'tablet' | 'mobile'
    const [inspectorEnabled, setInspectorEnabled] = useState(true);
    const [activeToken, setActiveToken] = useState(null);
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        variables: {
            primary: "#2563eb",
            primaryHover: "#1d4ed8",
            primaryContent: "#ffffff",
            secondary: "#4b5563",
            accent: "#facc15",
            accentSoft: "#eff6ff",
            accentContent: "#2563eb",
            buttonPrimaryBg: "#2563eb",
            buttonPrimaryText: "#ffffff",
            buttonSecondaryBg: "#eff6ff",
            buttonSecondaryText: "#2563eb",
            background: "#ffffff",
            text: "#111827",
            fontHeading: "Manrope",
            fontBody: "Manrope",
            radius: "0.5rem",
            buttonRadius: "9999px",
            cardBg: "#ffffff",
            cardRadius: "0.5rem",
            logo: "",
            copyright: "",
            social: {}
        }
    });

    useEffect(() => {
        if (id) fetchTheme();
    }, [id]);

    const fetchTheme = async () => {
        try {
            const res = await api.get(`/page-builder/themes/${id}`);
            if (res.data.success) {
                setTheme(res.data.theme);
                setFormData({
                    name: res.data.theme.name,
                    variables: {
                        ...formData.variables,
                        ...res.data.theme.variables // Merge incase of new schema keys
                    }
                });
            }
        } catch (error) {
            console.error("Failed to fetch theme", error);
            alert("Failed to load theme");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/page-builder/themes/${id}`, formData);
            alert("Theme saved successfully");
            fetchTheme(); // Refresh to ensure sync
        } catch (error) {
            console.error("Failed to save theme", error);
            alert("Failed to save theme");
        } finally {
            setSaving(false);
        }
    };

    const updateVariable = (key, value) => {
        setFormData(prev => ({
            ...prev,
            variables: { ...prev.variables, [key]: value }
        }));
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!theme) return <div className="p-8">Theme not found</div>;

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/storefront/themes" className="text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Theme: {theme.name}</h1>
                        <p className="text-xs text-gray-500">
                            {theme.is_active ? <span className="text-green-600 font-bold">Active Theme</span> : "Inactive"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Form Sidebar */}
                <div className="w-96 bg-white border-r overflow-y-auto p-6 space-y-8">

                    {/* General Details */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">General Details</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Theme Name</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Core Colors</h3>
                        <div className="space-y-4">
                            <ColorInput variableKey="primary" activeKeys={activeToken?.keys} label="Primary Action Color" value={formData.variables.primary} onChange={v => updateVariable("primary", v)} />
                            <ColorInput variableKey="primaryHover" activeKeys={activeToken?.keys} label="Primary Hover" value={formData.variables.primaryHover} onChange={v => updateVariable("primaryHover", v)} />
                            <ColorInput variableKey="primaryContent" activeKeys={activeToken?.keys} label="Text on Primary" value={formData.variables.primaryContent} onChange={v => updateVariable("primaryContent", v)} />
                            <ColorInput variableKey="secondary" activeKeys={activeToken?.keys} label="Secondary Elements" value={formData.variables.secondary} onChange={v => updateVariable("secondary", v)} />
                            <ColorInput variableKey="accent" activeKeys={activeToken?.keys} label="Accent / Badges" value={formData.variables.accent} onChange={v => updateVariable("accent", v)} />
                            <ColorInput variableKey="background" activeKeys={activeToken?.keys} label="Site Background" value={formData.variables.background} onChange={v => updateVariable("background", v)} />
                            <ColorInput variableKey="text" activeKeys={activeToken?.keys} label="Main Text Color" value={formData.variables.text} onChange={v => updateVariable("text", v)} />
                        </div>
                    </div>

                    {/* Accent Soft */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Soft Components</h3>
                        <div className="space-y-4">
                            <ColorInput variableKey="accentSoft" activeKeys={activeToken?.keys} label="Soft Background" value={formData.variables.accentSoft} onChange={v => updateVariable("accentSoft", v)} />
                            <ColorInput variableKey="accentContent" activeKeys={activeToken?.keys} label="Soft Content (Text/Icons)" value={formData.variables.accentContent} onChange={v => updateVariable("accentContent", v)} />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Button Variations</h3>
                        <div className="space-y-4">
                            <ColorInput variableKey="buttonPrimaryBg" activeKeys={activeToken?.keys} label="Primary Button Background (Main Actions)" value={formData.variables.buttonPrimaryBg} onChange={v => updateVariable("buttonPrimaryBg", v)} />
                            <ColorInput variableKey="buttonPrimaryText" activeKeys={activeToken?.keys} label="Primary Button Text" value={formData.variables.buttonPrimaryText} onChange={v => updateVariable("buttonPrimaryText", v)} />
                            <ColorInput variableKey="buttonSecondaryBg" activeKeys={activeToken?.keys} label="Secondary Button Background (Widgets)" value={formData.variables.buttonSecondaryBg} onChange={v => updateVariable("buttonSecondaryBg", v)} />
                            <ColorInput variableKey="buttonSecondaryText" activeKeys={activeToken?.keys} label="Secondary Button Text" value={formData.variables.buttonSecondaryText} onChange={v => updateVariable("buttonSecondaryText", v)} />
                        </div>
                    </div>

                    {/* Typography */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Typography</h3>
                        <div className="space-y-4">
                            <SelectInput
                                variableKey="fontHeading"
                                activeKeys={activeToken?.keys}
                                label="Heading Font"
                                value={formData.variables.fontHeading}
                                onChange={v => updateVariable("fontHeading", v)}
                                options={[
                                    { label: 'Inter', value: 'Inter' },
                                    { label: 'Roboto', value: 'Roboto' },
                                    { label: 'Open Sans', value: 'Open Sans' },
                                    { label: 'Playfair Display', value: 'Playfair Display' },
                                    { label: 'Montserrat', value: 'Montserrat' },
                                    { label: 'Manrope', value: 'Manrope' },
                                ]}
                            />
                            <SelectInput
                                variableKey="fontBody"
                                activeKeys={activeToken?.keys}
                                label="Body Font"
                                value={formData.variables.fontBody}
                                onChange={v => updateVariable("fontBody", v)}
                                options={[
                                    { label: 'Inter', value: 'Inter' },
                                    { label: 'Roboto', value: 'Roboto' },
                                    { label: 'Open Sans', value: 'Open Sans' },
                                    { label: 'Lato', value: 'Lato' },
                                    { label: 'Manrope', value: 'Manrope' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Layout */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Global Layout</h3>
                        <div className="space-y-4">
                            <SelectInput
                                variableKey="radius"
                                activeKeys={activeToken?.keys}
                                label="Global Border Radius"
                                value={formData.variables.radius}
                                onChange={v => updateVariable("radius", v)}
                                options={[
                                    { label: 'Sharp (0)', value: '0px' },
                                    { label: 'Small (0.25rem)', value: '0.25rem' },
                                    { label: 'Medium (0.5rem)', value: '0.5rem' },
                                    { label: 'Large (1rem)', value: '1rem' },
                                    { label: 'Full (9999px)', value: '9999px' },
                                ]}
                            />
                            <SelectInput
                                variableKey="buttonRadius"
                                activeKeys={activeToken?.keys}
                                label="Buttons Radius"
                                value={formData.variables.buttonRadius}
                                onChange={v => updateVariable("buttonRadius", v)}
                                options={[
                                    { label: 'Sharp (0)', value: '0px' },
                                    { label: 'Small (0.25rem)', value: '0.25rem' },
                                    { label: 'Medium (0.5rem)', value: '0.5rem' },
                                    { label: 'Large (1rem)', value: '1rem' },
                                    { label: 'Full Pill (9999px)', value: '9999px' },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Cards */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Cards & Containers</h3>
                        <div className="space-y-4">
                            <ColorInput variableKey="cardBg" activeKeys={activeToken?.keys} label="Card Background" value={formData.variables.cardBg} onChange={v => updateVariable("cardBg", v)} />
                            <SelectInput
                                variableKey="cardRadius"
                                activeKeys={activeToken?.keys}
                                label="Card Radius"
                                value={formData.variables.cardRadius}
                                onChange={v => updateVariable("cardRadius", v)}
                                options={[
                                    { label: 'Sharp (0)', value: '0px' },
                                    { label: 'Small (0.25rem)', value: '0.25rem' },
                                    { label: 'Medium (0.5rem)', value: '0.5rem' },
                                    { label: 'Large (1rem)', value: '1rem' },
                                    { label: 'Extra Large (1.5rem)', value: '1.5rem' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-gray-100 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-5xl mx-auto space-y-4">
                        {/* Toolbar: Device Switcher + Inspector Toggle */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    Live Storefront Preview
                                </h2>
                                <p className="text-xs text-gray-500">Hover any component to see the exact theme token and configuration controlling it in the sidebar.</p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Token Inspector Toggle */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInspectorEnabled(!inspectorEnabled);
                                        setActiveToken(null);
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                        inspectorEnabled
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${inspectorEnabled ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`} />
                                    {inspectorEnabled ? 'Token Inspector ON' : 'Token Inspector OFF'}
                                </button>

                                {/* Device Mode Switcher */}
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewDevice('desktop')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${previewDevice === 'desktop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        <Monitor className="w-3.5 h-3.5" /> Desktop
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewDevice('tablet')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${previewDevice === 'tablet' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        <Tablet className="w-3.5 h-3.5" /> Tablet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewDevice('mobile')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${previewDevice === 'mobile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Inspector HUD Status Bar */}
                        {inspectorEnabled && (
                            <div className="transition-all duration-200">
                                {activeToken ? (
                                    <div className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-black uppercase tracking-wider text-[10px] bg-white/20 px-2 py-0.5 rounded-md">
                                                Inspecting
                                            </span>
                                            <span className="font-bold text-white text-sm">{activeToken.name}</span>
                                            <span className="text-blue-100 hidden md:inline">→ Active in sidebar:</span>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {activeToken.tokens.map((t, idx) => (
                                                    <span key={idx} className="bg-white/15 px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 shadow-xs">
                                                        {t.isColor && <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/50 shrink-0" style={{ backgroundColor: t.val }} />}
                                                        <span className="text-blue-200">{t.key}:</span>
                                                        <span className="font-bold text-white">{t.val}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-medium text-blue-200 shrink-0">
                                            Highlighted in left sidebar ←
                                        </span>
                                    </div>
                                ) : (
                                    <div className="bg-white text-gray-500 px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-dashed border-gray-200 shadow-xs">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span>Hover over any container, button, price, or text below to highlight its controls in the sidebar in real time.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Storefront Canvas Specs Bar */}
                        <div className="flex items-center justify-between px-2 text-xs text-gray-500">
                            <Inspectable
                                name="Storefront Canvas & Background"
                                tokens={[
                                    { key: 'background', val: formData.variables.background || '#ffffff', isColor: true },
                                    { key: 'text', val: formData.variables.text || '#111827', isColor: true },
                                    { key: 'fontBody', val: formData.variables.fontBody || 'Inter' }
                                ]}
                                inspectorEnabled={inspectorEnabled}
                                activeToken={activeToken}
                                setActiveToken={setActiveToken}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border shadow-xs hover:border-blue-400 transition cursor-pointer"
                            >
                                <span className="w-3 h-3 rounded border" style={{ backgroundColor: formData.variables.background || '#ffffff' }} />
                                <span className="font-semibold text-gray-700">Canvas Base:</span>
                                <span className="font-mono text-gray-500">{formData.variables.background || '#ffffff'}</span>
                                <span className="text-gray-300">•</span>
                                <span className="font-mono text-gray-500">Body: {formData.variables.fontBody || 'Inter'}</span>
                            </Inspectable>
                        </div>

                        {/* Simulated Storefront Container */}
                        <div className="flex justify-center">
                            <div
                                className="w-full bg-white border border-gray-200 shadow-xl overflow-hidden transition-all duration-300 rounded-[1.25rem]"
                                style={{
                                    maxWidth: previewDevice === 'mobile' ? '390px' : previewDevice === 'tablet' ? '768px' : '100%',
                                    backgroundColor: formData.variables.background || '#ffffff',
                                    color: formData.variables.text || '#111827',
                                    fontFamily: formData.variables.fontBody || 'Inter, sans-serif'
                                }}
                            >
                                {/* 1. Storefront Mini Header */}
                                <div
                                    className="px-6 py-3.5 border-b flex items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md bg-white/95"
                                    style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                                >
                                    {/* Logo & Name */}
                                    <Inspectable
                                        name="Header Brand & Logo"
                                        tokens={[
                                            { key: 'primary', val: formData.variables.primary || '#2563eb', isColor: true },
                                            { key: 'fontHeading', val: formData.variables.fontHeading || 'Manrope' }
                                        ]}
                                        inspectorEnabled={inspectorEnabled}
                                        activeToken={activeToken}
                                        setActiveToken={setActiveToken}
                                        className="flex items-center gap-2"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm pointer-events-none"
                                            style={{ backgroundColor: formData.variables.primary || '#2563eb' }}
                                        >
                                            <ShoppingBag className="w-4 h-4" />
                                        </div>
                                        <span
                                            className="font-bold text-base tracking-tight pointer-events-none"
                                            style={{ fontFamily: formData.variables.fontHeading || 'Manrope, sans-serif' }}
                                        >
                                            {formData.name || 'Storefront'}
                                        </span>
                                    </Inspectable>

                                    {/* Search input */}
                                    {previewDevice !== 'mobile' && (
                                        <Inspectable
                                            name="Search Input"
                                            tokens={[
                                                { key: 'buttonRadius', val: formData.variables.buttonRadius || '9999px' }
                                            ]}
                                            inspectorEnabled={inspectorEnabled}
                                            activeToken={activeToken}
                                            setActiveToken={setActiveToken}
                                            className="flex-1 max-w-xs relative"
                                        >
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                readOnly
                                                placeholder="Search products..."
                                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none pointer-events-none"
                                                style={{ borderRadius: formData.variables.buttonRadius || '9999px' }}
                                            />
                                        </Inspectable>
                                    )}

                                    {/* Header Action Badges */}
                                    <div className="flex items-center gap-2.5">
                                        <Inspectable
                                            name="Wishlist Badge"
                                            tokens={[
                                                { key: 'accent', val: formData.variables.accent || '#facc15', isColor: true }
                                            ]}
                                            inspectorEnabled={inspectorEnabled}
                                            activeToken={activeToken}
                                            setActiveToken={setActiveToken}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition relative"
                                            style={{ borderRadius: '9999px' }}
                                        >
                                            <Heart className="w-4 h-4 pointer-events-none" />
                                            <span
                                                className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center text-white pointer-events-none"
                                                style={{ backgroundColor: formData.variables.accent || '#facc15' }}
                                            >
                                                2
                                            </span>
                                        </Inspectable>

                                        <Inspectable
                                            name="Cart Action Button"
                                            tokens={[
                                                { key: 'buttonPrimaryBg', val: formData.variables.buttonPrimaryBg || formData.variables.primary, isColor: true },
                                                { key: 'buttonPrimaryText', val: formData.variables.buttonPrimaryText || '#ffffff', isColor: true },
                                                { key: 'buttonRadius', val: formData.variables.buttonRadius || '9999px' }
                                            ]}
                                            inspectorEnabled={inspectorEnabled}
                                            activeToken={activeToken}
                                            setActiveToken={setActiveToken}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition"
                                            style={{
                                                backgroundColor: formData.variables.buttonPrimaryBg || formData.variables.primary || '#2563eb',
                                                color: formData.variables.buttonPrimaryText || '#ffffff',
                                                borderRadius: formData.variables.buttonRadius || '9999px'
                                            }}
                                        >
                                            <ShoppingCart className="w-4 h-4 pointer-events-none" />
                                        </Inspectable>
                                    </div>
                                </div>

                                {/* 2. Storefront Hero Banner */}
                                <div className="p-6 sm:p-8 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                    <Inspectable
                                        name="Hero Banner Card"
                                        tokens={[
                                            { key: 'accentSoft', val: formData.variables.accentSoft || 'rgba(37,99,235,0.06)', isColor: true },
                                            { key: 'cardRadius', val: formData.variables.cardRadius || formData.variables.radius || '1rem' }
                                        ]}
                                        inspectorEnabled={inspectorEnabled}
                                        activeToken={activeToken}
                                        setActiveToken={setActiveToken}
                                        className="relative rounded-2xl p-6 sm:p-10 overflow-hidden shadow-sm flex flex-col justify-center text-center space-y-4"
                                        style={{
                                            backgroundColor: formData.variables.accentSoft || 'rgba(37,99,235,0.06)',
                                            borderRadius: formData.variables.cardRadius || formData.variables.radius || '1rem'
                                        }}
                                    >
                                        <Inspectable
                                            name="Hero Tag Pill"
                                            tokens={[
                                                { key: 'primary', val: formData.variables.primary || '#2563eb', isColor: true }
                                            ]}
                                            inspectorEnabled={inspectorEnabled}
                                            activeToken={activeToken}
                                            setActiveToken={setActiveToken}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mx-auto border"
                                            style={{
                                                backgroundColor: '#ffffff',
                                                color: formData.variables.primary || '#2563eb',
                                                borderColor: 'rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            <Zap className="w-3.5 h-3.5 fill-current pointer-events-none" />
                                            <span className="pointer-events-none">New Season Collection</span>
                                        </Inspectable>

                                        <Inspectable
                                            name="Hero Heading Typography"
                                            tokens={[
                                                { key: 'fontHeading', val: formData.variables.fontHeading || 'Manrope' }
                                            ]}
                                            inspectorEnabled={inspectorEnabled}
                                            activeToken={activeToken}
                                            setActiveToken={setActiveToken}
                                            className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight pointer-events-none"
                                            style={{ fontFamily: formData.variables.fontHeading || 'Manrope, sans-serif' }}
                                        >
                                            Elevate Your Shopping Experience
                                        </Inspectable>

                                        <Inspectable
                                            name="Hero Description Typography"
                                            tokens={[
                                                { key: 'fontBody', val: formData.variables.fontBody || 'Inter' }
                                            ]}
                                            inspectorEnabled={inspectorEnabled}
                                            activeToken={activeToken}
                                            setActiveToken={setActiveToken}
                                            className="max-w-lg mx-auto text-xs sm:text-sm opacity-80 leading-relaxed pointer-events-none"
                                        >
                                            Curated premium products with real-time currency conversion, verified vendors, and instant chat checkout.
                                        </Inspectable>

                                        <div className="flex flex-wrap gap-3 justify-center pt-2">
                                            <Inspectable
                                                name="Primary Action Button"
                                                tokens={[
                                                    { key: 'buttonPrimaryBg', val: formData.variables.buttonPrimaryBg || formData.variables.primary, isColor: true },
                                                    { key: 'buttonPrimaryText', val: formData.variables.buttonPrimaryText || '#ffffff', isColor: true },
                                                    { key: 'buttonRadius', val: formData.variables.buttonRadius || '9999px' }
                                                ]}
                                                inspectorEnabled={inspectorEnabled}
                                                activeToken={activeToken}
                                                setActiveToken={setActiveToken}
                                                className="px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2 select-none"
                                                style={{
                                                    backgroundColor: formData.variables.buttonPrimaryBg || formData.variables.primary || '#2563eb',
                                                    color: formData.variables.buttonPrimaryText || '#ffffff',
                                                    borderRadius: formData.variables.buttonRadius || '9999px'
                                                }}
                                            >
                                                <ShoppingCart className="w-4 h-4 pointer-events-none" />
                                                <span className="pointer-events-none">Shop Collection</span>
                                            </Inspectable>

                                            <Inspectable
                                                name="Secondary Action Button"
                                                tokens={[
                                                    { key: 'buttonSecondaryBg', val: formData.variables.buttonSecondaryBg || 'rgba(0,0,0,0.04)', isColor: true },
                                                    { key: 'buttonSecondaryText', val: formData.variables.buttonSecondaryText || formData.variables.text || '#111827', isColor: true },
                                                    { key: 'buttonRadius', val: formData.variables.buttonRadius || '9999px' }
                                                ]}
                                                inspectorEnabled={inspectorEnabled}
                                                activeToken={activeToken}
                                                setActiveToken={setActiveToken}
                                                className="px-5 py-2.5 text-xs sm:text-sm font-bold border transition-all hover:bg-white/60 select-none"
                                                style={{
                                                    backgroundColor: formData.variables.buttonSecondaryBg || 'rgba(0,0,0,0.04)',
                                                    color: formData.variables.buttonSecondaryText || formData.variables.text || '#111827',
                                                    borderColor: 'rgba(0,0,0,0.08)',
                                                    borderRadius: formData.variables.buttonRadius || '9999px'
                                                }}
                                            >
                                                <span className="pointer-events-none">Explore Categories</span>
                                            </Inspectable>
                                        </div>
                                    </Inspectable>
                                </div>

                                {/* 3. Authentic Storefront Product Grid Section */}
                                <div className="p-6 sm:p-8 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Inspectable
                                                name="Section Heading"
                                                tokens={[
                                                    { key: 'fontHeading', val: formData.variables.fontHeading || 'Manrope' }
                                                ]}
                                                inspectorEnabled={inspectorEnabled}
                                                activeToken={activeToken}
                                                setActiveToken={setActiveToken}
                                                className="text-xl font-bold tracking-tight"
                                                style={{ fontFamily: formData.variables.fontHeading || 'Manrope, sans-serif' }}
                                            >
                                                Featured Products
                                            </Inspectable>
                                            <p className="text-xs text-gray-500 mt-0.5">Live rendering of storefront product cards</p>
                                        </div>
                                        <Inspectable
                                            name="Section Link Action"
                                            tokens={[
                                                { key: 'primary', val: formData.variables.primary || '#2563eb', isColor: true }
                                            ]}
                                            inspectorEnabled={inspectorEnabled}
                                            activeToken={activeToken}
                                            setActiveToken={setActiveToken}
                                            className="text-xs font-bold hover:underline cursor-pointer"
                                            style={{ color: formData.variables.primary || '#2563eb' }}
                                        >
                                            View All →
                                        </Inspectable>
                                    </div>

                                    {/* Responsive Product Cards Grid */}
                                    <div
                                        className="grid gap-4 sm:gap-6"
                                        style={{
                                            gridTemplateColumns: previewDevice === 'mobile'
                                                ? 'repeat(1, minmax(0, 1fr))'
                                                : previewDevice === 'tablet'
                                                ? 'repeat(2, minmax(0, 1fr))'
                                                : 'repeat(3, minmax(0, 1fr))'
                                        }}
                                    >
                                        {PREVIEW_PRODUCTS.map((product) => (
                                            <Inspectable
                                                key={product.id}
                                                name="Product Card Container"
                                                tokens={[
                                                    { key: 'cardBg', val: formData.variables.cardBg || '#ffffff', isColor: true },
                                                    { key: 'cardRadius', val: formData.variables.cardRadius || formData.variables.radius || '0.75rem' }
                                                ]}
                                                inspectorEnabled={inspectorEnabled}
                                                activeToken={activeToken}
                                                setActiveToken={setActiveToken}
                                                className="group relative border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                                                style={{
                                                    backgroundColor: formData.variables.cardBg || '#ffffff',
                                                    borderColor: 'rgba(0,0,0,0.08)',
                                                    borderRadius: formData.variables.cardRadius || formData.variables.radius || '0.75rem'
                                                }}
                                            >
                                                {/* Image Container */}
                                                <div className="relative aspect-square overflow-hidden bg-gray-100">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                                    />

                                                    {/* Wishlist Heart Overlay Button */}
                                                    <button
                                                        type="button"
                                                        aria-label="Wishlist"
                                                        className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Heart className="w-4 h-4 pointer-events-none" />
                                                    </button>

                                                    {/* Status / Discount Badge Overlay */}
                                                    {product.badge && (
                                                        <Inspectable
                                                            name="Product Badge (Accent)"
                                                            tokens={[
                                                                { key: 'accent', val: formData.variables.accent || '#f59e0b', isColor: true }
                                                            ]}
                                                            inspectorEnabled={inspectorEnabled}
                                                            activeToken={activeToken}
                                                            setActiveToken={setActiveToken}
                                                            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1"
                                                            style={{ backgroundColor: formData.variables.accent || '#f59e0b' }}
                                                        >
                                                            <Sparkles className="w-2.5 h-2.5 pointer-events-none" />
                                                            <span className="pointer-events-none">{product.badge}</span>
                                                        </Inspectable>
                                                    )}

                                                    {/* Delivery Badge */}
                                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-gray-700 shadow-sm flex items-center gap-1 pointer-events-none">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                                        <span>Express</span>
                                                    </div>
                                                </div>

                                                {/* Card Content */}
                                                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                                                    <div className="space-y-1.5">
                                                        {/* Verified Vendor Tag */}
                                                        <div className="flex">
                                                            <Inspectable
                                                                name="Vendor Tag (Soft Accent)"
                                                                tokens={[
                                                                    { key: 'accentSoft', val: formData.variables.accentSoft || 'rgba(37,99,235,0.06)', isColor: true },
                                                                    { key: 'accentContent', val: formData.variables.accentContent || formData.variables.primary || '#2563eb', isColor: true }
                                                                ]}
                                                                inspectorEnabled={inspectorEnabled}
                                                                activeToken={activeToken}
                                                                setActiveToken={setActiveToken}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] leading-relaxed border"
                                                                style={{
                                                                    backgroundColor: formData.variables.accentSoft || 'rgba(37,99,235,0.06)',
                                                                    color: formData.variables.accentContent || formData.variables.primary || '#2563eb',
                                                                    borderColor: 'rgba(37,99,235,0.1)'
                                                                }}
                                                            >
                                                                <span className="pointer-events-none">{product.vendor}</span>
                                                                <Check className="w-3 h-3 text-blue-600 stroke-[3] pointer-events-none" />
                                                            </Inspectable>
                                                        </div>

                                                        {/* Product Title */}
                                                        <Inspectable
                                                            name="Product Title Typography"
                                                            tokens={[
                                                                { key: 'fontHeading', val: formData.variables.fontHeading || 'Manrope' }
                                                            ]}
                                                            inspectorEnabled={inspectorEnabled}
                                                            activeToken={activeToken}
                                                            setActiveToken={setActiveToken}
                                                            className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                                                            style={{ fontFamily: formData.variables.fontHeading || 'Manrope, sans-serif' }}
                                                        >
                                                            {product.name}
                                                        </Inspectable>

                                                        {/* Ratings & Social Proof */}
                                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                <span className="font-bold text-gray-800">{product.rating}</span>
                                                                <span className="text-[10px] text-gray-400">({product.reviews})</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" /> {product.views}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Heart className="w-3 h-3" /> {product.likes}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Price & Action Button Bar */}
                                                    <div className="pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                                        <Inspectable
                                                            name="Product Price (Primary)"
                                                            tokens={[
                                                                { key: 'primary', val: formData.variables.primary || '#2563eb', isColor: true }
                                                            ]}
                                                            inspectorEnabled={inspectorEnabled}
                                                            activeToken={activeToken}
                                                            setActiveToken={setActiveToken}
                                                            className="flex flex-col"
                                                        >
                                                            <span
                                                                className="text-base sm:text-lg font-extrabold pointer-events-none"
                                                                style={{ color: formData.variables.primary || '#2563eb' }}
                                                            >
                                                                {product.price}
                                                            </span>
                                                            {product.comparePrice && (
                                                                <span className="text-xs text-gray-400 line-through pointer-events-none">
                                                                    {product.comparePrice}
                                                                </span>
                                                            )}
                                                        </Inspectable>

                                                        {/* Action Buttons: Chat & Add to Cart */}
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                title="Chat with Seller"
                                                                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                                                            >
                                                                <MessageCircle className="w-3.5 h-3.5" />
                                                            </button>

                                                            <Inspectable
                                                                name="Card Add-to-Cart Action"
                                                                tokens={[
                                                                    { key: 'buttonPrimaryBg', val: formData.variables.buttonPrimaryBg || formData.variables.primary, isColor: true },
                                                                    { key: 'buttonPrimaryText', val: formData.variables.buttonPrimaryText || '#ffffff', isColor: true },
                                                                    { key: 'buttonRadius', val: formData.variables.buttonRadius || '9999px' }
                                                                ]}
                                                                inspectorEnabled={inspectorEnabled}
                                                                activeToken={activeToken}
                                                                setActiveToken={setActiveToken}
                                                                className="px-3 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all transform active:scale-95 select-none"
                                                                style={{
                                                                    backgroundColor: formData.variables.buttonPrimaryBg || formData.variables.primary || '#2563eb',
                                                                    color: formData.variables.buttonPrimaryText || '#ffffff',
                                                                    borderRadius: formData.variables.buttonRadius || '9999px'
                                                                }}
                                                            >
                                                                <ShoppingCart className="w-3.5 h-3.5 pointer-events-none" />
                                                                <span className="pointer-events-none">Add</span>
                                                            </Inspectable>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Inspectable>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Fixed Floating Inspector Tooltip (Portal outside overflow containers to avoid clipping) */}
            {inspectorEnabled && activeToken && activeToken.rect && (
                <div
                    className="fixed z-[99999] pointer-events-none select-none flex flex-col items-center transition-all duration-75"
                    style={{
                        top: activeToken.rect.top < 150
                            ? `${activeToken.rect.bottom + 10}px` // flip below if near top
                            : `${activeToken.rect.top - 10}px`,  // default above
                        left: `${Math.max(140, Math.min(typeof window !== 'undefined' ? window.innerWidth - 140 : 500, activeToken.rect.left + (activeToken.rect.width / 2)))}px`,
                        transform: activeToken.rect.top < 150
                            ? 'translate(-50%, 0)'
                            : 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-gray-950/95 text-white text-[11px] px-3.5 py-2.5 rounded-xl shadow-2xl border border-white/20 backdrop-blur-md flex flex-col gap-1.5 min-w-[210px] max-w-sm text-left">
                        <div className="font-bold text-blue-300 flex items-center justify-between border-b border-white/15 pb-1 gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                {activeToken.name}
                            </span>
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Token</span>
                        </div>
                        <div className="space-y-1 pt-0.5">
                            {activeToken.tokens.map((t, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 text-[10px]">
                                    <span className="text-gray-300 font-mono">{t.key}:</span>
                                    <span className="font-bold font-mono text-white flex items-center gap-1.5">
                                        {t.isColor && (
                                            <span className="w-2.5 h-2.5 rounded-full border border-white/40 inline-block shrink-0 shadow-xs" style={{ backgroundColor: t.val }} />
                                        )}
                                        {t.val}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Tooltip Arrow */}
                    <div
                        className={`w-2.5 h-2.5 bg-gray-950 rotate-45 border-white/20 ${
                            activeToken.rect.top < 150
                                ? '-mt-1.5 -order-1 border-l border-t'
                                : '-mt-1.5 border-r border-b'
                        }`}
                    />
                </div>
            )}
        </div>
    );
}

function ColorInput({ label, value, onChange, variableKey, activeKeys = [] }) {
    const isActive = variableKey && activeKeys?.includes(variableKey);

    return (
        <div
            id={variableKey ? `field-${variableKey}` : undefined}
            className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/70 border-2 border-blue-500 shadow-md ring-4 ring-blue-500/20 border-l-4 border-l-blue-600 scale-[1.01]'
                    : 'border border-gray-100 hover:border-gray-200 bg-gray-50/40'
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {isActive && <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />}
                    <label className={`text-xs font-semibold ${isActive ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                        {label}
                    </label>
                </div>
                {isActive && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider text-blue-700 bg-white border border-blue-300 px-2 py-0.5 rounded-full shadow-xs animate-pulse uppercase">
                        ⚡ Active
                    </span>
                )}
            </div>
            <div className="flex gap-2 items-center">
                <input
                    type="color"
                    className="h-9 w-12 p-0.5 border border-gray-300 rounded-lg cursor-pointer bg-white"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
                <input
                    type="text"
                    className={`flex-1 px-3 py-1.5 border rounded-lg text-xs font-mono uppercase transition-all ${
                        isActive ? 'border-blue-500 bg-white ring-2 ring-blue-500/30 font-bold text-blue-900' : 'border-gray-200 bg-white text-gray-800'
                    }`}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}

function SelectInput({ label, value, onChange, options, variableKey, activeKeys = [] }) {
    const isActive = variableKey && activeKeys?.includes(variableKey);

    return (
        <div
            id={variableKey ? `field-${variableKey}` : undefined}
            className={`p-3 rounded-xl transition-all duration-200 ${
                isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/70 border-2 border-blue-500 shadow-md ring-4 ring-blue-500/20 border-l-4 border-l-blue-600 scale-[1.01]'
                    : 'border border-gray-100 hover:border-gray-200 bg-gray-50/40'
            }`}
        >
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    {isActive && <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />}
                    <label className={`text-xs font-semibold ${isActive ? 'text-blue-900 font-bold' : 'text-gray-700'}`}>
                        {label}
                    </label>
                </div>
                {isActive && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider text-blue-700 bg-white border border-blue-300 px-2 py-0.5 rounded-full shadow-xs animate-pulse uppercase">
                        ⚡ Active
                    </span>
                )}
            </div>
            <select
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white transition-all ${
                    isActive ? 'border-blue-500 ring-2 ring-blue-500/30 font-bold text-blue-950' : 'border-gray-200 text-gray-800'
                }`}
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}
