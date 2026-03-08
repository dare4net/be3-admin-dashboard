"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Search, Loader2, RefreshCw, User, Mail, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CustomersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", pagination.page);
            params.append("limit", pagination.perPage); // Note: Route uses 'limit'

            if (debouncedSearch) {
                params.append("search", debouncedSearch);
            }

            const res = await api.get(`/auth/users?${params.toString()}`);
            if (res.data.success) {
                setUsers(res.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: res.data.pagination.total,
                    totalPages: res.data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.perPage, debouncedSearch]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-gray-100 shadow-none">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Customers</h1>
                    <p className="text-xs text-gray-400 font-medium">Manage and view your customer base</p>
                </div>
                <button
                    onClick={fetchUsers}
                    title="Refresh Data"
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-none"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-none border border-gray-100">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {/* Users Content */}
            <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500 font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Customer</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Email</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Status</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Joined</th>
                                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                                        <span className="text-sm font-medium">Loading customers...</span>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                                        No customers found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/dashboard/customers/${user.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {user.first_name?.[0] || user.email[0].toUpperCase()}
                                                </div>
                                                <div className="font-bold text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                    {!user.first_name && <span className="text-gray-400 italic font-normal ml-1">(No Name)</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                ${user.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                                            `}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-md transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/customers/${user.id}`);
                                                }}
                                            >
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden block divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                            <p className="text-xs font-bold uppercase tracking-widest">Refreshing...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic text-sm">
                            No customers found.
                        </div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => router.push(`/dashboard/customers/${user.id}`)}
                                className="p-4 active:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-gray-900 truncate">
                                            {user.first_name || 'No Name'} {user.last_name}
                                        </div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                            <Mail className="w-3 h-3" />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest
                                        ${user.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
                                    `}>
                                        {user.status}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400">
                                        Joined {new Date(user.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && pagination.total > 0 && (
                    <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Page <span className="text-gray-900">{pagination.page}</span> of {pagination.totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePageChange(pagination.page - 1); }}
                                disabled={pagination.page === 1}
                                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-100 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Prev
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePageChange(pagination.page + 1); }}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-100 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
