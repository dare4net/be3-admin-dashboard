"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Search, Plus, Trash2, User, Mail, Phone,
    MapPin, CreditCard, FileText, Package, AlertCircle, ShoppingBag
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
    { value: 'manual',        label: 'Manual / Other' },
    { value: 'cash',          label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'pos',           label: 'POS Terminal' },
];

function ProductSearch({ onAdd }) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await api.get('/products', { params: { search: q, per_page: 8 } });
                setResults(res.data.data || []);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 350);
        return () => clearTimeout(timer);
    }, [q]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input type="text" value={q} onChange={e => { setQ(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search products to add..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
            {open && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
                    {results.map(p => (
                        <button key={p.id} type="button"
                            onClick={() => { onAdd(p); setQ(''); setResults([]); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 text-gray-300" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                                <p className="text-xs text-gray-400">₦{Number(p.price || 0).toLocaleString()}</p>
                            </div>
                            <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            )}
            {open && results.length === 0 && q && !loading && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl p-4 text-center text-sm text-gray-400">
                    No products found
                </div>
            )}
        </div>
    );
}

export default function CreateOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
    const [shipping_address, setShippingAddress] = useState('');
    const [payment_method, setPaymentMethod] = useState('manual');
    const [payment_status, setPaymentStatus] = useState('fulfilled');
    const [notes, setNotes] = useState('');
    const [discount_amount, setDiscountAmount] = useState('');

    const setCustomerField = (k, v) => setCustomer(p => ({ ...p, [k]: v }));

    const addItem = (product) => {
        setItems(prev => {
            const existing = prev.find(i => i.product_id === product.id);
            if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, {
                product_id: product.id,
                product_name: product.name,
                image_url: product.image_url,
                quantity: 1,
                price: parseFloat(product.price || 0),
            }];
        });
    };

    const updateQty = (product_id, qty) => {
        if (qty < 1) return removeItem(product_id);
        setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity: qty } : i));
    };

    const updatePrice = (product_id, price) => {
        setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, price: parseFloat(price) || 0 } : i));
    };

    const removeItem = (product_id) => setItems(prev => prev.filter(i => i.product_id !== product_id));

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountAmt = parseFloat(discount_amount || 0);
    const total = Math.max(0, subtotal - discountAmt);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (items.length === 0) return setError('Add at least one product');
        if (!customer.name && !customer.email) return setError('Customer name or email is required');

        setLoading(true);
        try {
            const res = await api.post('/orders', {
                customer_name: customer.name,
                customer_email: customer.email,
                customer_phone: customer.phone,
                items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price })),
                payment_method,
                payment_status,
                shipping_address,
                notes,
                discount_amount: discountAmt,
            });

            if (res.data.success) {
                toast.success(`Order ${res.data.order.order_number} created!`);
                router.push(`/dashboard/orders/${res.data.order.id}`);
            }
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back */}
            <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Orders
            </Link>

            <div>
                <h1 className="text-2xl font-black text-gray-900">Create Order</h1>
                <p className="text-sm text-gray-400 mt-1">Manually create an order for a customer</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Customer */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <User className="w-4 h-4" /> Customer Info
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Full Name</label>
                            <input type="text" value={customer.name} onChange={e => setCustomerField('name', e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email</label>
                            <input type="email" value={customer.email} onChange={e => setCustomerField('email', e.target.value)}
                                placeholder="john@example.com"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Phone</label>
                            <input type="tel" value={customer.phone} onChange={e => setCustomerField('phone', e.target.value)}
                                placeholder="+234..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Shipping Address</label>
                            <input type="text" value={shipping_address} onChange={e => setShippingAddress(e.target.value)}
                                placeholder="123 Main St, Lagos"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Products */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Products
                    </h2>
                    <ProductSearch onAdd={addItem} />

                    {items.length > 0 && (
                        <div className="space-y-2 mt-2">
                            {items.map(item => (
                                <div key={item.product_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                        {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 text-gray-300 m-2.5" />}
                                    </div>
                                    <p className="flex-1 text-sm font-semibold text-gray-800 truncate">{item.product_name}</p>
                                    {/* Price override */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">₦</span>
                                        <input type="number" min="0" step="any" value={item.price}
                                            onChange={e => updatePrice(item.product_id, e.target.value)}
                                            className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                    </div>
                                    {/* Qty */}
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => updateQty(item.product_id, item.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">−</button>
                                        <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                                        <button type="button" onClick={() => updateQty(item.product_id, item.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">+</button>
                                    </div>
                                    <p className="w-24 text-sm font-bold text-gray-900 text-right">₦{(item.price * item.quantity).toLocaleString()}</p>
                                    <button type="button" onClick={() => removeItem(item.product_id)}
                                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}

                            {/* Totals */}
                            <div className="border-t border-gray-100 pt-3 space-y-1.5">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
                                </div>
                                {discountAmt > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span><span>− ₦{discountAmt.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-black text-gray-900">
                                    <span>Total</span><span>₦{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Payment
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Payment Method</label>
                            <select value={payment_method} onChange={e => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Payment Status</label>
                            <select value={payment_status} onChange={e => setPaymentStatus(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                                <option value="fulfilled">Paid / Fulfilled</option>
                                <option value="unpaid">Unpaid (Invoice)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Discount Amount (₦)</label>
                            <input type="number" min="0" value={discount_amount} onChange={e => setDiscountAmount(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Notes</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Order notes..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Link href="/dashboard/orders"
                        className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all text-center">
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading || items.length === 0}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-all">
                        {loading ? 'Creating...' : `Create Order${total > 0 ? ` — ₦${total.toLocaleString()}` : ''}`}
                    </button>
                </div>
            </form>
        </div>
    );
}
