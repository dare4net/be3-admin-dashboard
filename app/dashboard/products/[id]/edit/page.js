"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
    Star, X, Folder, ChevronRight, ArrowLeft, Image as ImageIcon,
    ChevronDown, ChevronUp, Loader2, Plus, Tag, Globe, Settings, BarChart3, Check
} from "lucide-react";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";

import VariantManager from "@/components/products/VariantManager";
import PremiumImageUpload from "@/components/ui/PremiumImageUpload";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // 'info' or 'variants'

    // Workflow State
    const [step, setStep] = useState('form');
    const [currentParentId, setCurrentParentId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        attributes: true,
        seo: false,
        tags: false
    });

    const [formData, setFormData] = useState({
        name: "", description: "", sku: "", price: "",
        status: "draft", is_featured: false, category_ids: [],
        tags: [], handle: "", image_url: "", attributes: {},
        meta_description: "", og_title: "", og_description: "",
        og_image: "", og_type: "product", twitter_card: "summary_large_image",
        twitter_title: "", twitter_description: "", twitter_image: "",
        canonical_url: "", robots: "index,follow", structured_data: null,
        parent_id: null, is_variant: false, variant_label: ""
    });
    const [tagInput, setTagInput] = useState("");
    const [availableAttributes, setAvailableAttributes] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [catRes, prodRes] = await Promise.all([
                api.get('/products/categories/all'),
                api.get(`/products/${productId}`)
            ]);

            if (catRes.data.success) setCategories(catRes.data.categories);

            if (prodRes.data.success) {
                const product = prodRes.data.product;
                const productCats = product.categories || [];
                const primaryCatId = productCats.length > 0 ? productCats[0].id : null;

                setFormData({
                    name: product.name, description: product.description || "",
                    sku: product.sku, price: product.price, status: product.status || 'draft',
                    is_featured: !!product.is_featured, category_ids: primaryCatId ? [primaryCatId] : [],
                    tags: product.tags || [], handle: product.handle || "",
                    image_url: product.image_url || "", attributes: product.attributes || {},
                    meta_description: product.meta_description || "", og_title: product.og_title || "",
                    og_description: product.og_description || "", og_image: product.og_image || "",
                    og_type: product.og_type || "product", twitter_card: product.twitter_card || "summary_large_image",
                    twitter_title: product.twitter_title || "", twitter_description: product.twitter_description || "",
                    twitter_image: product.twitter_image || "", canonical_url: product.canonical_url || "",
                    robots: product.robots || "index,follow", structured_data: product.structured_data || null,
                    parent_id: product.parent_id, is_variant: product.is_variant, variant_label: product.variant_label || ""
                });

                if (primaryCatId && catRes.data.categories) {
                    const cat = catRes.data.categories.find(c => c.id === primaryCatId);
                    if (cat) setSelectedCategory(cat);
                }
            }
        } catch (error) {
            console.error('Failed to fetch initial data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAttributes = async () => {
            if (!selectedCategory) {
                setAvailableAttributes([]);
                return;
            }
            try {
                const res = await api.get(`/products/categories/${selectedCategory.id}/admin`);
                if (res.data.category && res.data.category.attributes) {
                    setAvailableAttributes(res.data.category.attributes.filter(a => !a.is_ignored));
                }
            } catch (error) {
                console.error("Failed to fetch attributes", error);
            }
        };

        if (step === 'form' && selectedCategory) {
            fetchAttributes();
        }
    }, [step, selectedCategory]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const hasChildren = (catId) => {
        return categories.some(c => c.parent_id === catId);
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        setFormData(prev => ({ ...prev, category_ids: [category.id] }));
        setStep('form');
    };

    const handleCategoryClick = (category) => {
        if (hasChildren(category.id)) {
            setCurrentParentId(category.id);
        } else {
            handleSelectCategory(category);
        }
    };

    const generateSKU = (name) => {
        const prefix = name ? name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'PRD';
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `${prefix}-${random}`;
    };

    const handleReturn = () => {
        router.push("/dashboard/products");
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/products/${productId}`, {
                ...formData,
                price: parseFloat(formData.price),
            });
            handleReturn();
        } catch (err) {
            alert('Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    const addTag = () => {
        const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t && !formData.tags.includes(t));
        if (newTags.length > 0) setFormData(prev => ({ ...prev, tags: [...prev.tags, ...newTags] }));
        setTagInput("");
    };

    const removeTag = (tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    const handleTagKeyDown = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] grayscale opacity-50">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Product Catalog...</p>
            </div>
        );
    }

    if (step === 'category_selection') {
        const currentOptions = categories.filter(c => currentParentId === null ? !c.parent_id : c.parent_id === currentParentId);
        const parentCategory = categories.find(c => c.id === currentParentId);

        return (
            <div className="w-full space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Category Selection</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Classification Library</p>
                    </div>
                    <button onClick={() => setStep('form')} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-lg transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-none border border-gray-100 p-6 min-h-[500px] flex flex-col">
                    <div className="flex items-center gap-3 mb-6 text-[10px] font-black uppercase tracking-widest text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
                        <button onClick={() => setCurrentParentId(null)} className={cn("hover:text-blue-600", !currentParentId && "text-blue-600")}>Library Root</button>
                        {parentCategory && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-gray-900">{parentCategory.name}</span>
                            </>
                        )}
                    </div>

                    {currentParentId !== null && (
                        <button onClick={() => setCurrentParentId(categories.find(c => c.id === currentParentId)?.parent_id || null)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 underline">
                            <ArrowLeft className="w-3 h-3" /> Step Up
                        </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentOptions.map(cat => (
                            <div key={cat.id} className="group flex items-center gap-4 bg-white border border-gray-100 rounded-lg p-4 hover:border-blue-500 transition-all shadow-none">
                                <div
                                    onClick={() => handleCategoryClick(cat)}
                                    className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors overflow-hidden cursor-pointer"
                                >
                                    {cat.image_url ? (
                                        <img src={cat.image_url} className="w-full h-full object-cover rounded-lg" alt="" />
                                    ) : <Folder className="w-6 h-6 text-gray-300" />}
                                </div>
                                <div
                                    onClick={() => handleCategoryClick(cat)}
                                    className="flex-1 min-w-0 cursor-pointer"
                                >
                                    <span className="font-black text-sm text-gray-900 block truncate transition-colors uppercase tracking-tight">{cat.name}</span>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                        {hasChildren(cat.id) ? 'Subcategories' : 'Selection'}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectCategory(cat); }}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center shadow-none"
                                        title="Pick this category"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    {hasChildren(cat.id) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat); }}
                                            className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center border border-gray-100"
                                            title="View subcategories"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full pb-24 space-y-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={handleReturn} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900 shadow-sm">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Refine Product</h1>
                        {formData.is_variant && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-black px-1.5 py-0.5 bg-blue-600 text-white rounded uppercase tracking-widest">Configuration</span>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Linking to Parent ID: {formData.parent_id}</p>
                            </div>
                        )}
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Catalog ID: {productId}</p>
                    </div>
                </div>
                <div className="hidden md:flex gap-3">
                    <button onClick={handleReturn} className="px-6 py-2.5 bg-white border border-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Discard</button>
                    <button onClick={handleSubmit} disabled={saving} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none flex items-center gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update Catalog
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-8 border-b border-gray-100 mb-8 pl-2">
                <button
                    onClick={() => setActiveTab('info')}
                    className={cn(
                        "pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                        activeTab === 'info' ? "text-blue-600" : "text-gray-300 hover:text-gray-500"
                    )}
                >
                    Management Hub
                    {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />}
                </button>
                {!formData.is_variant && (
                    <button
                        onClick={() => setActiveTab('variants')}
                        className={cn(
                            "pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative",
                            activeTab === 'variants' ? "text-blue-600" : "text-gray-300 hover:text-gray-500"
                        )}
                    >
                        Variation Library
                        {activeTab === 'variants' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />}
                    </button>
                )}
            </div>

            {activeTab === 'variants' ? (
                <VariantManager productId={productId} categoryId={formData.category_ids[0]} />
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Information Section */}
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                        <button type="button" onClick={() => toggleSection('basic')} className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <Settings className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Basic Information</h2>
                            </div>
                            {expandedSections.basic ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                        </button>
                        {expandedSections.basic && (
                            <div className="p-6 pt-0 space-y-6 animate-in slide-in-from-top-2 duration-300 border-t border-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name *</label>
                                        <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Ultra Lightweight Running Shoes" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Price ($) *</label>
                                        <input type="number" step="0.01" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">SKU *</label>
                                        <div className="relative">
                                            <input type="text" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-mono text-gray-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all pr-20"
                                                value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, sku: generateSKU(prev.name) }))}
                                                className="absolute right-2 top-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-md text-[9px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
                                            >
                                                Auto
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility Status</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="draft">Draft (Private)</option>
                                            <option value="active">Active (Live)</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-center gap-3 p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl mt-2">
                                        <input
                                            type="checkbox"
                                            id="is_featured"
                                            className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                        />
                                        <label htmlFor="is_featured" className="text-xs font-black text-gray-900 uppercase tracking-widest cursor-pointer select-none">
                                            Mark as Featured Product
                                            <span className="block text-[9px] font-black text-blue-400 mt-0.5 uppercase tracking-tighter">Showcase this item in featured collections</span>
                                        </label>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <PremiumImageUpload 
                                            label="Product Digital Asset"
                                            value={formData.image_url}
                                            onChange={(url) => setFormData({ ...formData, image_url: url })}
                                            folder="products"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                                        <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm leading-relaxed focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="detailed dimensions, materials, or features..." />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attributes Section */}
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <Folder className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Attributes</h2>
                        </div>

                        {selectedCategory ? (
                            <div className="flex items-center justify-between p-5 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg shadow-none border border-blue-50 flex items-center justify-center overflow-hidden">
                                        {selectedCategory.image_url ? <img src={selectedCategory.image_url} className="w-full h-full object-cover rounded-lg" /> : <Folder className="w-6 h-6 text-blue-300" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{selectedCategory.name}</p>
                                        <div className="flex items-center gap-1.5 opacity-50 mt-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Library Slug: </span>
                                            <code className="text-[9px] font-black uppercase tracking-widest font-mono text-blue-600">{selectedCategory.slug}</code>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setStep('category_selection')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest underline underline-offset-4">Change Category</button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setStep('category_selection')} className="w-full py-10 border-2 border-dashed border-gray-100 rounded-lg text-gray-300 flex flex-col items-center gap-3 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/30 transition-all">
                                <Plus className="w-8 h-8" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Assign Category</span>
                            </button>
                        )}

                        {/* Dynamic Attributes */}
                        {selectedCategory && (availableAttributes.length > 0) && (
                            <div className="pt-6 border-t border-gray-50 space-y-6">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="w-5 h-5 text-gray-400" />
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Category Fields</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {availableAttributes.map(attr => (
                                        <div key={attr.code} className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                {attr.label}
                                                {attr.is_required && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                            </label>

                                            {attr.type === 'text' && (
                                                <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none"
                                                    value={formData.attributes[attr.code] || ''} onChange={(e) => setFormData(p => ({ ...p, attributes: { ...p.attributes, [attr.code]: e.target.value } }))} required={attr.is_required} />
                                            )}

                                            {attr.type === 'number' && (
                                                <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none"
                                                    value={formData.attributes[attr.code] || ''} onChange={(e) => setFormData(p => ({ ...p, attributes: { ...p.attributes, [attr.code]: e.target.value } }))} required={attr.is_required} />
                                            )}

                                            {(attr.type === 'select' || attr.type === 'boolean') && (
                                                <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none"
                                                    value={formData.attributes[attr.code] || ''} onChange={(e) => setFormData(p => ({ ...p, attributes: { ...p.attributes, [attr.code]: e.target.value } }))} required={attr.is_required}>
                                                    <option value="">Select Option...</option>
                                                    {attr.type === 'boolean' ? (
                                                        <>
                                                            <option value="true">Yes</option>
                                                            <option value="false">No</option>
                                                        </>
                                                    ) : (
                                                        attr.options?.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)
                                                    )}
                                                </select>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags Section */}
                    <div className="bg-white rounded-2xl shadow-none border border-gray-100 overflow-hidden">
                        <button type="button" onClick={() => toggleSection('tags')} className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <Tag className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Keywords & Tags</h2>
                            </div>
                            {expandedSections.tags ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                        </button>
                        {expandedSections.tags && (
                            <div className="p-6 pt-0 space-y-6 border-t border-gray-50 pt-6">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Add New Keywords</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="e.g. summer, trending, premium..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                        />
                                        <button
                                            type="button"
                                            onClick={addTag}
                                            className="px-6 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all font-black"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-full group hover:bg-blue-100 transition-all">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{tag}</span>
                                            <button type="button" onClick={() => removeTag(tag)} className="text-blue-300 hover:text-blue-600 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.tags.length === 0 && (
                                        <div className="w-full py-8 border border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center grayscale opacity-30">
                                            <Tag className="w-6 h-6 mb-2" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">No tags defined for this listing</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SEO Section */}
                    <div className="bg-white rounded-2xl shadow-none border border-gray-100 overflow-hidden">
                        <button type="button" onClick={() => toggleSection('seo')} className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-blue-600" />
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Search Engine Optimization (SEO)</h2>
                            </div>
                            {expandedSections.seo ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                        </button>
                        {expandedSections.seo && (
                            <div className="p-6 pt-0 space-y-6 border-t border-gray-50 pt-6">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">URL Context Slug</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                        <span className="text-[10px] font-mono font-black text-gray-400 uppercase">/catalog/</span>
                                        <input type="text" className="flex-1 bg-transparent font-mono text-sm text-blue-600 outline-none"
                                            value={formData.handle} onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                                    </div>
                                </div>
                                <SEOMetaEditor page={formData} onChange={(updated) => setFormData(updated)} />
                            </div>
                        )}
                    </div>

                    {/* Mobile Floating Action Bar */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3 z-50">
                        <button type="button" onClick={() => router.back()} className="flex-1 py-4 bg-white border border-gray-200 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                        <button type="submit" onClick={handleSubmit} disabled={saving} className="flex-[2] py-4 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none">Update Listing</button>
                    </div>

                    <div className="hidden md:flex justify-end gap-4 pt-8">
                        <button onClick={handleReturn} className="px-8 py-3 bg-white border border-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Discard Changes</button>
                        <button onClick={handleSubmit} disabled={saving} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none flex items-center justify-center gap-2">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Commit Updates
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
