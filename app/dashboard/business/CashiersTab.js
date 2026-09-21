"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import {
    Users, UserPlus, Trash2, Clock, Monitor, AlertCircle,
    CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp,
    Info, Shield, CalendarDays, Mail, Plus, X, Building2
} from "lucide-react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatusPill({ status }) {
    const map = {
        active:  { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "Active" },
        expired: { cls: "bg-amber-50 text-amber-700 border border-amber-200",   label: "Expired" },
        revoked: { cls: "bg-red-50 text-red-700 border border-red-200",         label: "Revoked" },
    };
    const s = map[status] || map.expired;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
            {status === "active" && <CheckCircle2 className="w-3 h-3" />}
            {status === "expired" && <Clock className="w-3 h-3" />}
            {status === "revoked" && <XCircle className="w-3 h-3" />}
            {s.label}
        </span>
    );
}

function CashierCard({ link, onRevoke }) {
    const lastShift = link.last_shift_at
        ? new Date(link.last_shift_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "No shifts yet";

    return (
        <div className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-sm ${link.status !== "active" ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(link.first_name?.[0] || "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{link.cashier_name}</p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />{link.email}
                    </p>
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{lastShift}</span>
            </div>
            <StatusPill status={link.status} />
            {link.status === "active" && (
                <button
                    onClick={() => onRevoke(link)}
                    className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Disconnect cashier"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

function RegisterCard({ register, onSaveHours, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const oh = register.operating_hours || {};
    const [enabled, setEnabled] = useState(oh.enabled ?? false);
    const [open, setOpen] = useState(oh.open || "08:00");
    const [close, setClose] = useState(oh.close || "22:00");
    const [days, setDays] = useState(oh.days ?? [1, 2, 3, 4, 5, 6]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSaveHours(register.id, { enabled, open, close, days });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50/80 transition-colors">
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="flex-1 flex items-center justify-between text-left pr-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Monitor className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{register.name}</p>
                            <p className="text-xs text-gray-500">{register.location || "Default Counter"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {oh.enabled ? (
                            <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 font-medium">
                                {oh.open} – {oh.close}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100 font-normal">
                                24/7 (No restrictions)
                            </span>
                        )}
                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                </button>
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(register); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ml-1"
                        title="Delete register"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {expanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5 bg-slate-50/50">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="space-y-0.5">
                            <label htmlFor={`enforce-${register.id}`} className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                                Enforce Operating Hours
                                {enabled ? (
                                    <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                                ) : (
                                    <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Disabled</span>
                                )}
                            </label>
                            <p className="text-xs text-gray-500">
                                {enabled
                                    ? "Cashiers will be blocked from opening shifts outside the scheduled window."
                                    : "No shift time restrictions. Cashiers can open shifts at any time."}
                            </p>
                        </div>
                        <button
                            type="button"
                            id={`enforce-${register.id}`}
                            role="switch"
                            aria-checked={enabled}
                            onClick={() => setEnabled(!enabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-blue-600" : "bg-gray-300"}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* Form fields: always visible for easy inspection & editing */}
                    <div className={`space-y-4 p-4 rounded-xl border transition-all ${enabled ? "bg-white border-blue-100 shadow-sm" : "bg-gray-50/70 border-gray-200/80 opacity-75"}`}>
                        {/* Time pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    Opening Time
                                </label>
                                <input
                                    type="time"
                                    value={open}
                                    onChange={e => setOpen(e.target.value)}
                                    className="w-full border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    Closing Time
                                </label>
                                <input
                                    type="time"
                                    value={close}
                                    onChange={e => setClose(e.target.value)}
                                    className="w-full border border-gray-200 bg-white rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Day selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                                Active Operating Days
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {DAY_LABELS.map((d, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => toggleDay(i)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                            days.includes(i)
                                                ? "bg-blue-600 text-white shadow-blue-200"
                                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Selected days when cashiers are authorized to open and operate this terminal.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
                            {saved ? "Hours Saved!" : saving ? "Saving..." : "Save Operating Hours"}
                        </button>
                        {saved && (
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Changes updated successfully
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CashiersTab() {
    const [cashiers, setCashiers] = useState([]);
    const [registers, setRegisters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const [addSuccess, setAddSuccess] = useState("");
    const [revokeTarget, setRevokeTarget] = useState(null);
    const [revoking, setRevoking] = useState(false);

    // Register Management State
    const [showAddRegister, setShowAddRegister] = useState(false);
    const [regName, setRegName] = useState("");
    const [regLocation, setRegLocation] = useState("");
    const [creatingReg, setCreatingReg] = useState(false);
    const [regError, setRegError] = useState("");
    const [deleteRegTarget, setDeleteRegTarget] = useState(null);
    const [deletingReg, setDeletingReg] = useState(false);

    const load = useCallback(async () => {
        try {
            const [cRes, rRes] = await Promise.all([
                api.get("/pos/cashiers"),
                api.get("/pos/registers"),
            ]);
            setCashiers(cRes.data.data || []);
            setRegisters(rRes.data.data || []);
        } catch (e) {
            console.error("Failed to load cashier data:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async () => {
        if (!email.trim()) return;
        setAdding(true);
        setAddError("");
        setAddSuccess("");
        try {
            const res = await api.post("/pos/cashiers", { email: email.trim() });
            setAddSuccess(res.data.message || "Cashier added successfully.");
            setEmail("");
            load();
        } catch (err) {
            setAddError(err.response?.data?.message || "Failed to add cashier.");
        } finally {
            setAdding(false);
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            await api.delete(`/pos/cashiers/${revokeTarget.id}`);
            setRevokeTarget(null);
            load();
        } catch (e) {
            console.error("Revoke failed:", e);
        } finally {
            setRevoking(false);
        }
    };

    const handleCreateRegister = async (e) => {
        if (e) e.preventDefault();
        if (!regName.trim()) return;
        setCreatingReg(true);
        setRegError("");
        try {
            await api.post("/pos/registers", {
                name: regName.trim(),
                location: regLocation.trim() || null,
            });
            setRegName("");
            setRegLocation("");
            setShowAddRegister(false);
            load();
        } catch (err) {
            setRegError(err.response?.data?.message || err.response?.data?.error || "Failed to create register.");
        } finally {
            setCreatingReg(false);
        }
    };

    const handleDeleteRegister = async () => {
        if (!deleteRegTarget) return;
        setDeletingReg(true);
        try {
            await api.delete(`/pos/registers/${deleteRegTarget.id}`);
            setDeleteRegTarget(null);
            load();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || "Failed to delete register.");
        } finally {
            setDeletingReg(false);
        }
    };

    const handleSaveHours = async (registerId, hours) => {
        await api.patch(`/pos/registers/${registerId}/operating-hours`, hours);
    };

    const activeCashiers = cashiers.filter(c => c.status === "active");
    const pastCashiers = cashiers.filter(c => c.status !== "active");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* ── Vendor POS Terminal Launch Banner ─────────────────────── */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-700/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                        <Monitor className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Vendor POS Terminal</h2>
                        <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                            As the inventory owner, you have direct, full access to open cashier shifts, tender walk-in sales, and manage your registers anytime.
                        </p>
                    </div>
                </div>
                <Link
                    href="/dashboard/pos"
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                >
                    <Monitor className="w-4 h-4" />
                    Launch Terminal
                </Link>
            </div>

            {/* ── Add Cashier ─────────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Add Cashier</h2>
                        <p className="text-xs text-gray-500">Link a registered user to your POS by their email address.</p>
                    </div>
                </div>

                {/* Policy notice */}
                <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-sm text-blue-800">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                    <div className="space-y-1">
                        <p className="font-semibold">Auto-disconnect policy</p>
                        <p className="text-xs leading-relaxed">
                            If a cashier has no shifts for <strong>7 consecutive days</strong>, their link automatically expires. This prevents a previous vendor from blocking them from working elsewhere. You can also manually disconnect a cashier at any time.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        id="cashier-email-input"
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setAddError(""); setAddSuccess(""); }}
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                        placeholder="cashier@email.com"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                        id="add-cashier-btn"
                        onClick={handleAdd}
                        disabled={adding || !email.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                        {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {adding ? "Adding..." : "Add"}
                    </button>
                </div>

                {addError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {addError}
                    </div>
                )}
                {addSuccess && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {addSuccess}
                    </div>
                )}
            </div>

            {/* ── Active Cashiers ─────────────────────────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Active Cashiers
                        <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{activeCashiers.length}</span>
                    </h2>
                </div>

                {activeCashiers.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-medium">No active cashiers</p>
                        <p className="text-xs mt-1">Add a cashier above to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activeCashiers.map(link => (
                            <CashierCard key={link.id} link={link} onRevoke={setRevokeTarget} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Past Cashiers ────────────────────────────────────────── */}
            {pastCashiers.length > 0 && (
                <div className="space-y-3">
                    <h2 className="font-bold text-gray-500 text-sm flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Past Cashiers
                    </h2>
                    <div className="space-y-2">
                        {pastCashiers.map(link => (
                            <CashierCard key={link.id} link={link} onRevoke={() => {}} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Register Management & Operating Hours ─────────────────────── */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                            POS Registers & Terminals
                            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full px-2.5 py-0.5">{registers.length}</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Set up multiple registers (e.g. Counter 1, Express Checkout) and configure shift operating hours.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowAddRegister(true); setRegError(""); }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Register
                    </button>
                </div>

                {registers.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-500 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-500">
                            <Monitor className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">No registers yet</p>
                            <p className="text-xs text-gray-500 mt-0.5">Create your first POS register terminal to start opening shifts and making sales.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setShowAddRegister(true); setRegError(""); }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            Create Register
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {registers.map(reg => (
                            <RegisterCard
                                key={reg.id}
                                register={reg}
                                onSaveHours={handleSaveHours}
                                onDelete={setDeleteRegTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Add Register Modal ───────────────────────────────────── */}
            {showAddRegister && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-2 border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Monitor className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Add New Register</h3>
                                    <p className="text-xs text-gray-500">Set up a new checkout counter or terminal</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddRegister(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Register Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={regName}
                                    onChange={e => setRegName(e.target.value)}
                                    placeholder="e.g. Counter 1, Express Lane, Floor 2"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Location / Branch (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={regLocation}
                                    onChange={e => setRegLocation(e.target.value)}
                                    placeholder="e.g. Main Hall, Front Desk, Lekki Branch"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {regError && (
                                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {regError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddRegister(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingReg || !regName.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
                                >
                                    {creatingReg && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {creatingReg ? "Creating..." : "Create Register"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Register Confirm Modal ────────────────────────── */}
            {deleteRegTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Deactivate Register?</h3>
                                <p className="text-xs text-gray-500">{deleteRegTarget.name}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            This will remove <strong>{deleteRegTarget.name}</strong> from active checkout terminals. Existing past sales and shift history will remain safely preserved.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteRegTarget(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteRegister}
                                disabled={deletingReg}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                                {deletingReg && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {deletingReg ? "Deactivating..." : "Deactivate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Revoke Confirm Modal ─────────────────────────────────── */}
            {revokeTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Disconnect Cashier?</h3>
                                <p className="text-xs text-gray-500">{revokeTarget.cashier_name}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            This will immediately remove <strong>{revokeTarget.first_name}</strong>&apos;s ability to open shifts on your registers. They will receive a notification.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRevokeTarget(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                id="confirm-revoke-btn"
                                onClick={handleRevoke}
                                disabled={revoking}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                                {revoking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {revoking ? "Disconnecting..." : "Disconnect"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
