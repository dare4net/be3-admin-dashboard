"use client";

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Trash2, CheckCircle, Clock, AlertCircle, ArrowDown } from 'lucide-react';
import api from '@/lib/axios';

const JourneyModal = ({ isOpen, onClose, entity }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (isOpen && entity) {
            fetchJourney();
        }
    }, [isOpen, entity]);

    const fetchJourney = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics/journey/${entity.entity_type}/${entity.entity_id}`);
            setData(res.data);
        } catch (err) {
            console.error('Failed to fetch journey:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">
                            Product Conversion Journey
                        </h2>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                            {entity?.entity_name || entity?.entity_id}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-100 shadow-sm"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 font-bold uppercase tracking-tighter text-sm">Analyzing product lifecycles...</p>
                        </div>
                    ) : (
                        <div className="p-8 space-y-8">
                            {/* Summary Totals */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SummaryBadge
                                    label="Total Lifecycle Entries"
                                    value={data?.lifecycles?.length || 0}
                                    sub="Aggregated Sessions"
                                />
                                <SummaryBadge
                                    label="Active Shopping"
                                    value={data?.lifecycles?.filter(l => l.status === 'shopping').length || 0}
                                    sub="Last 30 Minutes"
                                />
                                <SummaryBadge
                                    label="Successfully Purchased"
                                    value={data?.lifecycles?.filter(l => l.status === 'purchased').length || 0}
                                    sub="Conversion Win"
                                />
                            </div>

                            {/* Lifecycle Table */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <ArrowDown className="w-4 h-4 text-blue-600" />
                                        Session Lifecycle Report
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                        Status Threshold: 30m Inactivity
                                    </span>
                                </div>

                                <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm bg-white">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest">Session ID</th>
                                                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest">Date (First Add)</th>
                                                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest text-center">Added</th>
                                                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest text-center text-blue-600">In Cart</th>
                                                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest text-center">Removed</th>
                                                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest text-center">Duration</th>
                                                <th className="px-6 py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data?.lifecycles?.map((lifecycle, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-5 font-mono text-xs text-gray-400">
                                                        {lifecycle.session_id.substring(0, 12)}...
                                                    </td>
                                                    <td className="px-6 py-5 text-gray-600 font-bold whitespace-nowrap">
                                                        {new Date(lifecycle.date).toLocaleDateString(undefined, {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-black text-gray-900">
                                                        {lifecycle.added}
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-black text-blue-600 bg-blue-50/20">
                                                        {lifecycle.in_cart}
                                                    </td>
                                                    <td className="px-6 py-5 text-center font-black text-red-400">
                                                        {lifecycle.removed}
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500">
                                                            <Clock className="w-3 h-3 text-gray-300" />
                                                            {lifecycle.duration}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border ${getStatusStyle(lifecycle.status)}`}>
                                                            {lifecycle.status === 'shopping' ? '🛒 Shopping' :
                                                                lifecycle.status === 'purchased' ? '✅ Purchased' :
                                                                    '⌛ Abandoned'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!data?.lifecycles || data.lifecycles.length === 0) && (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-20 text-center text-gray-400 italic font-medium">
                                                        No cart activity found for this product yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase tracking-widest">
                        <AlertCircle className="w-4 h-4" />
                        Session-locked lifecycle analysis (Aggregation Mode)
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    );
};

const SummaryBadge = ({ label, value, sub }) => (
    <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-3xl font-black text-gray-900">{value}</div>
        <div className="text-[9px] font-bold text-gray-400 uppercase mt-1">{sub}</div>
    </div>
);

const getStatusStyle = (status) => {
    switch (status) {
        case 'shopping': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'purchased': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'abandoned': return 'bg-gray-100 text-gray-500 border-gray-200';
        default: return 'bg-gray-100 text-gray-400 border-gray-200';
    }
};

export default JourneyModal;
