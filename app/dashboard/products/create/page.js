"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Star, X, Folder, ChevronRight, ArrowLeft, Image as ImageIcon } from "lucide-react";

export default function CreateProductPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);

    // Workflow State
    const [step, setStep] = useState('category_selection'); // 'category_selection' | 'form'
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
        seo_title: "",
        seo_description: "",
        handle: "",
        image_url: "",
        attributes: {} // { code: value }
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
                // Fetch attributes for the single selected category (which includes inherited ones)
                const res = await api.get(`/products/categories/${selectedCategory.id}/admin`);

                if (res.data.category && res.data.category.attributes) {
                    setAvailableAttributes(res.data.category.attributes);
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

    const handleCategoryClick = (category) => {
        if (hasChildren(category.id)) {
            // Drill down
            setCurrentParentId(category.id);
        } else {
            // Select leaf and move to form
            setSelectedCategory(category);
            setFormData(prev => ({ ...prev, category_ids: [category.id] }));
            setStep('form');
        }
    };

    const handleBackUp = () => {
        if (currentParentId === null) return; // Already at top
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
            seo_title: prev.seo_title || name
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

    const addTag = () => { /* ... existing logic ... */
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            setTagInput("");
        }
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
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-2xl font-bold mb-2">Category Selection</h1>
                <p className="text-gray-500 mb-8">Choose the category for your new product.</p>

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
                        {currentOptions.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No categories found here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // RENDER: STEP 2 - PRODUCT FORM
    // ------------------------------------------------------------------
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        Creating in: <span className="font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{selectedCategory?.name}</span>
                        <button onClick={() => setStep('category_selection')} className="text-gray-400 hover:text-gray-600 underline text-xs ml-2">Change</button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>

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
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Attributes for {selectedCategory?.name}</h2>

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
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4">Tags</h2>
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

                {/* SEO */}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                        <input type="text" maxLength={60} className="w-full px-4 py-2 border rounded-lg"
                            value={formData.seo_title} onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                        <textarea rows={3} maxLength={160} className="w-full px-4 py-2 border rounded-lg"
                            value={formData.seo_description} onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })} />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button type="submit" disabled={loading} className={cn("flex-1 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700", loading && "opacity-50")}>
                        {loading ? "Creating..." : "Create Product"}
                    </button>
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
