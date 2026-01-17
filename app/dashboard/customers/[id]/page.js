"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { ArrowLeft, Mail, Calendar, Package, Clock, DollarSign, Loader2 } from "lucide-react";

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch User Details
            const userRes = await api.get(`/auth/users/${id}`);
            if (userRes.data.success) {
                setUser(userRes.data.user);
            }

            // Fetch User Orders
            const ordersRes = await api.get(`/orders?user_id=${id}`);
            if (ordersRes.data.success) {
                setOrders(ordersRes.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch customer data:", error);
        } finally {
            setLoading(false);
        }
    };

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [allRoles, setAllRoles] = useState([]);
    const [roleLoading, setRoleLoading] = useState(false);

    const handleManageRoles = async () => {
        setIsRoleModalOpen(true);
        if (allRoles.length === 0) {
            setRoleLoading(true);
            try {
                const res = await api.get("/roles");
                if (res.data.success) {
                    setAllRoles(res.data.roles);
                }
            } catch (e) {
                console.error("Failed to fetch roles");
            } finally {
                setRoleLoading(false);
            }
        }
    };

    const toggleRole = async (roleId, hasRole) => {
        try {
            if (hasRole) {
                // Remove
                await api.delete(`/roles/${roleId}/users/${id}`);
            } else {
                // Add
                await api.post(`/roles/${roleId}/users`, { userId: id });
            }
            // Refresh User
            const userRes = await api.get(`/auth/users/${id}`);
            if (userRes.data.success) {
                setUser(userRes.data.user);
            }
        } catch (e) {
            alert("Failed to update role");
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Customer not found.</p>
                <Link href="/dashboard/customers" className="text-blue-600 hover:underline mt-2 inline-block">
                    Return to Customers
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/customers" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-4">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {user.first_name} {user.last_name}
                            </h2>
                            <div className="flex items-center gap-2 text-gray-500 mt-1">
                                <Mail className="w-4 h-4" />
                                {user.email}
                            </div>
                            <div className="mt-4 flex flex-col gap-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize mx-auto
                                    ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                `}>
                                    {user.status}
                                </span>

                                {/* Roles Display */}
                                <div className="mt-2">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Roles</h4>
                                    <div className="flex flex-wrap justify-center gap-1">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map(r => (
                                                <span key={r.id} className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {r.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No roles assigned</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleManageRoles}
                                        className="mt-2 text-xs text-blue-600 hover:underline"
                                    >
                                        Manage Roles
                                    </button>
                                </div>
                            </div>
                        </div>

                        <hr className="my-6 border-gray-100" />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Joined
                                </span>
                                <span className="font-medium text-gray-900">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Last Login
                                </span>
                                <span className="font-medium text-gray-900">
                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-500" />
                                Order History
                            </h3>
                            <span className="text-sm text-gray-500">
                                {orders.length} orders
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-3">Order #</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Total</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                No orders found for this customer.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-blue-600">
                                                    {order.order_number}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
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
                                                <td className="px-6 py-4 text-right font-medium">
                                                    ${parseFloat(order.total).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/orders/${order.id}`}
                                                        className="text-blue-600 hover:underline"
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
                </div>
            </div>

            {/* Manage Roles Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Manage Roles</h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="space-y-3">
                            {roleLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : allRoles.map(role => {
                                const hasRole = user.roles?.some(ur => ur.id === role.id);
                                return (
                                    <label key={role.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasRole}
                                            onChange={() => toggleRole(role.id, hasRole)}
                                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                        />
                                        <div>
                                            <div className="font-medium text-sm">{role.name}</div>
                                            <div className="text-xs text-gray-500">{role.description}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsRoleModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
