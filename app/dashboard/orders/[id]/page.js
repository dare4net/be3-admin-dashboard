"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { ArrowLeft, Package, Truck, CreditCard, Mail, MapPin, User, Calendar, Save, RefreshCw, MessageSquare } from "lucide-react";

// ── Status display helpers ────────────────────────────────────────────────────
const ORDER_STATUS = {
    pending:    { label: "Pending",    cls: "bg-amber-50 text-amber-700 ring-amber-200"    },
    processing: { label: "Processing", cls: "bg-blue-50 text-blue-700 ring-blue-200"       },
    shipped:    { label: "Shipped",    cls: "bg-indigo-50 text-indigo-700 ring-indigo-200"  },
    delivered:  { label: "Delivered",  cls: "bg-green-50 text-green-700 ring-green-200"    },
    returned:   { label: "Returned",   cls: "bg-orange-50 text-orange-700 ring-orange-200" },
    cancelled:  { label: "Cancelled",  cls: "bg-red-50 text-red-700 ring-red-200"          },
};

const PAYMENT_STATUS = {
    unpaid:     { label: "Unpaid",    cls: "bg-red-50 text-red-700 ring-red-200"          },
    processing: { label: "Verifying", cls: "bg-amber-50 text-amber-700 ring-amber-200"    },
    paid:       { label: "Paid",      cls: "bg-green-50 text-green-700 ring-green-200"    },
    failed:     { label: "Failed",    cls: "bg-red-50 text-red-800 ring-red-200"          },
    fulfilled:  { label: "Paid (DM)", cls: "bg-teal-50 text-teal-700 ring-teal-200"      },
    refunded:   { label: "Refunded",  cls: "bg-orange-50 text-orange-700 ring-orange-200" },
};

function OrderBadge({ status }) {
    const cfg = ORDER_STATUS[status] || { label: status, cls: "bg-gray-100 text-gray-600 ring-gray-200" };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ring-1 ring-inset ${cfg.cls}`}>{cfg.label}</span>;
}

function PaymentBadge({ status }) {
    const cfg = PAYMENT_STATUS[status] || { label: status, cls: "bg-gray-100 text-gray-600 ring-gray-200" };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cfg.cls}`}>{cfg.label}</span>;
}

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
            }
        } catch (error) {
            const data = error.response?.data;

            // 402 = payment gate triggered — vendor must confirm manual payment
            if (error.response?.status === 402 && data?.action === 'confirm_manual_payment') {
                const confirmed = window.confirm(
                    `This order has no confirmed payment.\n\nDid the customer pay outside the platform (e.g. bank transfer, cash)?\n\nClick OK to mark payment as fulfilled and move order to Processing.`
                );
                if (confirmed) {
                    // 1. Set payment_status = fulfilled
                    await api.patch(`/orders/${id}/payment-status`, { payment_status: 'fulfilled' });
                    // 2. Retry the status update
                    const retry = await api.patch(`/orders/${id}/status`, { status });
                    if (retry.data.success) {
                        setOrder(prev => ({ ...prev, status, payment_status: 'fulfilled' }));
                    }
                }
                return;
            }

            const msg = data?.message || 'Failed to update status';
            alert(`Error: ${msg}`);
            console.error('Failed to update status:', error);
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
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Order {order.order_number}
                            <OrderBadge status={order.status} />
                            {order.checkout_type === 'whatsapp' && (
                                <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.534 5.845L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.886.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z"/></svg> WhatsApp Order</span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-none border border-gray-100">
                    <span className="text-sm font-medium text-gray-700 pl-2">Status:</span>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border-none bg-transparent font-medium text-sm focus:ring-0 cursor-pointer"
                    >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="returned">Returned</option>
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
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 font-medium text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-400" />
                            Order Items
                        </div>
                        <div className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <div key={item.id} className="p-6 flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-xs overflow-hidden border border-gray-100">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-6 h-6 opacity-20" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                        <p className="text-sm text-gray-500">Variant: {item.variant_name || 'Default'}</p>
                                        <div className="mt-1 text-sm text-gray-500">
                                            Qty: {item.quantity} × ₦{parseFloat(item.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="text-right font-medium text-gray-900">
                                    ₦{(item.quantity * item.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>₦{parseFloat(order.subtotal).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>₦{parseFloat(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline (Placeholder) */}
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 p-5">
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
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 p-5">
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

                    {/* Shipping Address */}
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 p-5">
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
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 p-5">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            Payment
                        </h3>
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Order Status</span>
                                <OrderBadge status={order.status} />
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Payment</span>
                                <PaymentBadge status={order.payment_status} />
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Channel</span>
                                <span className="font-medium">
                                    {order.payment_status === 'fulfilled'
                                        ? 'Manual'
                                        : order.checkout_type === 'whatsapp'
                                            ? 'DM'
                                            : 'Platform'}
                                </span>
                            </div>
                            {order.payment_confirmed_at && (
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-500">Confirmed</span>
                                    <span className="text-xs text-gray-600">{new Date(order.payment_confirmed_at).toLocaleDateString()}</span>
                                </div>
                            )}
                            {order.paid_at && (
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-500">Paid at</span>
                                    <span className="text-xs text-gray-600">{new Date(order.paid_at).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
