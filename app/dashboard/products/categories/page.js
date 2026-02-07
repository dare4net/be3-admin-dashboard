"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Folder, ChevronRight, ChevronDown, Package, Tag, BarChart3, X, Settings, Search } from "lucide-react";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";
import ProductForm from "@/components/products/ProductForm";

export default function CategoriesPage() {
    // Navigation State
    const [topLevelCategories, setTopLevelCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [categoryChildren, setCategoryChildren] = useState({}); // { categoryId: [children] }

    // Selection State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryDetails, setCategoryDetails] = useState(null);
    const [activeDetailTab, setActiveDetailTab] = useState('info');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'attributes' | 'seo'

    // Additional state for parent selector
    const [allCategories, setAllCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: '',
        description: '',
        image_url: '',
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

    const [attributes, setAttributes] = useState([]);
    const [linkedAttributes, setLinkedAttributes] = useState([]);
    const [initialLinkedAttributes, setInitialLinkedAttributes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Products pagination state
    const [paginatedProducts, setPaginatedProducts] = useState([]);
    const [productsPagination, setProductsPagination] = useState({ page: 1, perPage: 20, total: 0, totalPages: 0 });
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Expanded attributes for clause visibility
    const [expandedAttributes, setExpandedAttributes] = useState(new Set());

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [topRes, attrRes, allRes] = await Promise.all([
                api.get('/products/categories/top-level'),
                api.get('/products/attributes'),
                api.get('/products/categories/all') // Fetch all for parent selector
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
            // Collapse
            newExpanded.delete(category.id);
        } else {
            // Expand and fetch children if not already loaded
            newExpanded.add(category.id);

            if (!categoryChildren[category.id]) {
                try {
                    const res = await api.get(`/products/categories/${category.id}/children`);
                    if (res.data.success) {
                        setCategoryChildren(prev => ({
                            ...prev,
                            [category.id]: res.data.categories
                        }));
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
            name: '',
            slug: '',
            parent_id: parentId || '',
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

    const handleEdit = async () => {
        if (!categoryDetails) return;
        const category = categoryDetails;

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

            await fetchInitialData();
            setIsModalOpen(false);

            // Refresh selected category if it was the one edited
            if (selectedCategory && selectedCategory.id === categoryId) {
                const res = await api.get(`/products/categories/${categoryId}/details`);
                if (res.data.success) {
                    setCategoryDetails(res.data.category);
                }
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
            await fetchInitialData();
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

    const handleDeleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            await api.delete(`/products/${productId}`);
            // Remove from local list
            setPaginatedProducts(prev => prev.filter(p => p.id !== productId));
            // Update counts locally (approximate)
            setCategoryDetails(prev => ({
                ...prev,
                total_product_count: Math.max(0, prev.total_product_count - 1),
                direct_product_count: Math.max(0, prev.direct_product_count - 1) // Assuming direct for simplicity
            }));
        } catch (error) {
            console.error("Failed to delete product", error);
            alert("Failed to delete product");
        }
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

    // Render hierarchical category in master panel
    const renderCategoryItem = (category, depth = 0) => {
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategory?.id === category.id;
        const children = categoryChildren[category.id] || [];

        return (
            <div key={category.id}>
                <div
                    className={`
                        flex items-center gap-2 p-2 rounded cursor-pointer group transition
                        ${isSelected ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-gray-100'}
                    `}
                    style={{ paddingLeft: `${depth * 20 + 8}px` }}
                >
                    {category.has_children ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleExpandCategory(category);
                            }}
                            className="p-0.5 hover:bg-gray-200 rounded"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    ) : (
                        <div className="w-5" />
                    )}

                    <div
                        className="flex-1 flex items-center gap-2"
                        onClick={() => handleSelectCategory(category)}
                    >
                        {category.image_url ? (
                            <img src={category.image_url} className="w-6 h-6 rounded object-cover" alt="" />
                        ) : (
                            <Folder className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-medium text-sm flex-1">{category.name}</span>
                        {category.product_count > 0 && (
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{category.product_count}</span>
                        )}
                    </div>
                </div>

                {isExpanded && children.length > 0 && (
                    <div>
                        {children.map(child => renderCategoryItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Product Categories</h1>
                    <p className="text-gray-600 text-sm">Organize products and define their attributes</p>
                </div>
                <button
                    onClick={() => handleCreate()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Create Category
                </button>
            </div>

            {/* Master-Detail Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Master Panel - Category Navigation */}
                <div className="w-80 bg-white border-r overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Categories</h3>
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : topLevelCategories.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No categories yet</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {topLevelCategories.map(cat => renderCategoryItem(cat))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="flex-1 overflow-y-auto">
                    {!selectedCategory ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Select a category to view details</p>
                                <p className="text-sm">Choose from the left panel or create a new one</p>
                            </div>
                        </div>
                    ) : !categoryDetails ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-gray-500">Loading details...</div>
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                <span>Home</span>
                                {categoryDetails.breadcrumb?.map((crumb, i) => (
                                    <div key={crumb.id} className="flex items-center gap-2">
                                        <ChevronRight className="w-4 h-4" />
                                        <span className={i === categoryDetails.breadcrumb.length - 1 ? 'font-bold text-gray-900' : ''}>
                                            {crumb.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Header */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        {categoryDetails.image_url ? (
                                            <img src={categoryDetails.image_url} className="w-16 h-16 rounded-lg object-cover border" alt="" />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Folder className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-2xl font-bold">{categoryDetails.name}</h2>
                                            <p className="text-gray-600 text-sm">{categoryDetails.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleEdit}
                                            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleCreate(categoryDetails.id)}
                                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Subcategory
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                                            <Package className="w-5 h-5" />
                                            <span className="text-sm font-medium">Products</span>
                                        </div>
                                        <p className="text-2xl font-bold">{categoryDetails.total_product_count}</p>
                                        <p className="text-xs text-gray-600">{categoryDetails.direct_product_count} direct</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-green-600 mb-1">
                                            <Folder className="w-5 h-5" />
                                            <span className="text-sm font-medium">Subcategories</span>
                                        </div>
                                        <p className="text-2xl font-bold">{categoryDetails.subcategories?.length || 0}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                                            <Tag className="w-5 h-5" />
                                            <span className="text-sm font-medium">Attributes</span>
                                        </div>
                                        <p className="text-2xl font-bold">{categoryDetails.attributes?.filter(a => !a.is_ignored).length || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="flex border-b">
                                    {['info', 'products', 'attributes'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveDetailTab(tab)}
                                            className={`
                                                flex-1 py-3 text-sm font-medium border-b-2 transition capitalize
                                                ${activeDetailTab === tab
                                                    ? 'border-blue-600 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'}
                                            `}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6">
                                    {activeDetailTab === 'info' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <p className="text-gray-600">{categoryDetails.description || 'No description'}</p>
                                            </div>
                                            {categoryDetails.subcategories && categoryDetails.subcategories.length > 0 && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategories</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {categoryDetails.subcategories.map(sub => (
                                                            <div
                                                                key={sub.id}
                                                                onClick={() => handleSelectCategory(sub)}
                                                                className="flex items-center gap-2 p-2 border rounded hover:border-blue-500 cursor-pointer"
                                                            >
                                                                {sub.image_url ? (
                                                                    <img src={sub.image_url} className="w-8 h-8 rounded" alt="" />
                                                                ) : (
                                                                    <Folder className="w-6 h-6 text-gray-400" />
                                                                )}
                                                                <span className="text-sm font-medium">{sub.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeDetailTab === 'products' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-semibold">Products</h3>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm text-gray-600">
                                                        {categoryDetails.total_product_count} total ({categoryDetails.direct_product_count} direct)
                                                    </span>
                                                    <button
                                                        onClick={() => setIsCreateProductModalOpen(true)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Add Product
                                                    </button>
                                                </div>
                                            </div>

                                            {loadingProducts ? (
                                                <div className="text-center py-8 text-gray-500">Loading products...</div>
                                            ) : paginatedProducts.length > 0 ? (
                                                <>
                                                    <div className="space-y-2">
                                                        {paginatedProducts.map(product => (
                                                            <div key={product.id} className="flex items-center gap-3 p-3 border rounded hover:border-blue-500">
                                                                {product.image_url ? (
                                                                    <img src={product.image_url} className="w-12 h-12 object-cover rounded" alt="" />
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                                                        <Package className="w-6 h-6 text-gray-400" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{product.name}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                                        <span>${product.price}</span>
                                                                        {product.sku && <span>• SKU: {product.sku}</span>}
                                                                        {product.sort_order > 0 && (
                                                                            <span className="text-blue-600">• from {product.category_name}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className={`text-xs px-2 py-1 rounded ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {product.status}
                                                                </span>

                                                                {/* Actions */}
                                                                <div className="flex items-center gap-1 pl-2 border-l ml-3">
                                                                    <a
                                                                        href={`/dashboard/products/${product.id}/edit`}
                                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                                        title="Edit Product"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDeleteProduct(product.id)}
                                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                        title="Delete Product"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Pagination */}
                                                    {productsPagination.totalPages > 1 && (
                                                        <div className="flex justify-center items-center gap-2 pt-4">
                                                            <button
                                                                onClick={() => fetchPaginatedProducts(productsPagination.page - 1)}
                                                                disabled={productsPagination.page === 1}
                                                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                                            >
                                                                Previous
                                                            </button>
                                                            <span className="text-sm text-gray-600">
                                                                Page {productsPagination.page} of {productsPagination.totalPages}
                                                            </span>
                                                            <button
                                                                onClick={() => fetchPaginatedProducts(productsPagination.page + 1)}
                                                                disabled={productsPagination.page === productsPagination.totalPages}
                                                                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                                            >
                                                                Next
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-gray-500 text-center py-8">No products in this category</p>
                                            )}
                                        </div>
                                    )}

                                    {activeDetailTab === 'attributes' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Linked Attributes</h3>
                                            {categoryDetails.attributes && categoryDetails.attributes.filter(a => !a.is_ignored).length > 0 ? (
                                                <div className="space-y-3">
                                                    {categoryDetails.attributes
                                                        .filter(a => !a.is_ignored)
                                                        .map(attr => {
                                                            // Parse clauses if it's a string
                                                            let parsedClauses = [];
                                                            try {
                                                                parsedClauses = typeof attr.clauses === 'string'
                                                                    ? JSON.parse(attr.clauses)
                                                                    : (Array.isArray(attr.clauses) ? attr.clauses : []);
                                                            } catch (e) {
                                                                parsedClauses = [];
                                                            }

                                                            return (
                                                                <div
                                                                    key={attr.id}
                                                                    className={`p-4 rounded-lg border ${attr.is_inherited ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex items-center gap-3 flex-1">
                                                                            {attr.image_url ? (
                                                                                <img
                                                                                    src={attr.image_url}
                                                                                    alt={attr.label}
                                                                                    className="w-10 h-10 rounded object-cover border"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                                                    <Tag className="w-5 h-5 text-gray-500" />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-semibold text-gray-900">{attr.label}</span>
                                                                                    {attr.is_inherited && (
                                                                                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                                                                                            from {attr.source_category_name}
                                                                                        </span>
                                                                                    )}
                                                                                    {attr.is_required && (
                                                                                        <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                                                                            Required
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                                                    <span>{attr.code}</span>
                                                                                    <span>•</span>
                                                                                    <span className="capitalize">{attr.type}</span>
                                                                                    {parsedClauses.length > 0 && (
                                                                                        <>
                                                                                            <span>•</span>
                                                                                            <span>{parsedClauses.length} clause{parsedClauses.length !== 1 ? 's' : ''}</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Toggle button for clauses */}
                                                                        {parsedClauses.length > 0 && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newExpanded = new Set(expandedAttributes);
                                                                                    if (newExpanded.has(attr.id)) {
                                                                                        newExpanded.delete(attr.id);
                                                                                    } else {
                                                                                        newExpanded.add(attr.id);
                                                                                    }
                                                                                    setExpandedAttributes(newExpanded);
                                                                                }}
                                                                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                                                                            >
                                                                                {expandedAttributes.has(attr.id) ? (
                                                                                    <>
                                                                                        <ChevronDown className="w-4 h-4" />
                                                                                        Hide Clauses
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <ChevronRight className="w-4 h-4" />
                                                                                        Show Clauses
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* Collapsible Clauses */}
                                                                    {parsedClauses.length > 0 && expandedAttributes.has(attr.id) && (
                                                                        <div className="mt-3 pt-3 border-t">
                                                                            <div className="space-y-1.5">
                                                                                {parsedClauses.map((clause, idx) => {
                                                                                    // Check exclusion in clause.excluded_category_ids (Array of strings)
                                                                                    const excludedIds = Array.isArray(clause.excluded_category_ids) ? clause.excluded_category_ids : [];
                                                                                    const isExcluded = excludedIds.includes(categoryDetails.id);

                                                                                    const handleToggleExclusion = async () => {
                                                                                        try {
                                                                                            // 1. Prepare new excluded IDs list
                                                                                            const newExcludedIds = isExcluded
                                                                                                ? excludedIds.filter(id => id !== categoryDetails.id)
                                                                                                : [...excludedIds, categoryDetails.id];

                                                                                            // 2. Clone clauses and update the specific clause
                                                                                            const updatedClauses = [...parsedClauses];
                                                                                            updatedClauses[idx] = {
                                                                                                ...clause,
                                                                                                excluded_category_ids: newExcludedIds
                                                                                            };

                                                                                            // 3. Update the global attribute (PUT)
                                                                                            const res = await api.put(`/products/attributes/${attr.id}`, {
                                                                                                ...attr,
                                                                                                clauses: JSON.stringify(updatedClauses)
                                                                                            });

                                                                                            if (res.data.success) {
                                                                                                // 4. Update local state
                                                                                                const updatedAttributes = categoryDetails.attributes.map(a => {
                                                                                                    if (a.id === attr.id) {
                                                                                                        return { ...a, clauses: updatedClauses };
                                                                                                    }
                                                                                                    return a;
                                                                                                });
                                                                                                setCategoryDetails(prev => ({ ...prev, attributes: updatedAttributes }));
                                                                                            }
                                                                                        } catch (error) {
                                                                                            console.error('Failed to toggle exclusion', error);
                                                                                            alert('Failed to update exclusion');
                                                                                        }
                                                                                    };

                                                                                    return (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                                                                                        >
                                                                                            <div className="flex-1">
                                                                                                <span className="text-sm font-medium text-gray-800">{clause.label || clause.name}</span>
                                                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                                                    {clause.operator} {Array.isArray(clause.value) ? clause.value.join(', ') : clause.value}
                                                                                                </div>
                                                                                            </div>
                                                                                            <button
                                                                                                onClick={handleToggleExclusion}
                                                                                                className={`text-xs px-2 py-1 rounded border transition ${isExcluded
                                                                                                    ? 'text-green-600 hover:bg-green-50 border-green-300 hover:border-green-400'
                                                                                                    : 'text-orange-600 hover:bg-orange-50 border-orange-300 hover:border-orange-400'
                                                                                                    }`}
                                                                                                title={isExcluded ? "Include this clause in this category" : "Exclude this clause from this category"}
                                                                                            >
                                                                                                {isExcluded ? 'Include' : 'Exclude'}
                                                                                            </button>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-center py-8">No attributes linked</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal - Reuse existing modal code */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
                                <h3 className="font-bold text-lg">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
                                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="px-6 border-b bg-white flex">
                                {['general', 'seo', 'attributes'].map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`
                                            px-4 py-3 text-sm font-medium border-b-2 capitalize transition
                                            ${activeTab === tab
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'}
                                        `}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 min-h-0 p-6">
                                {activeTab === 'general' && (
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
                                            <CategoryTreeSelect
                                                value={formData.parent_id}
                                                onChange={(val) => setFormData({ ...formData, parent_id: val })}
                                                options={allCategories}
                                                excludeId={editingCategory?.id}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Image URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={formData.image_url}
                                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                    placeholder="https://..."
                                                />
                                                {formData.image_url && <img src={formData.image_url} className="w-10 h-10 rounded border object-cover" alt="" />}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'seo' && (
                                    <SEOMetaEditor
                                        page={formData}
                                        onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                                    />
                                )}

                                {activeTab === 'attributes' && (
                                    <div className="space-y-6">
                                        <div className="flex gap-2">
                                            <select
                                                id="attr-select"
                                                className="flex-1 px-3 py-2 border rounded-lg"
                                            >
                                                <option value="">Select attribute to link...</option>
                                                {attributes
                                                    .filter(a => !linkedAttributes.find(la => la.attribute_id === a.id))
                                                    .map(a => (
                                                        <option key={a.id} value={a.id}>{a.label} ({a.code})</option>
                                                    ))
                                                }
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const select = document.getElementById('attr-select');
                                                    if (select.value) {
                                                        handleLinkAttribute(select.value);
                                                        select.value = '';
                                                    }
                                                }}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Link
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {linkedAttributes.map((link, idx) => {
                                                const attrDef = attributes.find(a => a.id === link.attribute_id);
                                                if (!attrDef) return null;

                                                // Parse clauses
                                                let parsedClauses = [];
                                                try {
                                                    parsedClauses = typeof attrDef.clauses === 'string'
                                                        ? JSON.parse(attrDef.clauses)
                                                        : (Array.isArray(attrDef.clauses) ? attrDef.clauses : []);
                                                } catch (e) {
                                                    parsedClauses = [];
                                                }

                                                return (
                                                    <div key={link.attribute_id} className="border rounded-lg p-4 bg-white shadow-sm">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{attrDef.label}</h4>
                                                                <code className="text-xs text-gray-500">{attrDef.code}</code>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {parsedClauses.length > 0 && editingCategory && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newExpanded = new Set(expandedAttributes);
                                                                            if (newExpanded.has(attrDef.id)) {
                                                                                newExpanded.delete(attrDef.id);
                                                                            } else {
                                                                                newExpanded.add(attrDef.id);
                                                                            }
                                                                            setExpandedAttributes(newExpanded);
                                                                        }}
                                                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded transition"
                                                                    >
                                                                        {expandedAttributes.has(attrDef.id) ? (
                                                                            <>
                                                                                <ChevronDown className="w-3 h-3" />
                                                                                Hide Clauses
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ChevronRight className="w-3 h-3" />
                                                                                Show Clauses
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}

                                                                {!link.is_inherited && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUnlinkAttribute(idx)}
                                                                        className="text-red-500 hover:text-red-700 p-1"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {link.is_inherited && (
                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                        Inherited from {link.source_category_name || 'Parent'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4 mb-2">
                                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={link.is_required}
                                                                    onChange={() => toggleRequired(idx)}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                    disabled={link.is_inherited}
                                                                />
                                                                Required
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={link.is_ignored}
                                                                    onChange={() => toggleIgnored(idx)}
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                Hidden/Ignored
                                                            </label>
                                                        </div>

                                                        {/* Collapsible Clauses (Edit Mode Only) */}
                                                        {parsedClauses.length > 0 && expandedAttributes.has(attrDef.id) && editingCategory && (
                                                            <div className="mt-3 pt-3 border-t">
                                                                <p className="text-xs text-gray-500 mb-2">Toggle clauses to exclude them from this category:</p>
                                                                <div className="space-y-1.5">
                                                                    {parsedClauses.map((clause, cIdx) => {
                                                                        const excludedIds = Array.isArray(clause.excluded_category_ids) ? clause.excluded_category_ids : [];
                                                                        const isExcluded = excludedIds.includes(editingCategory.id);

                                                                        const handleToggleExclusion = async () => {
                                                                            try {
                                                                                const newExcludedIds = isExcluded
                                                                                    ? excludedIds.filter(id => id !== editingCategory.id)
                                                                                    : [...excludedIds, editingCategory.id];

                                                                                const updatedClauses = [...parsedClauses];
                                                                                updatedClauses[cIdx] = {
                                                                                    ...clause,
                                                                                    excluded_category_ids: newExcludedIds
                                                                                };

                                                                                // Immediate update to Attribute definition
                                                                                const res = await api.put(`/products/attributes/${attrDef.id}`, {
                                                                                    ...attrDef,
                                                                                    clauses: JSON.stringify(updatedClauses)
                                                                                });

                                                                                if (res.data.success) {
                                                                                    // Update attributes state locally to reflect change without full reload
                                                                                    const updatedGlobalAttributes = attributes.map(a => {
                                                                                        if (a.id === attrDef.id) {
                                                                                            return { ...a, clauses: updatedClauses }; // Store as object or string? Original is mixed, let's keep consistency.
                                                                                            // Actually fetchInitialData parses it? No, setAttributes stores raw.
                                                                                            // Let's store raw string to match initial load expectation, OR object if consistent.
                                                                                            // The component code parses it on render: "parsedClauses = typeof attrDef.clauses === 'string'..."
                                                                                            // So storing object is safer if our render handles check.
                                                                                        }
                                                                                        return a;
                                                                                    });
                                                                                    // But wait, setAttributes expects raw data from API?
                                                                                    // Better to update 'attributes' state with the new clause data
                                                                                    // Hack: Update local 'attributes' state directly
                                                                                    // We need to mutate 'attributes' state
                                                                                    // setAttributes(updatedGlobalAttributes); // 'attributes' is state

                                                                                    // Re-fetch attributes to be safe and clean
                                                                                    const attrRes = await api.get('/products/attributes');
                                                                                    if (attrRes.data.success) setAttributes(attrRes.data.data || []);
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Failed to toggle exclusion', error);
                                                                                alert('Failed to update exclusion');
                                                                            }
                                                                        };

                                                                        return (
                                                                            <div key={cIdx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100">
                                                                                <div className="flex-1">
                                                                                    <span className="text-sm font-medium text-gray-800">{clause.label || clause.name}</span>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {clause.operator} {Array.isArray(clause.value) ? clause.value.join(', ') : clause.value}
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={handleToggleExclusion}
                                                                                    className={`text-xs px-2 py-1 rounded border transition ${isExcluded
                                                                                        ? 'text-green-600 hover:bg-green-50 border-green-300 hover:border-green-400'
                                                                                        : 'text-orange-600 hover:bg-orange-50 border-orange-300 hover:border-orange-400'
                                                                                        }`}
                                                                                >
                                                                                    {isExcluded ? 'Include' : 'Exclude'}
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {parsedClauses.length > 0 && !editingCategory && (
                                                            <div className="mt-2 text-xs text-gray-400 italic">
                                                                Save category to configure clause exclusions.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {linkedAttributes.length === 0 && (
                                                <p className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                                                    No attributes linked to this category yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </form>

                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button onClick={handleSubmit} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Creation Modal */}
            {isCreateProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <ProductForm
                                categoryId={categoryDetails?.id}
                                onSuccess={() => {
                                    setIsCreateProductModalOpen(false);
                                    fetchPaginatedProducts(productsPagination.page); // Refresh list
                                    // Update count optionally?
                                    setCategoryDetails(prev => ({
                                        ...prev,
                                        total_product_count: prev.total_product_count + 1,
                                        direct_product_count: prev.direct_product_count + 1
                                    }));
                                }}
                                onCancel={() => setIsCreateProductModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Helper Components ---

function CategoryTreeSelect({ value, onChange, options, excludeId }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedName, setSelectedName] = React.useState('');
    const [expanded, setExpanded] = React.useState(new Set());
    const [nodes, setNodes] = React.useState([]); // Flat list of all nodes

    // Build tree structure from flat list
    React.useEffect(() => {
        if (options && options.length > 0) {
            setNodes(options);
        }
    }, [options]);

    // Find selected name
    React.useEffect(() => {
        if (!value) {
            setSelectedName('None (Top Level)');
            return;
        }
        const node = nodes.find(n => n.id === value);
        if (node) {
            setSelectedName(node.name);
        } else {
            setSelectedName('Unknown Category');
        }
    }, [value, nodes]);

    // Filter nodes based on search
    const filteredNodes = nodes.filter(n =>
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        n.id !== excludeId
    );

    const handleSelect = (node) => {
        onChange(node.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setIsOpen(false);
    };

    const toggleExpand = (e, nodeId) => {
        e.stopPropagation();
        const newExpanded = new Set(expanded);
        if (newExpanded.has(nodeId)) newExpanded.delete(nodeId);
        else newExpanded.add(nodeId);
        setExpanded(newExpanded);
    };

    // Render tree node
    const renderNode = (node, level = 0) => {
        const hasChildren = nodes.some(n => n.parent_id === node.id && n.id !== excludeId);
        const isExpanded = expanded.has(node.id) || searchTerm;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded ${value === node.id ? 'bg-blue-50 text-blue-600' : ''}`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => handleSelect(node)}
                >
                    {hasChildren && !searchTerm && (
                        <button onClick={(e) => toggleExpand(e, node.id)} type="button" className="p-0.5 hover:bg-gray-200 rounded">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                    )}
                    {!hasChildren && !searchTerm && <div className="w-5" />}

                    <Folder className={`w-4 h-4 ${value === node.id ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="text-sm">{node.name}</span>
                </div>
                {hasChildren && isExpanded && !searchTerm && (
                    <div>
                        {nodes.filter(n => n.parent_id === node.id && n.id !== excludeId).map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative">
            <div
                className="w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer bg-white hover:border-gray-400 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Folder className="w-4 h-4 text-gray-400" />
                    <span>{selectedName}</span>
                </div>
                <div className="flex items-center gap-2">
                    {value && (
                        <button onClick={handleClear} type="button" className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        <div
                            className={`flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded ${!value ? 'bg-blue-50 text-blue-600' : ''}`}
                            onClick={() => { onChange(''); setIsOpen(false); }}
                        >
                            <div className="w-5" />
                            <span className="text-sm italic text-gray-500">None (Top Level)</span>
                        </div>
                        {searchTerm ? (
                            filteredNodes.map(node => (
                                <div
                                    key={node.id}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded pl-8"
                                    onClick={() => handleSelect(node)}
                                >
                                    <Folder className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{node.name}</span>
                                    {node.parent_id && <span className="text-xs text-gray-400 ml-auto">in {nodes.find(n => n.id === node.parent_id)?.name}</span>}
                                </div>
                            ))
                        ) : (
                            nodes.filter(n => !n.parent_id && n.id !== excludeId).map(node => renderNode(node))
                        )}
                        {nodes.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">No categories found</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
