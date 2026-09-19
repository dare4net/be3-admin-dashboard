"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Plus, Trash2, Edit2, Check, X, Search, Link as LinkIcon,
    Image as ImageIcon, ChevronRight, ChevronDown, Tag,
    Settings, Loader2, ArrowLeft, MoreVertical, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-100 rounded-xl min-h-[44px] focus-within:ring-4 focus-within:ring-blue-100 transition-all">
            {list.map((v, i) => (
                <span key={i} className="flex items-center gap-1 bg-white text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-50 shadow-sm">
                    {v}
                    <button type="button" onClick={() => removeTag(i)} className="hover:text-blue-900 transition-colors"><X className="w-3 h-3" /></button>
                </span>
            ))}
            <input
                className="flex-1 bg-transparent outline-none text-xs px-2 min-w-[100px] placeholder:text-gray-300"
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
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [affectedCategories, setAffectedCategories] = useState([]);
    const [isExclusionModalOpen, setIsExclusionModalOpen] = useState(false);
    const [exclusionConfig, setExclusionConfig] = useState({ clauseIndex: null, excludedIds: [] });

    // View state
    const [activeTab, setActiveTab] = useState('general'); // For Modal

    // Form State
    const [formData, setFormData] = useState({
        label: '', code: '', type: 'text', image_url: '',
        options: [], clauses: [], allow_custom: false
    });

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [initialCategories, setInitialCategories] = useState([]);
    const [optionInput, setOptionInput] = useState({ label: '', value: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // setLoading(true); // Disabled loading screen
            const [attrRes, catRes] = await Promise.all([
                api.get('/products/attributes'),
                api.get('/products/categories/all')
            ]);
            if (attrRes.data.success) {
                // Parse JSON strings for options and clauses
                const parsedAttributes = (attrRes.data.data || []).map(attr => ({
                    ...attr,
                    options: typeof attr.options === 'string' ? JSON.parse(attr.options || '[]') : (attr.options || []),
                    clauses: typeof attr.clauses === 'string' ? JSON.parse(attr.clauses || '[]') : (attr.clauses || [])
                }));
                setAttributes(parsedAttributes);
            }
            if (catRes.data.success) setCategories(catRes.data.categories || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
        // finally {
        //     setLoading(false);
        // }
    };

    const handleCreate = () => {
        setEditingAttribute(null);
        resetForm();
        setActiveTab('general');
        setIsCreateModalOpen(true);
    };

    const handleEdit = async (attr) => {
        setEditingAttribute(attr);
        setFormData({
            label: attr.label, code: attr.code, type: attr.type,
            image_url: attr.image_url || '', options: attr.options || [],
            clauses: attr.clauses || [],
            allow_custom: attr.allow_custom || false
        });
        setActiveTab('general');
        setIsCreateModalOpen(true);

        try {
            const res = await api.get(`/products/attributes/${attr.id}/categories`);
            if (res.data.success) {
                const linkedIds = res.data.category_ids || [];
                setSelectedCategories(linkedIds);
                setInitialCategories(linkedIds);
            }
        } catch (error) {
            console.error('Failed to fetch linked categories', error);
        }
        if (attr.id) fetchAffectedCategories(attr.id);
    };

    const fetchAffectedCategories = async (attrId) => {
        try {
            const res = await api.get(`/products/attributes/${attrId}/affected-categories`);
            if (res.data.success) setAffectedCategories(res.data.categories || []);
        } catch (error) {
            console.error('Failed to fetch affected categories', error);
        }
    };

    const handleDelete = async (attr) => {
        if (!confirm(`Permanently delete "${attr.label}"?`)) return;
        try {
            await api.delete(`/products/attributes/${attr.id}`);
            fetchData();
        } catch (error) {
            alert('Deletion failed. Attribute might be in active use.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
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

            const added = selectedCategories.filter(id => !initialCategories.includes(id));
            const removed = initialCategories.filter(id => !selectedCategories.includes(id));

            for (const catId of added) {
                await api.post(`/products/categories/${catId}/attributes`, { attribute_id: attributeId, is_required: false });
            }
            if (editingAttribute) {
                for (const catId of removed) {
                    await api.delete(`/products/categories/${catId}/attributes/${attributeId}`);
                }
            }

            fetchData();
            setIsCreateModalOpen(false);
            resetForm();
        } catch (error) {
            alert('Save failed');
        }
    };

    const resetForm = () => {
        setFormData({ label: '', code: '', type: 'text', image_url: '', options: [], clauses: [], allow_custom: false });
        setOptionInput({ label: '', value: '' });
        setSelectedCategories([]);
        setInitialCategories([]);
    };

    const updateClause = (index, field, val) => {
        const newClauses = [...formData.clauses];
        newClauses[index] = { ...newClauses[index], [field]: val };
        if (field === 'label' && !newClauses[index].name) {
            newClauses[index].name = val.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
        }
        setFormData(prev => ({ ...prev, clauses: newClauses }));
    };

    const filteredAttributes = attributes.filter(attr =>
        attr.label.toLowerCase().includes(searchText.toLowerCase()) ||
        attr.code.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 leading-none">Attributes</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Core Specification Library</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/10 text-[11px] font-black uppercase tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    New Definition
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-none flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <input
                    type="text"
                    placeholder="SCANNING LIBRARY..."
                    className="flex-1 px-4 py-3 bg-transparent outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-200"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            {/* Content Table / Grid */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-none overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Identity</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] hidden md:table-cell">Internal Key</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] hidden sm:table-cell">Interface</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] hidden lg:table-cell">Options</th>
                            <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {/* {loading ? (
                            <tr>
                                <td colSpan="5" className="p-20 text-center grayscale opacity-50">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Hydrating Catalog...</p>
                                </td>
                            </tr>
                        ) : */}
                        {filteredAttributes.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-4 opacity-50">
                                        <Tag className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Clean</p>
                                </td>
                            </tr>
                        ) : (
                            filteredAttributes.map((attr) => (
                                <tr key={attr.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-blue-100 transition-colors overflow-hidden">
                                                {attr.image_url ? (
                                                    <img src={attr.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : <Tag className="w-5 h-5 text-gray-300" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{attr.label}</p>
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1 md:hidden">{attr.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <code className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                            {attr.code}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{attr.type}</span>
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                // Ensure options is always an array
                                                let options = attr.options;
                                                if (typeof options === 'string') {
                                                    try {
                                                        options = JSON.parse(options);
                                                    } catch (e) {
                                                        options = [];
                                                    }
                                                }
                                                if (!Array.isArray(options)) options = [];

                                                return (
                                                    <>
                                                        {options.slice(0, 3).map((o, i) => (
                                                            <span key={i} className="text-[9px] font-black px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-400 rounded-md uppercase tracking-tight">
                                                                {o.label}
                                                            </span>
                                                        ))}
                                                        {options.length > 3 && (
                                                            <span className="text-[9px] font-black text-gray-300">+{options.length - 3}</span>
                                                        )}
                                                        {options.length === 0 && <span className="text-[9px] font-black text-gray-200 uppercase tracking-widest">Dynamic</span>}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleEdit(attr)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(attr)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 transition-all">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{editingAttribute ? 'Update' : 'Define'} Attribute</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Specification Drafting</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex border-b border-gray-100 bg-white">
                            {['general', 'logic', 'links'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={cn(
                                        "flex-1 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
                                        activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-300 hover:text-gray-600"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Label</label>
                                            <input
                                                type="text" required
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                                                placeholder="e.g. Size, Color"
                                                value={formData.label}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData({ ...formData, label: val, code: editingAttribute ? formData.code : val.toLowerCase().replace(/[^a-z0-9_]+/g, '_') });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal Hash</label>
                                            <input
                                                type="text" required
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-mono text-gray-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_') })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Interface Pattern</label>
                                            <select
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            >
                                                <option value="text">Text Input</option>
                                                <option value="number">Number Input</option>
                                                <option value="range">Range Input (Min/Max)</option>
                                                <option value="select">Dropdown Menu</option>
                                                <option value="multiselect">Multi-Selection</option>
                                                <option value="boolean">Binary Switch</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Interface Icon</label>
                                            <div className="flex gap-4">
                                                <input
                                                    type="url"
                                                    className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                                                    placeholder="https://..."
                                                    value={formData.image_url}
                                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                />
                                                {formData.image_url && <img src={formData.image_url} className="w-14 h-14 rounded-2xl object-cover border border-gray-100" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Options Section */}
                                    {(formData.type === 'select' || formData.type === 'multiselect' || formData.type === 'boolean') && (
                                        <div className="pt-6 border-t border-gray-100 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col gap-1">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Interface Options</label>
                                                    {formData.type === 'select' && (
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                className="w-3 h-3 rounded text-blue-600 focus:ring-blue-500"
                                                                checked={formData.allow_custom}
                                                                onChange={(e) => setFormData({ ...formData, allow_custom: e.target.checked })}
                                                            />
                                                            <span className="text-[9px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-widest transition-colors">Allow custom values</span>
                                                        </label>
                                                    )}
                                                </div>
                                                {formData.type !== 'boolean' && (
                                                    <button type="button" onClick={() => {
                                                        if (optionInput.label && optionInput.value) {
                                                            setFormData({ ...formData, options: [...formData.options, optionInput] });
                                                            setOptionInput({ label: '', value: '' });
                                                        }
                                                    }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest underline underline-offset-4">Add Entry</button>
                                                )}
                                            </div>

                                            {formData.type === 'boolean' ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">True State</label>
                                                        <input className="w-full bg-transparent border-none font-bold text-sm outline-none" value={formData.options[0]?.label || 'Yes'} onChange={(e) => {
                                                            const o = [...formData.options];
                                                            o[0] = { label: e.target.value, value: 'true' };
                                                            setFormData({ ...formData, options: o });
                                                        }} />
                                                    </div>
                                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">False State</label>
                                                        <input className="w-full bg-transparent border-none font-bold text-sm outline-none" value={formData.options[1]?.label || 'No'} onChange={(e) => {
                                                            const o = [...formData.options];
                                                            o[1] = { label: e.target.value, value: 'false' };
                                                            setFormData({ ...formData, options: o });
                                                        }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input placeholder="LABEL: e.g. SMALL" className="px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest outline-none" value={optionInput.label} onChange={(e) => setOptionInput({ ...optionInput, label: e.target.value.toUpperCase() })} />
                                                        <input placeholder="VALUE: e.g. S" className="px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono font-bold outline-none" value={optionInput.value} onChange={(e) => setOptionInput({ ...optionInput, value: e.target.value })} />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.options.map((opt, i) => (
                                                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-sm group">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">{opt.label}</span>
                                                                <button type="button" onClick={() => setFormData({ ...formData, options: formData.options.filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                                                            </div>
                                                        ))}
                                                        {formData.options.length === 0 && <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No entries defined</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'logic' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Intelligent Clauses</label>
                                        <button type="button" onClick={() => setFormData({ ...formData, clauses: [...formData.clauses, { name: '', label: '', operator: '=', value: [], prefix: '', suffix: '', seo_template: '', excluded_category_ids: [] }] })}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest underline underline-offset-4">New Clause</button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.clauses.map((clause, i) => (
                                            <div key={i} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 relative group">
                                                <button type="button" onClick={() => setFormData({ ...formData, clauses: formData.clauses.filter((_, idx) => idx !== i) })} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-600 hover:bg-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>

                                                <div className="grid grid-cols-2 gap-4 pr-12">
                                                    <div className="space-y-2">
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Label</label>
                                                        <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100" value={clause.label} onChange={(e) => updateClause(i, 'label', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Condition</label>
                                                        <div className="flex gap-2">
                                                            <select className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black outline-none" value={clause.operator} onChange={(e) => updateClause(i, 'operator', e.target.value)}>
                                                                <option value="=">=</option>
                                                                <option value=">">&gt;</option>
                                                                <option value="<">&lt;</option>
                                                                <option value="LIKE">LIKE</option>
                                                            </select>
                                                            <div className="flex-1">
                                                                <ChipInput values={clause.value} onChange={(val) => updateClause(i, 'value', val)} placeholder="Values..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Prefix and Suffix */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Prefix</label>
                                                        <input
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                                                            placeholder="e.g. 'Products with'"
                                                            value={clause.prefix || ''}
                                                            onChange={(e) => updateClause(i, 'prefix', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Suffix</label>
                                                        <input
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                                                            placeholder="e.g. 'available'"
                                                            value={clause.suffix || ''}
                                                            onChange={(e) => updateClause(i, 'suffix', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Category Exclusions */}
                                                <div className="pt-4 border-t border-gray-200/50">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Category Exclusions</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setExclusionConfig({
                                                                    clauseIndex: i,
                                                                    excludedIds: clause.excluded_category_ids || []
                                                                });
                                                                setIsExclusionModalOpen(true);
                                                            }}
                                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest underline underline-offset-4 hover:text-blue-700"
                                                        >
                                                            {clause.excluded_category_ids?.length > 0
                                                                ? `${clause.excluded_category_ids.length} Excluded`
                                                                : 'Manage Exclusions'}
                                                        </button>
                                                    </div>
                                                    {clause.excluded_category_ids?.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {categories
                                                                .filter(cat => clause.excluded_category_ids.includes(cat.id))
                                                                .map(cat => (
                                                                    <span key={cat.id} className="text-[9px] font-black px-2 py-1 bg-red-50 border border-red-100 text-red-600 rounded-lg uppercase tracking-tight">
                                                                        {cat.name}
                                                                    </span>
                                                                ))
                                                            }
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-4 border-t border-gray-200/50">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">SEO Template</label>
                                                    <textarea rows={2} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:ring-4 focus:ring-blue-100" placeholder="Meta content pattern..." value={clause.seo_template} onChange={(e) => updateClause(i, 'seo_template', e.target.value)} />
                                                </div>
                                            </div>
                                        ))}
                                        {formData.clauses.length === 0 && (
                                            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-[2rem]">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Dynamic Logic Defined</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'links' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Category Attachment</h4>
                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-6 leading-relaxed">Select contexts where this attribute should be active by default.</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                                            {categories.map(cat => (
                                                <label key={cat.id} className={cn(
                                                    "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                                    selectedCategories.includes(cat.id) ? "bg-white border-blue-200 shadow-sm" : "bg-white/40 border-gray-100 hover:border-blue-100"
                                                )}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 text-blue-600 rounded-lg border-gray-200 focus:ring-blue-500"
                                                        checked={selectedCategories.includes(cat.id)}
                                                        onChange={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                                                    />
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-700 truncate">{cat.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                            <button type="submit" onClick={handleSubmit} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/10">Publish Definition</button>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-10 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition">Discard</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Exclusion Modal */}
            {isExclusionModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Category Exclusions</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Select categories to exclude from this clause</p>
                            </div>
                            <button
                                onClick={() => setIsExclusionModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {categories.map(cat => (
                                    <label
                                        key={cat.id}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                            exclusionConfig.excludedIds.includes(cat.id)
                                                ? "bg-red-50 border-red-200 shadow-sm"
                                                : "bg-white border-gray-100 hover:border-red-100"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-red-600 rounded-lg border-gray-200 focus:ring-red-500"
                                            checked={exclusionConfig.excludedIds.includes(cat.id)}
                                            onChange={() => {
                                                setExclusionConfig(prev => ({
                                                    ...prev,
                                                    excludedIds: prev.excludedIds.includes(cat.id)
                                                        ? prev.excludedIds.filter(id => id !== cat.id)
                                                        : [...prev.excludedIds, cat.id]
                                                }));
                                            }}
                                        />
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-700 truncate">
                                            {cat.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                            <button
                                onClick={() => {
                                    const newClauses = [...formData.clauses];
                                    newClauses[exclusionConfig.clauseIndex] = {
                                        ...newClauses[exclusionConfig.clauseIndex],
                                        excluded_category_ids: exclusionConfig.excludedIds
                                    };
                                    setFormData({ ...formData, clauses: newClauses });
                                    setIsExclusionModalOpen(false);
                                }}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/10"
                            >
                                Apply Exclusions
                            </button>
                            <button
                                onClick={() => setIsExclusionModalOpen(false)}
                                className="px-10 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
