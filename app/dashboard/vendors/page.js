"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import {
    Store, Users, ShieldCheck, ShieldAlert, RefreshCw, Loader2,
    CheckCircle, XCircle, Clock, ChevronRight, Search, AlertTriangle
} from "lucide-react";

const TABS = [
    { id: "applications", label: "Applications", icon: Store },
    { id: "kyc", label: "KYC Queue", icon: ShieldCheck },
    { id: "kyb", label: "KYB Queue", icon: ShieldAlert },
    { id: "vendors", label: "Active Vendors", icon: Users },
];

const STATUS_COLORS = {
    draft: "bg-gray-50 text-gray-600 border-gray-100",
    application_review: "bg-amber-50 text-amber-700 border-amber-100",
    training: "bg-blue-50 text-blue-700 border-blue-100",
    product_test: "bg-purple-50 text-purple-700 border-purple-100",
    setup: "bg-cyan-50 text-cyan-700 border-cyan-100",
    approved: "bg-green-50 text-green-700 border-green-100",
    rejected: "bg-red-50 text-red-700 border-red-100",
    withdrawn: "bg-gray-50 text-gray-500 border-gray-100",
    none: "bg-gray-50 text-gray-500 border-gray-100",
    submitted: "bg-amber-50 text-amber-700 border-amber-100",
};

function StatusBadge({ status, label }) {
    const cls = STATUS_COLORS[status] || STATUS_COLORS.none;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
            {label || status}
        </span>
    );
}

// ─── KYC/KYB Review Row ────────────────────────────────────────────────────────
function KycRow({ user, type, onAction }) {
    const [reason, setReason] = useState("");
    const [showReject, setShowReject] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        try {
            await api.post(`/vendor/admin/${type}/${user.id}/approve`);
            onAction();
        } catch (e) {
            alert(e.response?.data?.message || "Failed to approve");
        } finally { setLoading(false); }
    };

    const handleReject = async () => {
        if (!reason.trim()) return alert("Please provide a rejection reason");
        setLoading(true);
        try {
            await api.post(`/vendor/admin/${type}/${user.id}/reject`, { reason });
            onAction();
        } catch (e) {
            alert(e.response?.data?.message || "Failed to reject");
        } finally { setLoading(false); setShowReject(false); }
    };

    return (
        <div className="p-4 border-b border-gray-50 last:border-0">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        {user[`${type}_submitted_at`] && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                Submitted {new Date(user[`${type}_submitted_at`]).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {user[`${type}_document_url`] && (
                        <a href={user[`${type}_document_url`]} target="_blank" rel="noreferrer"
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-100 rounded-lg hover:bg-gray-50 transition-all">
                            View Doc
                        </a>
                    )}
                    {type === "kyc" && user.kyc_liveness_url && (
                        <a href={user.kyc_liveness_url} target="_blank" rel="noreferrer"
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-100 rounded-lg hover:bg-gray-50 transition-all">
                            Liveness
                        </a>
                    )}
                    <button onClick={handleApprove} disabled={loading}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                    </button>
                    <button onClick={() => setShowReject(!showReject)} disabled={loading}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-lg transition-all">
                        Reject
                    </button>
                </div>
            </div>
            {showReject && (
                <div className="mt-3 flex gap-2">
                    <input
                        value={reason} onChange={e => setReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                    />
                    <button onClick={handleReject} disabled={loading || !reason.trim()}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50">
                        Confirm
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Active Vendor Row ─────────────────────────────────────────────────────────
function VendorRow({ vendor, onAction }) {
    const [loading, setLoading] = useState(false);
    const [showTerminate, setShowTerminate] = useState(false);
    const [reason, setReason] = useState("");

    const handleSuspend = async () => {
        setLoading(true);
        try {
            await api.post(`/vendor/admin/vendors/${vendor.id}/suspend`);
            onAction();
        } catch (e) { alert(e.response?.data?.message || "Failed"); } finally { setLoading(false); }
    };

    const handleTerminate = async () => {
        if (!reason.trim()) return alert("Please provide a reason");
        setLoading(true);
        try {
            await api.post(`/vendor/admin/vendors/${vendor.id}/terminate`, { reason });
            onAction();
        } catch (e) { alert(e.response?.data?.message || "Failed"); } finally { setLoading(false); setShowTerminate(false); }
    };

    return (
        <div className="p-4 border-b border-gray-50 last:border-0">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex-shrink-0">
                        {vendor.business_thumbnail
                            ? <img src={vendor.business_thumbnail} alt="" className="w-full h-full object-cover" />
                            : <span className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                {vendor.first_name?.[0] || "V"}
                              </span>
                        }
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{vendor.business_name || `${vendor.first_name} ${vendor.last_name}`}</p>
                        <p className="text-xs text-gray-500 truncate">{vendor.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <StatusBadge status={vendor.kyc_status} label={`KYC: ${vendor.kyc_status}`} />
                            <StatusBadge status={vendor.kyb_status} label={`KYB: ${vendor.kyb_status}`} />
                            <span className="text-[10px] text-gray-400">{vendor.product_count} products</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={handleSuspend} disabled={loading}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-amber-100 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all disabled:opacity-50">
                        Suspend
                    </button>
                    <button onClick={() => setShowTerminate(!showTerminate)} disabled={loading}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-red-100 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all">
                        Terminate
                    </button>
                </div>
            </div>
            {showTerminate && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> This will archive all products and remove vendor access
                    </p>
                    <div className="flex gap-2">
                        <input value={reason} onChange={e => setReason(e.target.value)}
                            placeholder="Reason for termination..."
                            className="flex-1 px-3 py-2 text-xs border border-red-200 rounded-lg focus:outline-none bg-white" />
                        <button onClick={handleTerminate} disabled={loading || !reason.trim()}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-red-600 text-white rounded-lg disabled:opacity-50">
                            Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function VendorsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("applications");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let res;
            const params = new URLSearchParams({ page, limit: 20 });
            if (statusFilter) params.append("status", statusFilter);

            if (activeTab === "applications") res = await api.get(`/vendor/admin/applications?${params}`);
            else if (activeTab === "kyc") res = await api.get(`/vendor/admin/kyc?${params}`);
            else if (activeTab === "kyb") res = await api.get(`/vendor/admin/kyb?${params}`);
            else if (activeTab === "vendors") res = await api.get(`/vendor/admin/vendors?${params}`);

            if (res?.data?.success) {
                setData(res.data.data);
                setPagination(res.data.pagination || { total: 0, totalPages: 1 });
            }
        } catch (e) {
            console.error("Failed to fetch vendor data", e);
        } finally { setLoading(false); }
    }, [activeTab, statusFilter, page]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); setStatusFilter(""); }, [activeTab]);

    const APPLICATION_STATUSES = ["draft","application_review","training","product_test","setup","approved","rejected","withdrawn"];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Vendors</h1>
                    <p className="text-xs text-gray-400 font-medium">Manage applications, verifications, and active vendors</p>
                </div>
                <button onClick={fetchData} title="Refresh"
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-all">
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                    : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                            }`}>
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filter bar for applications */}
                {activeTab === "applications" && (
                    <div className="px-4 py-3 border-b border-gray-50 flex gap-2 flex-wrap">
                        <button onClick={() => setStatusFilter("")}
                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all ${!statusFilter ? "bg-blue-600 text-white border-blue-600" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                            All
                        </button>
                        {APPLICATION_STATUSES.map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                                {s.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 text-sm italic">No records found.</div>
                ) : activeTab === "applications" ? (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                {["Applicant","Store Name","Status","Category","Applied",""].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-wider text-gray-500">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map(app => (
                                <tr key={app.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/vendors/applications/${app.id}`)}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {app.first_name?.[0] || app.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{app.first_name} {app.last_name}</p>
                                                <p className="text-[10px] text-gray-400">{app.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-gray-700">{app.store_name || <span className="text-gray-400 italic">—</span>}</td>
                                    <td className="px-5 py-3.5"><StatusBadge status={app.status} /></td>
                                    <td className="px-5 py-3.5 text-gray-500 text-xs">{app.primary_category || "—"}</td>
                                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : activeTab === "kyc" ? (
                    <div className="divide-y divide-gray-50">
                        {data.map(u => <KycRow key={u.id} user={u} type="kyc" onAction={fetchData} />)}
                    </div>
                ) : activeTab === "kyb" ? (
                    <div className="divide-y divide-gray-50">
                        {data.map(u => <KycRow key={u.id} user={u} type="kyb" onAction={fetchData} />)}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {data.map(v => <VendorRow key={v.id} vendor={v} onAction={fetchData} />)}
                    </div>
                )}

                {/* Pagination */}
                {!loading && pagination.total > 0 && (
                    <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {pagination.total} total
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-100 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all">Prev</button>
                            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} disabled={page === pagination.totalPages}
                                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-100 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
