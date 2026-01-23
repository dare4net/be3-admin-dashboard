'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Plus, Trash2, Edit2, Check, X, Search, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

const ChipInput = ({ values = [], onChange, placeholder }) => {
    const [inputValue, setInputValue] = useState("");
    const list = Array.isArray(values) ? values : (values ? [values] : []);

    const addTag = (val) => {
        const clean = val.trim();
        if (clean && !list.includes(clean)) {
            onChange([...list, clean]);
        }
        setInputValue("");
    };

    const removeTag = (index) => {
        onChange(list.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-wrap gap-1 p-1.5 border border-gray-300 rounded-lg min-h-[38px] bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
            {list.map((v, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold border border-blue-100">
                    {v}
                    <button type="button" onClick={() => removeTag(i)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                </span>
            ))}
            <input
                className="flex-1 outline-none text-sm px-1 min-w-[80px]"
                placeholder={list.length === 0 ? placeholder : ""}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(inputValue);
                    }
                    if (e.key === 'Backspace' && !inputValue && list.length > 0) {
                        removeTag(list.length - 1);
                    }
                }}
            />
        </div>
    );
};

export default function AttributesPage() {
    const [attributes, setAttributes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [affectedCategories, setAffectedCategories] = useState([]); // For the current attribute being edited
    const [isExclusionModalOpen, setIsExclusionModalOpen] = useState(false);
    const [exclusionConfig, setExclusionConfig] = useState({ clauseIndex: null, excludedIds: [] });

    // Form State
    const [formData, setFormData] = useState({
        label: '',
        code: '',
        type: 'text',
        image_url: '',
        options: [], // [{ label: 'Small', value: 'S' }]
        clauses: [] // [{ name: 'under_30', label: 'Under $30', operator: '<', value: '30', prefix: 'Steal: ', suffix: ' under $30', seo_template: '' }]
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
            options: attr.options || [],
            clauses: attr.clauses || []
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
        if (attr.id) {
            fetchAffectedCategories(attr.id);
        }
    };

    const fetchAffectedCategories = async (attrId) => {
        try {
            const res = await api.get(`/products/attributes/${attrId}/affected-categories`);
            if (res.data.success) {
                setAffectedCategories(res.data.categories || []);
            }
        } catch (error) {
            console.error('Failed to fetch affected categories', error);
        }
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
            // Prepare payload - ensure options is valid JSON
            const payload = {
                ...formData,
                options: JSON.stringify(formData.options),
                clauses: JSON.stringify(formData.clauses)
            };

            let attributeId;
            if (editingAttribute) {
                const res = await api.put(`/products/attributes/${editingAttribute.id}`, payload);
                attributeId = res.data.attribute.id;
            } else {
                const res = await api.post('/products/attributes', payload);
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
            options: [],
            clauses: []
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

    const addClause = () => {
        setFormData(prev => ({
            ...prev,
            clauses: [...prev.clauses, { name: '', label: '', operator: '=', value: '', prefix: '', suffix: '', seo_template: '', excluded_category_ids: [] }]
        }));
    };

    const removeClause = (index) => {
        setFormData(prev => ({
            ...prev,
            clauses: prev.clauses.filter((_, i) => i !== index)
        }));
    };

    const openExclusions = (index) => {
        setExclusionConfig({
            clauseIndex: index,
            excludedIds: formData.clauses[index].excluded_category_ids || []
        });
        setIsExclusionModalOpen(true);
    };

    const toggleExclusion = (catId) => {
        setExclusionConfig(prev => {
            const nextIds = prev.excludedIds.includes(catId)
                ? prev.excludedIds.filter(id => id !== catId)
                : [...prev.excludedIds, catId];

            // Sync with formData immediately
            const newClauses = [...formData.clauses];
            newClauses[prev.clauseIndex] = { ...newClauses[prev.clauseIndex], excluded_category_ids: nextIds };
            setFormData(f => ({ ...f, clauses: newClauses }));

            return { ...prev, excludedIds: nextIds };
        });
    };

    const updateClause = (index, field, val) => {
        const newClauses = [...formData.clauses];
        newClauses[index] = { ...newClauses[index], [field]: val };

        // Auto-generate name from label if name is empty
        if (field === 'label' && !newClauses[index].name) {
            newClauses[index].name = val.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
        }

        setFormData(prev => ({ ...prev, clauses: newClauses }));
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

                            {/* Clauses Editor */}
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-bold text-blue-900 flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Clauses (Dynamic Filtering & SEO)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addClause}
                                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add Clause
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                    {formData.clauses.map((clause, i) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-blue-200 relative group">
                                            <button
                                                type="button"
                                                onClick={() => removeClause(i)}
                                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>

                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Clause Label</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Under $30"
                                                        className="w-full px-2 py-1 text-sm border rounded"
                                                        value={clause.label}
                                                        onChange={(e) => updateClause(i, 'label', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Internal Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. budget_30"
                                                        className="w-full px-2 py-1 text-sm border rounded font-mono"
                                                        value={clause.name}
                                                        onChange={(e) => updateClause(i, 'name', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Operator</label>
                                                    <select
                                                        className="w-full px-2 py-1 text-sm border rounded"
                                                        value={clause.operator}
                                                        onChange={(e) => updateClause(i, 'operator', e.target.value)}
                                                    >
                                                        <option value="=">=</option>
                                                        <option value=">">&gt;</option>
                                                        <option value="<">&lt;</option>
                                                        <option value=">=">&gt;=</option>
                                                        <option value="<=">&lt;=</option>
                                                        <option value="LIKE">Contains (LIKE)</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Matching Value(s)</label>
                                                    <ChipInput
                                                        placeholder="Enter value..."
                                                        values={clause.value}
                                                        onChange={(val) => updateClause(i, 'value', val)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Title Prefix</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Best "
                                                        className="w-full px-2 py-1 text-sm border rounded"
                                                        value={clause.prefix}
                                                        onChange={(e) => updateClause(i, 'prefix', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Title Suffix</label>
                                                    <input
                                                        type="text"
                                                        placeholder=" for Summer"
                                                        className="w-full px-2 py-1 text-sm border rounded"
                                                        value={clause.suffix}
                                                        onChange={(e) => updateClause(i, 'suffix', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">SEO Description Template</label>
                                                <div className="flex gap-2 items-start">
                                                    <textarea
                                                        rows="2"
                                                        placeholder="Use [Category], [Attribute], [Title] tags..."
                                                        className="w-full px-2 py-1 text-sm border rounded"
                                                        value={clause.seo_template}
                                                        onChange={(e) => updateClause(i, 'seo_template', e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => openExclusions(i)}
                                                        className={`flex flex-col items-center gap-1 p-2 border rounded-lg hover:bg-gray-50 transition min-w-[80px] ${clause.excluded_category_ids?.length > 0 ? 'border-orange-200 bg-orange-50' : ''}`}
                                                    >
                                                        <Search className={`w-4 h-4 ${clause.excluded_category_ids?.length > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                                                        <span className="text-[10px] uppercase font-bold text-gray-600">Exclude</span>
                                                        {clause.excluded_category_ids?.length > 0 && (
                                                            <span className="text-[10px] bg-orange-200 text-orange-800 px-1 rounded-full">
                                                                {clause.excluded_category_ids.length}
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.clauses.length === 0 && (
                                        <p className="text-center text-blue-300 text-xs py-4 border-2 border-dashed border-blue-100 rounded-lg">
                                            No clauses defined. Add one to enable dynamic filtering.
                                        </p>
                                    )}
                                </div>
                            </div>

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

            {/* Exclusion Modal */}
            {isExclusionModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-900">Category Exclusions</h4>
                                <p className="text-xs text-gray-500">Stop this clause from appearing in specific categories or their children.</p>
                            </div>
                            <button onClick={() => setIsExclusionModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {affectedCategories.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 text-sm italic">This attribute isn't linked to any categories yet.</p>
                                </div>
                            ) : (
                                affectedCategories.map(cat => (
                                    <div
                                        key={cat.id}
                                        className={`flex justify-between items-center p-3 rounded-lg border transition cursor-pointer group ${exclusionConfig.excludedIds.includes(cat.id) ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                                        onClick={() => toggleExclusion(cat.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm">
                                                <p className={`font-medium ${exclusionConfig.excludedIds.includes(cat.id) ? 'text-orange-900' : 'text-gray-900'}`}>
                                                    {cat.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Depth: {cat.depth} {cat.is_direct ? '• Direct' : '• Inherited'}</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${exclusionConfig.excludedIds.includes(cat.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 bg-white group-hover:border-blue-400'}`}>
                                            {exclusionConfig.excludedIds.includes(cat.id) && <X className="w-3 h-3" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-center">
                            <button
                                onClick={() => setIsExclusionModalOpen(false)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-black transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
