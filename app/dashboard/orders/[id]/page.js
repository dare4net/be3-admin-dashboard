"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { ArrowLeft, Package, Truck, CreditCard, Mail, MapPin, User, Calendar, Save, RefreshCw } from "lucide-react";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/orders/${id}`);
            if (res.data.success) {
                setOrder(res.data.order);
                setItems(res.data.items || []);
                setStatus(res.data.order.status);
            }
        } catch (error) {
            console.error("Failed to fetch order details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        setUpdating(true);
        try {
            const res = await api.patch(`/orders/${id}/status`, { status });
            if (res.data.success) {
                setOrder(prev => ({ ...prev, status }));
                alert("Order status updated successfully!");
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
    }

    if (!order) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
                <Link href="/dashboard/orders" className="text-blue-600 hover:underline mt-2 inline-block">
                    Return to Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Order {order.order_number}
                            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium capitalize
                                ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                {order.status}
                            </span>
                        </h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 pl-2">Status:</span>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border-none bg-transparent font-medium text-sm focus:ring-0 cursor-pointer"
                    >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                        onClick={handleStatusUpdate}
                        disabled={updating || status === order.status}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 font-medium text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-400" />
                            Order Items
                        </div>
                        <div className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <div key={item.id} className="p-6 flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                        Img
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                        <p className="text-sm text-gray-500">Variant: {item.variant_name || 'Default'}</p>
                                        <div className="mt-1 text-sm text-gray-500">
                                            Qty: {item.quantity} × ${item.price}
                                        </div>
                                    </div>
                                    <div className="text-right font-medium text-gray-900">
                                        ${(item.quantity * item.price).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>${parseFloat(order.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline (Placeholder) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-4">Order Timeline</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            {order.paid_at && (
                                <div className="flex gap-3">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Payment Confirmed</p>
                                        <p className="text-xs text-gray-500">{new Date(order.paid_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Customer */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            Customer
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-900">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {order.customer_email || 'No email provided'}
                            </div>
                            <div className="text-gray-500 pl-6">
                                {order.user_id ? 'Registered Customer' : 'Guest Checkout'}
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address (Placeholder if missing in DB schema currently) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            Shipping
                        </h3>
                        <div className="text-sm text-gray-600">
                            <p>Address data not yet stored in flat orders table.</p>
                            <p className="text-xs text-gray-400 mt-2">(Would join with addresses table in production)</p>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            Payment
                        </h3>
                        <div className="text-sm">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Status</span>
                                <span className="font-medium capitalize">{order.payment_status}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Method</span>
                                <span className="font-medium">Credit Card</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
