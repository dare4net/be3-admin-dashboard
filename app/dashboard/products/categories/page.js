"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import {
    Plus, Edit2, Trash2, Folder, ChevronRight, ChevronDown, Package,
    Tag, BarChart3, X, Settings, Search, ArrowLeft, Loader2, Image as ImageIcon,
    MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";
import ProductForm from "@/components/products/ProductForm";
import ImageUploader from "@/components/config/ImageUploader";

export default function CategoriesPage() {
    // Navigation State
    const [topLevelCategories, setTopLevelCategories] = useState([]);
    const [categoryChildren, setCategoryChildren] = useState({}); // { categoryId: [children] }
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    // Selection State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryDetails, setCategoryDetails] = useState(null);
    const [activeDetailTab, setActiveDetailTab] = useState('info');

    // View state for mobile
    const [showDetail, setShowDetail] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
    const [isAttrRelModalOpen, setIsAttrRelModalOpen] = useState(false);
    const [selectedAttrRel, setSelectedAttrRel] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('general');

    const [allCategories, setAllCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '', slug: '', parent_id: '', description: '', image_url: '',
        meta_description: '', og_title: '', og_description: '', og_image: '',
        og_type: 'product.group', twitter_card: 'summary_large_image',
        twitter_title: '', twitter_description: '', twitter_image: '',
        canonical_url: '', robots: 'index,follow', structured_data: null
    });

    const [attributes, setAttributes] = useState([]);
    const [linkedAttributes, setLinkedAttributes] = useState([]);
    const [initialLinkedAttributes, setInitialLinkedAttributes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [paginatedProducts, setPaginatedProducts] = useState([]);
    const [productsPagination, setProductsPagination] = useState({ page: 1, perPage: 20, total: 0, totalPages: 0 });
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Real-time Attribute Inheritance Sync for Category Creation
    useEffect(() => {
        const syncInheritance = async () => {
            // Only trigger if we have a parent and we're potentially creating or changing parent
            if (!formData.parent_id) {
                // If parent is cleared, remove all inherited attributes
                setLinkedAttributes(prev => prev.filter(a => !a.is_inherited));
                return;
            }

            try {
                const res = await api.get(`/products/categories/${formData.parent_id}/admin`);
                if (res.data.category && res.data.category.attributes) {
                    const parentAttrs = res.data.category.attributes
                        .filter(a => !a.is_ignored)
                        .map(a => ({
                            attribute_id: a.id, 
                            is_required: a.is_required, 
                            is_ignored: false,
                            is_inherited: true, 
                            source_category_name: res.data.category.name
                        }));

                    setLinkedAttributes(prev => {
                        // 1. Strip out previous inherited attributes
                        const withoutInherited = prev.filter(a => !a.is_inherited);
                        
                        // 2. Merge new parent attributes (respecting manual direct links)
                        const merged = [...withoutInherited];
                        parentAttrs.forEach(pa => {
                            const hasDirectOverride = merged.find(m => m.attribute_id === pa.attribute_id);
                            if (!hasDirectOverride) {
                                merged.push(pa);
                            }
                        });
                        return merged;
                    });
                }
            } catch (error) {
                console.error("Failed to sync parent attributes", error);
            }
        };

        syncInheritance();
    }, [formData.parent_id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [topRes, attrRes, allRes] = await Promise.all([
                api.get('/products/categories/top-level'),
                api.get('/products/attributes'),
                api.get('/products/categories/all')
            ]);

            if (topRes.data.success) setTopLevelCategories(topRes.data.categories);
            if (attrRes.data.success) setAttributes(attrRes.data.data || []);
            if (allRes.data.success) setAllCategories(allRes.data.categories || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExpandCategory = async (category) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category.id)) {
            newExpanded.delete(category.id);
        } else {
            newExpanded.add(category.id);
            if (!categoryChildren[category.id]) {
                try {
                    const res = await api.get(`/products/categories/${category.id}/children`);
                    if (res.data.success) {
                        setCategoryChildren(prev => ({ ...prev, [category.id]: res.data.categories }));
                    }
                } catch (error) {
                    console.error('Failed to fetch children', error);
                }
            }
        }
        setExpandedCategories(newExpanded);
    };

    const handleSelectCategory = async (category) => {
        setSelectedCategory(category);
        setActiveDetailTab('info');
        setPaginatedProducts([]);
        setProductsPagination({ page: 1, perPage: 20, total: 0, totalPages: 0 });
        setShowDetail(true);

        try {
            const res = await api.get(`/products/categories/${category.id}/details`);
            if (res.data.success) {
                setCategoryDetails(res.data.category);
            }
        } catch (error) {
            console.error('Failed to fetch category details', error);
        }
    };

    const fetchPaginatedProducts = async (page = 1) => {
        if (!selectedCategory) return;
        try {
            setLoadingProducts(true);
            const res = await api.get(`/products/categories/${selectedCategory.id}/products`, {
                params: { page, per_page: 20 }
            });
            if (res.data.success) {
                setPaginatedProducts(res.data.products);
                setProductsPagination(res.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch paginated products', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        if (activeDetailTab === 'products' && selectedCategory) {
            fetchPaginatedProducts(1);
        }
    }, [activeDetailTab, selectedCategory]);

    const handleCreate = (parentId = null) => {
        setEditingCategory(null);
        setFormData({
            name: '', slug: '', parent_id: parentId || '', description: '', image_url: '',
            meta_description: '', og_title: '', og_description: '', og_image: '',
            og_type: 'product.group', twitter_card: 'summary_large_image',
            twitter_title: '', twitter_description: '', twitter_image: '',
            canonical_url: '', robots: 'index,follow', structured_data: null
        });
        setLinkedAttributes([]);
        setInitialLinkedAttributes([]);
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleEdit = async () => {
        if (!categoryDetails) return;
        const category = categoryDetails;
        setEditingCategory(category);
        setFormData({
            name: category.name, slug: category.slug, parent_id: category.parent_id || '',
            description: category.description || '', image_url: category.image_url || '',
            meta_description: category.meta_description || '', og_title: category.og_title || '',
            og_description: category.og_description || '', og_image: category.og_image || '',
            og_type: category.og_type || 'product.group', twitter_card: category.twitter_card || 'summary_large_image',
            twitter_title: category.twitter_title || '', twitter_description: category.twitter_description || '',
            twitter_image: category.twitter_image || '', canonical_url: category.canonical_url || '',
            robots: category.robots || 'index,follow', structured_data: category.structured_data || null
        });
        setActiveTab('general');
        setIsModalOpen(true);

        try {
            const res = await api.get(`/products/categories/${category.id}/admin`);
            if (res.data.category && res.data.category.attributes) {
                const attrs = res.data.category.attributes.map(a => ({
                    attribute_id: a.id, is_required: a.is_required, is_ignored: a.is_ignored,
                    is_inherited: a.is_inherited, source_category_name: a.source_category_name
                }));
                setLinkedAttributes(attrs);
                setInitialLinkedAttributes(JSON.parse(JSON.stringify(attrs)));
            }
        } catch (error) {
            console.error("Failed to fetch linked attributes", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let categoryId;
            const payload = { ...formData, parent_id: formData.parent_id || null };
            if (editingCategory) {
                await api.put(`/products/categories/${editingCategory.id}`, payload);
                categoryId = editingCategory.id;
            } else {
                const res = await api.post('/products/categories', payload);
                categoryId = res.data.category.id;
            }

            // Attributes sync logic
            const currentIds = linkedAttributes.map(a => a.attribute_id);
            const initialIds = initialLinkedAttributes.map(a => a.attribute_id);
            const toRemove = initialIds.filter(id => !currentIds.includes(id));

            for (const attrId of toRemove) {
                await api.delete(`/products/categories/${categoryId}/attributes/${attrId}`);
            }
            // Save attributes with Smart Sync logic
            for (const attr of linkedAttributes) {
                const shouldDelete = (attr.is_ignored && !attr.is_inherited) ||
                    (!attr.is_ignored && attr.is_inherited);

                if (shouldDelete) {
                    await api.delete(`/products/categories/${categoryId}/attributes/${attr.attribute_id}`);
                } else {
                    await api.post(`/products/categories/${categoryId}/attributes`, {
                        attribute_id: attr.attribute_id,
                        is_required: attr.is_required,
                        is_ignored: attr.is_ignored
                    });
                }
            }

            await fetchInitialData();
            setIsModalOpen(false);
            if (selectedCategory && selectedCategory.id === categoryId) {
                handleSelectCategory(selectedCategory);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save category');
        }
    };

    const handleDelete = async () => {
        if (!categoryDetails) return;
        if (!confirm(`Delete category "${categoryDetails.name}"?`)) return;
        try {
            await api.delete(`/products/categories/${categoryDetails.id}`);
            setSelectedCategory(null);
            setCategoryDetails(null);
            setShowDetail(false);
            await fetchInitialData();
        } catch (error) {
            alert('Failed to delete category.');
        }
    };

    const handleEditAttributeRel = (attribute) => {
        setSelectedAttrRel({
            ...attribute,
            is_required: attribute.is_required,
            is_ignored: attribute.is_ignored
        });
        setIsAttrRelModalOpen(true);
    };

    const handleSaveAttributeRel = async () => {
        if (!selectedAttrRel || !categoryDetails) return;
        try {
            // Smart Sync Logic:
            // 1. If it's a DIRECT link and we are unlinking it, DELETE it.
            // 2. If it's an INHERITED link and we are re-linking it (is_ignored = false), DELETE it.
            //    (De-linking the local override record restores the natural parent inheritance)
            const shouldDelete = (selectedAttrRel.is_ignored && !selectedAttrRel.is_inherited) ||
                (!selectedAttrRel.is_ignored && selectedAttrRel.is_inherited);

            if (shouldDelete) {
                await api.delete(`/products/categories/${categoryDetails.id}/attributes/${selectedAttrRel.id}`);
            } else {
                await api.post(`/products/categories/${categoryDetails.id}/attributes`, {
                    attribute_id: selectedAttrRel.id,
                    is_required: selectedAttrRel.is_required,
                    is_ignored: selectedAttrRel.is_ignored
                });
            }
            setIsAttrRelModalOpen(false);
            handleSelectCategory(selectedCategory);
        } catch (error) {
            console.error(error);
            alert('Failed to update attribute relationship');
        }
    };

    const renderCategoryItem = (category, depth = 0) => {
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategory?.id === category.id;
        const children = categoryChildren[category.id] || [];

        return (
            <div key={category.id} className="w-full">
                <div
                    onClick={() => handleSelectCategory(category)}
                    className={cn(
                        "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border border-transparent",
                        isSelected ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-700"
                    )}
                    style={{ marginLeft: `${depth * 1}rem` }}
                >
                    {category.has_children ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExpandCategory(category);
                            }}
                            className={cn("p-1 rounded-md transition-colors", isSelected ? "hover:bg-blue-500" : "hover:bg-gray-200")}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}

                    <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className={cn("w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border", isSelected ? "bg-blue-500 border-blue-400" : "bg-white border-gray-100")}>
                            {category.image_url ? (
                                <img src={category.image_url} className="w-full h-full rounded-lg object-cover" alt="" />
                            ) : (
                                <Folder className={cn("w-5 h-5", isSelected ? "text-blue-100" : "text-gray-400")} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm block truncate">{category.name}</span>
                            <span className={cn("text-[10px] uppercase font-black tracking-widest block", isSelected ? "text-blue-200" : "text-gray-400")}>
                                {category.product_count || 0} Products
                            </span>
                        </div>
                    </div>
                </div>

                {isExpanded && children.length > 0 && (
                    <div className="mt-1 space-y-1">
                        {children.map(child => renderCategoryItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Sidebar / Master Panel */}
            <div className={cn(
                "w-full md:w-96 flex-shrink-0 flex flex-col border-r border-gray-100 bg-white transition-all duration-300",
                showDetail ? "hidden md:flex" : "flex"
            )}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Categories</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Classification Library</p>
                    </div>
                    <button
                        onClick={() => handleCreate()}
                        className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 grayscale opacity-50">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing...</p>
                        </div>
                    ) : topLevelCategories.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                            <Folder className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Library Empty</p>
                        </div>
                    ) : (
                        topLevelCategories.map(cat => renderCategoryItem(cat))
                    )}
                </div>
            </div>

            {/* Detail Panel */}
            <div className={cn(
                "flex-1 flex flex-col bg-gray-50/30 transition-all duration-300",
                !showDetail ? "hidden md:flex" : "flex"
            )}>
                {!selectedCategory ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-50 grayscale">
                        <div className="w-24 h-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center mb-6">
                            <Folder className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-gray-900 font-black text-xl mb-2">Category Detail</h3>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select a listing from the library to manage</p>
                    </div>
                ) : !categoryDetails ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hydrating Details...</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Detail Header */}
                        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowDetail(false)}
                                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-900"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-black text-gray-900 leading-tight">{categoryDetails.name}</h2>
                                    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                                        {categoryDetails.breadcrumb?.map((crumb, i) => (
                                            <div key={crumb.id} className="flex items-center gap-1.5 grayscale opacity-50">
                                                {i > 0 && <ChevronRight className="w-3 h-3" />}
                                                <span className="text-[9px] font-black uppercase tracking-widest">{crumb.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleEdit} className="p-2 text-gray-400 hover:text-blue-600 transition border border-transparent hover:border-blue-100 rounded-lg hover:bg-blue-50">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 transition border border-transparent hover:border-red-100 rounded-lg hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                            {/* Fast Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-none">
                                    <div className="flex items-center gap-3 text-blue-600 mb-2">
                                        <Package className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Inventory</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{categoryDetails.total_product_count}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{categoryDetails.direct_product_count} Direct Listings</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-none">
                                    <div className="flex items-center gap-3 text-green-600 mb-2">
                                        <Folder className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Sub-Folders</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{categoryDetails.subcategories?.length || 0}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Recursive structure</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-none col-span-2 lg:col-span-1">
                                    <div className="flex items-center gap-3 text-purple-600 mb-2">
                                        <Tag className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Schema Fields</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{categoryDetails.attributes?.filter(a => !a.is_ignored).length || 0}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Custom specifications</p>
                                </div>
                            </div>

                            {/* View Tabs */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-none overflow-hidden">
                                <div className="flex border-b border-gray-100 p-1 bg-gray-50/50">
                                    {['info', 'products', 'attributes'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveDetailTab(tab)}
                                            className={cn(
                                                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                                                activeDetailTab === tab
                                                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                                    : 'text-gray-400 hover:text-gray-600'
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 min-h-[400px]">
                                    {activeDetailTab === 'info' && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="w-full md:w-32 h-32 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex-shrink-0">
                                                    {categoryDetails.image_url ? (
                                                        <img src={categoryDetails.image_url} className="w-full h-full object-cover" alt="" />
                                                    ) : <Folder className="w-full h-full p-10 text-gray-200" />}
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Internal Handle</label>
                                                        <code className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-mono text-gray-600">{categoryDetails.slug}</code>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                                                        <p className="text-sm text-gray-700 leading-relaxed font-medium">{categoryDetails.description || 'No descriptive information provided.'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {categoryDetails.subcategories?.length > 0 && (
                                                <div className="pt-6 border-t border-gray-50">
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Immediate Children</label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {categoryDetails.subcategories.map(sub => (
                                                            <div
                                                                key={sub.id}
                                                                onClick={() => handleSelectCategory(sub)}
                                                                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group"
                                                            >
                                                                <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                                                                    {sub.image_url ? <img src={sub.image_url} className="w-full h-full object-cover" alt="" /> : <Folder className="w-full h-full p-2.5 text-gray-200" />}
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 truncate">{sub.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeDetailTab === 'products' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Inventory List</h3>
                                                <button
                                                    onClick={() => setIsCreateProductModalOpen(true)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-none"
                                                >
                                                    <Plus className="w-3 h-3" /> Insert Product
                                                </button>
                                            </div>

                                            {loadingProducts ? (
                                                <div className="text-center py-20 grayscale opacity-50">
                                                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Scanning Catalog...</p>
                                                </div>
                                            ) : paginatedProducts.length > 0 ? (
                                                <div className="space-y-4">
                                                    {paginatedProducts.map(product => (
                                                        <div key={product.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 bg-white border border-gray-100 rounded-[24px] hover:border-blue-500 transition-all group shadow-sm">
                                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                                                                    {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-full h-full p-3 text-gray-200" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start sm:block">
                                                                        <p className="font-black text-[13px] text-gray-900 truncate leading-tight uppercase tracking-tight">{product.name}</p>
                                                                        <span className="sm:hidden text-[13px] font-black text-blue-600">${product.price}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                                                        <span className="hidden sm:inline text-[11px] font-black text-blue-600 uppercase tracking-widest">${product.price}</span>
                                                                        {product.sku && (
                                                                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter truncate max-w-[80px]" title={product.sku}>
                                                                                #{product.sku.length > 8 ? `${product.sku.substring(0, 8)}...` : product.sku}
                                                                            </span>
                                                                        )}
                                                                        <span className={cn(
                                                                            "px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded",
                                                                            product.status === 'active' ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"
                                                                        )}>
                                                                            {product.status || 'Draft'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Actions Row */}
                                                            <div className="flex items-center justify-end gap-2 pt-3 sm:pt-0 border-t border-gray-50 sm:border-0">
                                                                <Link
                                                                    href={`/dashboard/products/${product.id}/edit`}
                                                                    className="flex-1 sm:flex-none text-center px-4 py-2 sm:p-2 bg-gray-50 sm:bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-100 sm:border-transparent hover:border-blue-100"
                                                                >
                                                                    <span className="sm:hidden">Edit</span>
                                                                    <Edit2 className="hidden sm:block w-4 h-4" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleDeleteProduct(product.id)}
                                                                    className="flex-1 sm:flex-none text-center px-4 py-2 sm:p-2 bg-red-50 sm:bg-transparent text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100 sm:border-transparent"
                                                                >
                                                                    <span className="sm:hidden">Delete</span>
                                                                    <Trash2 className="hidden sm:block w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {productsPagination.totalPages > 1 && (
                                                        <div className="flex justify-center items-center gap-4 pt-6">
                                                            <button
                                                                onClick={() => fetchPaginatedProducts(productsPagination.page - 1)}
                                                                disabled={productsPagination.page === 1}
                                                                className="p-2 bg-white border border-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-50"
                                                            >
                                                                <ChevronRight className="w-4 h-4 rotate-180" />
                                                            </button>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Page {productsPagination.page} / {productsPagination.totalPages}</span>
                                                            <button
                                                                onClick={() => fetchPaginatedProducts(productsPagination.page + 1)}
                                                                disabled={productsPagination.page === productsPagination.totalPages}
                                                                className="p-2 bg-white border border-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-50"
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Clean</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeDetailTab === 'attributes' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Active Data Model</h3>
                                                <button onClick={handleEdit} className="text-[10px] font-black text-blue-600 uppercase tracking-widest underline">Configure Schema</button>
                                            </div>
                                            <div className="space-y-3">
                                                {categoryDetails.attributes?.filter(a => !a.is_ignored).map(attr => (
                                                    <div key={attr.id} className={cn(
                                                        "p-4 rounded-2xl border flex items-center justify-between group transition-all",
                                                        attr.is_inherited ? "bg-gray-50/50 border-gray-100" : "bg-white border-blue-100 shadow-sm"
                                                    )}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                                                                {attr.image_url ? <img src={attr.image_url} className="w-full h-full object-cover rounded-xl" alt="" /> : <Tag className="w-5 h-5 text-gray-400" />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm text-gray-900">{attr.label}</span>
                                                                    {attr.is_required && <span className="text-[8px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded-full font-black uppercase tracking-widest border border-red-100">Required</span>}
                                                                </div>
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 block">
                                                                    {attr.type} • {attr.is_inherited ? `Inherited from ${attr.source_category_name || 'Parent'}` : 'Direct Field'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditAttributeRel(attr); }}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 group"
                                                        >
                                                            <Settings className="w-4 h-4 text-gray-200 group-hover:text-blue-600 transition-colors" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {categoryDetails.attributes?.filter(a => !a.is_ignored).length === 0 && (
                                                    <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                                                        <Tag className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No Schema Fields</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reuse Modals (Simplified here for focus, you'd keep original if logic is needed) */}
            {isCreateProductModalOpen && (
                <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Insert Product</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Under {categoryDetails?.name}</p>
                            </div>
                            <button onClick={() => setIsCreateProductModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <ProductForm
                                categoryId={categoryDetails?.id}
                                onSuccess={() => {
                                    setIsCreateProductModalOpen(false);
                                    fetchPaginatedProducts(1);
                                }}
                                onCancel={() => setIsCreateProductModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{editingCategory ? 'Update Category' : 'Draft Category'}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Classification Management</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-all"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex border-b border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-none">
                            {['general', 'attributes', 'seo'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={cn(
                                        "flex-1 md:flex-none px-8 py-3.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                                        activeTab === t ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                            {activeTab === 'general' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Name *</label>
                                        <input type="text" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="e.g. Footwear" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Parent Context</label>
                                            <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all capitalize"
                                                value={formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}>
                                                <option value="">Top Level Root</option>
                                                {allCategories.filter(c => c.id !== editingCategory?.id).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">URL Handle</label>
                                            <input type="text" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 focus:ring-4 focus:ring-blue-100 outline-none"
                                                value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                                        </div>
                                    </div>
                                    <ImageUploader 
                                        label="Visual Icon"
                                        value={formData.image_url}
                                        onChange={(url) => setFormData({ ...formData, image_url: url })}
                                        folder="categories"
                                    />
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Summary</label>
                                        <textarea rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                                            value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Internal categorization notes..." />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'attributes' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Connect Attributes</label>
                                        <span className="text-sm text-gray-400 font-bold">{linkedAttributes.length} Active Fields</span>
                                    </div>
                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Linked Attributes</h4>
                                        <div className="space-y-2">
                                            {linkedAttributes.filter(attr => !attr.is_ignored).map((attr, idx) => {
                                                const masterAttr = attributes.find(a => a.id === attr.attribute_id);
                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-xl group transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                                {masterAttr?.image_url ? <img src={masterAttr.image_url} className="w-full h-full object-cover rounded-lg" /> : <Tag className="w-4 h-4 text-gray-400" />}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-bold text-gray-900">{masterAttr?.label || 'Loading...'}</span>
                                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">{masterAttr?.type}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={attr.is_required} onChange={() => {
                                                                    const n = [...linkedAttributes];
                                                                    n[idx].is_required = !n[idx].is_required;
                                                                    setLinkedAttributes(n);
                                                                }} />
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Required</span>
                                                            </label>
                                                            {!attr.is_inherited && (
                                                                <button type="button" onClick={() => setLinkedAttributes(linkedAttributes.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-600 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {linkedAttributes.length === 0 && <p className="text-center py-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest">No Linked Fields</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available from Master</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {attributes.filter(a => {
                                                const link = linkedAttributes.find(l => l.attribute_id === a.id);
                                                return !link || link.is_ignored;
                                            }).map(a => (
                                                <button key={a.id} type="button" onClick={() => {
                                                    const existing = linkedAttributes.find(l => l.attribute_id === a.id);
                                                    if (existing) {
                                                        // Reactivate an ignored link
                                                        setLinkedAttributes(linkedAttributes.map(l => l.attribute_id === a.id ? { ...l, is_ignored: false } : l));
                                                    } else {
                                                        // Add a brand new link
                                                        setLinkedAttributes([...linkedAttributes, { attribute_id: a.id, is_required: false, is_ignored: false }]);
                                                    }
                                                }}
                                                    className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 group text-left transition-all">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white transition-colors">
                                                        <Tag className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-800">{a.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'seo' && (
                                <div className="space-y-6">
                                    <SEOMetaEditor page={formData} onChange={(u) => setFormData(u)} />
                                </div>
                            )}
                        </form>

                        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                            <button type="submit" onClick={handleSubmit} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10">Commit Changes</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Discard</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Attribute Relationship Modal */}
            {isAttrRelModalOpen && selectedAttrRel && (
                <div className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <Tag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Field Settings</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Schema Relationship</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAttrRelModalOpen(false)} className="p-3 text-gray-400 hover:text-gray-900 bg-white border border-gray-100 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Context Card */}
                            <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Attribute</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900">{selectedAttrRel.label}</span>
                                    <span className="text-[9px] px-2 py-0.5 bg-white border border-gray-100 rounded-full font-black text-gray-400 uppercase tracking-widest uppercase">{selectedAttrRel.type}</span>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Context:</span>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                        selectedAttrRel.is_inherited ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                    )}>
                                        {selectedAttrRel.is_inherited ? `Inherited from ${selectedAttrRel.source_category_name || 'Parent'}` : 'Direct Mapping'}
                                    </span>
                                </div>
                            </div>

                            {/* Property Toggles */}
                            <div className="space-y-4">
                                <div
                                    onClick={() => setSelectedAttrRel(prev => ({ ...prev, is_required: !prev.is_required }))}
                                    className={cn(
                                        "p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group",
                                        selectedAttrRel.is_required ? "bg-white border-blue-600 shadow-sm" : "bg-white border-gray-100 hover:border-blue-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-colors", selectedAttrRel.is_required ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-300 group-hover:text-blue-400")}>
                                            <Settings className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="block font-black text-xs text-gray-900 uppercase tracking-widest">Require Field</span>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Make this field mandatory</p>
                                        </div>
                                    </div>
                                    <div className={cn("w-10 h-6 rounded-full relative transition-colors p-1", selectedAttrRel.is_required ? "bg-blue-600" : "bg-gray-100")}>
                                        <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", selectedAttrRel.is_required ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                </div>

                                <div
                                    onClick={() => setSelectedAttrRel(prev => ({ ...prev, is_ignored: !prev.is_ignored }))}
                                    className={cn(
                                        "p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group",
                                        selectedAttrRel.is_ignored ? "bg-white border-red-600 shadow-sm" : "bg-white border-gray-100 hover:border-red-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-colors", selectedAttrRel.is_ignored ? "bg-red-600 text-white" : "bg-gray-50 text-gray-300 group-hover:text-red-400")}>
                                            <X className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="block font-black text-xs text-gray-900 uppercase tracking-widest text-red-600">Unlink Field</span>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Remove or ignore this field</p>
                                        </div>
                                    </div>
                                    <div className={cn("w-10 h-6 rounded-full relative transition-colors p-1", selectedAttrRel.is_ignored ? "bg-red-600" : "bg-gray-100")}>
                                        <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", selectedAttrRel.is_ignored ? "translate-x-4" : "translate-x-0")} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                            <button onClick={handleSaveAttributeRel} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Update Field Registry</button>
                            <button onClick={() => setIsAttrRelModalOpen(false)} className="px-6 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Discard</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
