'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Plus, Trash2, Edit2, Check, X, Search, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function AttributesPage() {
    const [attributes, setAttributes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [editingAttribute, setEditingAttribute] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        label: '',
        code: '',
        type: 'text',
        image_url: '',
        options: [] // [{ label: 'Small', value: 'S' }]
    });

    const [selectedCategories, setSelectedCategories] = useState([]); // Currently selected in UI
    const [initialCategories, setInitialCategories] = useState([]); // Originally linked (for diffing)

    const [optionInput, setOptionInput] = useState({ label: '', value: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [attrRes, catRes] = await Promise.all([
                api.get('/products/attributes'),
                api.get('/products/categories/all')
            ]);

            if (attrRes.data.success) setAttributes(attrRes.data.data || []);
            if (catRes.data.success) setCategories(catRes.data.categories || []);

        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingAttribute(null);
        resetForm();
        setIsCreateModalOpen(true);
    };

    const handleEdit = async (attr) => {
        setEditingAttribute(attr);
        setFormData({
            label: attr.label,
            code: attr.code,
            type: attr.type,
            image_url: attr.image_url || '',
            options: attr.options || []
        });

        // Fetch linked categories
        try {
            const res = await api.get(`/products/attributes/${attr.id}/categories`);
            if (res.data.success) {
                const linkedIds = res.data.category_ids || [];
                setSelectedCategories(linkedIds);
                setInitialCategories(linkedIds);
            }
        } catch (error) {
            console.error('Failed to fetch linked categories', error);
            setSelectedCategories([]);
            setInitialCategories([]);
        }

        setIsCreateModalOpen(true);
    };

    const handleDelete = async (attr) => {
        if (!confirm(`Delete attribute "${attr.label}"? This may affect existing products.`)) return;

        try {
            await api.delete(`/products/attributes/${attr.id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete attribute', error);
            alert('Failed to delete attribute. It might be in use.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let attributeId;
            if (editingAttribute) {
                const res = await api.put(`/products/attributes/${editingAttribute.id}`, formData);
                attributeId = res.data.attribute.id;
            } else {
                const res = await api.post('/products/attributes', formData);
                attributeId = res.data.attribute.id;
            }

            // Calculate Diffs
            const added = selectedCategories.filter(id => !initialCategories.includes(id));
            const removed = initialCategories.filter(id => !selectedCategories.includes(id));

            // Process Adds
            for (const catId of added) {
                await api.post(`/products/categories/${catId}/attributes`, {
                    attribute_id: attributeId,
                    is_required: false
                });
            }

            // Process Removes (Only if editing, as new attributes have no initial)
            if (editingAttribute) {
                for (const catId of removed) {
                    await api.delete(`/products/categories/${catId}/attributes/${attributeId}`);
                }
            }

            fetchData();
            setIsCreateModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save attribute', error);
            alert('Failed to save attribute');
        }
    };

    const resetForm = () => {
        setFormData({
            label: '',
            code: '',
            type: 'text',
            image_url: '',
            options: []
        });
        setOptionInput({ label: '', value: '' });
        setSelectedCategories([]);
        setInitialCategories([]);
    };

    const addOption = () => {
        if (!optionInput.label || !optionInput.value) return;
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, optionInput]
        }));
        setOptionInput({ label: '', value: '' });
    };

    const removeOption = (index) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    // Auto-generate code from label (only for create)
    const handleLabelChange = (val) => {
        setFormData(prev => ({
            ...prev,
            label: val,
            code: (!editingAttribute && !prev.code) ? val.toLowerCase().replace(/[^a-z0-9_]+/g, '_') : prev.code
        }));
    };

    const toggleCategorySelection = (catId) => {
        setSelectedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const filteredAttributes = attributes.filter(attr =>
        attr.label.toLowerCase().includes(searchText.toLowerCase()) ||
        attr.code.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attributes</h1>
                    <p className="text-gray-500 mt-1">Manage global product attributes</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Create Attribute
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search attributes..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Attribute</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Code</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Options</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : filteredAttributes.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No attributes found. Create one to get started.</td></tr>
                        ) : (
                            filteredAttributes.map((attr) => (
                                <tr key={attr.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                        {attr.image_url ? (
                                            <img src={attr.image_url} alt="" className="w-8 h-8 rounded border object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-gray-100 border flex items-center justify-center text-gray-400">
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                        {attr.label}
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-600">{attr.code}</code>
                                    </td>
                                    <td className="px-6 py-4 capitalize">{attr.type}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {attr.options?.length > 0
                                            ? `${attr.options.length} options`
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(attr)}
                                                className="p-2 text-gray-400 hover:text-blue-600 transition hover:bg-blue-50 rounded-full"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(attr)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition hover:bg-red-50 rounded-full"
                                            >
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

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingAttribute ? 'Edit Attribute' : 'Create New Attribute'}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Label</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Size, Material"
                                        value={formData.label}
                                        onChange={(e) => handleLabelChange(e.target.value)}
                                    />
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                        placeholder="e.g. size"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="text">Text Input</option>
                                        <option value="number">Number Input</option>
                                        <option value="select">Select Dropdown</option>
                                        <option value="multiselect">Multi-Select</option>
                                        <option value="boolean">Yes/No Toggle</option>
                                    </select>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL (Optional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="https://..."
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        />
                                        {formData.image_url && <img src={formData.image_url} className="w-10 h-10 rounded border object-cover" />}
                                    </div>
                                </div>
                            </div>

                            {/* Options Editor for Select Types */}
                            {(formData.type === 'select' || formData.type === 'multiselect') && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>

                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g. Small)"
                                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                            value={optionInput.label}
                                            onChange={(e) => setOptionInput({ ...optionInput, label: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value (e.g. S)"
                                            className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
                                            value={optionInput.value}
                                            onChange={(e) => setOptionInput({ ...optionInput, value: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {formData.options.map((opt, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-100 text-sm">
                                                <span>{opt.label} <span className="text-gray-400 text-xs">({opt.value})</span></span>
                                                <button type="button" onClick={() => removeOption(i)}><X className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Category Linking */}
                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" /> Link to Categories
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Select categories to automatically attach this attribute to. (Existing links are reserved)</p>
                                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50 grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center gap-2 p-2 bg-white rounded border hover:border-blue-300 cursor-pointer text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(cat.id)}
                                                onChange={() => toggleCategorySelection(cat.id)}
                                                className="text-blue-600 rounded"
                                            />
                                            <span className="truncate">{cat.name}</span>
                                        </label>
                                    ))}
                                    {categories.length === 0 && <p className="col-span-2 text-center text-gray-400 text-xs p-2">No categories found</p>}
                                </div>
                            </div>

                        </form>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                {editingAttribute ? 'Save Changes' : 'Create Attribute'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
