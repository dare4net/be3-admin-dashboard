"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Plus, Trash2, Edit2, Check, X, Search, List, Settings,
    Save, ArrowRight, ExternalLink, Eye, Package, Loader2,
    ChevronRight, ChevronDown, Filter, Info, BarChart3, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const [activeTab, setActiveTab] = useState('general'); // For Modal

    // Form State
    const [formData, setFormData] = useState({
        name: '', slug: '', description: '', rules: [],
        manual_product_ids: [], excluded_product_ids: [],
        is_active: true, seo: { title: '', description: '' },
        image_url: '', thumbnail_url: ''
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
            name: '', slug: '', description: '', image_url: '', thumbnail_url: '',
            rules: [], manual_product_ids: [], excluded_product_ids: [],
            is_active: true, seo: { title: '', description: '' }
        });
        setActiveTab('general');
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
        setActiveTab('general');
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this curated collection?')) return;
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
                params: { collection_id: col.id, type: 'product', per_page: 50 }
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
            alert('Save operation failed');
        }
    };

    const addRule = () => {
        setFormData(prev => ({
            ...prev,
            rules: [...prev.rules, { field: 'category', operator: 'in', value: [] }]
        }));
    };

    const updateRule = (index, field, val) => {
        const newRules = [...formData.rules];
        newRules[index][field] = val;
        if (field === 'field') {
            if (val === 'attribute_clause') {
                newRules[index].attribute_code = '';
                newRules[index].value = '';
            } else {
                newRules[index].operator = OPERATORS[val]?.[0]?.value || 'is';
                newRules[index].value = val === 'category' ? [] : '';
            }
        }
        setFormData(prev => ({ ...prev, rules: newRules }));
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 leading-none">Collections</h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Dynamic Merchandising Sets</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/10 text-[11px] font-black uppercase tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    New Curated Set
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-none overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Identification</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] hidden md:table-cell">Internal Hash</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] hidden sm:table-cell">Logic Count</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Exposure</th>
                            <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-20 text-center grayscale opacity-50">
                                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Hydrating Catalog...</p>
                                </td>
                            </tr>
                        ) : collections.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-20 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mx-auto mb-4 opacity-50">
                                        <List className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Clean</p>
                                </td>
                            </tr>
                        ) : (
                            collections.map((col) => (
                                <tr key={col.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-blue-100 transition-colors overflow-hidden">
                                                {col.thumbnail_url ? (
                                                    <img src={col.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                ) : <List className="w-5 h-5 text-gray-300" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 leading-tight">{col.name}</p>
                                                <div className="flex items-center gap-2 mt-1 underline-offset-4">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter sm:hidden">{col.rules?.length || 0} LOGIC HOOKS</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <code className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                            {col.slug}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase tracking-widest">
                                            {col.rules?.length || 0} Rules
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            col.is_active ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"
                                        )}>
                                            {col.is_active ? 'Live' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handlePreview(col)} className={cn("p-2 rounded-xl transition-all", previewCollection?.id === col.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50")}>
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(col)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(col.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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

            {/* Preview Panel (Be3 Styled) */}
            {previewCollection && (
                <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Package className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 leading-none">Scanning curated set: {previewCollection.name}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <Filter className="w-3 h-3" /> Live results for {previewCollection.rules?.length || 0} active conditions
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setPreviewCollection(null)} className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-gray-900 rounded-2xl transition-all shadow-sm">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 min-h-[300px]">
                        {isPreviewLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-30">
                                <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Compiling Manifest...</p>
                            </div>
                        ) : previewProducts.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-100">
                                <Package className="w-16 h-16 mx-auto mb-6 text-gray-100" />
                                <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Zero Matches Found In Core Inventory</h4>
                                <p className="text-xs text-gray-400 mt-2">Adjust your logic rules to broaden the capture area.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {previewProducts.map((product) => (
                                    <div key={product.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 hover:border-blue-500 hover:shadow-lg transition-all group">
                                        <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden border border-gray-50 flex-shrink-0">
                                            {product.metadata?.image_url ? (
                                                <img src={product.metadata.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : <Package className="w-8 h-8 text-gray-200 p-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-gray-900 truncate">{product.title}</p>
                                            <p className="text-[10px] font-mono font-black text-gray-400 uppercase mt-0.5 tracking-tighter">SKU: {product.metadata?.sku || 'NULL'}</p>
                                            <p className="text-xs font-black text-blue-600 mt-1">${parseFloat(product.metadata?.price || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden">
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 leading-none">{editingCollection ? 'Update' : 'Blueprint'} Curated Set</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Curatorial Engineering</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-3 text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-2xl border border-gray-100 shadow-sm"><X className="w-7 h-7" /></button>
                        </div>

                        <div className="flex border-b border-gray-100 bg-white">
                            {['general', 'logic', 'seo'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={cn(
                                        "flex-1 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b-4 transition-all",
                                        activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-300 hover:text-gray-600"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin">
                            {activeTab === 'general' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Handle</label>
                                            <input required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-bold focus:ring-8 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: !editingCollection ? e.target.value.toLowerCase().replace(/ /g, '-') : formData.slug })} placeholder="e.g. Summer Essentials" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal ID (Slug)</label>
                                            <input required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-mono text-gray-500 focus:ring-8 focus:ring-blue-100 outline-none transition-all"
                                                value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Curator's Notes / Description</label>
                                        <textarea rows={3} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm leading-relaxed focus:ring-8 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Public facing summary for this curated collection..." />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Hero Backdrop URL</label>
                                            <input className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-xs font-mono focus:ring-8 focus:ring-blue-100 outline-none"
                                                value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://..." />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Visual Index Thumb</label>
                                            <input className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-xs font-mono focus:ring-8 focus:ring-blue-100 outline-none"
                                                value={formData.thumbnail_url} onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })} placeholder="https://..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'logic' && (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4" /> Conditional Logic Engine
                                        </h3>
                                        <button type="button" onClick={addRule} className="text-[10px] font-black text-blue-600 uppercase tracking-widest underline underline-offset-8 decoration-2">Add Logical Hook</button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.rules.map((rule, i) => (
                                            <div key={i} className="group p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center relative transition-all hover:bg-white hover:shadow-xl hover:border-blue-100">
                                                <button type="button" onClick={() => setFormData({ ...formData, rules: formData.rules.filter((_, idx) => idx !== i) })}
                                                    className="absolute top-6 right-6 p-2 text-gray-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>

                                                <div className="flex flex-wrap gap-4 flex-1 pr-12">
                                                    <select className="px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm"
                                                        value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)}>
                                                        <option value="category">Class</option>
                                                        <option value="tag">Marker</option>
                                                        <option value="price">Valuation</option>
                                                        <option value="has_attribute">Presence</option>
                                                        <option value="attribute">Property</option>
                                                        <option value="attribute_clause">Logic Block</option>
                                                    </select>

                                                    {['attribute', 'attribute_clause', 'has_attribute'].includes(rule.field) && (
                                                        <select className="px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm"
                                                            value={rule.attribute_code || ''} onChange={e => {
                                                                const code = e.target.value;
                                                                const nr = [...formData.rules];
                                                                nr[i].attribute_code = code;
                                                                nr[i].value = rule.field === 'has_attribute' ? code : '';
                                                                setFormData({ ...formData, rules: nr });
                                                            }}>
                                                            <option value="">Spec...</option>
                                                            {attributes.map(a => <option key={a.id} value={a.code}>{a.label}</option>)}
                                                        </select>
                                                    )}

                                                    <div className="flex-1 min-w-[200px] flex gap-2">
                                                        {rule.field === 'category' ? (
                                                            <div className="flex-1 flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-2xl min-h-[50px]">
                                                                {categories.map(cat => (
                                                                    <label key={cat.id} className={cn(
                                                                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all border",
                                                                        rule.value?.includes(cat.id) ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
                                                                    )}>
                                                                        <input type="checkbox" className="hidden" checked={rule.value?.includes(cat.id)}
                                                                            onChange={e => {
                                                                                const v = e.target.checked ? [...(rule.value || []), cat.id] : (rule.value || []).filter(id => id !== cat.id);
                                                                                updateRule(i, 'value', v);
                                                                            }} />
                                                                        {cat.name}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <input className="w-full px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold shadow-sm outline-none"
                                                                placeholder="Target match..." value={rule.value || ''} onChange={e => updateRule(i, 'value', e.target.value)} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {formData.rules.length === 0 && (
                                            <div className="py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
                                                <BarChart3 className="w-16 h-16 mx-auto mb-6 text-gray-100" />
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Curatorial Conditions Found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'seo' && (
                                <div className="space-y-10">
                                    <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 space-y-6">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                            <Info className="w-4 h-4" /> Global Discovery Optimization
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Public Page Title</label>
                                                <input className="w-full px-6 py-4 bg-white border border-blue-50 rounded-2xl text-sm font-bold shadow-sm outline-none"
                                                    value={formData.seo.title} onChange={e => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Meta Description</label>
                                                <textarea rows={3} className="w-full px-6 py-4 bg-white border border-blue-50 rounded-2xl text-sm leading-relaxed shadow-sm outline-none"
                                                    value={formData.seo.description} onChange={e => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="p-10 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
                            <label className="flex items-center gap-3 cursor-pointer mr-auto mb-4 sm:mb-0">
                                <div className={cn("w-12 h-6 rounded-full transition-all relative", formData.is_active ? "bg-blue-600" : "bg-gray-200")}>
                                    <input type="checkbox" className="hidden" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                    <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", formData.is_active ? "left-7" : "left-1")} />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Deployment</span>
                            </label>
                            <button type="submit" onClick={handleSubmit} className="px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/10">Deploy Set</button>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition">Discard</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
