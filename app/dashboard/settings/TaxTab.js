"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { Plus, X, Pencil, CheckCircle, Loader2, Percent, Trash2, AlertCircle } from "lucide-react";

// ── Tax Rate Form Modal ────────────────────────────────────────────────────────
function TaxRateModal({ existingRate, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: existingRate?.name || "",
        rate: existingRate?.rate || "",
        applies_to: existingRate?.applies_to || "all",
        is_compound: existingRate?.is_compound || false,
        is_active: existingRate?.is_active !== false,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async () => {
        if (!form.name || !form.rate) {
            setError("Name and rate are required");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const url = existingRate ? `/tax/${existingRate.id}` : `/tax`;
            const res = existingRate ? await api.patch(url, form) : await api.post(url, form);
            if (res.data?.success) { onSaved(); onClose(); }
            else setError(res.data?.error || "Failed to save");
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data?.error || "Network error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="tax-overlay" onClick={onClose}>
            <div className="tax-modal" onClick={e => e.stopPropagation()}>
                <div className="tax-modal__head">
                    <h3>{existingRate ? "Edit Tax Rate" : "New Tax Rate"}</h3>
                    <button onClick={onClose}><X size={17} /></button>
                </div>

                {error && (
                    <div className="tax-error">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <div className="tax-modal__body">
                    <div className="tax-field">
                        <label>Tax Name *</label>
                        <input
                            placeholder="e.g. VAT, GST, Service Charge"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                    </div>
                    <div className="tax-field">
                        <label>Rate (%) *</label>
                        <div className="tax-rate-input">
                            <input
                                type="number" min="0" max="100" step="0.01"
                                placeholder="e.g. 7.5"
                                value={form.rate}
                                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                            />
                            <span><Percent size={13} /></span>
                        </div>
                    </div>
                    <div className="tax-field">
                        <label>Applies To</label>
                        <select value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value }))}>
                            <option value="all">All Products</option>
                            <option value="products">Specific Products</option>
                            <option value="categories">Specific Categories</option>
                        </select>
                    </div>
                    <div className="tax-field tax-field--row">
                        <label>
                            <input type="checkbox" checked={form.is_compound}
                                onChange={e => setForm(f => ({ ...f, is_compound: e.target.checked }))} />
                            <span>Compound Tax</span>
                        </label>
                        <small>Applied on top of other taxes</small>
                    </div>
                    <div className="tax-field tax-field--row">
                        <label>
                            <input type="checkbox" checked={form.is_active}
                                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                            <span>Active</span>
                        </label>
                    </div>
                </div>

                <div className="tax-modal__actions">
                    <button className="tax-btn tax-btn--ghost" onClick={onClose}>Cancel</button>
                    <button className="tax-btn tax-btn--primary" disabled={saving} onClick={handleSave}>
                        {saving ? <Loader2 size={14} className="tax-spin" /> : <CheckCircle size={14} />}
                        {existingRate ? "Save Changes" : "Create Rate"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main TaxTab ────────────────────────────────────────────────────────────────
export default function TaxTab() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editRate, setEditRate] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const fetchRates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/tax");
            setRates(res.data?.data || []);
        } catch (e) {
            console.error("Failed to load tax rates:", e);
            setRates([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRates(); }, [fetchRates]);

    const deleteRate = async (id) => {
        if (!confirm("Deactivate this tax rate?")) return;
        setDeleting(id);
        try {
            await api.delete(`/tax/${id}`);
        } catch (e) {
            console.error("Failed to deactivate tax rate:", e);
        } finally {
            setDeleting(null);
            fetchRates();
        }
    };

    const tenantRates = rates.filter(r => !r.vendor_id);
    const vendorRates = rates.filter(r => r.vendor_id);

    return (
        <>
            <style>{`
                .tax-section { margin-bottom: 32px; }
                .tax-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
                .tax-section-head h3 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0; }
                .tax-section-head small { font-size: 12px; color: #64748b; }
                .tax-table-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                .tax-table { width: 100%; border-collapse: collapse; font-size: 14px; }
                .tax-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                .tax-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; vertical-align: middle; }
                .tax-table tr:last-child td { border-bottom: none; }
                .tax-rate-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 800; color: #6366f1; }
                .tax-status { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .tax-status--on { background: #dcfce7; color: #16a34a; }
                .tax-status--off { background: #f1f5f9; color: #94a3b8; }
                .tax-compound-badge { display: inline-flex; padding: 2px 8px; border-radius: 8px; font-size: 11px; background: #fef3c7; color: #d97706; font-weight: 600; }
                .tax-actions { display: flex; gap: 6px; }
                .tax-icon-btn { padding: 6px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; color: #64748b; transition: all .15s; }
                .tax-icon-btn:hover { background: #f1f5f9; }
                .tax-icon-btn--del:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
                .tax-empty { text-align: center; padding: 32px; color: #94a3b8; font-size: 13px; }
                .tax-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .tax-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 440px; overflow: hidden; }
                .tax-modal__head { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px; border-bottom: 1px solid #f1f5f9; }
                .tax-modal__head h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
                .tax-modal__head button { background: none; border: none; cursor: pointer; color: #94a3b8; }
                .tax-modal__body { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
                .tax-field { display: flex; flex-direction: column; gap: 6px; }
                .tax-field label { font-size: 13px; font-weight: 600; color: #374151; }
                .tax-field input[type=text], .tax-field input[type=number], .tax-field select { padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; }
                .tax-field input:focus, .tax-field select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
                .tax-rate-input { position: relative; }
                .tax-rate-input input { width: 100%; padding-right: 36px; }
                .tax-rate-input span { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .tax-field--row { flex-direction: row; align-items: center; gap: 10px; }
                .tax-field--row label { display: flex; align-items: center; gap: 6px; margin: 0; }
                .tax-field--row label input { accent-color: #6366f1; }
                .tax-field--row small { color: #94a3b8; font-size: 12px; }
                .tax-modal__actions { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid #f1f5f9; }
                .tax-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
                .tax-btn--primary { background: #6366f1; color: #fff; }
                .tax-btn--primary:disabled { opacity: .6; cursor: not-allowed; }
                .tax-btn--ghost { background: #f1f5f9; color: #374151; }
                .tax-add-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 8px; background: #6366f1; color: #fff; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
                .tax-error { margin: 12px 22px 0; padding: 10px 14px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; color: #dc2626; font-size: 13px; display: flex; align-items: center; gap: 8px; }
                .tax-spin { animation: spin .8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            {/* Store-wide rates */}
            <div className="tax-section">
                <div className="tax-section-head">
                    <div>
                        <h3>Store-Wide Tax Rates</h3>
                        <small>Applied by default to all vendors unless they override</small>
                    </div>
                    <button className="tax-add-btn" onClick={() => { setEditRate(null); setShowModal(true); }}>
                        <Plus size={14} /> Add Rate
                    </button>
                </div>

                <div className="tax-table-wrap">
                    {loading ? (
                        <div className="tax-empty"><Loader2 className="tax-spin" size={20} style={{ display: "inline" }} /></div>
                    ) : tenantRates.length === 0 ? (
                        <div className="tax-empty">No store-wide tax rates configured</div>
                    ) : (
                        <table className="tax-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Rate</th>
                                    <th>Applies To</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenantRates.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                                        <td><span className="tax-rate-chip"><Percent size={12} />{r.rate}%</span></td>
                                        <td style={{ textTransform: "capitalize" }}>{r.applies_to.replace("_", " ")}</td>
                                        <td>{r.is_compound && <span className="tax-compound-badge">Compound</span>}</td>
                                        <td>
                                            <span className={`tax-status ${r.is_active ? "tax-status--on" : "tax-status--off"}`}>
                                                {r.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="tax-actions">
                                                <button className="tax-icon-btn" onClick={() => { setEditRate(r); setShowModal(true); }}>
                                                    <Pencil size={13} />
                                                </button>
                                                <button className="tax-icon-btn tax-icon-btn--del"
                                                    onClick={() => deleteRate(r.id)}
                                                    disabled={deleting === r.id}>
                                                    {deleting === r.id ? <Loader2 size={13} className="tax-spin" /> : <Trash2 size={13} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Vendor-specific rates */}
            {vendorRates.length > 0 && (
                <div className="tax-section">
                    <div className="tax-section-head">
                        <div>
                            <h3>Vendor-Specific Rates</h3>
                            <small>Overrides set by individual vendors</small>
                        </div>
                    </div>
                    <div className="tax-table-wrap">
                        <table className="tax-table">
                            <thead>
                                <tr>
                                    <th>Vendor</th>
                                    <th>Name</th>
                                    <th>Rate</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendorRates.map(r => (
                                    <tr key={r.id}>
                                        <td style={{ color: "#64748b" }}>{r.vendor_name || r.vendor_id}</td>
                                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                                        <td><span className="tax-rate-chip"><Percent size={12} />{r.rate}%</span></td>
                                        <td>
                                            <span className={`tax-status ${r.is_active ? "tax-status--on" : "tax-status--off"}`}>
                                                {r.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="tax-actions">
                                                <button className="tax-icon-btn tax-icon-btn--del"
                                                    onClick={() => deleteRate(r.id)}
                                                    disabled={deleting === r.id}>
                                                    {deleting === r.id ? <Loader2 size={13} className="tax-spin" /> : <Trash2 size={13} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <TaxRateModal
                    existingRate={editRate}
                    onClose={() => { setShowModal(false); setEditRate(null); }}
                    onSaved={fetchRates}
                />
            )}
        </>
    );
}
