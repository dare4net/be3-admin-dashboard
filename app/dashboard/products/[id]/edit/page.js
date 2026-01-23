"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Star, X, Folder, ChevronRight, ArrowLeft, Image as ImageIcon } from "lucide-react";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Workflow State
    const [step, setStep] = useState('form'); // 'form' | 'category_selection'
    const [currentParentId, setCurrentParentId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

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
        attributes: {},
        // SEO Fields
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
    const [availableAttributes, setAvailableAttributes] = useState([]);

    useEffect(() => {
        fetchCategories();
        fetchProduct();
    }, []);

    // Fetch attributes when selectedCategory changes
    useEffect(() => {
        const fetchAttributes = async () => {
            if (!selectedCategory) {
                setAvailableAttributes([]);
                return;
            }

            try {
                // Fetch attributes for the single selected category
                const res = await api.get(`/products/categories/${selectedCategory.id}/admin`);

                if (res.data.category && res.data.category.attributes) {
                    // Only show attributes that are not explicitly ignored for this category
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

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/products/${productId}`);
            if (res.data.success) {
                const product = res.data.product;

                // Determine primary category (first one found)
                const productCats = product.categories || [];
                const primaryCatId = productCats.length > 0 ? productCats[0].id : null;

                setFormData({
                    name: product.name,
                    description: product.description || "",
                    sku: product.sku,
                    price: product.price,
                    status: product.status,
                    is_featured: product.is_featured || false,
                    category_ids: primaryCatId ? [primaryCatId] : [],
                    tags: product.tags || [],
                    handle: product.handle || "",
                    image_url: product.image_url || "",
                    attributes: product.attributes || {},
                    // SEO Fields
                    meta_description: product.meta_description || "",
                    og_title: product.og_title || "",
                    og_description: product.og_description || "",
                    og_image: product.og_image || "",
                    og_type: product.og_type || "product",
                    twitter_card: product.twitter_card || "summary_large_image",
                    twitter_title: product.twitter_title || "",
                    twitter_description: product.twitter_description || "",
                    twitter_image: product.twitter_image || "",
                    canonical_url: product.canonical_url || "",
                    robots: product.robots || "index,follow",
                    structured_data: product.structured_data || null
                });

                // Set initial selected category object (need to find it in full list once loaded)
                // However, categories might strictly load after product. 
                // We'll rely on categories list finding it.
            }
        } catch (error) {
            console.error('Failed to fetch product', error);
            alert('Failed to load product');
        } finally {
            setLoading(false);
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

    // Sync selectedCategory state once both product and categories are loaded
    useEffect(() => {
        if (!loading && categories.length > 0 && formData.category_ids.length > 0 && !selectedCategory) {
            const cat = categories.find(c => c.id === formData.category_ids[0]);
            if (cat) setSelectedCategory(cat);
        }
    }, [loading, categories, formData.category_ids]);


    // Category Navigation Helpers
    const hasChildren = (catId) => categories.some(c => c.parent_id === catId);
    const getChildren = (parentId) => categories.filter(c => parentId === null ? !c.parent_id : c.parent_id === parentId);

    const handleCategoryClick = (category) => {
        if (hasChildren(category.id)) {
            setCurrentParentId(category.id);
        } else {
            setSelectedCategory(category);
            setFormData(prev => ({ ...prev, category_ids: [category.id] }));
            setStep('form');
        }
    };

    const handleBackUp = () => {
        if (currentParentId === null) return;
        const current = categories.find(c => c.id === currentParentId);
        setCurrentParentId(current ? (current.parent_id || null) : null);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.patch(`/products/${productId}`, {
                ...formData,
                price: parseFloat(formData.price),
            });
            router.push("/dashboard/products");
        } catch (err) {
            console.error("Failed to update product", err);
            alert(`Failed to update product: ${err.response?.data?.message || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleNameChange = (name) => {
        setFormData(prev => ({
            ...prev,
            name,
            og_title: prev.og_title || name
        }));
    };

    const handleAttributeChange = (code, value) => {
        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [code]: value }
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

    if (loading) {
        return <div className="max-w-4xl p-8 flex justify-center"><div className="animate-pulse text-gray-400">Loading product data...</div></div>;
    }

    // ------------------------------------------------------------------
    // RENDER: CATEGORY SELECTION MODE
    // ------------------------------------------------------------------
    if (step === 'category_selection') {
        const currentOptions = getChildren(currentParentId);
        const parentCategory = categories.find(c => c.id === currentParentId);

        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Change Category</h1>
                        <p className="text-gray-500">Drill down to select a new category for this product.</p>
                    </div>
                    <button onClick={() => setStep('form')} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg border p-6 min-h-[400px]">
                    {/* Breadcrumb / Navigation */}
                    <div className="flex items-center gap-2 mb-6 text-sm">
                        <button
                            onClick={() => setCurrentParentId(null)}
                            className={`hover:text-blue-600 ${currentParentId === null ? 'font-bold text-gray-900' : 'text-gray-500'}`}
                        >
                            All Categories
                        </button>
                        {parentCategory && (
                            <>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <span className="font-bold text-gray-900">{parentCategory.name}</span>
                            </>
                        )}
                    </div>

                    {currentParentId !== null && (
                        <button onClick={handleBackUp} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {currentOptions.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className="group cursor-pointer border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center text-center gap-3"
                            >
                                {cat.image_url ? (
                                    <img src={cat.image_url} className="w-16 h-16 object-cover rounded-md" alt="" />
                                ) : (
                                    <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-md flex items-center justify-center">
                                        <Folder className="w-8 h-8 fill-current" />
                                    </div>
                                )}

                                <div>
                                    <span className="font-medium text-gray-900 block">{cat.name}</span>
                                    {hasChildren(cat.id) && <span className="text-xs text-gray-500">View Subcategories</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // RENDER: FORM MODE
    // ------------------------------------------------------------------
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Product</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
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

                {/* Organization */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <h2 className="text-xl font-semibold border-b pb-2">Organization</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        {selectedCategory ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    {selectedCategory.image_url ? (
                                        <img src={selectedCategory.image_url} className="w-10 h-10 rounded object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-500">
                                            <Folder className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedCategory.name}</p>
                                        <p className="text-xs text-gray-500">{selectedCategory.slug}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setStep('category_selection')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    Change category
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setStep('category_selection')} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition">
                                Select a Category
                            </button>
                        )}
                    </div>

                    {/* Attributes Section */}
                    {selectedCategory && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-md font-medium text-gray-900 mb-4">Attributes for {selectedCategory.name}</h3>

                            {availableAttributes.length === 0 ? (
                                <p className="text-gray-500 italic text-sm">No specific attributes defined for this category.</p>
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
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
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
                </div>

                {/* SEO & URL */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <h2 className="text-xl font-semibold border-b pb-2">SEO & URL</h2>
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
                            💡 Leave fields empty to inherit from category: <span className="font-semibold">{selectedCategory?.name || "(not selected)"}</span>
                        </p>
                        <SEOMetaEditor
                            page={formData}
                            onChange={(updated) => setFormData(updated)}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button type="submit" disabled={saving} className={cn("flex-1 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700", saving && "opacity-50")}>
                        {saving ? "Saving..." : "Update Product"}
                    </button>
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
