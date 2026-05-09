"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import {
    ArrowLeft, Loader2, CheckCircle, XCircle, Clock, Package,
    User, ShieldCheck, ShieldAlert, ChevronRight, AlertTriangle,
    Star, RefreshCw
} from "lucide-react";

const STEPS = [
    { key: "draft",               label: "Started",        desc: "Application created" },
    { key: "application_review",  label: "Form Submitted", desc: "Awaiting admin review" },
    { key: "training",            label: "Training",       desc: "Completing training & assessment" },
    { key: "product_test",        label: "Product Test",   desc: "5 test products under review" },
    { key: "setup",               label: "Store Setup",    desc: "Completing store setup" },
    { key: "approved",            label: "Approved",       desc: "Vendor role assigned" },
];

const STATUS_ORDER = ["draft","application_review","training","product_test","setup","approved"];

function StepTracker({ status }) {
    const currentIdx = STATUS_ORDER.indexOf(status);
    return (
        <div className="flex items-start gap-0">
            {STEPS.map((step, idx) => {
                const done = idx < currentIdx || status === "approved";
                const active = idx === currentIdx && status !== "rejected";
                const rejected = status === "rejected";
                return (
                    <div key={step.key} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                                done ? "bg-green-500 border-green-500 text-white" :
                                active ? (rejected ? "bg-red-500 border-red-500 text-white" : "bg-blue-600 border-blue-600 text-white") :
                                "bg-white border-gray-200 text-gray-400"
                            }`}>
                                {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-wider mt-1 text-center max-w-[60px] leading-tight">
                                {step.label}
                            </p>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 mt-[-16px] ${done ? "bg-green-400" : "bg-gray-100"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function TestProductRow({ product, onReview }) {
    const [notes, setNotes] = useState(product.review_notes || "");
    const [loading, setLoading] = useState(false);

    const handleReview = async (status) => {
        setLoading(true);
        try {
            await api.post(`/vendor/admin/test-products/${product.id}/review`, { status, notes });
            onReview();
        } catch (e) { alert(e.response?.data?.message || "Failed"); } finally { setLoading(false); }
    };

    return (
        <div className={`p-4 rounded-lg border ${
            product.review_status === "passed" ? "border-green-100 bg-green-50/30" :
            product.review_status === "failed" ? "border-red-100 bg-red-50/30" :
            "border-gray-100 bg-white"
        }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900">{product.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        ₦{parseFloat(product.price || 0).toLocaleString()}
                        {product.sku && <span className="ml-2 text-gray-400">SKU: {product.sku}</span>}
                    </p>
                    {product.review_notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">{product.review_notes}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        product.review_status === "passed" ? "bg-green-50 text-green-700 border-green-100" :
                        product.review_status === "failed" ? "bg-red-50 text-red-700 border-red-100" :
                        "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>{product.review_status}</span>
                </div>
            </div>
            {product.review_status === "pending" && (
                <div className="mt-3 flex gap-2 items-center">
                    <input value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Notes (required for failure)..."
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
                    <button onClick={() => handleReview("passed")} disabled={loading}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-all">Pass</button>
                    <button onClick={() => handleReview("failed")} disabled={loading || !notes.trim()}
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-lg disabled:opacity-50 transition-all">Fail</button>
                </div>
            )}
        </div>
    );
}

export default function ApplicationDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);

    const fetchApplication = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/vendor/admin/applications/${id}`);
            if (res.data.success) setApplication(res.data.application);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchApplication(); }, [fetchApplication]);

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            const res = await api.post(`/vendor/admin/applications/${id}/approve`);
            alert(res.data.message);
            fetchApplication();
        } catch (e) { alert(e.response?.data?.message || "Failed"); } finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return alert("Reason required");
        setActionLoading(true);
        try {
            await api.post(`/vendor/admin/applications/${id}/reject`, { reason: rejectReason });
            fetchApplication();
            setShowRejectForm(false);
        } catch (e) { alert(e.response?.data?.message || "Failed"); } finally { setActionLoading(false); }
    };

    const APPROVABLE = ["application_review", "product_test", "setup"];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    if (!application) return (
        <div className="text-center py-12">
            <p className="text-gray-500">Application not found.</p>
            <Link href="/dashboard/vendors" className="text-blue-600 hover:underline mt-2 inline-block">← Back to Vendors</Link>
        </div>
    );

    const app = application;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/vendors"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-700">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Vendor Application</h1>
                    <p className="text-xs text-gray-400 font-medium">{app.email} · Applied {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={fetchApplication} className="ml-auto p-2 text-gray-400 hover:text-blue-600 rounded-lg border border-gray-100 hover:bg-blue-50 transition-all">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Step Tracker */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <StepTracker status={app.status} />
                {app.status === "rejected" && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                        </p>
                        {app.rejection_reason && <p className="text-xs text-red-600 mt-1">{app.rejection_reason}</p>}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — User Info */}
                <div className="space-y-4">
                    {/* Applicant */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Applicant</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
                                {app.first_name?.[0] || app.email[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{app.first_name} {app.last_name}</p>
                                <p className="text-xs text-gray-500">{app.email}</p>
                                <Link href={`/dashboard/customers/${app.user_id}`}
                                    className="text-[10px] text-blue-600 hover:underline font-bold mt-0.5 inline-block">
                                    View Customer Profile →
                                </Link>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> KYC Status</span>
                                <span className={`font-bold ${app.kyc_status === "approved" ? "text-green-600" : "text-amber-600"}`}>
                                    {app.kyc_status}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> KYB Status</span>
                                <span className={`font-bold ${app.kyb_status === "approved" ? "text-green-600" : "text-gray-400"}`}>
                                    {app.kyb_status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Application Info */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Application Info</h3>
                        <div className="space-y-3 text-xs">
                            <div><p className="text-gray-400 mb-0.5">Store Name</p><p className="font-bold text-gray-900">{app.store_name || "—"}</p></div>
                            <div><p className="text-gray-400 mb-0.5">Category</p><p className="font-bold text-gray-900">{app.primary_category || "—"}</p></div>
                            <div><p className="text-gray-400 mb-0.5">Description</p><p className="text-gray-700">{app.store_description || "—"}</p></div>
                        </div>
                    </div>

                    {/* Training */}
                    {(app.assessment_score !== null && app.assessment_score !== undefined) && (
                        <div className="bg-white rounded-xl border border-gray-100 p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Training</h3>
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <p className={`text-4xl font-black ${app.assessment_score === 100 ? "text-green-600" : "text-red-500"}`}>
                                        {app.assessment_score}%
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">{app.assessment_attempts} attempt(s)</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right — Test Products + Actions */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Test Products */}
                    {app.test_products && app.test_products.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                                    Test Products ({app.test_products.length}/5)
                                </h3>
                                {app.test_result && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                        app.test_result === "passed" ? "bg-green-50 text-green-700 border-green-100" :
                                        app.test_result === "partial" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                        "bg-red-50 text-red-700 border-red-100"
                                    }`}>{app.test_result}</span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {app.test_products.map(p => (
                                    <TestProductRow key={p.id} product={p} onReview={fetchApplication} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bank Details */}
                    {app.bank_details && (
                        <div className="bg-white rounded-xl border border-gray-100 p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Bank Details</h3>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                                <div><p className="text-gray-400">Account Name</p><p className="font-bold">{app.bank_details.account_name}</p></div>
                                <div><p className="text-gray-400">Account Number</p><p className="font-bold">{app.bank_details.account_number}</p></div>
                                <div><p className="text-gray-400">Bank</p><p className="font-bold">{app.bank_details.bank_name}</p></div>
                            </div>
                        </div>
                    )}

                    {/* Action Panel */}
                    {!["approved","rejected","withdrawn"].includes(app.status) && (
                        <div className="bg-white rounded-xl border border-gray-100 p-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Admin Actions</h3>
                            <div className="flex flex-col gap-3">
                                {APPROVABLE.includes(app.status) && (
                                    <button onClick={handleApprove} disabled={actionLoading}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        {app.status === "setup" ? "Final Approve — Assign Vendor Role" : "Approve & Advance to Next Step"}
                                    </button>
                                )}
                                {!showRejectForm ? (
                                    <button onClick={() => setShowRejectForm(true)}
                                        className="w-full py-2.5 border border-red-100 bg-red-50 hover:bg-red-100 text-red-700 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                                        <XCircle className="w-4 h-4" /> Reject Application
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Reason for rejection (will be shown to applicant)..."
                                            rows={3} className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none bg-white resize-none" />
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowRejectForm(false)}
                                                className="flex-1 py-2 border border-gray-100 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                                            <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}
                                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-sm disabled:opacity-50">Confirm Reject</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
