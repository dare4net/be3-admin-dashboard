"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { Package, ShoppingCart, DollarSign, TrendingUp, Clock, RefreshCw, ArrowRight, User } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
    const { user, setGlobalLoading } = useAuth();
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        revenue: 0,
        customers: 0,
        impressions: 0,
        aov: 0,
        conversion: 0
    });
    const [chartData, setChartData] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [period, setPeriod] = useState('30D');
    const [customRange, setCustomRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchStats();
    }, [period, customRange.startDate, customRange.endDate]);

    const fetchStats = async (forceRefresh = false) => {
        try {
            setLoading(true);
            if (forceRefresh) setIsRefreshing(true);

            const params = {
                period,
                ...(period === 'Custom' ? customRange : {}),
                ...(forceRefresh ? { refresh: true } : {})
            };

            // Calculate previous period params for trend comparison
            let prevParams = { period: 'Custom' };
            const now = new Date();
            const currentEndDate = (period === 'Custom' && customRange.endDate) ? new Date(customRange.endDate) : new Date();
            const currentStartDate = (period === 'Custom' && customRange.startDate) ? new Date(customRange.startDate) : new Date(now.setDate(now.getDate() - 30));

            // Re-resolve current period if not custom to be safe
            if (period !== 'Custom') {
                // Simple lookback based on period string
                const today = new Date();
                let days = 30;
                if (period === 'Today') days = 1;
                if (period === '7D') days = 7;
                if (period === 'This Month') days = 30; // Approximation

                // Set current period start/end for calculation
                // Note: The backend handles 'period' param, but for prevParams we need explicit dates
                // Actually, let's just shift based on the 'days' duration

                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - days);

                // Previous period: shift back by 'days' again
                const prevEnd = new Date(start);
                const prevStart = new Date(start);
                prevStart.setDate(prevStart.getDate() - days);

                prevParams.startDate = prevStart.toISOString().split('T')[0];
                prevParams.endDate = prevEnd.toISOString().split('T')[0];
            } else {
                const duration = currentEndDate - currentStartDate;
                const prevEnd = new Date(currentStartDate);
                const prevStart = new Date(prevEnd.getTime() - duration);
                prevParams.startDate = prevStart.toISOString().split('T')[0];
                prevParams.endDate = prevEnd.toISOString().split('T')[0];
            }

            // Fetch all dashboard data in parallel using allSettled
            const results = await Promise.allSettled([
                api.get("/products"),
                api.get("/analytics/dashboard", { params }),
                api.get("/analytics/dashboard", { params: { ...prevParams, period: 'Custom' } }),
                api.get("/orders", { params: { limit: 8, page: 1 } }),
                api.get("/analytics/stats", { params: { ...params, limit: 5, orderBy: 'impressions' } })
            ]);

            const [productsRes, analyticsRes, prevAnalyticsRes, ordersRes, topProductsRes] = results;

            // Process Data
            const productsData = productsRes.status === 'fulfilled' ? productsRes.value.data : {};
            const analyticsData = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : {};
            const prevAnalyticsData = prevAnalyticsRes.status === 'fulfilled' ? prevAnalyticsRes.value.data : {};
            const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value.data : {};
            const topProductsData = topProductsRes.status === 'fulfilled' ? topProductsRes.value.data : {};

            if (analyticsData?._meta) {
                setMeta(analyticsData._meta);
            }

            const calculateTrend = (current, previous) => {
                if (!previous || previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            // Derived Metrics
            const totalOrders = analyticsData?.totals?.orders || 0;
            const totalRevenue = analyticsData?.totals?.sales || 0;
            const totalClicks = analyticsData?.totals?.clicks || 0;

            const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const conversion = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

            // Previous Derived Metrics (for trends)
            const prevOrders = prevAnalyticsData?.totals?.orders || 0;
            const prevRevenue = prevAnalyticsData?.totals?.sales || 0;
            const prevClicks = prevAnalyticsData?.totals?.clicks || 0;
            const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;
            const prevConversion = prevClicks > 0 ? (prevOrders / prevClicks) * 100 : 0;

            setStats({
                products: productsData.pagination?.total || 0,
                orders: totalOrders,
                revenue: totalRevenue,
                customers: analyticsData?.totals?.customers || 0,
                impressions: analyticsData?.totals?.impressions || 0,
                aov: aov,
                conversion: conversion,
                trends: {
                    orders: calculateTrend(totalOrders, prevOrders),
                    revenue: calculateTrend(totalRevenue, prevRevenue),
                    aov: calculateTrend(aov, prevAov),
                    conversion: calculateTrend(conversion, prevConversion),
                    products: 0
                }
            });

            // Set Chart Data
            setChartData(analyticsData.chart_data || []);

            // Set Recent Orders
            setRecentOrders(ordersData.data || ordersData.orders || []);

            // Set Top Products
            setTopProducts(topProductsData.data || []);
            console.log('[Dashboard] Top Products Data:', topProductsData.data);

        } catch (err) {
            console.error("Failed to fetch stats", err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
            setGlobalLoading(false);
        }
    };

    const statCards = [
        {
            name: "Total Revenue",
            value: `$${stats.revenue.toFixed(2)}`,
            trend: stats.trends?.revenue,
            icon: DollarSign,
            text: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            name: "Orders",
            value: stats.orders,
            trend: stats.trends?.orders,
            icon: ShoppingCart,
            text: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            name: "Avg Order Value",
            value: `$${stats.aov.toFixed(2)}`,
            trend: stats.trends?.aov,
            icon: DollarSign,
            text: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            name: "Conversion Rate",
            value: `${stats.conversion.toFixed(1)}%`,
            trend: stats.trends?.conversion,
            icon: TrendingUp,
            text: "text-orange-600",
            bg: "bg-orange-50",
        },
        {
            name: "Total Products",
            value: stats.products,
            trend: stats.trends?.products,
            icon: Package,
            text: "text-indigo-600",
            bg: "bg-indigo-50",
        },
        {
            name: "Impressions",
            value: stats.impressions.toLocaleString(),
            trend: 0,
            icon: User,
            text: "text-pink-600",
            bg: "bg-pink-50",
        }
    ];

    return (
        <div>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
                    <div className="flex items-center gap-3 mt-1">
                        {meta?.updated_at && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                <Clock className="w-3 h-3" />
                                Updated {new Date(meta.updated_at).toLocaleTimeString()}
                                <span className="mx-1 opacity-20">|</span>
                                {meta.source === 'cache' ? 'Cached' : 'Fresh'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div id="period-selector" className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto max-w-full no-scrollbar">
                        {['Today', '7D', 'This Month', 'Custom'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
                                    period === p
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    {period === 'Custom' && (
                        <div className="flex items-center gap-2 bg-white p-1.5 border border-gray-200 rounded-lg shadow-sm">
                            <input
                                type="date"
                                value={customRange.startDate}
                                onChange={(e) => setCustomRange(p => ({ ...p, startDate: e.target.value }))}
                                className="text-xs font-medium text-gray-700 px-1 focus:outline-none bg-transparent"
                            />
                            <span className="text-gray-400 text-xs">→</span>
                            <input
                                type="date"
                                value={customRange.endDate}
                                onChange={(e) => setCustomRange(p => ({ ...p, endDate: e.target.value }))}
                                className="text-xs font-medium text-gray-700 px-1 focus:outline-none bg-transparent"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => fetchStats(true)}
                        disabled={loading || isRefreshing}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw className={isRefreshing ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.name}
                        className="bg-white rounded-lg shadow-none p-5 flex items-start justify-between border border-gray-100"
                    >
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{stat.name}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {loading ? "..." : stat.value}
                            </p>

                            {stat.trend !== null && stat.trend !== undefined && (
                                <div className={cn(
                                    "flex items-center gap-1 mt-2 text-xs font-bold",
                                    stat.trend >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    <TrendingUp className={cn("w-3 h-3", stat.trend < 0 && "rotate-180")} />
                                    {Math.abs(stat.trend).toFixed(1)}%
                                </div>
                            )}
                        </div>
                        <div className={`p-2.5 rounded-lg ${stat.bg} bg-opacity-50`}>
                            <stat.icon className={`w-5 h-5 ${stat.text}`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart */}
                <div id="analytics-chart" className="lg:col-span-2 bg-white rounded-lg shadow-none border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return `${d.getMonth() + 1}/${d.getDate()}`;
                                    }}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value}`, 'Revenue']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total_sales"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-lg shadow-none border border-gray-100 p-6 flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Top Products</h2>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                        {topProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                <Package className="w-8 h-8 mb-2 opacity-50" />
                                No data available
                            </div>
                        ) : (
                            topProducts.map((p, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                        {p.thumbnail ? (
                                            <img src={p.thumbnail} alt={p.entity_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{p.entity_name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">#{i + 1} • {p.impressions} Views</p>
                                    </div>
                                    <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                        {p.ctr}%
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <Link href="/dashboard/analytics" className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 justify-center border-t border-gray-100 pt-3">
                        View Analytics <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-none border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                    <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-50">
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</th>
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">
                                        No recent orders found.
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
                                        <td className="py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {(order.customer_email || 'G').charAt(0).toUpperCase()}
                                                </div>
                                                {order.customer_email || 'Guest'}
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-sm font-bold text-gray-900">
                                            ${parseFloat(order.total).toFixed(2)}
                                        </td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                                order.status === 'completed' ? "bg-green-50 text-green-700" :
                                                    order.status === 'pending' ? "bg-yellow-50 text-yellow-700" :
                                                        order.status === 'cancelled' ? "bg-red-50 text-red-700" :
                                                            "bg-gray-100 text-gray-700"
                                            )}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div id="quick-actions" className="bg-white rounded-lg shadow-none border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto pb-2 no-scrollbar snap-x">
                    <Link
                        href="/dashboard/products/create"
                        className="flex-shrink-0 w-[240px] md:w-auto flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all group snap-start"
                    >
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Add New Product</p>
                            <p className="text-sm text-gray-500">Create a product listing</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/products"
                        className="flex-shrink-0 w-[240px] md:w-auto flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all group snap-start"
                    >
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">View Products</p>
                            <p className="text-sm text-gray-500">Manage your catalog</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
