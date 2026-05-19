"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import {
    Tag, Plus, Search, ToggleLeft, ToggleRight, Trash2,
    Percent, DollarSign, Truck, Calendar, Users, AlertCircle, CheckCircle
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const TYPE_META = {
    percentage:   { label: "% Off",         icon: Percent,    color: "text-blue-600",   bg: "bg-blue-50"  },
    fixed:        { label: "Fixed Amount",   icon: DollarSign, color: "text-green-600",  bg: "bg-green-50" },
    free_shipping:{ label: "Free Shipping",  icon: Truck,      color: "text-purple-600", bg: "bg-purple-50"},
};

function CouponCard({ coupon, onToggle, onDelete }) {
    const type = TYPE_META[coupon.type] || TYPE_META.percentage;
    const Icon = type.icon;
    const now = new Date();
    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < now;
    const isExhausted = coupon.max_uses && coupon.used_count >= coupon.max_uses;
    const effectivelyActive = coupon.is_active && !isExpired && !isExhausted;

    return (
        <div className={`bg-white rounded-2xl border ${effectivelyActive ? 'border-gray-100' : 'border-gray-100 opacity-70'} p-5 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${type.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${type.color}`} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 font-mono tracking-wider text-sm">{coupon.code}</p>
                        <p className="text-xs text-gray-400">{type.label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {effectivelyActive
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Active</span>
                        : <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> {isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Disabled'}</span>
                    }
                </div>
            </div>

            {/* Value */}
            <div className="mb-4">
                <p className="text-2xl font-black text-gray-900">
                    {coupon.type === 'percentage' ? `${coupon.value}%` :
                     coupon.type === 'free_shipping' ? 'Free Ship' :
                     `₦${Number(coupon.value).toLocaleString()}`}
                </p>
                {coupon.description && <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center bg-gray-50 rounded-xl p-2">
                    <p className="text-xs text-gray-400">Used</p>
                    <p className="text-sm font-bold text-gray-800">{coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-xl p-2">
                    <p className="text-xs text-gray-400">Min Order</p>
                    <p className="text-sm font-bold text-gray-800">{coupon.min_order_value > 0 ? `₦${Number(coupon.min_order_value).toLocaleString()}` : 'None'}</p>
                </div>
                <div className="text-center bg-gray-50 rounded-xl p-2">
                    <p className="text-xs text-gray-400">Expires</p>
                    <p className="text-sm font-bold text-gray-800">
                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '∞'}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button onClick={() => onToggle(coupon)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all
                        ${coupon.is_active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {coupon.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {coupon.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => onDelete(coupon.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function DiscountsPage() {
    const { token } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | active | inactive

    const fetchCoupons = useCallback(async () => {
        try {
            const params = {};
            if (filter !== 'all') params.active = filter === 'active' ? 'true' : 'false';
            const res = await api.get('/discounts', { params });
            if (res.data.success) setCoupons(res.data.data);
        } catch (e) {
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const handleToggle = async (coupon) => {
        try {
            await api.patch(`/discounts/${coupon.id}`, { is_active: !coupon.is_active });
            toast.success(`Coupon ${coupon.is_active ? 'disabled' : 'enabled'}`);
            fetchCoupons();
        } catch (e) {
            toast.error('Failed to update coupon');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deactivate this coupon?')) return;
        try {
            await api.delete(`/discounts/${id}`);
            toast.success('Coupon deactivated');
            fetchCoupons();
        } catch (e) {
            toast.error('Failed to deactivate');
        }
    };

    const filtered = coupons.filter(c =>
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Discounts & Coupons</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Create and manage promotional coupon codes</p>
                </div>
                <Link href="/dashboard/discounts/create"
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
                    <Plus className="w-4 h-4" />
                    New Coupon
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" placeholder="Search coupons..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'inactive'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all
                                ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Coupons', value: coupons.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active', value: coupons.filter(c => c.is_active).length, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Total Uses', value: coupons.reduce((s, c) => s + c.used_count, 0), color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Expired', value: coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length, color: 'text-red-500', bg: 'bg-red-50' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl p-4`}>
                        <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                        <Tag className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No coupons found</p>
                    <p className="text-xs text-gray-400 mt-1">Create your first discount coupon</p>
                    <Link href="/dashboard/discounts/create"
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">
                        Create Coupon
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(coupon => (
                        <CouponCard key={coupon.id} coupon={coupon} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
