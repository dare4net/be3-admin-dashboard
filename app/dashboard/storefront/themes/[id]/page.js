"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { ArrowLeft, Check, Save } from "lucide-react";
import Link from "next/link";

export default function ThemeEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

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
                            <ColorInput label="Primary Action Color" value={formData.variables.primary} onChange={v => updateVariable("primary", v)} />
                            <ColorInput label="Primary Hover" value={formData.variables.primaryHover} onChange={v => updateVariable("primaryHover", v)} />
                            <ColorInput label="Text on Primary" value={formData.variables.primaryContent} onChange={v => updateVariable("primaryContent", v)} />
                            <ColorInput label="Secondary Elements" value={formData.variables.secondary} onChange={v => updateVariable("secondary", v)} />
                            <ColorInput label="Accent / Badges" value={formData.variables.accent} onChange={v => updateVariable("accent", v)} />
                            <ColorInput label="Site Background" value={formData.variables.background} onChange={v => updateVariable("background", v)} />
                            <ColorInput label="Main Text Color" value={formData.variables.text} onChange={v => updateVariable("text", v)} />
                        </div>
                    </div>

                    {/* Accent Soft */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Soft Components</h3>
                        <div className="space-y-4">
                            <ColorInput label="Soft Background" value={formData.variables.accentSoft} onChange={v => updateVariable("accentSoft", v)} />
                            <ColorInput label="Soft Content (Text/Icons)" value={formData.variables.accentContent} onChange={v => updateVariable("accentContent", v)} />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Button Variations</h3>
                        <div className="space-y-4">
                            <ColorInput label="Primary Button Background (Main Actions)" value={formData.variables.buttonPrimaryBg} onChange={v => updateVariable("buttonPrimaryBg", v)} />
                            <ColorInput label="Primary Button Text" value={formData.variables.buttonPrimaryText} onChange={v => updateVariable("buttonPrimaryText", v)} />
                            <ColorInput label="Secondary Button Background (Widgets)" value={formData.variables.buttonSecondaryBg} onChange={v => updateVariable("buttonSecondaryBg", v)} />
                            <ColorInput label="Secondary Button Text" value={formData.variables.buttonSecondaryText} onChange={v => updateVariable("buttonSecondaryText", v)} />
                        </div>
                    </div>

                    {/* Typography */}
                    <div>
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Typography</h3>
                        <div className="space-y-4">
                            <SelectInput
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
                            <ColorInput label="Card Background" value={formData.variables.cardBg} onChange={v => updateVariable("cardBg", v)} />
                            <SelectInput
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
                <div className="flex-1 bg-gray-50 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-500">Live Preview</h2>
                            <span className="text-sm text-gray-400">Component examples utilizing theme variables</span>
                        </div>

                        {/* Preview Components */}
                        <div
                            className="bg-white rounded-xl shadow-lg border p-8 space-y-12 transition-colors duration-300"
                            style={{
                                backgroundColor: formData.variables.background,
                                color: formData.variables.text,
                                fontFamily: formData.variables.fontBody,
                                borderRadius: formData.variables.radius === '9999px' ? '1rem' : formData.variables.radius // Don't make container circle
                            }}
                        >
                            {/* Hero Section Preview */}
                            <div className="text-center space-y-6 py-8 border-b border-gray-100 pb-12">
                                <h1
                                    className="text-4xl font-extrabold"
                                    style={{ fontFamily: formData.variables.fontHeading }}
                                >
                                    Welcome to Our Store
                                </h1>
                                <p className="max-w-2xl mx-auto text-lg opacity-80">
                                    This is how your typography and colors will look together. We believe in quality and style.
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        className="px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                                        style={{
                                            backgroundColor: formData.variables.buttonPrimaryBg || formData.variables.primary,
                                            color: formData.variables.buttonPrimaryText || formData.variables.primaryContent,
                                            borderRadius: formData.variables.buttonRadius || formData.variables.radius
                                        }}
                                    >
                                        Primary Add to Cart
                                    </button>
                                    <button
                                        className="px-6 py-3 font-semibold transition-opacity hover:opacity-90"
                                        style={{
                                            backgroundColor: formData.variables.buttonSecondaryBg || formData.variables.accentSoft,
                                            color: formData.variables.buttonSecondaryText || formData.variables.accentContent,
                                            borderRadius: formData.variables.buttonRadius || formData.variables.radius
                                        }}
                                    >
                                        Secondary Add to Cart
                                    </button>
                                </div>
                            </div>

                            {/* Product Card Preview */}
                            <div>
                                <h3
                                    className="text-2xl font-bold mb-6"
                                    style={{ fontFamily: formData.variables.fontHeading }}
                                >
                                    Product Card Preview
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="border overflow-hidden group shadow-sm"
                                            style={{
                                                borderColor: 'rgba(0,0,0,0.05)',
                                                borderRadius: formData.variables.cardRadius || formData.variables.radius,
                                                backgroundColor: formData.variables.cardBg
                                            }}
                                        >
                                            <div className="h-48 bg-gray-100 relative">
                                                <div className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded-sm"
                                                    style={{ backgroundColor: formData.variables.accent }}>
                                                    SALE
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                <div className="text-sm opacity-60">Category</div>
                                                <h4 className="font-bold text-lg" style={{ fontFamily: formData.variables.fontHeading }}>Sample Product {i}</h4>
                                                <div className="font-bold" style={{ color: formData.variables.primary }}>$99.00</div>
                                                <button
                                                    className="w-full py-2 mt-2 text-sm font-medium transition-colors"
                                                    style={{
                                                        backgroundColor: formData.variables.buttonSecondaryBg || formData.variables.accentSoft,
                                                        color: formData.variables.buttonSecondaryText || formData.variables.accentContent,
                                                        borderRadius: formData.variables.buttonRadius || formData.variables.radius
                                                    }}
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorInput({ label, value, onChange }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div className="flex gap-2">
                <input
                    type="color"
                    className="h-10 w-12 p-1 border rounded cursor-pointer"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
                <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm uppercase"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}

function SelectInput({ label, value, onChange, options }) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
            <select
                className="w-full px-3 py-2 border rounded-lg bg-white"
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
