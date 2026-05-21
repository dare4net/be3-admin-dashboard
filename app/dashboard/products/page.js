"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Plus, Edit, Trash2, Package, Search, Loader2, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deliveryFilter, setDeliveryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("list");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            // Fetch more items to properly support client-side search/pagination
            const res = await api.get("/products?per_page=500");
            setProducts(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter((p) => p.id !== id));
        } catch (err) {
            alert("Failed to delete product");
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesDelivery = deliveryFilter === 'all' || p.delivery_type === deliveryFilter;
        return matchesSearch && matchesStatus && matchesDelivery;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, deliveryFilter]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Loading Catalog...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            {/* Header Area */}
            <div className="flex items-center justify-between bg-white p-5 rounded-lg border border-gray-100 shadow-none">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Products</h1>
                    <p className="text-xs text-gray-400 font-medium">{products.length} Items in Catalog</p>
                </div>
                <Link
                    href="/dashboard/products/create"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-none text-sm font-bold uppercase tracking-tighter"
                >
                    <Plus className="w-4 h-4" />
                    New Product
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-none border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 items-center">
                    <select
                        value={deliveryFilter}
                        onChange={(e) => setDeliveryFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border bg-white text-gray-600 border-gray-100 hover:border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                    >
                        <option value="all">All Delivery</option>
                        <option value="normal">Normal</option>
                        <option value="express">Express ⚡</option>
                        <option value="shipped_from_abroad">Abroad ✈️</option>
                    </select>

                    <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

                    {['all', 'active', 'draft', 'archived'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border",
                                statusFilter === status
                                    ? "bg-blue-600 text-white border-blue-600 shadow-none"
                                    : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                            )}
                        >
                            {status}
                        </button>
                    ))}

                    <div className="hidden md:flex bg-gray-50 border border-gray-100 rounded-lg p-1 ml-auto">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                {viewMode === "list" ? (
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">SKU</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : <Package className="w-full h-full p-3 text-gray-200" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-gray-900 truncate">{product.name}</div>
                                                    <div className="flex gap-1 mt-1">
                                                        {product.categories?.slice(0, 1).map((cat, i) => (
                                                            <span key={i} className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                                {cat.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">
                                            {product.sku || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-black text-gray-900">${parseFloat(product.price).toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.delivery_type === 'express' && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#ff4e00] bg-[#ff4e00]/10 px-2 py-0.5 rounded border border-[#ff4e00]/20">Express ⚡</span>}
                                            {product.delivery_type === 'shipped_from_abroad' && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Abroad ✈️</span>}
                                            {(!product.delivery_type || product.delivery_type === 'normal') && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Normal</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn(
                                                "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-full",
                                                product.status === 'active' ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"
                                            )}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/dashboard/products/${product.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100">
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {paginatedProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg border border-gray-100 shadow-none overflow-hidden hover:shadow-sm transition-shadow group flex flex-col">
                                <div className="aspect-square bg-gray-50 relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full">
                                            <Package className="w-12 h-12 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={cn(
                                            "px-2 py-1 text-[8px] font-black uppercase tracking-widest border rounded backdrop-blur-md",
                                            product.status === 'active' ? "bg-white/80 text-green-700 border-green-100" : "bg-white/80 text-gray-500 border-gray-100"
                                        )}>
                                            {product.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-auto pt-4">
                                        <div className="font-black text-gray-900 text-lg">${parseFloat(product.price).toFixed(2)}</div>
                                        <div className="flex gap-1">
                                            <Link href={`/dashboard/products/${product.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {paginatedProducts.map((product) => (
                    <div key={product.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-none flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg border border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden">
                            {product.image_url ? (
                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            ) : <Package className="w-full h-full p-4 text-gray-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-[13px] font-bold text-gray-900 truncate">{product.name}</h3>
                                <span className="text-[14px] font-black text-gray-900">${parseFloat(product.price).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter truncate">{product.sku || 'No SKU'}</p>
                                <span className={cn(
                                    "px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border rounded",
                                    product.status === 'active' ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"
                                )}>
                                    {product.status}
                                </span>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <Link href={`/dashboard/products/${product.id}/edit`} className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-600 rounded-lg border border-gray-100 hover:bg-white transition-all">
                                    Edit
                                </Link>
                                <button onClick={() => handleDelete(product.id)} className="px-3 py-1.5 bg-red-50 text-[10px] font-bold uppercase tracking-widest text-red-600 rounded-lg border border-red-100">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                    <p className="text-xs text-gray-400 font-medium">
                        Showing <span className="text-gray-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="text-gray-900 font-bold">{filteredProducts.length}</span> entries
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {filteredProducts.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-100 border-dashed p-16 text-center">
                    <Package className="w-12 h-12 mx-auto text-gray-100 mb-4" />
                    <h3 className="text-gray-900 font-black text-lg">No Items Matches</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
