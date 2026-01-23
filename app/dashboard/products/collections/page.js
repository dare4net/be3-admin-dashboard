'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Plus, Trash2, Edit2, Check, X, Search, List, Settings, Save, ArrowRight, ExternalLink, Eye, Package } from 'lucide-react';

const OPERATORS = {
    category: [{ label: 'Is In', value: 'in' }],
    tag: [{ label: 'Has', value: 'has' }],
    price: [{ label: 'Greater than', value: 'gt' }, { label: 'Less than', value: 'lt' }],
    attribute: [{ label: 'Is', value: 'is' }],
    has_attribute: [{ label: 'Exists', value: 'exists' }]
};

export default function CollectionsPage() {
    const [collections, setCollections] = useState([]);
    const [categories, setCategories] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [previewCollection, setPreviewCollection] = useState(null);
    const [previewProducts, setPreviewProducts] = useState([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        rules: [],
        manual_product_ids: [],
        excluded_product_ids: [],
        is_active: true,
        seo: { title: '', description: '' }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [colRes, catRes, attrRes] = await Promise.all([
                api.get('/products/collections/admin'),
                api.get('/products/categories/all'),
                api.get('/products/attributes/all')
            ]);
            setCollections(colRes.data.data || []);
            setCategories(catRes.data.categories || []);
            setAttributes(attrRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingCollection(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            image_url: '',
            thumbnail_url: '',
            rules: [],
            manual_product_ids: [],
            excluded_product_ids: [],
            is_active: true,
            seo: { title: '', description: '' }
        });
        setIsEditModalOpen(true);
    };

    const handleEdit = (col) => {
        setEditingCollection(col);
        setFormData({
            ...col,
            image_url: col.image_url || '',
            thumbnail_url: col.thumbnail_url || '',
            rules: col.rules || [],
            manual_product_ids: col.manual_product_ids || [],
            excluded_product_ids: col.excluded_product_ids || [],
            seo: col.seo || { title: '', description: '' }
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this collection?')) return;
        try {
            await api.delete(`/products/collections/${id}`);
            if (previewCollection?.id === id) setPreviewCollection(null);
            fetchData();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handlePreview = async (col) => {
        setPreviewCollection(col);
        setIsPreviewLoading(true);
        try {
            const res = await api.get('/search', {
                params: {
                    collection_id: col.id,
                    type: 'product',
                    per_page: 50
                }
            });
            setPreviewProducts(res.data.results || []);
        } catch (error) {
            console.error('Preview fetch failed', error);
            setPreviewProducts([]);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCollection) {
                await api.put(`/products/collections/${editingCollection.id}`, formData);
            } else {
                await api.post('/products/collections', formData);
            }
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Save failed', error);
        }
    };

    const addRule = () => {
        setFormData(prev => ({
            ...prev,
            rules: [...prev.rules, { field: 'category', operator: 'in', value: [] }]
        }));
    };

    const removeRule = (index) => {
        setFormData(prev => ({
            ...prev,
            rules: prev.rules.filter((_, i) => i !== index)
        }));
    };

    const renderAttributeInput = (index, rule) => {
        const attr = attributes.find(a => a.code === rule.attribute_code);
        if (!attr) return null;

        const options = Array.isArray(attr.options) ? attr.options : [];

        switch (attr.type) {
            case 'multiselect':
                return (
                    <div className="flex flex-wrap gap-2">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center gap-1.5 text-xs bg-gray-50 px-2 py-1 rounded border cursor-pointer hover:bg-gray-100 transition">
                                <input
                                    type="checkbox"
                                    checked={(rule.value || []).includes(opt)}
                                    onChange={e => {
                                        const newValue = e.target.checked
                                            ? [...(Array.isArray(rule.value) ? rule.value : []), opt]
                                            : (Array.isArray(rule.value) ? rule.value : []).filter(v => v !== opt);
                                        updateRule(index, 'value', newValue);
                                    }}
                                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                );
            case 'dropdown':
            case 'select':
                return (
                    <div className="flex flex-wrap gap-3">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer group">
                                <input
                                    type="radio"
                                    name={`rule-${index}`}
                                    checked={rule.value === opt}
                                    onChange={() => updateRule(index, 'value', opt)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="group-hover:text-blue-600 transition">{opt}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'yes/no':
                return (
                    <div className="flex gap-2">
                        {['Yes', 'No'].map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => updateRule(index, 'value', opt)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${rule.value === opt ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                );
            default:
                return (
                    <input
                        className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                        placeholder="Enter value..."
                        value={rule.value || ''}
                        onChange={e => updateRule(index, 'value', e.target.value)}
                    />
                );
        }
    };

    const updateRule = (index, field, val) => {
        const newRules = [...formData.rules];
        newRules[index][field] = val;

        // Reset operator if field changes
        if (field === 'field') {
            if (val === 'attribute_clause') {
                newRules[index].attribute_code = '';
                newRules[index].value = '';
            } else {
                newRules[index].operator = OPERATORS[val][0].value;
                newRules[index].value = val === 'category' ? [] : '';
            }
        }

        setFormData(prev => ({ ...prev, rules: newRules }));
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
                    <p className="text-gray-500 mt-1">Group products with dynamic rules or manually</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Create Collection
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Collection</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Slug</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Rules</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : collections.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No collections found.</td></tr>
                        ) : (
                            collections.map((col) => (
                                <tr key={col.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 overflow-hidden border border-blue-100 shrink-0">
                                                {col.thumbnail_url ? (
                                                    <img src={col.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <List className="w-5 h-5" />
                                                )}
                                            </div>
                                            {col.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{col.slug}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                            {col.rules?.length || 0} Rules
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${col.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {col.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handlePreview(col)}
                                                className={`p-1.5 rounded-lg transition ${previewCollection?.id === col.id ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                title="Preview Products"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(col)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(col.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Preview Panel */}
            {previewCollection && (
                <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Products in "{previewCollection.name}"</h3>
                                <p className="text-xs text-gray-500">Showing up to 50 products matching this collection's rules</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setPreviewCollection(null)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-0">
                        {isPreviewLoading ? (
                            <div className="py-12 text-center text-gray-500">Loading products...</div>
                        ) : previewProducts.length === 0 ? (
                            <div className="py-12 m-6 text-center text-gray-400 border-2 border-dashed rounded-xl">
                                No products found matching this collection's rules.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b">
                                        <tr>
                                            <th className="px-6 py-3 w-16">Product</th>
                                            <th className="px-6 py-3">Name \ SKU</th>
                                            <th className="px-6 py-3">Categories</th>
                                            <th className="px-6 py-3">Tags</th>
                                            <th className="px-6 py-3 text-right">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {previewProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-3">
                                                    <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden border">
                                                        {product.metadata?.image_url ? (
                                                            <img src={product.metadata.image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <Package className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="font-semibold text-gray-900">{product.title}</div>
                                                    <div className="text-xs text-gray-400 font-mono">{product.metadata?.sku || 'NO-SKU'}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {product.metadata?.category_names?.map(name => (
                                                            <span key={name} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                                                                {name}
                                                            </span>
                                                        )) || <span className="text-gray-300 text-[10px] italic">Uncategorized</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {product.metadata?.tags?.map(t => (
                                                            <span key={t} className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                                #{t}
                                                            </span>
                                                        )) || <span className="text-gray-300 text-[10px] italic">No tags</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-bold text-gray-900">
                                                    ${parseFloat(product.metadata?.price || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-center">
                        <button
                            onClick={() => window.open(`/collections/${previewCollection.slug}`, '_blank')}
                            className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                        >
                            View Live Collection <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingCollection ? 'Edit Collection' : 'New Collection'}</h2>
                            <button onClick={() => setIsEditModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value, slug: !editingCollection ? e.target.value.toLowerCase().replace(/ /g, '-') : formData.slug })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                                            value={formData.slug}
                                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                                        placeholder="https://example.com/hero.jpg"
                                        value={formData.image_url}
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">Large background image for the collection landing page.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                                        placeholder="https://example.com/thumb.jpg"
                                        value={formData.thumbnail_url}
                                        onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">Smaller image for lists and previews.</p>
                                </div>
                            </div>

                            {/* Rules Section */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold flex items-center gap-2 text-gray-900">
                                        <Settings className="w-4 h-4 text-blue-600" />
                                        Collection Rules
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addRule}
                                        className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Add Rule
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.rules.map((rule, i) => (
                                        <div key={i} className="flex gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm items-center">
                                            <select
                                                className="px-2 py-1.5 border rounded-md text-sm bg-gray-50 shrink-0"
                                                value={rule.field}
                                                onChange={e => {
                                                    const field = e.target.value;
                                                    const newRules = [...formData.rules];
                                                    const oldRule = newRules[i];
                                                    newRules[i] = {
                                                        field,
                                                        operator: OPERATORS[field]?.[0]?.value || 'is',
                                                        attribute_code: oldRule.attribute_code || '',
                                                        value: field === 'category' ? [] : (field === 'has_attribute' ? (oldRule.attribute_code || '') : '')
                                                    };
                                                    setFormData({ ...formData, rules: newRules });
                                                }}
                                            >
                                                <option value="category">Category</option>
                                                <option value="tag">Tag</option>
                                                <option value="price">Price</option>
                                                <option value="has_attribute">Has Attribute</option>
                                                <option value="attribute">Attribute Value</option>
                                                <option value="attribute_clause">Attribute Clause</option>
                                            </select>

                                            {['attribute', 'attribute_clause', 'has_attribute'].includes(rule.field) ? (
                                                <>
                                                    <select
                                                        className="px-2 py-1.5 border rounded-md text-sm shrink-0"
                                                        value={rule.attribute_code || ''}
                                                        onChange={e => {
                                                            const attrCode = e.target.value;
                                                            const newRules = [...formData.rules];
                                                            newRules[i].attribute_code = attrCode;
                                                            if (rule.field === 'has_attribute') {
                                                                newRules[i].value = attrCode;
                                                            } else {
                                                                newRules[i].value = rule.field === 'category' ? [] : '';
                                                            }
                                                            setFormData(f => ({ ...f, rules: newRules }));
                                                        }}
                                                    >
                                                        <option value="">Select Attribute...</option>
                                                        {attributes.map(a => (
                                                            <option key={a.id} value={a.code}>{a.label}</option>
                                                        ))}
                                                    </select>

                                                    {rule.field === 'attribute_clause' && (
                                                        <select
                                                            className="flex-1 px-2 py-1.5 border rounded-md text-sm"
                                                            value={rule.value || ''}
                                                            onChange={e => updateRule(i, 'value', e.target.value)}
                                                            disabled={!rule.attribute_code}
                                                        >
                                                            <option value="">Select Clause...</option>
                                                            {attributes.find(a => a.code === rule.attribute_code)?.clauses?.map(c => (
                                                                <option key={c.name} value={c.name}>{c.label}</option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {rule.field === 'attribute' && rule.attribute_code && (
                                                        <div className="flex-1 flex gap-2">
                                                            {renderAttributeInput(i, rule)}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <select
                                                        className="px-2 py-1.5 border rounded-md text-sm shrink-0"
                                                        value={rule.operator}
                                                        onChange={e => updateRule(i, 'operator', e.target.value)}
                                                    >
                                                        {OPERATORS[rule.field]?.map(op => (
                                                            <option key={op.value} value={op.value}>{op.label}</option>
                                                        ))}
                                                    </select>

                                                    {rule.field === 'category' ? (
                                                        <div className="flex-1">
                                                            <select
                                                                multiple
                                                                className="w-full px-2 py-1.5 border rounded-md text-sm h-10 overflow-y-auto"
                                                                value={rule.value}
                                                                onChange={e => updateRule(i, 'value', Array.from(e.target.selectedOptions).map(o => o.value))}
                                                            >
                                                                {categories.map(cat => (
                                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                                                            placeholder="Enter value..."
                                                            value={rule.value}
                                                            onChange={e => updateRule(i, 'value', e.target.value)}
                                                        />
                                                    )}
                                                </>
                                            )}

                                            <button type="button" onClick={() => removeRule(i)} className="text-gray-400 hover:text-red-600 p-1 shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.rules.length === 0 && (
                                        <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                            No rules defined. This collection will include all products unless you add rules or manual IDs.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Manual IDs */}
                            <div className="grid grid-cols-2 gap-6 pb-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Always Include (IDs)</label>
                                    <textarea
                                        placeholder="Paste product IDs separated by commas..."
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                                        rows={3}
                                        value={(formData.manual_product_ids || []).join(', ')}
                                        onChange={e => setFormData({ ...formData, manual_product_ids: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Exclude (IDs)</label>
                                    <textarea
                                        placeholder="Paste product IDs separated by commas..."
                                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                                        rows={3}
                                        value={(formData.excluded_product_ids || []).join(', ')}
                                        onChange={e => setFormData({ ...formData, excluded_product_ids: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                Active Collection
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2 border rounded-lg font-medium hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg"
                                >
                                    <Save className="w-4 h-4" /> Save Collection
                                </button>
                            </div>
                        </div>
                    </div>
                </div >
            )
            }
        </div >
    );
}
