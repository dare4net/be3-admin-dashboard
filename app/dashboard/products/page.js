"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Plus, Edit, Trash2, Package, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get("/products");
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
        return matchesSearch && matchesStatus;
    });

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
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
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
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">SKU</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredProducts.map((product) => (
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

            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {filteredProducts.map((product) => (
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
