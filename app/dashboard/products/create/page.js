"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Star, X, Folder, ChevronRight, ArrowLeft, Image as ImageIcon, ChevronDown, ChevronUp, Loader2, Plus, Check } from "lucide-react";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";

export default function CreateProductPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);

    // Workflow State
    const [step, setStep] = useState('category_selection'); // 'category_selection' | 'form'
    const [currentParentId, setCurrentParentId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Collapsible sections state
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        attributes: true,
        seo: false,
        tags: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        price: "",
        status: "draft",
        is_featured: false,
        category_ids: [],
        tags: [],
        handle: "",
        image_url: "",
        attributes: {}, // { code: value }
        meta_description: "",
        og_title: "",
        og_description: "",
        og_image: "",
        og_type: "product",
        twitter_card: "summary_large_image",
        twitter_title: "",
        twitter_description: "",
        twitter_image: "",
        canonical_url: "",
        robots: "index,follow",
        structured_data: null
    });
    const [tagInput, setTagInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [availableAttributes, setAvailableAttributes] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch attributes when category is selected (Step 2)
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

    const hasChildren = (catId) => {
        return categories.some(c => c.parent_id === catId);
    };

    const getChildren = (parentId) => {
        return categories.filter(c =>
            parentId === null ? !c.parent_id : c.parent_id === parentId
        );
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

    const handleBackUp = () => {
        if (currentParentId === null) return;
        const current = categories.find(c => c.id === currentParentId);
        setCurrentParentId(current ? (current.parent_id || null) : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/products", {
                ...formData,
                price: parseFloat(formData.price),
            });
            router.push("/dashboard/products");
        } catch (err) {
            console.error("Failed to create product", err);
            alert(`Failed to create product: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (name) => {
        const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        setFormData(prev => ({
            ...prev,
            name,
            handle: prev.handle || handle,
            og_title: prev.og_title || name
        }));
    };

    const handleAttributeChange = (code, value) => {
        setFormData(prev => ({
            ...prev,
            attributes: {
                ...prev.attributes,
                [code]: value
            }
        }));
    };

    const addTag = () => {
        const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t && !formData.tags.includes(t));
        if (newTags.length > 0) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, ...newTags] }));
        }
        setTagInput("");
    };
    const removeTag = (tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    const handleTagKeyDown = (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } };

    // ------------------------------------------------------------------
    // RENDER: STEP 1 - CATEGORY SELECTION
    // ------------------------------------------------------------------
    if (step === 'category_selection') {
        const currentOptions = getChildren(currentParentId);
        const parentCategory = categories.find(c => c.id === currentParentId);

        return (
            <div className="w-full space-y-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-gray-900">Category Selection</h1>
                    <p className="text-sm text-gray-500">Pick a category for your product. Any level can be selected.</p>
                </div>

                <div className="bg-white rounded-lg shadow-none border border-gray-100 p-6 min-h-[400px]">
                    <div className="flex items-center gap-2 mb-6 text-sm overflow-x-auto whitespace-nowrap pb-2">
                        <button
                            onClick={() => setCurrentParentId(null)}
                            className={cn("hover:text-blue-600 transition", currentParentId === null ? 'font-black text-gray-900' : 'text-gray-400 font-medium')}
                        >
                            All Categories
                        </button>
                        {parentCategory && (
                            <>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <span className="font-black text-gray-900">{parentCategory.name}</span>
                            </>
                        )}
                    </div>

                    {currentParentId !== null && (
                        <button onClick={handleBackUp} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mb-6 uppercase tracking-widest">
                            <ArrowLeft className="w-4 h-4" /> Go Back
                        </button>
                    )}

                    <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                        {currentOptions.map(cat => (
                            <div
                                key={cat.id}
                                className="group flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-500 transition-all shadow-none"
                            >
                                <div
                                    onClick={() => handleCategoryClick(cat)}
                                    className="w-12 h-12 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors cursor-pointer"
                                >
                                    {cat.image_url ? (
                                        <img src={cat.image_url} className="w-full h-full object-cover rounded-lg" alt="" />
                                    ) : (
                                        <Folder className="w-6 h-6" />
                                    )}
                                </div>

                                <div
                                    onClick={() => handleCategoryClick(cat)}
                                    className="flex-1 min-w-0 cursor-pointer"
                                >
                                    <span className="font-black text-sm text-gray-900 block truncate leading-tight transition-colors">{cat.name}</span>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        {hasChildren(cat.id) ? 'Subcategories' : 'Direct Selection'}
                                    </p>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectCategory(cat); }}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center shadow-none"
                                        title="Select this category"
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

    // ------------------------------------------------------------------
    // RENDER: STEP 2 - PRODUCT FORM
    // ------------------------------------------------------------------
    return (
        <div className="w-full pb-24 space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Create Product</h1>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-blue-600 px-2 py-0.5 bg-blue-50 rounded border border-blue-100">{selectedCategory?.name}</span>
                        <button onClick={() => setStep('category_selection')} className="text-gray-400 hover:text-blue-600 underline">Change</button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2 text-gray-400 hover:text-gray-900 bg-white border border-gray-100 rounded-lg transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Information Section */}
                <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('basic')}
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
                    >
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Basic Information</h2>
                        {expandedSections.basic ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {expandedSections.basic && (
                        <div className="p-5 pt-0 space-y-5 border-t border-gray-50">
                            <div className="mt-5">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Name *</label>
                                <input type="text" required className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                    value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Minimalist Watch" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Image URL</label>
                                <div className="flex gap-4 items-start flex-col md:flex-row">
                                    <input type="url" className="flex-1 w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        placeholder="Paste image link here" />
                                    {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-100 bg-gray-50" onError={(e) => e.target.style.display = 'none'} />}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                <textarea rows={4} className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Tell more about the product..." />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Price ($) *</label>
                                    <input type="number" step="0.01" required className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">SKU *</label>
                                    <input type="text" required className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU-XXXXX" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                                    <select className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none capitalize"
                                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-2 md:pt-8 px-2">
                                    <label className="flex items-center cursor-pointer group">
                                        <input type="checkbox" className="w-5 h-5 text-blue-600 border-gray-200 rounded-lg focus:ring-blue-100 transition-all"
                                            checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                                        <span className="ml-3 text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                            <Star className={cn("w-4 h-4 transition-colors", formData.is_featured ? "text-yellow-500 fill-yellow-500" : "text-gray-200")} />
                                            Featured Product
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Attributes Section */}
                <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('attributes')}
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
                    >
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Attributes</h2>
                        {expandedSections.attributes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {expandedSections.attributes && (
                        <div className="p-5 pt-0 border-t border-gray-50">
                            {availableAttributes.length === 0 ? (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic py-4">No custom attributes for this category.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-5">
                                    {availableAttributes.map(attr => (
                                        <div key={attr.code}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 flex items-center justify-center bg-gray-50 rounded border border-gray-100">
                                                    {attr.image_url ? (
                                                        <img src={attr.image_url} alt="" className="w-4 h-4 object-cover rounded-[2px]" />
                                                    ) : (
                                                        <ImageIcon className="w-3 h-3 text-gray-300" />
                                                    )}
                                                </div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    {attr.label}
                                                    {attr.is_required && <span className="text-red-500 ml-1 opacity-50">*</span>}
                                                </label>
                                            </div>

                                            {attr.type === 'text' && (
                                                <input type="text" className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                                    value={formData.attributes[attr.code] || ''}
                                                    onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                                    required={attr.is_required} />
                                            )}

                                            {attr.type === 'number' && (
                                                <input type="number" className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                                    value={formData.attributes[attr.code] || ''}
                                                    onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                                    required={attr.is_required} />
                                            )}

                                            {attr.type === 'select' && (
                                                <select className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none"
                                                    value={formData.attributes[attr.code] || ''}
                                                    onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                                    required={attr.is_required}>
                                                    <option value="">Select Option...</option>
                                                    {attr.options?.map((opt, i) => (
                                                        <option key={i} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {attr.type === 'boolean' && (
                                                <select className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none appearance-none"
                                                    value={formData.attributes[attr.code] || ''}
                                                    onChange={(e) => handleAttributeChange(attr.code, e.target.value)}>
                                                    <option value="">Choose...</option>
                                                    <option value="true">Yes</option>
                                                    <option value="false">No</option>
                                                </select>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tags Section */}
                <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('tags')}
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
                    >
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Tags</h2>
                        {expandedSections.tags ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {expandedSections.tags && (
                        <div className="p-5 pt-0 border-t border-gray-50">
                            <div className="flex gap-2 mb-4 mt-5">
                                <input type="text" className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                    placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                                <button type="button" onClick={addTag} className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition shadow-none">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag) => (
                                    <span key={tag} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-900 border border-gray-100 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                                {formData.tags.length === 0 && <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No tags added</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* SEO Section */}
                <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => toggleSection('seo')}
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
                    >
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">SEO</h2>
                        {expandedSections.seo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {expandedSections.seo && (
                        <div className="p-5 pt-0 border-t border-gray-50 space-y-6 pt-5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">URL Slug</label>
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2">
                                    <span className="text-gray-400 text-xs font-bold">/product/</span>
                                    <input type="text" className="flex-1 bg-transparent border-none text-sm focus:ring-0 outline-none p-0 font-medium"
                                        value={formData.handle} onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                                </div>
                            </div>

                            <div className="pt-2">
                                <SEOMetaEditor
                                    page={formData}
                                    onChange={(updated) => setFormData(updated)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className={cn("flex-1 py-4 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-none flex items-center justify-center gap-2", loading && "opacity-50")}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Product"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 bg-gray-100 text-gray-500 rounded-lg text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all"
                    >
                        Discard
                    </button>
                </div>
            </form>
        </div>
    );
}
