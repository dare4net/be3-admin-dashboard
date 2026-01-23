"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Folder, Layers, Settings, X, Search } from "lucide-react";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [attributes, setAttributes] = useState([]); // Global attributes
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'attributes' | 'seo'

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: '', // Nullable in DB but empty string for select
        description: '',
        image_url: '',
        // SEO Fields
        meta_description: '',
        og_title: '',
        og_description: '',
        og_image: '',
        og_type: 'product.group', // Default for categories
        twitter_card: 'summary_large_image',
        twitter_title: '',
        twitter_description: '',
        twitter_image: '',
        canonical_url: '',
        robots: 'index,follow',
        structured_data: null
    });

    const [linkedAttributes, setLinkedAttributes] = useState([]); // [{id, is_required}]
    const [initialLinkedAttributes, setInitialLinkedAttributes] = useState([]); // For diffing

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [catRes, attrRes] = await Promise.all([
                api.get('/products/categories/all'),
                api.get('/products/attributes')
            ]);

            if (catRes.data.success) setCategories(catRes.data.categories);
            if (attrRes.data.success) setAttributes(attrRes.data.data || []);

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            parent_id: '',
            description: '',
            image_url: '',
            // SEO Defaults
            meta_description: '',
            og_title: '',
            og_description: '',
            og_image: '',
            og_type: 'product.group',
            twitter_card: 'summary_large_image',
            twitter_title: '',
            twitter_description: '',
            twitter_image: '',
            canonical_url: '',
            robots: 'index,follow',
            structured_data: null
        });
        setLinkedAttributes([]);
        setInitialLinkedAttributes([]);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEdit = async (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id || '',
            description: category.description || '',
            image_url: category.image_url || '',
            // SEO Fields
            meta_description: category.meta_description || '',
            og_title: category.og_title || '',
            og_description: category.og_description || '',
            og_image: category.og_image || '',
            og_type: category.og_type || 'product.group',
            twitter_card: category.twitter_card || 'summary_large_image',
            twitter_title: category.twitter_title || '',
            twitter_description: category.twitter_description || '',
            twitter_image: category.twitter_image || '',
            canonical_url: category.canonical_url || '',
            robots: category.robots || 'index,follow',
            structured_data: category.structured_data || null
        });
        setActiveTab('general');
        setIsModalOpen(true);

        // Fetch linked attributes for this category
        try {
            const res = await api.get(`/products/categories/${category.id}/admin`);
            if (res.data.category && res.data.category.attributes) {
                const attrs = res.data.category.attributes.map(a => ({
                    attribute_id: a.id,
                    is_required: a.is_required,
                    is_ignored: a.is_ignored,
                    is_inherited: a.is_inherited,
                    source_category_name: a.source_category_name
                }));
                setLinkedAttributes(attrs);
                setInitialLinkedAttributes(JSON.parse(JSON.stringify(attrs))); // Deep copy
            } else {
                setLinkedAttributes([]);
                setInitialLinkedAttributes([]);
            }
        } catch (error) {
            console.error("Failed to fetch linked attributes", error);
            setLinkedAttributes([]);
            setInitialLinkedAttributes([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let categoryId;
            const payload = {
                ...formData,
                parent_id: formData.parent_id || null
            };

            if (editingCategory) {
                await api.put(`/products/categories/${editingCategory.id}`, payload);
                categoryId = editingCategory.id;
            } else {
                const res = await api.post('/products/categories', payload);
                categoryId = res.data.category.id;
            }

            // --- SYNC ATTRIBUTES ---
            const currentIds = linkedAttributes.map(a => a.attribute_id);
            const initialIds = initialLinkedAttributes.map(a => a.attribute_id);

            // 1. Delete Removed
            const toRemove = initialIds.filter(id => !currentIds.includes(id));
            // Only perform deletes if we were editing (creates start fresh anyway, but safe to check)
            if (toRemove.length > 0) {
                for (const attrId of toRemove) {
                    await api.delete(`/products/categories/${categoryId}/attributes/${attrId}`);
                }
            }

            // 2. Upsert (Link/Update) Current
            // We loop through ALL current attributes to ensure is_required/is_ignored is updated if changed
            for (const attr of linkedAttributes) {
                await api.post(`/products/categories/${categoryId}/attributes`, {
                    attribute_id: attr.attribute_id,
                    is_required: attr.is_required,
                    is_ignored: attr.is_ignored
                });
            }

            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Failed to save category');
        }
    };

    const handleDelete = async (category) => {
        if (!confirm(`Delete category "${category.name}"?`)) return;

        try {
            await api.delete(`/products/categories/${category.id}`);
            await fetchData();
        } catch (error) {
            alert('Failed to delete category.');
        }
    };

    const handleLinkAttribute = (attrId) => {
        const existing = linkedAttributes.find(a => a.attribute_id === attrId);
        if (existing) {
            if (existing.is_ignored) {
                // Restore rejected inherited attribute
                setLinkedAttributes(linkedAttributes.map(a =>
                    a.attribute_id === attrId ? { ...a, is_ignored: false } : a
                ));
            }
            return;
        }
        setLinkedAttributes([...linkedAttributes, { attribute_id: attrId, is_required: false, is_ignored: false }]);
    };

    const handleUnlinkAttribute = (index, attrId) => {
        const newAttributes = [...linkedAttributes];
        newAttributes.splice(index, 1);
        setLinkedAttributes(newAttributes);
    };

    const toggleRequired = (index, attrId) => {
        const newAttrs = [...linkedAttributes];
        newAttrs[index].is_required = !newAttrs[index].is_required;
        setLinkedAttributes(newAttrs);
    };

    const toggleIgnored = (index, attrId) => {
        const newAttrs = [...linkedAttributes];
        newAttrs[index].is_ignored = !newAttrs[index].is_ignored;
        setLinkedAttributes(newAttrs);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Product Categories</h1>
                    <p className="text-gray-600">Organize products and define their attributes</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Create Category
                </button>
            </div>

            {/* Categories Table (Tree view would be better but flat list with parent info for MVP) */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    {category.image_url ? (
                                        <img src={category.image_url} className="w-10 h-10 rounded object-cover border" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                            <Folder className="w-5 h-5" />
                                        </div>
                                    )}
                                    <span className="font-medium text-gray-900">{category.name}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {category.slug}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {category.parent_id
                                        ? categories.find(c => c.id === category.parent_id)?.name || 'Unknown'
                                        : <span className="text-gray-400 italic">Top Level</span>}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(category)} className="text-blue-600 hover:text-blue-900 mr-4">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(category)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab('attributes')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'attributes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Attributes
                            </button>
                            <button
                                onClick={() => setActiveTab('seo')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'seo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                SEO
                            </button>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6">
                            {activeTab === 'general' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Name *</label>
                                            <input
                                                type="text" required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Slug *</label>
                                            <input
                                                type="text" required
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Parent Category</label>
                                        <select
                                            value={formData.parent_id}
                                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            <option value="">None (Top Level)</option>
                                            {categories
                                                .filter(c => c.id !== editingCategory?.id) // Prevent self-parenting
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={formData.image_url}
                                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                placeholder="https://..."
                                            />
                                            {formData.image_url && <img src={formData.image_url} className="w-10 h-10 rounded border object-cover" />}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ) : activeTab === 'attributes' ? (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                                        Products in this category will have these attributes.
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Linked Attributes</h4>
                                        {linkedAttributes.filter(a => !a.is_ignored).length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">No attributes linked yet.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {linkedAttributes.map((link, idx) => {
                                                    if (link.is_ignored) return null;
                                                    const attrDef = attributes.find(a => a.id === link.attribute_id);
                                                    if (!attrDef) return null;
                                                    return (
                                                        <div key={link.attribute_id} className={`flex justify-between items-center p-3 rounded border ${link.is_inherited ? 'bg-blue-50 border-blue-100' : 'bg-gray-50'}`}>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{attrDef.label}</span>
                                                                    {link.is_inherited && (
                                                                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                                                                            Inherited from {link.source_category_name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-500">({attrDef.code})</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <label className="flex items-center gap-2 text-sm cursor-pointer" title="Overrides parent setting if changed">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={link.is_required}
                                                                        onChange={() => toggleRequired(idx, link.attribute_id)}
                                                                        className="rounded text-blue-600"
                                                                    />
                                                                    Required
                                                                </label>
                                                                {link.is_inherited ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleIgnored(idx, link.attribute_id)}
                                                                        className="text-orange-500 hover:text-orange-700 text-xs font-bold flex items-center gap-1"
                                                                        title="Reject inheritance"
                                                                    >
                                                                        <X className="w-4 h-4" /> Reject
                                                                    </button>
                                                                ) : (
                                                                    <button type="button" onClick={() => handleUnlinkAttribute(idx, link.attribute_id)} className="text-red-500 hover:text-red-700">
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-2">Available Attributes</h4>
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                            <input type="text" placeholder="Search attributes..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm mb-2" />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {/* Rejected Inherited first */}
                                            {linkedAttributes.map((link, idx) => {
                                                if (!link.is_ignored) return null;
                                                const attrDef = attributes.find(a => a.id === link.attribute_id);
                                                if (!attrDef) return null;
                                                return (
                                                    <div key={link.attribute_id} className="flex justify-between items-center p-2 bg-orange-50 hover:bg-orange-100 rounded cursor-pointer group border border-orange-100" onClick={() => handleLinkAttribute(link.attribute_id)}>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-orange-800">{attrDef.label}</span>
                                                            <span className="text-[10px] text-orange-600">Inherited (Rejected)</span>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-orange-400 group-hover:text-orange-600" />
                                                    </div>
                                                );
                                            })}

                                            {/* Completely Unlinked */}
                                            {attributes
                                                .filter(a => !linkedAttributes.find(l => l.attribute_id === a.id))
                                                .map(attr => (
                                                    <div key={attr.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer group" onClick={() => handleLinkAttribute(attr.id)}>
                                                        <span className="text-sm">{attr.label}</span>
                                                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 pt-4">
                                    <h4 className="text-md font-semibold text-gray-800">Search Engine Optimization</h4>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Set default SEO settings for products in this category. Inherited values can be overridden on individual products.
                                    </p>
                                    <SEOMetaEditor
                                        page={formData}
                                        onChange={(updated) => setFormData(updated)}
                                    />
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form >
                    </div >
                </div >
            )
            }
        </div >
    );
}
