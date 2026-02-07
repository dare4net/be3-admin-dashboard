"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Star, X, Image as ImageIcon } from "lucide-react";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";

export default function ProductForm({ categoryId, onSuccess, onCancel }) {
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
                // Fetch category details for name and attributes
                const res = await api.get(`/products/categories/${categoryId}/admin`);

                if (res.data.category) {
                    setCategoryName(res.data.category.name);
                    if (res.data.category.attributes) {
                        // Only show attributes that are not explicitly ignored for this category
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">New Product</h2>
                    <p className="text-sm text-gray-500">Adding to category: <span className="font-semibold text-blue-600">{categoryName || 'Loading...'}</span></p>
                </div>
                <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                    </label>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={formData.name} onChange={(e) => handleNameChange(e.target.value)} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Image URL</label>
                    <div className="flex gap-4 items-start">
                        <input type="url" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                            value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg" />
                        {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-16 h-16 object-cover rounded border bg-gray-50" onError={(e) => e.target.style.display = 'none'} />}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                        <input type="number" step="0.01" required className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                        <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    <div className="flex items-center pt-8">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                            <span className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                Mark as Featured
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Attributes Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Attributes</h2>

                {availableAttributes.length === 0 ? (
                    <p className="text-gray-500 italic">No specific attributes defined for this category.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-6">
                        {availableAttributes.map(attr => (
                            <div key={attr.code}>
                                <div className="flex items-center gap-2 mb-1">
                                    {attr.image_url ? (
                                        <img src={attr.image_url} alt="" className="w-5 h-5 object-cover rounded" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                    )}
                                    <label className="block text-sm font-medium text-gray-700">
                                        {attr.label}
                                        {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                </div>

                                {attr.type === 'text' && (
                                    <input type="text" className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.attributes[attr.code] || ''}
                                        onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                        required={attr.is_required} />
                                )}

                                {attr.type === 'number' && (
                                    <input type="number" className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.attributes[attr.code] || ''}
                                        onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                        required={attr.is_required} />
                                )}

                                {attr.type === 'select' && (
                                    <select className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.attributes[attr.code] || ''}
                                        onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                        required={attr.is_required}>
                                        <option value="">Select {attr.label}...</option>
                                        {attr.options?.map((opt, i) => (
                                            <option key={i} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                )}

                                {attr.type === 'boolean' && (
                                    <select className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.attributes[attr.code] || ''}
                                        onChange={(e) => handleAttributeChange(attr.code, e.target.value)}>
                                        <option value="">Select...</option>
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Organization (Tags) */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Tags</h2>
                <div className="flex gap-2 mb-2">
                    <input type="text" className="flex-1 px-4 py-2 border rounded-lg"
                        placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
                    <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-200 rounded-lg">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            </div>

            {/* SEO & URL */}
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <h2 className="text-lg font-semibold border-b pb-2">SEO & URL</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Handle</label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">/products/</span>
                        <input type="text" className="flex-1 px-4 py-2 border rounded-lg"
                            value={formData.handle} onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                    </div>
                </div>

                {/* Comprehensive SEO Editor */}
                <div className="border-t pt-4">
                    <h3 className="text-md font-semibold mb-3 text-gray-800">Search Engine Optimization</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        💡 Leave fields empty to inherit from category
                    </p>
                    <SEOMetaEditor
                        page={formData}
                        onChange={(updated) => setFormData(updated)}
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button type="submit" disabled={loading} className={cn("flex-1 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700", loading && "opacity-50")}>
                    {loading ? "Creating..." : "Create Product"}
                </button>
                <button type="button" onClick={onCancel} className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancel
                </button>
            </div>
        </form>
    );
}
