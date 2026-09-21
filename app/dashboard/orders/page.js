"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useCurrency } from "@/hooks/useCurrency";
import toast from "react-hot-toast";
import {
    Search, Loader2, RefreshCw, Plus, Download,
    Globe, Store, MessageCircle, Bot, PenTool, CheckCircle2,
    Clock, Eye, Copy, Check, History, X,
    ShoppingBag, DollarSign, TrendingUp,
    ChevronLeft, ChevronRight
} from "lucide-react";

// ── Status configurations ───────────────────────────────────────────────────
const ORDER_STATUS = {
    pending:    { label: "Pending",    cls: "bg-amber-50 text-amber-700 ring-amber-200 border-amber-200" },
    processing: { label: "Processing", cls: "bg-blue-50 text-blue-700 ring-blue-200 border-blue-200" },
    shipped:    { label: "Shipped",    cls: "bg-indigo-50 text-indigo-700 ring-indigo-200 border-indigo-200" },
    delivered:  { label: "Delivered",  cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200" },
    returned:   { label: "Returned",   cls: "bg-orange-50 text-orange-700 ring-orange-200 border-orange-200" },
    cancelled:  { label: "Cancelled",  cls: "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200" },
};

const PAYMENT_STATUS = {
    unpaid:     { label: "Unpaid",     cls: "bg-rose-50 text-rose-700 ring-rose-200" },
    processing: { label: "Verifying",  cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    paid:       { label: "Paid",       cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    failed:     { label: "Failed",     cls: "bg-rose-100 text-rose-800 ring-rose-300" },
    fulfilled:  { label: "Paid (DM)",  cls: "bg-teal-50 text-teal-700 ring-teal-200" },
    refunded:   { label: "Refunded",   cls: "bg-orange-50 text-orange-700 ring-orange-200" },
};

// ── Channel configurations ──────────────────────────────────────────────────
const CHANNELS = {
    storefront: { id: "storefront", label: "Storefront", icon: Globe,         badgeCls: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20",   iconCls: "text-blue-600 bg-blue-50" },
    pos:        { id: "pos",        label: "POS",         icon: Store,         badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20", iconCls: "text-emerald-600 bg-emerald-50" },
    whatsapp:   { id: "whatsapp",   label: "WhatsApp",    icon: MessageCircle, badgeCls: "bg-green-50 text-green-700 border-green-200 ring-green-500/20",   iconCls: "text-green-600 bg-green-50" },
    be3ai:      { id: "be3ai",      label: "BE3 AI",      icon: Bot,           badgeCls: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20", iconCls: "text-purple-600 bg-purple-50" },
    manual:     { id: "manual",     label: "Manual",      icon: PenTool,       badgeCls: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",   iconCls: "text-amber-600 bg-amber-50" },
};

function ChannelBadge({ channel }) {
    const cfg = CHANNELS[channel] || CHANNELS.storefront;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${cfg.badgeCls}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
}

function OrderBadge({ status }) {
    const cfg = ORDER_STATUS[status] || { label: status, cls: "bg-gray-100 text-gray-600 ring-gray-200 border-gray-200" };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${cfg.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
            {cfg.label}
        </span>
    );
}

function PaymentBadge({ status }) {
    const cfg = PAYMENT_STATUS[status] || { label: status, cls: "bg-gray-100 text-gray-600 ring-gray-200" };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function OrdersPage() {
    const router = useRouter();
    const { formatPrice } = useCurrency();

    const [orders, setOrders] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [auditModalOrder, setAuditModalOrder] = useState(null);
    const [copiedOrder, setCopiedOrder] = useState(null);

    const [pagination, setPagination] = useState({ page: 1, perPage: 25, total: 0, totalPages: 1 });
    const [channelFilter, setChannelFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [dateRange, setDateRange] = useState("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortDir, setSortDir] = useState("desc");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleCopy = (text, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedOrder(text);
        setTimeout(() => setCopiedOrder(null), 1800);
    };

    const calculatedDates = useMemo(() => {
        if (dateRange === "custom") return { from: customFrom, to: customTo };
        if (dateRange === "today") {
            const today = new Date();
            return { from: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString(), to: "" };
        }
        if (dateRange === "7d") { const d = new Date(); d.setDate(d.getDate() - 7); return { from: d.toISOString(), to: "" }; }
        if (dateRange === "30d") { const d = new Date(); d.setDate(d.getDate() - 30); return { from: d.toISOString(), to: "" }; }
        return { from: "", to: "" };
    }, [dateRange, customFrom, customTo]);

    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const params = new URLSearchParams();
            if (calculatedDates.from) params.append("date_from", calculatedDates.from);
            if (calculatedDates.to) params.append("date_to", calculatedDates.to);
            const res = await api.get(`/orders/analytics?${params.toString()}`);
            if (res.data.success) setAnalytics(res.data.analytics);
        } catch (err) {
            console.error("Failed to fetch order analytics:", err);
        } finally {
            setAnalyticsLoading(false);
        }
    }, [calculatedDates.from, calculatedDates.to]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", pagination.page);
            params.append("per_page", pagination.perPage);
            if (channelFilter !== "all") params.append("channel", channelFilter);
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (paymentFilter !== "all") params.append("payment_status", paymentFilter);
            if (debouncedSearch) params.append("search", debouncedSearch);
            if (calculatedDates.from) params.append("date_from", calculatedDates.from);
            if (calculatedDates.to) params.append("date_to", calculatedDates.to);
            if (sortBy) params.append("sort_by", sortBy);
            if (sortDir) params.append("sort_dir", sortDir);

            const res = await api.get(`/orders?${params.toString()}`);
            if (res.data.success) {
                setOrders(res.data.data || []);
                setPagination(p => ({ ...p, ...res.data.pagination }));
            }
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.perPage, channelFilter, statusFilter, paymentFilter, debouncedSearch, calculatedDates.from, calculatedDates.to, sortBy, sortDir]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    // Reset page on filter change
    useEffect(() => {
        setPagination(p => ({ ...p, page: 1 }));
    }, [channelFilter, statusFilter, paymentFilter, debouncedSearch, calculatedDates.from, calculatedDates.to, sortBy, sortDir]);

    const handleQuickStatus = async (orderId, currentStatus, newStatus, paymentStatus, e) => {
        e.stopPropagation();
        if (paymentStatus === "unpaid" && newStatus !== "processing") {
            toast.error("Cannot advance — payment is unpaid");
            return;
        }
        setUpdatingId(orderId);
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders();
            fetchAnalytics();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || "Failed to update status";
            if (err.response?.status === 402) {
                if (confirm("Payment is unpaid. Manually confirm off-platform payment?")) {
                    try {
                        await api.patch(`/orders/${orderId}/payment-status`, { payment_status: "fulfilled" });
                        await api.patch(`/orders/${orderId}/status`, { status: newStatus });
                        toast.success("Payment confirmed and order updated");
                        fetchOrders();
                        fetchAnalytics();
                    } catch (e2) {
                        toast.error("Failed to confirm payment");
                    }
                }
            } else {
                toast.error(msg);
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleSelectAll = () => {
        setSelectedOrders(selectedOrders.length === orders.length && orders.length > 0 ? [] : orders.map(o => o.id));
    };
    const toggleSelectOrder = (id, e) => {
        e.stopPropagation();
        setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkStatus = async (newStatus) => {
        if (!selectedOrders.length) return;
        if (!confirm(`Mark ${selectedOrders.length} orders as "${newStatus}"?`)) return;
        setBulkLoading(true);
        try {
            await api.post("/orders/bulk-status", { order_ids: selectedOrders, status: newStatus });
            toast.success(`${selectedOrders.length} orders updated to ${newStatus}`);
            setSelectedOrders([]);
            fetchOrders();
            fetchAnalytics();
        } catch (err) {
            toast.error(err.response?.data?.error || "Bulk update failed");
        } finally {
            setBulkLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!orders.length) { toast.error("No orders to export"); return; }
        const headers = ["Order Number", "Channel", "Date", "Customer Name", "Customer Email", "Customer Phone", "Status", "Payment Status", "Subtotal", "Discount", "Shipping", "Tax", "Total", "Coupon Code", "Items Count"];
        const rows = orders.map(o => [
            o.order_number, o.resolved_channel || o.channel,
            new Date(o.created_at).toISOString(),
            `"${(o.customer_display_name || "").replace(/"/g, '""')}"`,
            `"${(o.customer_email || "").replace(/"/g, '""')}"`,
            `"${(o.customer_phone || "").replace(/"/g, '""')}"`,
            o.status, o.payment_status,
            o.subtotal || 0, o.discount_amount || 0, o.shipping_amount || 0, o.tax_amount || 0, o.total || 0,
            o.coupon_code || "", o.item_count || 0
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${orders.length} orders`);
    };

    // ── Analytics stat card data ───────────────────────────────────────────
    const statCards = analytics?.overview ? [
        {
            name: "Total Revenue",
            value: formatPrice(analytics.overview.total_revenue),
            sub: analytics.overview.total_revenue > 0
                ? `${Math.round((analytics.overview.paid_revenue / analytics.overview.total_revenue) * 100)}% collected`
                : "No revenue yet",
            icon: DollarSign,
            text: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            name: "Total Orders",
            value: analytics.overview.total_orders.toLocaleString(),
            sub: "Across all channels",
            icon: ShoppingBag,
            text: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            name: "Avg Order Value",
            value: formatPrice(analytics.overview.avg_order_value),
            sub: "Gross average",
            icon: TrendingUp,
            text: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            name: "Requires Action",
            value: analytics.overview.pending_fulfillment_count,
            sub: "Pending / Processing",
            icon: Clock,
            text: "text-amber-600",
            bg: "bg-amber-50",
        },
    ] : [];

    return (
        <div className="w-full space-y-4">
            {/* ── Header ───────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between bg-white p-5 rounded-lg border border-gray-100 shadow-none">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Orders</h1>
                    <p className="text-xs text-gray-400 font-medium">
                        {analyticsLoading ? "Loading…" : `${analytics?.overview?.total_orders ?? 0} orders across all channels`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => { fetchOrders(); fetchAnalytics(); }}
                        className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${(loading || analyticsLoading) ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                    <Link
                        href="/dashboard/orders/create"
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        New Order
                    </Link>
                </div>
            </div>

            {/* ── Analytics Overview (4 stat cards) ────────────────────────────── */}
            {!analyticsLoading && analytics?.overview && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {statCards.map(stat => (
                        <div
                            key={stat.name}
                            className="bg-white rounded-lg shadow-none p-5 flex items-start justify-between border border-gray-100"
                        >
                            <div>
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg ${stat.bg} bg-opacity-50`}>
                                <stat.icon className={`w-5 h-5 ${stat.text}`} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Filters & Controls ────────────────────────────────────────────── */}
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-none space-y-3">
                {/* Channel pill tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setChannelFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            channelFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        All
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${channelFilter === "all" ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-600"}`}>
                            {analytics?.overview?.total_orders ?? "—"}
                        </span>
                    </button>
                    {Object.values(CHANNELS).map(cfg => {
                        const Icon = cfg.icon;
                        const count = analytics?.channels?.[cfg.id]?.count ?? 0;
                        const isActive = channelFilter === cfg.id;
                        return (
                            <button
                                key={cfg.id}
                                onClick={() => setChannelFilter(cfg.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                    isActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {cfg.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-blue-700 text-blue-100" : "bg-gray-200 text-gray-600"}`}>
                                    {analyticsLoading ? "…" : count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filter row */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search order #, customer name, email, phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="returned">Returned</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        value={paymentFilter}
                        onChange={e => setPaymentFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    >
                        <option value="all">All Payments</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="fulfilled">Paid (DM / Cash)</option>
                        <option value="processing">Verifying</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="custom">Custom Range…</option>
                    </select>

                    <select
                        value={`${sortBy}_${sortDir}`}
                        onChange={e => {
                            const [by, dir] = e.target.value.split("_");
                            setSortBy(by); setSortDir(dir);
                        }}
                        className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    >
                        <option value="created_at_desc">Newest First</option>
                        <option value="created_at_asc">Oldest First</option>
                        <option value="total_desc">Highest Total</option>
                        <option value="total_asc">Lowest Total</option>
                    </select>
                </div>

                {/* Custom date range */}
                {dateRange === "custom" && (
                    <div className="flex items-center gap-3 text-sm border-t border-gray-100 pt-3">
                        <span className="text-gray-500 font-medium">From:</span>
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none" />
                        <span className="text-gray-500 font-medium">To:</span>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none" />
                    </div>
                )}
            </div>

            {/* ── Bulk Actions Bar (sticky) ─────────────────────────────────────── */}
            {selectedOrders.length > 0 && (
                <div className="sticky top-4 z-30 bg-gray-900 text-white p-3 rounded-lg shadow-xl flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold">{selectedOrders.length} selected</span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleBulkStatus("processing")} disabled={bulkLoading} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">Processing</button>
                        <button onClick={() => handleBulkStatus("shipped")} disabled={bulkLoading} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">Shipped</button>
                        <button onClick={() => handleBulkStatus("cancelled")} disabled={bulkLoading} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">Cancel</button>
                        <button onClick={() => setSelectedOrders([])} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-all">Clear</button>
                    </div>
                </div>
            )}

            {/* ── Orders Table (Desktop) ────────────────────────────────────────── */}
            <div className="hidden lg:block bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 text-xs uppercase tracking-wide">
                            <tr>
                                <th className="px-5 py-3.5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === orders.length && orders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-5 py-3.5">Order</th>
                                <th className="px-5 py-3.5">Date</th>
                                <th className="px-5 py-3.5">Customer</th>
                                <th className="px-5 py-3.5">Items</th>
                                <th className="px-5 py-3.5">Total</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Payment</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-20 text-center text-gray-400">
                                        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
                                        <p className="font-medium text-gray-600">Loading orders…</p>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-20 text-center text-gray-400">
                                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="font-semibold text-gray-600">No orders found</p>
                                        <p className="text-xs mt-1">Adjust filters to see results</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => {
                                    const isSelected = selectedOrders.includes(order.id);
                                    const channel = order.resolved_channel || order.channel || "storefront";
                                    return (
                                        <tr
                                            key={order.id}
                                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer group ${isSelected ? "bg-blue-50/50" : ""}`}
                                        >
                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={e => toggleSelectOrder(order.id, e)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                                                        {order.order_number}
                                                    </span>
                                                    <button
                                                        onClick={e => handleCopy(order.order_number, e)}
                                                        className="text-gray-300 hover:text-gray-500 p-0.5 transition-colors"
                                                    >
                                                        {copiedOrder === order.order_number ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                                <div className="mt-1">
                                                    <ChannelBadge channel={channel} />
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="text-xs font-medium text-gray-900 block">
                                                    {new Date(order.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                                </span>
                                                <span className="text-[11px] text-gray-400">{formatRelativeTime(order.created_at)}</span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                                        {(order.customer_display_name || "G")[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">{order.customer_display_name}</p>
                                                        <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{order.customer_email || order.customer_phone || "Guest"}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                                                    {order.item_count || 1} item{order.item_count !== 1 ? "s" : ""}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                                                {parseFloat(order.discount_amount || 0) > 0 && (
                                                    <span className="text-[10px] font-semibold text-emerald-600">Saved {formatPrice(order.discount_amount)}</span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <OrderBadge status={order.status} />
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <PaymentBadge status={order.payment_status} />
                                            </td>

                                            <td className="px-5 py-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1">
                                                    {order.status === "pending" && (
                                                        <button onClick={e => handleQuickStatus(order.id, order.status, "processing", order.payment_status, e)} disabled={updatingId === order.id} className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold transition-all">Process</button>
                                                    )}
                                                    {order.status === "processing" && (
                                                        <button onClick={e => handleQuickStatus(order.id, order.status, "shipped", order.payment_status, e)} disabled={updatingId === order.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-bold transition-all">Ship</button>
                                                    )}
                                                    {order.status === "shipped" && (
                                                        <button onClick={e => handleQuickStatus(order.id, order.status, "delivered", order.payment_status, e)} disabled={updatingId === order.id} className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold transition-all">Deliver</button>
                                                    )}
                                                    <button onClick={() => setAuditModalOrder(order)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Audit trail">
                                                        <History className="w-3.5 h-3.5" />
                                                    </button>
                                                    <Link href={`/dashboard/orders/${order.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Mobile Order Cards ────────────────────────────────────────────── */}
            <div className="lg:hidden space-y-3">
                {loading ? (
                    <div className="bg-white p-12 rounded-lg border border-gray-100 text-center">
                        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-gray-500 font-medium text-sm">Loading orders…</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-10 rounded-lg border border-gray-100 text-center">
                        <p className="text-gray-700 font-bold">No orders found</p>
                        <p className="text-xs text-gray-400 mt-1">Adjust filters to see orders</p>
                    </div>
                ) : (
                    orders.map(order => {
                        const channel = order.resolved_channel || order.channel || "storefront";
                        return (
                            <div
                                key={order.id}
                                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                                className="bg-white p-4 rounded-lg border border-gray-100 active:bg-gray-50 transition-colors space-y-3 cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-sm text-gray-900">{order.order_number}</span>
                                            <button onClick={e => handleCopy(order.order_number, e)} className="text-gray-400 p-0.5">
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString()} · {formatRelativeTime(order.created_at)}
                                        </p>
                                    </div>
                                    <ChannelBadge channel={channel} />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800">{order.customer_display_name}</p>
                                        <p className="text-[11px] text-gray-400">{order.item_count || 1} item(s)</p>
                                    </div>
                                    <p className="text-base font-black text-gray-900">{formatPrice(order.total)}</p>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5">
                                        <OrderBadge status={order.status} />
                                        <PaymentBadge status={order.payment_status} />
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); setAuditModalOrder(order); }}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded border border-gray-100"
                                    >
                                        <History className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Pagination ────────────────────────────────────────────────────── */}
            {!loading && pagination.total > 0 && (
                <div className="bg-white px-5 py-3.5 rounded-lg border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <p className="text-xs text-gray-500">
                        Showing <span className="font-bold text-gray-800">{(pagination.page - 1) * pagination.perPage + 1}</span>–<span className="font-bold text-gray-800">{Math.min(pagination.page * pagination.perPage, pagination.total)}</span> of <span className="font-bold text-gray-800">{pagination.total}</span> orders
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
                        <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Audit Trail Modal ─────────────────────────────────────────────── */}
            {auditModalOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAuditModalOrder(null)}>
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <History className="w-4 h-4 text-blue-600" />
                                    Order Audit Trail
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">{auditModalOrder.order_number} · {auditModalOrder.resolved_channel || auditModalOrder.channel}</p>
                            </div>
                            <button onClick={() => setAuditModalOrder(null)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">Order Placed</p>
                                        <p className="text-[11px] text-gray-400">{new Date(auditModalOrder.created_at).toLocaleString()}</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Channel: <span className="font-semibold">{auditModalOrder.resolved_channel || auditModalOrder.channel}</span>
                                        </p>
                                    </div>
                                </div>

                                {Array.isArray(auditModalOrder.metadata?.audit_log) && auditModalOrder.metadata.audit_log.map((entry, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 capitalize">{(entry.action || "update").replace(/_/g, " ")}</p>
                                            <p className="text-[11px] text-gray-400">{new Date(entry.timestamp).toLocaleString()}</p>
                                            <p className="text-xs text-gray-700 mt-1 font-medium">
                                                {entry.from ? `${entry.from} → ${entry.to}` : `Changed to ${entry.to}`}
                                            </p>
                                            {entry.actor_name && <p className="text-[11px] text-gray-500 mt-0.5">By: <span className="font-semibold text-gray-700">{entry.actor_name}</span></p>}
                                            {entry.note && <p className="text-xs italic text-gray-500 mt-1 bg-gray-50 p-2 rounded border border-gray-100">"{entry.note}"</p>}
                                        </div>
                                    </div>
                                ))}

                                {auditModalOrder.payment_confirmed_at && (
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-teal-500 ring-4 ring-teal-100" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Manual Payment Confirmed</p>
                                            <p className="text-[11px] text-gray-400">{new Date(auditModalOrder.payment_confirmed_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Status: <strong className="text-gray-900">{auditModalOrder.status}</strong> · Payment: <strong className="text-gray-900">{auditModalOrder.payment_status}</strong>
                            </span>
                            <button onClick={() => setAuditModalOrder(null)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
