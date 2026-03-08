"use client";

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    Eye,
    MousePointer2,
    Percent,
    Users,
    Calendar,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ShoppingBag,
    LayoutDashboard,
    BarChart3,
    RefreshCw,
    Clock
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/components/providers/AuthContext';
import AnalyticsService from '@/lib/services/AnalyticsService';
import StatsCard from '@/components/analytics/StatsCard';
import RankingTable from '@/components/analytics/RankingTable';
import SurfaceHeatmap from '@/components/analytics/SurfaceHeatmap';

export default function AnalyticsDashboard() {
    const { user } = useAuth();
    const [period, setPeriod] = useState('30D');
    const [customRange, setCustomRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ source: 'cache', updated_at: null });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState([]);
    const [surfaces, setSurfaces] = useState([]);
    const [chartMetric, setChartMetric] = useState('orders');
    const [summary, setSummary] = useState({
        totalImpressions: 0,
        totalPageViews: 0,
        totalClicks: 0,
        avgCtr: 0,
        newCustomers: 0,
        trends: []
    });

    const loadData = async (forceRefresh = false) => {
        if (!user?.tenant_id) return;
        setLoading(true);
        if (forceRefresh) setIsRefreshing(true);
        try {
            const params = {
                period,
                ...(period === 'Custom' ? customRange : {}),
                ...(forceRefresh ? { refresh: true } : {})
            };

            // Fetch stats and surfaces in parallel
            const [statsData, surfacesData, dashboardSummary] = await Promise.all([
                AnalyticsService.fetchStats(params),
                api.get('/analytics/surfaces', { params }),
                AnalyticsService.fetchDashboardSummary(params)
            ]);

            setStats(statsData.data || []);
            setSurfaces(surfacesData.data?.data || []);

            // Capture meta from one of the responses (e.g., dashboardSummary)
            if (dashboardSummary?._meta) {
                setMeta(dashboardSummary._meta);
            }

            const currentStats = statsData.data || [];
            const totals = dashboardSummary?.totals || {};

            // Use backend totals if available, otherwise fallback to stats calculation
            const totalImpressions = totals.impressions !== undefined ? totals.impressions : currentStats.reduce((sum, s) => sum + parseInt(s.impressions || 0), 0);
            const totalPageViews = totals.page_views !== undefined ? totals.page_views : currentStats.reduce((sum, s) => sum + parseInt(s.page_views || 0), 0);
            const totalClicks = totals.clicks !== undefined ? totals.clicks : currentStats.reduce((sum, s) => sum + parseInt(s.clicks || 0), 0);

            setSummary({
                totalImpressions,
                totalPageViews,
                totalClicks,
                avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0,
                newCustomers: totals.customers || 0,
                trends: dashboardSummary?.chart_data || []
            });
        } catch (error) {
            console.error('[Analytics] Load failed:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.tenant_id, period, customRange.startDate, customRange.endDate]);

    const [selectedTab, setSelectedTab] = useState(null);

    const groupedStats = React.useMemo(() => {
        const groups = stats.reduce((acc, s) => {
            const type = s.entity_type || 'other';
            if (!acc[type]) acc[type] = [];
            acc[type].push(s);
            return acc;
        }, {});

        // Auto-select first tab if none selected
        const types = Object.keys(groups);
        if (types.length > 0 && !selectedTab) {
            setSelectedTab(types[0]);
        }

        return groups;
    }, [stats, selectedTab]);

    return (
        <div className="w-full space-y-4 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg shadow-none border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        Insights & Performance
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5">
                        {meta.updated_at && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    Updated {new Date(meta.updated_at).toLocaleTimeString()}
                                    <span className="mx-1 opacity-30">|</span>
                                    {meta.source === 'cache' ? 'Cached' : meta.source === 'stale' ? 'Updating...' : 'Fresh'}
                                </div>
                                <button
                                    onClick={() => loadData(true)}
                                    disabled={loading || isRefreshing}
                                    title="Refresh Analytics"
                                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    {period === 'Custom' && (
                        <div className="flex items-center gap-2 bg-white p-1.5 border border-gray-200 rounded-xl">
                            <input
                                type="date"
                                value={customRange.startDate}
                                onChange={(e) => setCustomRange(p => ({ ...p, startDate: e.target.value }))}
                                className="text-[10px] font-bold text-gray-600 px-1 focus:outline-none"
                            />
                            <span className="text-gray-300 text-[10px]">→</span>
                            <input
                                type="date"
                                value={customRange.endDate}
                                onChange={(e) => setCustomRange(p => ({ ...p, endDate: e.target.value }))}
                                className="text-[10px] font-bold text-gray-600 px-1 focus:outline-none"
                            />
                        </div>
                    )}

                    <div className="flex p-1 bg-gray-100 rounded-xl overflow-x-auto">
                        {['Today', '7D', 'This Month', 'Custom'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap",
                                    period === p
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="Total Page Views"
                    value={summary.totalPageViews.toLocaleString()}
                    icon={LayoutDashboard}
                    loading={loading}
                    variant="blue"
                />
                <StatsCard
                    title="Impressions"
                    value={summary.totalImpressions.toLocaleString()}
                    icon={Eye}
                    loading={loading}
                    variant="purple"
                />
                <StatsCard
                    title="Clicks"
                    value={summary.totalClicks.toLocaleString()}
                    icon={MousePointer2}
                    loading={loading}
                    variant="emerald"
                />
                <StatsCard
                    title="Average CTR"
                    value={`${summary.avgCtr}%`}
                    icon={Percent}
                    loading={loading}
                    variant="emerald"
                />
                <StatsCard
                    title="New Customers"
                    value={summary.newCustomers.toLocaleString()}
                    icon={Users}
                    loading={loading}
                    variant="orange"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Engagement Trends */}
                <div className="lg:col-span-2 bg-white p-5 rounded-lg shadow-none border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="font-bold text-gray-900">Engagement Trends</h3>
                            <p className="text-xs text-gray-400 font-medium">Daily performance analysis</p>
                        </div>

                        <div className="flex p-1 bg-gray-50 rounded-lg self-start">
                            {[
                                { id: 'orders', label: 'Orders', color: '#3b82f6' },
                                { id: 'page_views', label: 'Views', color: '#8b5cf6' },
                                { id: 'impressions', label: 'Impressions', color: '#a855f7' },
                                { id: 'clicks', label: 'Clicks', color: '#10b981' }
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setChartMetric(m.id)}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                                        chartMetric === m.id
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary.trends}>
                                <defs>
                                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor={
                                                chartMetric === 'orders' ? '#3b82f6' :
                                                    chartMetric === 'page_views' ? '#8b5cf6' :
                                                        chartMetric === 'clicks' ? '#10b981' : '#a855f7'
                                            }
                                            stopOpacity={0.1}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={
                                                chartMetric === 'orders' ? '#3b82f6' :
                                                    chartMetric === 'page_views' ? '#8b5cf6' :
                                                        chartMetric === 'clicks' ? '#10b981' : '#a855f7'
                                            }
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={chartMetric === 'orders' ? 'order_count' : chartMetric}
                                    name={chartMetric.replace('_', ' ').toUpperCase()}
                                    stroke={
                                        chartMetric === 'orders' ? '#3b82f6' :
                                            chartMetric === 'page_views' ? '#8b5cf6' :
                                                chartMetric === 'clicks' ? '#10b981' : '#a855f7'
                                    }
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorMetric)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Surface Heatmap */}
                <SurfaceHeatmap data={surfaces} loading={loading} />
            </div>

            {/* Ranking Leaderboards with Pill Tabs */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 px-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                            Performance Leaderboards
                        </h2>
                    </div>

                    {/* Pill Tabs */}
                    <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                        {Object.keys(groupedStats).length > 0 ? (
                            Object.keys(groupedStats).sort().map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedTab(type)}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all whitespace-nowrap",
                                        selectedTab === type
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    {type.replace('_', ' ')}s
                                </button>
                            ))
                        ) : (
                            <div className="px-6 py-2 text-xs font-bold text-gray-300 uppercase">Waiting for data...</div>
                        )}
                    </div>
                </div>

                {selectedTab && groupedStats[selectedTab] ? (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <RankingTable
                            data={groupedStats[selectedTab]}
                            loading={loading}
                            title={`Top Engaging ${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1).replace('_', ' ')}s`}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                        <TrendingUp className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase text-xs">Select a category to view rankings</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
