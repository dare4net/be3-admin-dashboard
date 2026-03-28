"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { 
    Star, X, Image as ImageIcon, ChevronDown, ChevronUp, 
    Loader2, Save, ArrowLeft, Tag 
} from "lucide-react";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";

export default function ProductForm({ categoryId, onSuccess, onCancel }) {
    // Collapsible sections state
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        attributes: true,
        seo: false, // Collapsed by default per user request
        tags: false  // Collapsed by default per user request
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
        category_ids: categoryId ? [categoryId] : [],
        tags: [],
        handle: "",
        image_url: "",
        attributes: {}, // { code: value }
        // Comprehensive SEO Fields
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
    const [categoryName, setCategoryName] = useState("");

    // Fetch attributes and category details
    useEffect(() => {
        const fetchContext = async () => {
            if (!categoryId) return;

            try {
                const res = await api.get(`/products/categories/${categoryId}/admin`);
                if (res.data.category) {
                    setCategoryName(res.data.category.name);
                    if (res.data.category.attributes) {
                        setAvailableAttributes(res.data.category.attributes.filter(a => !a.is_ignored));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch attributes", error);
            }
        };

        fetchContext();
    }, [categoryId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/products", {
                ...formData,
                price: parseFloat(formData.price),
                category_id: categoryId // Main category context
            });
            if (onSuccess) onSuccess();
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

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information Section */}
            <div className="bg-white rounded-3xl shadow-none border border-gray-100 overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('basic')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Basic Information</h2>
                        {!expandedSections.basic && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{formData.name || 'Draft Entry'}</span>}
                    </div>
                    {expandedSections.basic ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedSections.basic && (
                    <div className="p-6 pt-0 space-y-6 border-t border-gray-50/50">
                        <div className="mt-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Name *</label>
                            <input type="text" required className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300"
                                value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Minimalist Watch" />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Cover URL</label>
                            <div className="flex gap-4 items-start flex-col md:flex-row">
                                <input type="url" className="flex-1 w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm ml-0 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://..." />
                                {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-2xl border border-gray-100 bg-gray-50 shadow-sm" onError={(e) => e.target.style.display = 'none'} />}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Summary</label>
                            <textarea rows={4} className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Internal categorization notes..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Price ($) *</label>
                                <input type="number" step="0.01" required className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">SKU Identity *</label>
                                <input type="text" required className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU-XXXXX" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Availability Status</label>
                                <select className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none capitalize"
                                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="draft">Draft (Private)</option>
                                    <option value="active">Active (Public)</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-2 md:pt-8 px-2">
                                <label className="flex items-center cursor-pointer group">
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 border-gray-200 rounded-lg focus:ring-blue-100 transition-all cursor-pointer"
                                        checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                                    <span className="ml-4 text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                        <Star className={cn("w-4 h-4 transition-colors", formData.is_featured ? "text-yellow-500 fill-yellow-500" : "text-gray-200")} />
                                        Featured Offering
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Attributes Section */}
            <div className="bg-white rounded-3xl shadow-none border border-gray-100 overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('attributes')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
                >
                    <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Attributes Registry</h2>
                    {expandedSections.attributes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedSections.attributes && (
                    <div className="p-6 pt-0 border-t border-gray-50/50">
                        {availableAttributes.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50/30 rounded-2xl border border-dashed border-gray-100 mt-6">
                                <Tag className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No Schema Defined for {categoryName || 'this category'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-6">
                                {availableAttributes.map(attr => (
                                    <div key={attr.code}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                                {attr.image_url ? (
                                                    <img src={attr.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <Tag className="w-4 h-4 text-gray-300" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    {attr.label}
                                                    {attr.is_required && <span className="text-red-500 ml-1 font-black leading-none">*</span>}
                                                </label>
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">{attr.type}</span>
                                            </div>
                                        </div>

                                        {attr.type === 'text' && (
                                            <input type="text" className="w-full px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={formData.attributes[attr.code] || ''}
                                                onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                                required={attr.is_required} />
                                        )}

                                        {attr.type === 'number' && (
                                            <input type="number" className="w-full px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={formData.attributes[attr.code] || ''}
                                                onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                                required={attr.is_required} />
                                        )}

                                        {attr.type === 'select' && (
                                            <select className="w-full px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none"
                                                value={formData.attributes[attr.code] || ''}
                                                onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                                required={attr.is_required}>
                                                <option value="">Select Variant...</option>
                                                {attr.options?.map((opt, i) => (
                                                    <option key={i} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        )}

                                        {attr.type === 'boolean' && (
                                            <select className="w-full px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none"
                                                value={formData.attributes[attr.code] || ''}
                                                onChange={(e) => handleAttributeChange(attr.code, e.target.value)}>
                                                <option value="">Status...</option>
                                                <option value="true">Enable</option>
                                                <option value="false">Disable</option>
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
            <div className="bg-white rounded-3xl shadow-none border border-gray-100 overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('tags')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
                >
                    <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Taxonomy Tags</h2>
                    {expandedSections.tags ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedSections.tags && (
                    <div className="p-6 pt-0 border-t border-gray-50/50">
                        <div className="flex gap-3 mb-6 mt-6">
                            <input type="text" className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                placeholder="e.g. Winter, Organic, BestSeller" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                            <button type="button" onClick={addTag} className="px-8 py-3 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/10">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-3 px-4 py-2 bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-tight">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                            {formData.tags.length === 0 && <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic text-center py-4 w-full">No active tags assigned</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* SEO Section */}
            <div className="bg-white rounded-3xl shadow-none border border-gray-100 overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('seo')}
                    className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
                >
                    <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">SEO</h2>
                    {expandedSections.seo ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedSections.seo && (
                    <div className="p-6 pt-0 border-t border-gray-50/50 space-y-6">
                        <div className="mt-6">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Canonical Handle</label>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3">
                                <span className="text-gray-400 text-xs font-black uppercase tracking-widest opacity-50">/prod/</span>
                                <input type="text" className="flex-1 bg-transparent border-none text-sm focus:ring-0 outline-none p-0 font-bold text-gray-900"
                                    value={formData.handle} onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                            </div>
                        </div>

                        <div className="pt-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Metadata Inheritance</p>
                            <SEOMetaEditor
                                page={formData}
                                onChange={(updated) => setFormData(updated)}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-8 pb-10">
                <button
                    type="submit"
                    disabled={loading}
                    className={cn("flex-1 py-5 bg-blue-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3", loading && "opacity-50")}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Finalize Product</>}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-12 py-5 bg-white text-gray-400 border border-gray-100 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
                >
                    Abandon Changes
                </button>
            </div>
        </form>
    );
}
