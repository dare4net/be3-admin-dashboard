"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Search, Plus, Trash2, User, Mail, Phone,
    MapPin, CreditCard, FileText, Package, AlertCircle, ShoppingBag,
    LayoutGrid, List, Loader2
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
    { value: 'manual', label: 'Manual / Other' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'pos', label: 'POS Terminal' },
];

function ProductBrowser({ onAdd }) {
    const [q, setQ] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Default to list on mobile
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setViewMode('list');
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(q);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [q]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await api.get('/products', {
                    params: { search: searchQuery, page, per_page: 12 }
                });
                setResults(res.data.data || []);
                if (res.data.pagination) {
                    setTotalPages(res.data.pagination.totalPages || 1);
                    setTotalItems(res.data.pagination.total || 0);
                } else {
                    setTotalPages(1);
                    setTotalItems(res.data.data?.length || 0);
                }
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [searchQuery, page]);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="min-h-[200px] border border-gray-100 rounded-xl bg-gray-50/50 p-4">
                {loading && results.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading products...</div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        <Package className="w-8 h-8 mb-2 opacity-20" />
                        No products found
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {results.map(p => (
                                    <div key={p.id} onClick={() => onAdd(p)} className="bg-white group cursor-pointer border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all">
                                        <div className="aspect-square bg-gray-100 relative">
                                            {p.image_url ? (
                                                <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                                            )}
                                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 flex items-center justify-center transition-all">
                                                <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">{p.name}</p>
                                            <p className="text-sm font-black text-blue-600">₦{Number(p.price || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {results.map(p => (
                                    <button key={p.id} type="button" onClick={() => onAdd(p)} className="w-full flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-200 transition-all text-left group">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 text-gray-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                                            <p className="text-sm font-black text-blue-600">₦{Number(p.price || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-gray-400">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/60">
                                <span className="text-xs text-gray-500">
                                    Showing <span className="font-semibold text-gray-700">{(page - 1) * 12 + 1} - {Math.min(page * 12, totalItems)}</span> of <span className="font-semibold text-gray-700">{totalItems}</span>
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || loading}
                                        className="flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Prev'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || loading}
                                        className="flex items-center justify-center min-w-[70px] px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Next'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
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
            const isWaTools = sessionStorage.getItem("wa_tools_origin") === "true";
            console.log('[Orders Page] wa_tools_origin:', sessionStorage.getItem("wa_tools_origin"), 'isWaTools:', isWaTools);

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
                ...(isWaTools && { metadata: { source: 'wa_tools' } })
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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Back */}
            <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Orders
            </Link>

            <div>
                <h1 className="text-2xl font-black text-gray-900">Create Order</h1>
                <p className="text-sm text-gray-400 mt-1">Manually create an order for a customer</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Error Banner */}
                {error && (
                    <div className="lg:col-span-12 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Left Column: Customer & Products */}
                <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
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

                    {/* Product Browser */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> Products
                        </h2>
                        <ProductBrowser onAdd={addItem} />
                    </div>
                </div>

                {/* Right Column: Cart & Payment */}
                <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                    {/* Selected Items / Cart */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            Selected Items
                        </h2>

                        {items.length === 0 ? (
                            <div className="text-center py-6 text-sm text-gray-400">
                                No items selected yet
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {items.map(item => (
                                        <div key={item.product_id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 text-gray-300 m-2.5" />}
                                                </div>
                                                <p className="flex-1 text-sm font-semibold text-gray-800 line-clamp-2">{item.product_name}</p>
                                                <button type="button" onClick={() => removeItem(item.product_id)}
                                                    className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                                                {/* Price override */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-gray-400">₦</span>
                                                    <input type="number" min="0" step="any" value={item.price}
                                                        onChange={e => updatePrice(item.product_id, e.target.value)}
                                                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                                </div>
                                                {/* Qty */}
                                                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                                                    <button type="button" onClick={() => updateQty(item.product_id, item.quantity - 1)}
                                                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm font-bold rounded-l-lg">−</button>
                                                    <span className="w-6 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                                                    <button type="button" onClick={() => updateQty(item.product_id, item.quantity + 1)}
                                                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-sm font-bold rounded-r-lg">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-200 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
                                    </div>
                                    {discountAmt > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount</span><span>− ₦{discountAmt.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-100">
                                        <span>Total</span><span>₦{total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payment Details
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Payment Method</label>
                                <select value={payment_method} onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Payment Status</label>
                                <select value={payment_status} onChange={e => setPaymentStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                                    <option value="fulfilled">Paid / Fulfilled</option>
                                    <option value="unpaid">Unpaid (Invoice)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Discount Amount (₦)</label>
                                <input type="number" min="0" value={discount_amount} onChange={e => setDiscountAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Notes</label>
                                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                                    placeholder="Order notes..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <Link href="/dashboard/orders"
                            className="flex-[0.4] py-3.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all text-center">
                            Cancel
                        </Link>
                        <button type="submit" disabled={loading || items.length === 0}
                            className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-all flex justify-center items-center gap-2 shadow-sm">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Order'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
