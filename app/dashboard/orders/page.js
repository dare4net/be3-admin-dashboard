"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Search, Filter, Loader2, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
    });

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Orders
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", pagination.page);
            params.append("per_page", pagination.perPage);

            if (statusFilter !== "all") {
                params.append("status", statusFilter);
            }
            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }

            const res = await api.get(`/orders?${params.toString()}`);
            if (res.data.success) {
                setOrders(res.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: res.data.pagination.total,
                    totalPages: res.data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.perPage, statusFilter, debouncedSearch]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
    };

    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                <button
                    onClick={fetchOrders}
                    className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Refresh Orders"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-none border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Order # or Email..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Desktop Orders Table */}
            <div className="hidden md:block bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                            <tr>
                                <th className="px-6 py-4">Order #</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No orders found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                                        <td className="px-6 py-4 font-medium text-blue-600">{order.order_number}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(order.created_at).toLocaleDateString()}
                                            <span className="text-xs text-gray-400 block">
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.customer_email || 'Guest'}</div>
                                            {order.user_id && <div className="text-xs text-gray-500">Registered User</div>}
                                        </td>
                                        <td className="px-6 py-4 font-medium">${parseFloat(order.total).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/orders/${order.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-gray-500">Loading orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
                        <p className="text-gray-500">No orders found.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm active:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-sm font-bold text-blue-600">{order.order_number}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                    ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{order.customer_email || 'Guest'}</p>
                                    {order.user_id && <p className="text-[10px] text-gray-400 uppercase font-bold">Member</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-gray-900">${parseFloat(order.total).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Shared Pagination */}
            <div className="bg-white rounded-lg shadow-none border border-gray-100 mt-6">
                {/* Pagination */}
                {!loading && pagination.total > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.perPage + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.perPage, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
