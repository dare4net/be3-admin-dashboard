"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import {
    Monitor, Search, ShoppingCart, X, Plus, Minus, User, Printer,
    CreditCard, Banknote, ArrowLeftRight, LogIn, LogOut, ChevronDown,
    Package, CheckCircle, Loader2, AlertCircle, Clock,
    RotateCcw, Tag, UserPlus, Phone, Settings, Layers, Trash2, PieChart, Check
} from "lucide-react";

const fmt = (n, sym = "₦") => `${sym}${parseFloat(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

// ──────────────────────────────────────────────────────────────────────────────
// Open Shift Modal
// ──────────────────────────────────────────────────────────────────────────────
function OpenShiftModal({ registers, onOpen, onClose, onRegisterCreated }) {
    const [registerId, setRegisterId] = useState(registers[0]?.id || "");
    const [openingCash, setOpeningCash] = useState("0");
    const [creatingInline, setCreatingInline] = useState(false);
    const [newRegName, setNewRegName] = useState("");
    const [newRegLocation, setNewRegLocation] = useState("");
    const [savingReg, setSavingReg] = useState(false);

    const handleCreateInline = async () => {
        if (!newRegName.trim()) return;
        setSavingReg(true);
        try {
            const res = await api.post("/pos/registers", {
                name: newRegName.trim(),
                location: newRegLocation.trim() || null,
            });
            if (res.data?.register) {
                if (onRegisterCreated) onRegisterCreated(res.data.register);
                setRegisterId(res.data.register.id);
                setCreatingInline(false);
                setNewRegName("");
                setNewRegLocation("");
            }
        } catch (e) {
            alert(e.response?.data?.message || e.response?.data?.error || "Failed to create register");
        } finally {
            setSavingReg(false);
        }
    };

    return (
        <div className="pos-overlay">
            <div className="pos-shift-modal">
                <div className="pos-shift-modal__icon"><Monitor size={32} /></div>
                <h2>Open Cashier Shift</h2>
                <p>Select a register and enter your opening cash float</p>

                {creatingInline ? (
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", margin: "16px 0", textAlign: "left" }}>
                        <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Create New Register</h4>
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>Register Name *</label>
                            <input
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
                                placeholder="e.g. Counter 2, Fast Checkout"
                                value={newRegName}
                                onChange={e => setNewRegName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 4 }}>Location / Branch</label>
                            <input
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, background: "#fff" }}
                                placeholder="e.g. Ground Floor, Front Desk"
                                value={newRegLocation}
                                onChange={e => setNewRegLocation(e.target.value)}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="pos-shift-btn pos-shift-btn--ghost"
                                style={{ fontSize: 12, padding: "6px 12px" }}
                                onClick={() => setCreatingInline(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="pos-shift-btn pos-shift-btn--primary"
                                style={{ fontSize: 12, padding: "6px 14px" }}
                                onClick={handleCreateInline}
                                disabled={savingReg || !newRegName.trim()}
                            >
                                {savingReg ? <Loader2 size={13} className="spin" /> : <Plus size={13} />} Save & Select
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="pos-shift-modal__field">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <label style={{ margin: 0 }}>Register</label>
                            <button
                                type="button"
                                onClick={() => setCreatingInline(true)}
                                style={{ fontSize: 12, color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
                            >
                                <Plus size={12} /> Add New Register
                            </button>
                        </div>
                        <select value={registerId} onChange={e => setRegisterId(e.target.value)}>
                            {registers.map(r => <option key={r.id} value={r.id}>{r.name}{r.location ? ` — ${r.location}` : ""}</option>)}
                        </select>
                    </div>
                )}

                <div className="pos-shift-modal__field">
                    <label>Opening Cash Float (₦)</label>
                    <input type="number" min="0" value={openingCash} onChange={e => setOpeningCash(e.target.value)} />
                </div>
                <div className="pos-shift-modal__actions">
                    <button className="pos-shift-btn pos-shift-btn--ghost" onClick={onClose}>Cancel</button>
                    <button className="pos-shift-btn pos-shift-btn--primary"
                        onClick={() => onOpen(registerId, parseFloat(openingCash || 0))}
                        disabled={!registerId || creatingInline}>
                        <LogIn size={16} /> Open Shift
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Close Shift Modal
// ──────────────────────────────────────────────────────────────────────────────
function CloseShiftModal({ session, onClose, onClosed }) {
    const [actualCash, setActualCash] = useState("");
    const [notes, setNotes] = useState("");
    const [summary, setSummary] = useState(null);
    const [closing, setClosing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (session) {
            api.get(`/pos/sessions/${session.id}/summary`)
                .then(res => {
                    setSummary(res.data);
                    const exp = parseFloat(res.data?.session?.opening_cash || 0) + parseFloat(res.data?.session?.cash_sales || 0);
                    // Pre-fill so user doesn't face a blank dead button
                    setActualCash(String(exp));
                })
                .catch(err => {
                    console.error("Failed to load shift summary:", err);
                    setActualCash("0");
                });
        }
    }, [session]);

    const expectedCash = summary ? parseFloat(summary.session?.opening_cash || 0) + parseFloat(summary.session?.cash_sales || 0) : 0;
    const currentActual = actualCash !== "" ? parseFloat(actualCash || 0) : expectedCash;
    const diff = currentActual - expectedCash;

    const handleClose = async () => {
        if (closing) return;
        setClosing(true);
        setError(null);
        try {
            const cashVal = actualCash !== "" ? parseFloat(actualCash || 0) : expectedCash;
            const res = await api.post("/pos/sessions/close", {
                session_id: session.id,
                closing_cash: cashVal,
                actual_cash: cashVal,
                notes: notes.trim() || null
            });
            if (res.data?.success) {
                onClosed();
            } else {
                setError(res.data?.message || res.data?.error || "Failed to close shift");
            }
        } catch (e) {
            console.error("Failed to close shift:", e);
            const msg = e.response?.data?.message || e.response?.data?.error || e.message || "Failed to close shift";
            setError(msg);
        } finally {
            setClosing(false);
        }
    };

    return (
        <div className="pos-overlay">
            <div className="pos-shift-modal">
                <div className="pos-shift-modal__icon"><LogOut size={32} /></div>
                <h2>Close Shift & Reconcile</h2>
                <p>Register: <strong>{session.register_name}</strong></p>

                {summary && (
                    <div className="pos-summary-grid">
                        <div className="pos-summary-row"><span>Opening Float</span><span>{fmt(summary.session?.opening_cash)}</span></div>
                        <div className="pos-summary-row"><span>Cash Sales</span><span>{fmt(summary.session?.cash_sales)}</span></div>
                        <div className="pos-summary-row"><span>Card Sales</span><span>{fmt(summary.session?.card_sales)}</span></div>
                        <div className="pos-summary-row"><span>Transfer Sales</span><span>{fmt(summary.session?.transfer_sales)}</span></div>
                        <div className="pos-summary-row pos-summary-row--total"><span>Expected Cash Drawer</span><span>{fmt(expectedCash)}</span></div>
                    </div>
                )}

                <div className="pos-shift-modal__field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label style={{ margin: 0 }}>Counted Cash in Drawer (₦)</label>
                        <button
                            type="button"
                            onClick={() => setActualCash(String(expectedCash))}
                            style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                        >
                            Reset to Expected ({fmt(expectedCash)})
                        </button>
                    </div>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        value={actualCash}
                        onChange={e => setActualCash(e.target.value)}
                        placeholder={String(expectedCash)}
                        autoFocus
                    />
                </div>

                <div className={`pos-summary-row ${diff < 0 ? "pos-summary-row--warn" : diff > 0 ? "pos-summary-row--ok" : ""}`} style={{ marginBottom: 12, borderRadius: 8 }}>
                    <span>{diff < 0 ? "Cash Shortage" : diff > 0 ? "Cash Overage" : "Balanced"}</span>
                    <strong>{fmt(Math.abs(diff))} {diff < 0 ? "short" : diff > 0 ? "over" : "✓"}</strong>
                </div>

                <div className="pos-shift-modal__field">
                    <label>Closing Notes</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Normal shift close" />
                </div>

                {error && (
                    <div style={{ color: "#ef4444", fontSize: 13, background: "#fee2e2", padding: "8px 12px", borderRadius: 8, marginBottom: 12, textAlign: "left" }}>
                        {error}
                    </div>
                )}

                <div className="pos-shift-modal__actions">
                    <button className="pos-shift-btn pos-shift-btn--ghost" onClick={onClose} disabled={closing}>Cancel</button>
                    <button
                        id="confirm-close-shift-btn"
                        className="pos-shift-btn pos-shift-btn--danger"
                        onClick={handleClose}
                        disabled={closing}
                    >
                        {closing ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />} Close Shift
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sale Complete Overlay — delegates printing to the Invoice module
// ──────────────────────────────────────────────────────────────────────────────
function SaleCompleteOverlay({ order, onNewSale }) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const tenantId = order.tenant_id || order.tenantId || "";
    const receiptUrl = `${apiBase}/invoices/orders/${order.id}/receipt${tenantId ? `?tenantId=${tenantId}` : ""}`;

    return (
        <div className="pos-overlay">
            <div className="pos-sale-complete">
                <div className="pos-sale-complete__icon">
                    <CheckCircle size={44} />
                </div>
                <h2>Sale Complete</h2>
                <p className="pos-sale-complete__order">{order.order_number}</p>
                <div className="pos-sale-complete__total">{fmt(order.total)}</div>
                {order.change_due > 0 && (
                    <div className="pos-sale-complete__change">Change due: {fmt(order.change_due)}</div>
                )}
                <div className="pos-sale-complete__actions">
                    <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pos-shift-btn pos-shift-btn--ghost"
                    >
                        <Printer size={15} /> Print Receipt
                    </a>
                    <button className="pos-shift-btn pos-shift-btn--primary" onClick={onNewSale}>
                        <Plus size={15} /> New Sale
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Variant Picker Modal
// ──────────────────────────────────────────────────────────────────────────────
function VariantPickerModal({ product, onSelect, onClose }) {
    if (!product) return null;
    return (
        <div className="pos-overlay" onClick={onClose}>
            <div className="pos-variant-modal" onClick={e => e.stopPropagation()}>
                <div className="pos-variant-modal__head">
                    <div>
                        <h3>Select Product Option</h3>
                        <p>{product.name}</p>
                    </div>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                <div className="pos-variant-modal__list">
                    {product.variants && product.variants.length > 0 ? (
                        product.variants.map(v => {
                            const isOut = v.stock_status === "out_of_stock";
                            return (
                                <button
                                    key={v.id}
                                    className={`pos-variant-item ${isOut ? "pos-variant-item--out" : ""}`}
                                    disabled={isOut}
                                    onClick={() => { onSelect(product, v); onClose(); }}
                                >
                                    <div className="pos-variant-item__info">
                                        <div className="pos-variant-item__label">{v.variant_label || v.name}</div>
                                        <div className="pos-variant-item__sku">SKU: {v.sku || "—"}</div>
                                    </div>
                                    <div className="pos-variant-item__meta">
                                        <div className="pos-variant-item__price">{fmt(v.price)}</div>
                                        <div className={`pos-variant-item__stock ${isOut ? "text-red-500" : ""}`}>
                                            {isOut ? "Out of Stock" : `${v.inventory_quantity} in stock`}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                            No options found for this item.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Held Carts Modal (Parked Orders)
// ──────────────────────────────────────────────────────────────────────────────
function HeldCartsModal({ heldCarts, onResume, onDiscard, onClose }) {
    return (
        <div className="pos-overlay" onClick={onClose}>
            <div className="pos-held-modal" onClick={e => e.stopPropagation()}>
                <div className="pos-held-modal__head">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Clock size={18} color="#f59e0b" />
                        <h3>Parked Orders ({heldCarts.length})</h3>
                    </div>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                <div className="pos-held-modal__list">
                    {heldCarts.length === 0 ? (
                        <div style={{ padding: "30px 20px", textAlign: "center", color: "#94a3b8" }}>
                            <Clock size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                            <p>No parked orders right now.</p>
                        </div>
                    ) : (
                        heldCarts.map(hc => (
                            <div key={hc.id} className="pos-held-item">
                                <div className="pos-held-item__top">
                                    <div>
                                        <strong style={{ fontSize: 14 }}>{hc.customerName || "Walk-in Order"}</strong>
                                        <span className="pos-held-time">{new Date(hc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <span className="pos-held-total">{fmt(hc.total)}</span>
                                </div>
                                <p className="pos-held-summary">
                                    {hc.cart.map(i => `${i.quantity}x ${i.product_name}`).join(", ")}
                                </p>
                                <div className="pos-held-actions">
                                    <button className="pos-shift-btn pos-shift-btn--ghost" style={{ color: "#ef4444" }} onClick={() => onDiscard(hc.id)}>
                                        <Trash2 size={13} /> Discard
                                    </button>
                                    <button className="pos-shift-btn pos-shift-btn--primary" onClick={() => onResume(hc)}>
                                        <ArrowLeftRight size={13} /> Resume Order
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Shift Sales History Drawer
// ──────────────────────────────────────────────────────────────────────────────
function ShiftSalesDrawer({ session, onClose }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

    useEffect(() => {
        if (!session?.id) return;
        (async () => {
            try {
                const res = await api.get(`/pos/sessions/${session.id}/summary`);
                setOrders(res.data?.orders || []);
            } catch (e) {
                console.error("Failed to load shift sales:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [session]);

    return (
        <div className="pos-overlay" onClick={onClose}>
            <div className="pos-sales-drawer" onClick={e => e.stopPropagation()}>
                <div className="pos-sales-drawer__head">
                    <div>
                        <h3>Shift Transactions</h3>
                        <p>{session.register_name} · {orders.length} sales recorded</p>
                    </div>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
                <div className="pos-sales-drawer__content">
                    {loading ? (
                        <div className="pos-center" style={{ height: 200 }}><Loader2 className="spin" size={24} /></div>
                    ) : orders.length === 0 ? (
                        <div className="pos-center" style={{ height: 200, flexDirection: "column", gap: 8 }}>
                            <Package size={32} color="#cbd5e1" />
                            <p>No completed sales in this shift yet.</p>
                        </div>
                    ) : (
                        orders.map(o => {
                            const receiptUrl = `${apiBase}/invoices/orders/${o.id}/receipt?tenantId=${session.tenant_id}`;
                            return (
                                <div key={o.id} className="pos-sale-item">
                                    <div className="pos-sale-item__main">
                                        <strong className="pos-sale-item__num">{o.order_number}</strong>
                                        <span className="pos-sale-item__time">
                                            {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="pos-sale-item__method">
                                            {o.payment_method || "cash"}
                                        </span>
                                    </div>
                                    <div className="pos-sale-item__right">
                                        <div className="pos-sale-item__total">{fmt(o.total)}</div>
                                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="pos-reprint-btn">
                                            <Printer size={12} /> Receipt
                                        </a>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Customer Selector
// ──────────────────────────────────────────────────────────────────────────────
function CustomerSelector({ onSelect, onClose }) {
    const [tab, setTab] = useState("local");
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false); // whether a search was attempted
    const [addMode, setAddMode] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [saving, setSaving] = useState(false);

    // Local customers: auto-fetch on search input change
    const fetchLocal = useCallback(async (q) => {
        setLoading(true);
        try {
            const res = await api.get(`/pos/local-customers?search=${encodeURIComponent(q)}`);
            setCustomers(res.data?.data || []);
        } catch (e) {
            console.error("Failed to fetch local customers:", e);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Store customers: only search on explicit submit (Enter / button)
    const fetchStore = useCallback(async (email) => {
        if (!email.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get(`/pos/store-customers?search=${encodeURIComponent(email.trim())}`);
            setCustomers(res.data?.data || []);
        } catch (e) {
            console.error("Failed to fetch store customers:", e);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // When tab changes, reset state
    useEffect(() => {
        setSearch("");
        setCustomers([]);
        setSearched(false);
        if (tab === "local") fetchLocal("");
    }, [tab, fetchLocal]);

    // Local tab: debounced auto-search
    useEffect(() => {
        if (tab !== "local") return;
        const t = setTimeout(() => fetchLocal(search), 300);
        return () => clearTimeout(t);
    }, [search, tab, fetchLocal]);

    const addLocal = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const res = await api.post("/pos/local-customers", {
                name: newName.trim(),
                phone: newPhone.trim()
            });
            if (res.data?.success) {
                onSelect({ type: "local", customer: res.data.customer });
            }
        } catch (e) {
            console.error("Failed to add local customer:", e);
        } finally {
            setSaving(false);
        }
    };

    const handleStoreKeyDown = (e) => {
        if (e.key === "Enter") fetchStore(search);
    };

    return (
        <div className="pos-overlay" onClick={onClose}>
            <div className="pos-customer-modal" onClick={e => e.stopPropagation()}>
                <div className="pos-customer-modal__head">
                    <h3>Select Customer</h3>
                    <button onClick={onClose}><X size={16} /></button>
                </div>
                <div className="pos-customer-modal__tabs">
                    <button className={tab === "local" ? "active" : ""} onClick={() => setTab("local")}>Local Customers</button>
                    <button className={tab === "store" ? "active" : ""} onClick={() => setTab("store")}>Store Users</button>
                </div>

                <div className="pos-customer-modal__search">
                    <Search size={14} />
                    <input
                        placeholder={tab === "store" ? "Enter exact email address…" : "Search by name or phone..."}
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            if (tab === "store") { setSearched(false); setCustomers([]); }
                        }}
                        onKeyDown={tab === "store" ? handleStoreKeyDown : undefined}
                        type={tab === "store" ? "email" : "text"}
                        autoFocus
                    />
                    {tab === "store" && (
                        <button
                            onClick={() => fetchStore(search)}
                            disabled={!search.trim() || loading}
                            style={{ marginLeft: 6, padding: "4px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: !search.trim() ? 0.5 : 1 }}
                        >
                            {loading ? <Loader2 size={12} className="spin" /> : "Search"}
                        </button>
                    )}
                </div>

                <div className="pos-customer-modal__list">
                    {loading ? (
                        <div className="pos-center"><Loader2 size={20} className="spin" /></div>
                    ) : tab === "store" && !searched ? (
                        <p style={{ textAlign: "center", color: "#94a3b8", padding: 20, fontSize: 13 }}>
                            Enter the customer's email and press Search
                        </p>
                    ) : customers.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#94a3b8", padding: 20, fontSize: 13 }}>
                            {tab === "store" ? "No account found with that email" : "No customers found"}
                        </p>
                    ) : (
                        customers.map(c => (
                            <button
                                key={c.id}
                                className="pos-customer-item"
                                onClick={() => onSelect({ type: tab, customer: c })}
                            >
                                <User size={15} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{c.name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email}</div>
                                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.phone || c.email}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {tab === "local" && (
                    addMode ? (
                        <div className="pos-customer-add-form">
                            <input placeholder="Customer Name *" value={newName} onChange={e => setNewName(e.target.value)} />
                            <input placeholder="Phone (optional)" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <button className="pos-shift-btn pos-shift-btn--ghost" onClick={() => setAddMode(false)}>Cancel</button>
                                <button className="pos-shift-btn pos-shift-btn--primary" onClick={addLocal} disabled={saving || !newName.trim()}>
                                    {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="pos-customer-add-btn" onClick={() => setAddMode(true)}>
                            <UserPlus size={15} /> Add New Local Customer
                        </button>
                    )
                )}

                <button className="pos-customer-walkin" onClick={() => onSelect({ type: "walk_in", customer: null })}>
                    Continue as Walk-in Customer
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Create Register Form (if no register exists)
// ──────────────────────────────────────────────────────────────────────────────
function CreateRegisterForm({ onCreated }) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [saving, setSaving] = useState(false);

    const create = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const res = await api.post("/pos/registers", { name: name.trim(), location: location.trim() || null });
            if (res.data?.success) onCreated(res.data.register);
        } catch (e) {
            console.error("Failed to create register:", e);
            alert(e.response?.data?.message || "Failed to create register");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ background: "#fff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", maxWidth: 360, width: "100%", textAlign: "left" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Setup Your First Register</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>You need at least one cash register terminal to start selling.</p>
            <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Register Name *</label>
                <input style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                    value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Counter" />
            </div>
            <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Location / Branch</label>
                <input style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
                    value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Ground Floor" />
            </div>
            <button className="pos-shift-btn pos-shift-btn--primary" style={{ width: "100%", justifyContent: "center" }}
                onClick={create} disabled={saving || !name.trim()}>
                {saving ? <Loader2 size={15} className="spin" /> : <Plus size={15} />} Create Register
            </button>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN POS PAGE
// ──────────────────────────────────────────────────────────────────────────────
export default function PosPage() {
    const [registers, setRegisters] = useState([]);
    const [session, setSession] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState("");
    const [showOpenShift, setShowOpenShift] = useState(false);
    const [showCloseShift, setShowCloseShift] = useState(false);
    const [showCustomer, setShowCustomer] = useState(false);
    const [showHeldModal, setShowHeldModal] = useState(false);
    const [showSalesDrawer, setShowSalesDrawer] = useState(false);
    const [variantPickerProduct, setVariantPickerProduct] = useState(null);
    const [heldCarts, setHeldCarts] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [cashTendered, setCashTendered] = useState("");
    const [splitCash, setSplitCash] = useState("");
    const [splitCard, setSplitCard] = useState("");
    const [splitTransfer, setSplitTransfer] = useState("");
    const [discount, setDiscount] = useState("0");
    const [couponCode, setCouponCode] = useState("");
    const [couponInput, setCouponInput] = useState("");
    const [couponData, setCouponData] = useState(null);   // validated coupon object
    const [couponError, setCouponError] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [showCouponBrowser, setShowCouponBrowser] = useState(false);
    const [eligibleCoupons, setEligibleCoupons] = useState([]);
    const [loadingEligible, setLoadingEligible] = useState(false);
    const [completedOrder, setCompletedOrder] = useState(null);
    const [checkingOut, setCheckingOut] = useState(false);
    const [error, setError] = useState(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const searchRef = useRef();

    // Load registers, active session, and categories
    const loadInitialData = useCallback(async () => {
        try {
            const [regRes, sessRes, catRes] = await Promise.all([
                api.get("/pos/registers"),
                api.get("/pos/sessions/current"),
                api.get("/categories?per_page=100").catch(() => ({ data: { data: [] } }))
            ]);
            setRegisters(regRes.data?.data || []);
            setSession(sessRes.data?.session || null);
            setCategories(catRes.data?.data || []);
        } catch (e) {
            console.error("Failed to load POS data:", e);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // Load held carts from localStorage
    useEffect(() => {
        if (session?.id) {
            try {
                const saved = localStorage.getItem(`pos_held_carts_${session.id}`);
                if (saved) setHeldCarts(JSON.parse(saved));
            } catch {}
        }
    }, [session?.id]);

    const saveHeldCarts = (newHeld) => {
        setHeldCarts(newHeld);
        if (session?.id) {
            localStorage.setItem(`pos_held_carts_${session.id}`, JSON.stringify(newHeld));
        }
    };

    // Load products
    const fetchProducts = useCallback(async () => {
        if (!session) return;
        setLoadingProducts(true);
        try {
            const params = new URLSearchParams({ search });
            if (categoryFilter) params.set("category_id", categoryFilter);
            const res = await api.get(`/pos/products?${params.toString()}`);
            setProducts(res.data?.data || []);
        } catch (e) {
            console.error("Failed to load products:", e);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }, [session, search, categoryFilter]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // ── Cart helpers ───────────────────────────────────────────────────────────
    const addToCart = (product, variant = null) => {
        // If product has variants and none was explicitly passed, open picker
        if (product.has_variants && !variant && product.variants?.length > 0) {
            setVariantPickerProduct(product);
            return;
        }

        const target = variant || product;
        if (target.stock_status === "out_of_stock") return;

        const cartKey = variant ? `${product.id}_${variant.id}` : product.id;
        const maxQty = target.inventory_quantity ?? 9999;

        setCart(prev => {
            const existing = prev.find(i => i.cart_key === cartKey);
            if (existing) {
                if (existing.quantity >= maxQty) return prev;
                return prev.map(i => i.cart_key === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                cart_key: cartKey,
                product_id: product.id,
                variant_id: variant ? variant.id : null,
                product_name: variant ? `${product.name} (${variant.variant_label || variant.name})` : product.name,
                price: parseFloat(target.price),
                quantity: 1,
                max_qty: maxQty,
                image_url: variant?.image_url || product.image_url,
                tax_class: product.tax_class,
            }];
        });
    };

    const updateQty = (cartKey, delta) => {
        setCart(prev => prev
            .map(i => i.cart_key === cartKey ? { ...i, quantity: i.quantity + delta } : i)
            .filter(i => i.quantity > 0));
    };

    const removeFromCart = (cartKey) => setCart(prev => prev.filter(i => i.cart_key !== cartKey));

    const clearCart = () => {
        setCart([]);
        setCustomer(null);
        setDiscount("0");
        setCashTendered("");
        setSplitCash("");
        setSplitCard("");
        setSplitTransfer("");
        // Clear coupon state too
        setCouponCode("");
        setCouponInput("");
        setCouponData(null);
        setCouponError(null);
        setShowCouponBrowser(false);
    };

    // ── Barcode / SKU Auto-Add Handler ─────────────────────────────────────────
    const handleSkuScan = (query) => {
        if (!query) return;
        const q = query.trim().toUpperCase();

        for (const p of products) {
            // Check child variant SKU
            if (p.variants && p.variants.length > 0) {
                const matchedVar = p.variants.find(v => (v.sku || "").toUpperCase() === q);
                if (matchedVar) {
                    addToCart(p, matchedVar);
                    setSearch("");
                    return;
                }
            }
            // Check parent SKU
            if ((p.sku || "").toUpperCase() === q) {
                if (p.has_variants) {
                    setVariantPickerProduct(p);
                } else {
                    addToCart(p);
                }
                setSearch("");
                return;
            }
        }
    };

    // ── Park / Hold Order ──────────────────────────────────────────────────────
    const holdCurrentCart = () => {
        if (cart.length === 0) return;
        const held = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            cart: [...cart],
            customer,
            discount,
            total,
            customerName: customer?.customer?.name || (customer?.type === "walk_in" ? "Walk-in Customer" : `Parked Order #${heldCarts.length + 1}`)
        };
        saveHeldCarts([held, ...heldCarts]);
        clearCart();
    };

    const resumeHeldCart = (held) => {
        setCart(held.cart);
        setCustomer(held.customer || null);
        setDiscount(held.discount || "0");
        saveHeldCarts(heldCarts.filter(h => h.id !== held.id));
        setShowHeldModal(false);
    };

    const discardHeldCart = (heldId) => {
        saveHeldCarts(heldCarts.filter(h => h.id !== heldId));
    };

    // ── Totals ─────────────────────────────────────────────────────────────────
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountAmt = Math.min(parseFloat(discount || 0), subtotal);
    // Coupon discount (validated server-side amount)
    const couponDiscountAmt = couponData ? Math.min(parseFloat(couponData.discount_amount || 0), subtotal - discountAmt) : 0;
    const total = Math.max(0, subtotal - discountAmt - couponDiscountAmt);
    const change = paymentMethod === "cash" ? Math.max(0, parseFloat(cashTendered || 0) - total) : 0;

    // Split payments allocation
    const splitTotalEntered = parseFloat(splitCash || 0) + parseFloat(splitCard || 0) + parseFloat(splitTransfer || 0);
    const splitRemaining = Math.max(0, total - splitTotalEntered);

    // ── Checkout ───────────────────────────────────────────────────────────────
    const checkout = async () => {
        if (!session || cart.length === 0) return;
        setCheckingOut(true);
        setError(null);

        let splitPayments = null;
        if (paymentMethod === "split") {
            if (splitRemaining > 0.01) {
                setError(`Please allocate full balance. ₦${splitRemaining.toFixed(2)} remaining.`);
                setCheckingOut(false);
                return;
            }
            splitPayments = [
                { method: "cash", amount: parseFloat(splitCash || 0) },
                { method: "card", amount: parseFloat(splitCard || 0) },
                { method: "transfer", amount: parseFloat(splitTransfer || 0) }
            ].filter(p => p.amount > 0);
        }

        try {
            const res = await api.post("/pos/checkout", {
                session_id: session.id,
                items: cart.map(i => ({
                    product_id: i.product_id,
                    variant_id: i.variant_id || null,
                    quantity: i.quantity,
                    price: i.price
                })),
                payment_method: paymentMethod,
                split_payments: splitPayments,
                cash_tendered: paymentMethod === "cash" ? parseFloat(cashTendered || 0) : null,
                customer_id: customer?.type === "store" ? customer.customer.id : null,
                local_customer_id: customer?.type === "local" ? customer.customer.id : null,
                customer_name: customer?.type === "walk_in" ? "Walk-in Customer" : null,
                discount_amount: discountAmt + couponDiscountAmt,
                coupon_code: couponCode || null,
            });
            if (res.data?.success) {
                setCompletedOrder(res.data.order);
                clearCart();
                fetchProducts(); // refresh stock
                // Update live session sales counter
                setSession(s => s ? {
                    ...s,
                    live_total_sales: (parseFloat(s.live_total_sales || 0) + total),
                    live_order_count: (parseInt(s.live_order_count || 0) + 1)
                } : s);
            } else {
                setError(res.data?.message || res.data?.error || "Checkout failed");
            }
        } catch (e) {
            setError(e.response?.data?.message || e.response?.data?.error || "Checkout failed");
        } finally {
            setCheckingOut(false);
        }
    };

    // ── Coupon Validation ──────────────────────────────────────────────────────
    const validateCoupon = async (code) => {
        const c = (code || couponInput).trim().toUpperCase();
        if (!c) return;
        setCouponLoading(true);
        setCouponError(null);
        setCouponData(null);
        try {
            const res = await api.post("/discounts/validate", {
                code: c,
                subtotal: subtotal - discountAmt,
                items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price }))
            });
            if (res.data?.valid) {
                setCouponCode(c);
                setCouponData(res.data);
                setCouponError(null);
            } else {
                setCouponError(res.data?.message || "Invalid or expired coupon");
            }
        } catch (e) {
            setCouponError(
                e.response?.data?.error ||
                e.response?.data?.message ||
                "Could not validate coupon"
            );
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setCouponCode("");
        setCouponInput("");
        setCouponData(null);
        setCouponError(null);
    };

    const fetchEligibleCoupons = async () => {
        setLoadingEligible(true);
        setEligibleCoupons([]);
        try {
            // 1. Load all active coupons accessible to this POS session
            const res = await api.get(`/pos/coupons`);
            const all = res.data?.data || [];

            if (all.length === 0) {
                setEligibleCoupons([]);
                return;
            }

            if (cart.length === 0) {
                // No cart — show all coupons with no eligibility info
                setEligibleCoupons(all.map(c => ({
                    ...c,
                    _eligible: false,
                    _eligibleCount: 0,
                    _discountAmount: 0,
                    _allEligible: false,
                    _error: "Add items to cart first",
                })));
                return;
            }

            // 2. Validate each coupon against the actual cart (server-side)
            const cartItems = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price }));
            const validations = await Promise.allSettled(
                all.map(c =>
                    api.post("/discounts/validate", {
                        code: c.code,
                        subtotal: subtotal - discountAmt,
                        items: cartItems,
                    }).then(r => ({ couponMeta: c, result: r.data })).catch(e => ({
                        couponMeta: c,
                        result: { valid: false, message: e.response?.data?.message || e.response?.data?.error || "Not eligible" }
                    }))
                )
            );

            // 3. Build enriched list — only valid ones, with eligibility details
            const enriched = validations
                .filter(v => v.status === "fulfilled")
                .map(v => v.value)
                .filter(v => v.result?.valid)
                .map(({ couponMeta, result }) => {
                    const eligibleIds = result.eligible_product_ids || [];
                    const eligibleCartItems = cart.filter(i => eligibleIds.includes(i.product_id));
                    return {
                        ...couponMeta,
                        _eligible: true,
                        _eligibleCount: eligibleCartItems.length,
                        _eligibleNames: eligibleCartItems.map(i => i.product_name),
                        _allEligible: eligibleCartItems.length === cart.length,
                        _discountAmount: result.discount_amount || 0,
                        _validatedData: result,
                    };
                });

            setEligibleCoupons(enriched);
        } catch (e) {
            console.error("Failed to fetch eligible coupons:", e);
            setEligibleCoupons([]);
        } finally {
            setLoadingEligible(false);
        }
    };

    const openShift = async (registerId, openingCash) => {
        try {
            const res = await api.post("/pos/sessions/open", {
                register_id: registerId,
                opening_cash: parseFloat(openingCash || 0)
            });
            if (res.data?.success) {
                setSession(res.data.session);
                setShowOpenShift(false);
            }
        } catch (e) {
            console.error("Failed to open shift:", e);
            alert(e.response?.data?.message || e.response?.data?.error || "Failed to open shift");
        }
    };

    if (!session) {
        return (
            <>
                <style>{POS_STYLES}</style>
                <div className="pos-no-session">
                    <Monitor size={64} />
                    <h2>Point of Sale</h2>
                    <p>No active shift. Open a shift to start selling.</p>
                    {registers.length > 0 ? (
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                            <button className="pos-shift-btn pos-shift-btn--primary" onClick={() => setShowOpenShift(true)}>
                                <LogIn size={16} /> Open Shift
                            </button>
                            <button className="pos-shift-btn pos-shift-btn--ghost" style={{ background: "#fff", border: "1px solid #cbd5e1" }} onClick={() => setShowOpenShift(true)}>
                                <Plus size={16} /> Add Register
                            </button>
                        </div>
                    ) : (
                        <CreateRegisterForm
                            onCreated={(register) => {
                                setRegisters([register]);
                                setShowOpenShift(true);
                            }}
                        />
                    )}
                    {showOpenShift && (
                        <OpenShiftModal
                            registers={registers}
                            onOpen={openShift}
                            onClose={() => setShowOpenShift(false)}
                            onRegisterCreated={(newReg) => setRegisters(prev => [...prev, newReg])}
                        />
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <style>{POS_STYLES}</style>

            {/* Header Bar */}
            <div className="pos-header">
                <div className="pos-header__left">
                    <Monitor size={18} />
                    <span className="pos-header__register">{session.register_name}</span>
                    <span className="pos-header__sep">·</span>
                    <Clock size={14} />
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>
                        Shift #{session.id?.slice(0, 8)}
                    </span>
                </div>
                <div className="pos-header__center">
                    <span className="pos-header__total-label">Shift Sales</span>
                    <span className="pos-header__total-value">{fmt(session.live_total_sales || session.total_sales || 0)}</span>
                </div>
                <div className="pos-header__right">
                    {heldCarts.length > 0 && (
                        <button className="pos-held-badge-btn" onClick={() => setShowHeldModal(true)}>
                            <Clock size={14} /> Parked ({heldCarts.length})
                        </button>
                    )}
                    <button className="pos-history-btn" onClick={() => setShowSalesDrawer(true)}>
                        <Printer size={14} /> Shift Sales
                    </button>
                    <button id="close-shift-header-btn" type="button" className="pos-close-shift-btn" onClick={() => setShowCloseShift(true)}>
                        <LogOut size={14} /> Close Shift
                    </button>
                </div>
            </div>

            <div className="pos-layout">
                {/* LEFT: Catalog Grid & Categories */}
                <div className="pos-left">
                    {/* Search & Barcode Bar */}
                    <div className="pos-search-bar">
                        <Search size={15} />
                        <input
                            ref={searchRef}
                            placeholder="Search products or scan barcode (press Enter)..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSkuScan(search);
                                }
                            }}
                            autoFocus
                        />
                        {search && <button onClick={() => setSearch("")}><X size={14} /></button>}
                    </div>

                    {/* Category Filter Pills */}
                    {categories.length > 0 && (
                        <div className="pos-category-bar">
                            <button
                                className={`pos-category-pill ${categoryFilter === null ? "active" : ""}`}
                                onClick={() => setCategoryFilter(null)}
                            >
                                All Items
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`pos-category-pill ${categoryFilter === cat.id ? "active" : ""}`}
                                    onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {loadingProducts ? (
                        <div className="pos-center"><Loader2 className="spin" size={28} /></div>
                    ) : products.length === 0 ? (
                        <div className="pos-center" style={{ flexDirection: "column", gap: 8, color: "#94a3b8" }}>
                            <Package size={36} />
                            <span>No products found</span>
                        </div>
                    ) : (
                        <div className="pos-product-grid">
                            {products.map(p => {
                                const inCart = cart.filter(i => i.product_id === p.id).reduce((s, i) => s + i.quantity, 0);
                                const isOut = p.stock_status === "out_of_stock";
                                return (
                                    <button
                                        key={p.id}
                                        className={`pos-product-card ${isOut ? "pos-product-card--out" : ""} ${inCart > 0 ? "pos-product-card--in-cart" : ""}`}
                                        onClick={() => addToCart(p)}
                                        disabled={isOut}
                                    >
                                        {p.image_url
                                            ? <img src={p.image_url} alt={p.name} className="pos-product-card__img" />
                                            : <div className="pos-product-card__placeholder"><Package size={24} /></div>}

                                        {p.has_variants && (
                                            <span className="pos-product-card__var-badge">
                                                <Layers size={10} /> {p.variants?.length || "Variations"}
                                            </span>
                                        )}
                                        {p.stock_status === "low_stock" && <span className="pos-product-card__low">Low</span>}
                                        {isOut && <span className="pos-product-card__out-badge">Out</span>}
                                        {inCart > 0 && <span className="pos-product-card__cart-badge">{inCart}</span>}

                                        <div className="pos-product-card__body">
                                            <div className="pos-product-card__name">{p.name}</div>
                                            <div className="pos-product-card__price">{fmt(p.price)}</div>
                                            <div className="pos-product-card__stock">
                                                {p.has_variants ? `${p.inventory_quantity} total units` : `${p.inventory_quantity} in stock`}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT: Cart & Checkout */}
                <div className="pos-right">
                    {/* Customer & Hold Order Header */}
                    <div className="pos-customer-header">
                        <button className="pos-customer-chip" onClick={() => setShowCustomer(true)}>
                            <User size={14} />
                            {customer
                                ? <span>{customer.customer?.name || customer.customer?.first_name || "Walk-in Customer"}</span>
                                : <span>Walk-in / Select Customer</span>}
                            <ChevronDown size={13} />
                        </button>
                        <button
                            className="pos-hold-action-btn"
                            disabled={cart.length === 0}
                            onClick={holdCurrentCart}
                            title="Park this cart to attend to another customer"
                        >
                            <Clock size={14} /> Hold
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="pos-cart">
                        {cart.length === 0 ? (
                            <div className="pos-cart-empty">
                                <ShoppingCart size={32} />
                                <p>Cart is empty</p>
                                <small>Tap a product or scan a barcode to add it</small>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cart_key} className="pos-cart-item">
                                    {item.image_url && <img src={item.image_url} alt={item.product_name} className="pos-cart-item__img" />}
                                    <div className="pos-cart-item__info">
                                        <div className="pos-cart-item__name">{item.product_name}</div>
                                        <div className="pos-cart-item__price">{fmt(item.price)} each</div>
                                    </div>
                                    <div className="pos-cart-item__qty">
                                        <button onClick={() => updateQty(item.cart_key, -1)}><Minus size={13} /></button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQty(item.cart_key, 1)} disabled={item.quantity >= item.max_qty}>
                                            <Plus size={13} />
                                        </button>
                                    </div>
                                    <div className="pos-cart-item__total">{fmt(item.price * item.quantity)}</div>
                                    <button className="pos-cart-item__remove" onClick={() => removeFromCart(item.cart_key)}>
                                        <X size={13} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals */}
                    <div className="pos-totals">
                        <div className="pos-totals__row">
                            <span>Subtotal</span><span>{fmt(subtotal)}</span>
                        </div>
                        <div className="pos-totals__row pos-totals__discount">
                            <span>Manual Discount (₦)</span>
                            <input type="number" min="0" value={discount}
                                onChange={e => setDiscount(e.target.value)}
                                className="pos-discount-input" />
                        </div>
                        {discountAmt > 0 && <div className="pos-totals__row pos-totals__row--disc">
                            <span>Discount Applied</span><span>-{fmt(discountAmt)}</span>
                        </div>}

                        {/* ── Coupon Section ── */}
                        <div className="pos-coupon-section">
                            {couponData ? (
                                // Applied coupon badge
                                <div className="pos-coupon-applied">
                                    <div className="pos-coupon-applied__info">
                                        <Tag size={13} />
                                        <div>
                                            <span className="pos-coupon-applied__code">{couponCode}</span>
                                            <span className="pos-coupon-applied__label">{couponData.coupon?.description || couponData.coupon?.type || "Coupon applied"}</span>
                                        </div>
                                    </div>
                                    <button className="pos-coupon-remove-btn" onClick={removeCoupon} title="Remove coupon">
                                        <X size={13} />
                                    </button>
                                </div>
                            ) : (
                                // Coupon input row
                                <div className="pos-coupon-input-row">
                                    <Tag size={13} style={{ color: "#6366f1", flexShrink: 0 }} />
                                    <input
                                        className="pos-coupon-input"
                                        placeholder="Coupon code…"
                                        value={couponInput}
                                        onChange={e => { setCouponInput(e.target.value); setCouponError(null); }}
                                        onKeyDown={e => e.key === "Enter" && validateCoupon()}
                                    />
                                    <button
                                        className="pos-coupon-apply-btn"
                                        onClick={() => validateCoupon()}
                                        disabled={!couponInput.trim() || couponLoading}
                                    >
                                        {couponLoading ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
                                        Apply
                                    </button>
                                    <button
                                        className="pos-coupon-browse-btn"
                                        title="Browse eligible coupons"
                                        onClick={() => { setShowCouponBrowser(b => !b); if (!showCouponBrowser) fetchEligibleCoupons(); }}
                                    >
                                        {loadingEligible ? <Loader2 size={13} className="spin" /> : <Search size={13} />}
                                        Browse
                                    </button>
                                </div>
                            )}

                            {couponError && (
                                <div className="pos-coupon-error">
                                    <AlertCircle size={12} /> {couponError}
                                </div>
                            )}

                            {/* Eligible coupon browser dropdown */}
                            {showCouponBrowser && !couponData && (
                                <div className="pos-coupon-browser">
                                    {loadingEligible ? (
                                        <div className="pos-coupon-browser__loading">
                                            <Loader2 size={16} className="spin" />
                                            <span>Checking eligibility against your cart…</span>
                                        </div>
                                    ) : eligibleCoupons.length === 0 ? (
                                        <p className="pos-coupon-browser__empty">
                                            {cart.length === 0 ? "Add items to your cart first" : "No eligible coupons for this cart"}
                                        </p>
                                    ) : (
                                        eligibleCoupons.map(c => (
                                            <button
                                                key={c.id}
                                                className={`pos-coupon-browser__item ${c._eligible ? "" : "pos-coupon-browser__item--blocked"}`}
                                                disabled={!c._eligible}
                                                onClick={() => {
                                                    if (!c._eligible) return;
                                                    setCouponInput(c.code);
                                                    setShowCouponBrowser(false);
                                                    // Reuse already-validated data instead of another round-trip
                                                    if (c._validatedData) {
                                                        setCouponCode(c.code.toUpperCase());
                                                        setCouponData(c._validatedData);
                                                        setCouponError(null);
                                                    } else {
                                                        validateCoupon(c.code);
                                                    }
                                                }}
                                            >
                                                <div className="pos-coupon-browser__row">
                                                    <div className="pos-coupon-browser__code">{c.code}</div>
                                                    {c._eligible && c._discountAmount > 0 && (
                                                        <div className="pos-coupon-browser__saving">-{fmt(c._discountAmount)}</div>
                                                    )}
                                                </div>
                                                <div className="pos-coupon-browser__desc">
                                                    {c.name}
                                                    {c._eligible && (
                                                        <span className="pos-coupon-browser__scope">
                                                            {" · "}
                                                            {c._allEligible
                                                                ? `All ${cart.length} product${cart.length > 1 ? "s" : ""} eligible`
                                                                : `${c._eligibleCount} of ${cart.length} product${cart.length > 1 ? "s" : ""} eligible`}
                                                        </span>
                                                    )}
                                                </div>
                                                {c._eligible && !c._allEligible && c._eligibleNames?.length > 0 && (
                                                    <div className="pos-coupon-browser__products">
                                                        {c._eligibleNames.join(" · ")}
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {couponDiscountAmt > 0 && (
                            <div className="pos-totals__row pos-totals__row--coupon">
                                <span>Coupon Savings</span><span>-{fmt(couponDiscountAmt)}</span>
                            </div>
                        )}

                        <div className="pos-totals__row pos-totals__tax">
                            <span>Tax</span><span style={{ color: "#94a3b8", fontSize: 12 }}>Applied at checkout</span>
                        </div>
                        <div className="pos-totals__row pos-totals__total">
                            <span>Total</span><strong>{fmt(total)}</strong>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="pos-payment-methods">
                        {[
                            { key: "cash", label: "Cash", icon: <Banknote size={15} /> },
                            { key: "card", label: "Card", icon: <CreditCard size={15} /> },
                            { key: "transfer", label: "Transfer", icon: <ArrowLeftRight size={15} /> },
                            { key: "split", label: "Split", icon: <PieChart size={15} /> },
                        ].map(m => (
                            <button key={m.key}
                                className={`pos-payment-btn ${paymentMethod === m.key ? "active" : ""}`}
                                onClick={() => setPaymentMethod(m.key)}>
                                {m.icon} {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Cash Tendered Field */}
                    {paymentMethod === "cash" && (
                        <div className="pos-cash-tendered">
                            <label>Cash Tendered (₦)</label>
                            <input type="number" min={total} value={cashTendered}
                                onChange={e => setCashTendered(e.target.value)}
                                placeholder={fmt(total, "")} />
                            {parseFloat(cashTendered) > 0 && (
                                <div className="pos-change">
                                    Change: <strong>{fmt(change)}</strong>
                                </div>
                            )}
                            <div className="pos-quick-amounts">
                                {[500, 1000, 2000, 5000, 10000].map(a => (
                                    <button key={a} onClick={() => setCashTendered(a)}>{fmt(a, "₦")}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Split Payment Tender Form */}
                    {paymentMethod === "split" && (
                        <div className="pos-split-form">
                            <div className="pos-split-inputs">
                                <div className="pos-split-field">
                                    <label>Cash (₦)</label>
                                    <input type="number" min="0" placeholder="0.00" value={splitCash} onChange={e => setSplitCash(e.target.value)} />
                                </div>
                                <div className="pos-split-field">
                                    <label>Card (₦)</label>
                                    <input type="number" min="0" placeholder="0.00" value={splitCard} onChange={e => setSplitCard(e.target.value)} />
                                </div>
                                <div className="pos-split-field">
                                    <label>Transfer (₦)</label>
                                    <input type="number" min="0" placeholder="0.00" value={splitTransfer} onChange={e => setSplitTransfer(e.target.value)} />
                                </div>
                            </div>
                            <div className="pos-split-status">
                                <span>Allocated: <strong>{fmt(splitTotalEntered)}</strong></span>
                                <span className={splitRemaining > 0 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                                    {splitRemaining > 0 ? `Remaining: ${fmt(splitRemaining)}` : "Fully Allocated ✓"}
                                </span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="pos-error">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}

                    {/* Cart Actions */}
                    <div className="pos-checkout-actions">
                        <button className="pos-clear-btn" onClick={clearCart} disabled={cart.length === 0}>
                            <RotateCcw size={14} /> Clear
                        </button>
                        <button className="pos-checkout-btn"
                            disabled={cart.length === 0 || checkingOut || (paymentMethod === "split" && splitRemaining > 0.01)}
                            onClick={checkout}>
                            {checkingOut
                                ? <><Loader2 size={16} className="spin" /> Processing...</>
                                : <><CheckCircle size={16} /> Charge {fmt(total)}</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals & Overlays */}
            {showOpenShift && (
                <OpenShiftModal registers={registers} onOpen={openShift} onClose={() => setShowOpenShift(false)} />
            )}
            {showCloseShift && (
                <CloseShiftModal
                    session={session}
                    onClose={() => setShowCloseShift(false)}
                    onClosed={() => { setSession(null); setShowCloseShift(false); clearCart(); }}
                />
            )}
            {showCustomer && (
                <CustomerSelector
                    onSelect={(sel) => { setCustomer(sel); setShowCustomer(false); }}
                    onClose={() => setShowCustomer(false)} />
            )}
            {variantPickerProduct && (
                <VariantPickerModal
                    product={variantPickerProduct}
                    onSelect={addToCart}
                    onClose={() => setVariantPickerProduct(null)}
                />
            )}
            {showHeldModal && (
                <HeldCartsModal
                    heldCarts={heldCarts}
                    onResume={resumeHeldCart}
                    onDiscard={discardHeldCart}
                    onClose={() => setShowHeldModal(false)}
                />
            )}
            {showSalesDrawer && (
                <ShiftSalesDrawer
                    session={session}
                    onClose={() => setShowSalesDrawer(false)}
                />
            )}
            {completedOrder && (
                <SaleCompleteOverlay
                    order={completedOrder}
                    onNewSale={() => setCompletedOrder(null)}
                />
            )}
        </>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────
const POS_STYLES = `
    * { box-sizing: border-box; }
    .pos-no-session { display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100vh - 60px); gap: 16px; color: #64748b; text-align: center; }
    .pos-no-session svg { color: #cbd5e1; }
    .pos-no-session h2 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
    .pos-no-session p { margin: 0; font-size: 15px; }

    .pos-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #1e293b; color: #fff; gap: 16px; }
    .pos-header__left { display: flex; align-items: center; gap: 8px; }
    .pos-header__register { font-weight: 700; font-size: 15px; }
    .pos-header__sep { color: #475569; }
    .pos-header__center { display: flex; flex-direction: column; align-items: center; }
    .pos-header__total-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
    .pos-header__total-value { font-size: 20px; font-weight: 800; color: #22c55e; }
    .pos-header__right { display: flex; align-items: center; gap: 10px; }

    .pos-held-badge-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: #f59e0b; color: #fff; border: none; cursor: pointer; font-size: 13px; font-weight: 700; }
    .pos-history-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: #334155; color: #fff; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
    .pos-history-btn:hover { background: #475569; }
    .pos-close-shift-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: #ef4444; color: #fff; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }

    .pos-layout { display: grid; grid-template-columns: 1fr 420px; height: calc(100vh - 52px); overflow: hidden; }
    .pos-left { display: flex; flex-direction: column; overflow: hidden; background: #f8fafc; padding: 16px; gap: 12px; }
    .pos-right { display: flex; flex-direction: column; background: #fff; border-left: 1px solid #e2e8f0; overflow: hidden; }

    .pos-search-bar { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; }
    .pos-search-bar input { border: none; outline: none; font-size: 14px; width: 100%; }
    .pos-search-bar button { background: none; border: none; cursor: pointer; color: #94a3b8; }

    /* Category Filter Bar */
    .pos-category-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
    .pos-category-bar::-webkit-scrollbar { display: none; }
    .pos-category-pill { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid #e2e8f0; background: #fff; color: #64748b; white-space: nowrap; cursor: pointer; transition: all .15s; }
    .pos-category-pill:hover { border-color: #cbd5e1; color: #1e293b; }
    .pos-category-pill.active { background: #1e293b; color: #fff; border-color: #1e293b; }

    /* Product Grid & Card */
    .pos-product-grid { display: grid; grid-template-columns: repeat(auto-fill, 160px); gap: 12px; overflow-y: auto; flex: 1; padding-bottom: 8px; align-content: start; }
    .pos-product-card {
        width: 160px; display: flex; flex-direction: column; background: #fff;
        border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;
        cursor: pointer; text-align: left; padding: 0; position: relative;
        transition: transform .12s, box-shadow .12s, border-color .12s;
    }
    .pos-product-card:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.08); border-color: #cbd5e1; }
    .pos-product-card--in-cart { border-color: #22c55e; background: #f0fdf4; }
    .pos-product-card--out { opacity: .5; cursor: not-allowed; }
    .pos-product-card__img { width: 100%; height: 100px; object-fit: cover; }
    .pos-product-card__placeholder { width: 100%; height: 100px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
    .pos-product-card__body { padding: 10px; display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .pos-product-card__name { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .pos-product-card__price { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: auto; }
    .pos-product-card__stock { font-size: 11px; color: #94a3b8; }
    .pos-product-card__low { position: absolute; top: 6px; left: 6px; background: #fef3c7; color: #d97706; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
    .pos-product-card__out-badge { position: absolute; top: 6px; left: 6px; background: #fee2e2; color: #ef4444; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; }
    .pos-product-card__cart-badge { position: absolute; top: 6px; right: 6px; background: #22c55e; color: #fff; font-size: 11px; font-weight: 800; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(34,197,94,.4); }
    .pos-product-card__var-badge { position: absolute; bottom: 74px; right: 6px; background: #6366f1; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 6px; display: flex; align-items: center; gap: 3px; }

    /* Cart Header & Customer */
    .pos-customer-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; background: #fff; }
    .pos-customer-chip { flex: 1; display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; font-size: 13px; font-weight: 600; color: #334155; cursor: pointer; text-align: left; }
    .pos-customer-chip span { flex: 1; }
    .pos-hold-action-btn { display: flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 10px; background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 12px; font-weight: 700; cursor: pointer; }
    .pos-hold-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Cart List */
    .pos-cart { flex: 1; overflow-y: auto; padding: 8px 16px; display: flex; flex-direction: column; gap: 8px; }
    .pos-cart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; text-align: center; gap: 6px; }
    .pos-cart-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
    .pos-cart-item__img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
    .pos-cart-item__info { flex: 1; min-width: 0; }
    .pos-cart-item__name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pos-cart-item__price { font-size: 11px; color: #94a3b8; }
    .pos-cart-item__qty { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 3px 6px; }
    .pos-cart-item__qty button { background: none; border: none; cursor: pointer; color: #64748b; display: flex; align-items: center; }
    .pos-cart-item__qty span { font-size: 13px; font-weight: 700; min-width: 16px; text-align: center; }
    .pos-cart-item__total { font-size: 13px; font-weight: 700; color: #0f172a; min-width: 60px; text-align: right; }
    .pos-cart-item__remove { background: none; border: none; cursor: pointer; color: #cbd5e1; padding: 2px; }
    .pos-cart-item__remove:hover { color: #ef4444; }

    /* Totals */
    .pos-totals { padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #fafafa; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
    .pos-totals__row { display: flex; justify-content: space-between; align-items: center; color: #64748b; }
    .pos-totals__row strong { color: #0f172a; }
    .pos-totals__discount input { width: 80px; text-align: right; padding: 3px 6px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-weight: 600; }
    .pos-totals__row--disc { color: #22c55e; font-weight: 600; }
    .pos-totals__row--coupon { color: #6366f1; font-weight: 700; }
    .pos-totals__total { font-size: 16px; font-weight: 800; color: #0f172a; padding-top: 4px; border-top: 1px solid #e2e8f0; }

    /* Coupon Section */
    .pos-coupon-section { margin: 2px 0 2px; display: flex; flex-direction: column; gap: 4px; position: relative; }
    .pos-coupon-input-row { display: flex; align-items: center; gap: 6px; background: #f5f3ff; border: 1px dashed #a5b4fc; border-radius: 8px; padding: 5px 8px; }
    .pos-coupon-input { flex: 1; border: none; background: transparent; outline: none; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; color: #1e293b; text-transform: uppercase; min-width: 0; }
    .pos-coupon-input::placeholder { text-transform: none; font-weight: 400; color: #94a3b8; }
    .pos-coupon-apply-btn { display: flex; align-items: center; gap: 4px; background: #6366f1; color: #fff; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
    .pos-coupon-apply-btn:disabled { opacity: .5; cursor: not-allowed; }
    .pos-coupon-browse-btn { display: flex; align-items: center; gap: 4px; background: #ede9fe; color: #6366f1; border: 1px solid #c4b5fd; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background .15s; }
    .pos-coupon-browse-btn:hover { background: #ddd6fe; }
    .pos-coupon-applied { display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 6px 10px; }
    .pos-coupon-applied__info { display: flex; align-items: center; gap: 6px; color: #16a34a; }
    .pos-coupon-applied__code { font-size: 12px; font-weight: 800; letter-spacing: 0.5px; display: block; }
    .pos-coupon-applied__label { font-size: 10px; color: #4ade80; display: block; margin-top: 1px; }
    .pos-coupon-remove-btn { background: none; border: none; cursor: pointer; color: #86efac; padding: 2px; display: flex; align-items: center; }
    .pos-coupon-remove-btn:hover { color: #ef4444; }
    .pos-coupon-error { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #dc2626; padding: 2px 2px; font-weight: 600; }
    .pos-coupon-browser { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.12); max-height: 220px; overflow-y: auto; margin-top: 4px; }
    .pos-coupon-browser__loading { display: flex; align-items: center; gap: 8px; padding: 14px 16px; font-size: 12px; color: #64748b; }
    .pos-coupon-browser__empty { padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; margin: 0; }
    .pos-coupon-browser__item { width: 100%; text-align: left; background: none; border: none; border-bottom: 1px solid #f1f5f9; padding: 10px 14px; cursor: pointer; display: block; transition: background .1s; }
    .pos-coupon-browser__item:hover:not(:disabled) { background: #f5f3ff; }
    .pos-coupon-browser__item:last-child { border-bottom: none; }
    .pos-coupon-browser__item--blocked { opacity: .45; cursor: not-allowed; }
    .pos-coupon-browser__row { display: flex; align-items: center; justify-content: space-between; }
    .pos-coupon-browser__code { font-size: 12px; font-weight: 800; color: #6366f1; letter-spacing: 0.5px; }
    .pos-coupon-browser__saving { font-size: 11px; font-weight: 800; color: #16a34a; background: #f0fdf4; border-radius: 4px; padding: 1px 6px; }
    .pos-coupon-browser__desc { font-size: 11px; color: #64748b; margin-top: 2px; }
    .pos-coupon-browser__scope { color: #22c55e; font-weight: 700; }
    .pos-coupon-browser__products { font-size: 10px; color: #94a3b8; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Payment Methods */
    .pos-payment-methods { display: flex; gap: 6px; padding: 8px 16px; border-top: 1px solid #f1f5f9; }
    .pos-payment-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 4px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 12px; font-weight: 700; cursor: pointer; }
    .pos-payment-btn.active { border-color: #6366f1; background: #eef2ff; color: #6366f1; }

    /* Tender Details */
    .pos-cash-tendered { padding: 8px 16px 12px; display: flex; flex-direction: column; gap: 6px; }
    .pos-cash-tendered label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .pos-cash-tendered input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 700; }
    .pos-change { font-size: 13px; color: #22c55e; font-weight: 600; }
    .pos-quick-amounts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .pos-quick-amounts button { padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 11px; font-weight: 600; cursor: pointer; color: #475569; }

    /* Split Tender */
    .pos-split-form { padding: 8px 16px 12px; display: flex; flex-direction: column; gap: 8px; }
    .pos-split-inputs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .pos-split-field label { display: block; font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 2px; }
    .pos-split-field input { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .pos-split-status { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-top: 1px solid #f1f5f9; }

    .pos-error { margin: 0 16px 8px; padding: 8px 12px; border-radius: 8px; background: #fee2e2; color: #dc2626; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }

    /* Checkout Actions */
    .pos-checkout-actions { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #e2e8f0; background: #fff; }
    .pos-clear-btn { padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .pos-clear-btn:hover:not(:disabled) { background: #f8fafc; color: #ef4444; border-color: #fca5a5; }
    .pos-checkout-btn { flex: 1; padding: 13px; border-radius: 10px; background: #6366f1; color: #fff; border: none; cursor: pointer; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background .18s; }
    .pos-checkout-btn:hover:not(:disabled) { background: #4f46e5; }
    .pos-checkout-btn:disabled { opacity: .6; cursor: not-allowed; }

    /* Shift & General Modals */
    .pos-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .pos-shift-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 420px; padding: 32px 28px; text-align: center; }
    .pos-shift-modal__icon { color: #6366f1; margin-bottom: 12px; display: flex; justify-content: center; }
    .pos-shift-modal h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px; }
    .pos-shift-modal p { color: #64748b; font-size: 14px; margin: 0 0 24px; }
    .pos-shift-modal__field { text-align: left; margin-bottom: 16px; }
    .pos-shift-modal__field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .pos-shift-modal__field select, .pos-shift-modal__field input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; }
    .pos-shift-modal__actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .pos-shift-btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; text-decoration: none; }
    .pos-shift-btn--primary { background: #6366f1; color: #fff; }
    .pos-shift-btn--primary:disabled { opacity: .6; cursor: not-allowed; }
    .pos-shift-btn--ghost { background: #f1f5f9; color: #374151; }
    .pos-shift-btn--danger { background: #ef4444; color: #fff; }

    /* Summary */
    .pos-summary-grid { text-align: left; margin: 16px 0 24px; background: #f8fafc; border-radius: 12px; overflow: hidden; }
    .pos-summary-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .pos-summary-row--total { background: #f1f5f9; font-weight: 700; font-size: 15px; }
    .pos-summary-row--warn { color: #f97316; }
    .pos-summary-row--ok { color: #22c55e; }

    /* Sale Complete Overlay */
    .pos-sale-complete { background: #fff; border-radius: 20px; width: 100%; max-width: 340px; padding: 36px 28px; text-align: center; }
    .pos-sale-complete__icon { color: #22c55e; display: flex; justify-content: center; margin-bottom: 14px; }
    .pos-sale-complete h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
    .pos-sale-complete__order { color: #94a3b8; font-size: 13px; margin: 0 0 16px; }
    .pos-sale-complete__total { font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 6px; letter-spacing: -1px; }
    .pos-sale-complete__change { font-size: 14px; color: #f97316; font-weight: 700; margin-bottom: 24px; }
    .pos-sale-complete__actions { display: flex; gap: 10px; justify-content: center; margin-top: 24px; }
    .pos-sale-complete__actions a { text-decoration: none; }

    /* Variant Picker Modal */
    .pos-variant-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 440px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
    .pos-variant-modal__head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .pos-variant-modal__head h3 { font-size: 16px; font-weight: 700; margin: 0 0 2px; }
    .pos-variant-modal__head p { font-size: 12px; color: #64748b; margin: 0; }
    .pos-variant-modal__head button { background: none; border: none; cursor: pointer; color: #94a3b8; }
    .pos-variant-modal__list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
    .pos-variant-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; cursor: pointer; text-align: left; transition: all .12s; }
    .pos-variant-item:hover:not(:disabled) { border-color: #6366f1; background: #f8fafc; }
    .pos-variant-item--out { opacity: .4; cursor: not-allowed; }
    .pos-variant-item__label { font-size: 14px; font-weight: 700; color: #1e293b; }
    .pos-variant-item__sku { font-size: 11px; color: #94a3b8; }
    .pos-variant-item__meta { text-align: right; }
    .pos-variant-item__price { font-size: 14px; font-weight: 800; color: #0f172a; }
    .pos-variant-item__stock { font-size: 11px; color: #64748b; font-weight: 600; }

    /* Held Orders Modal */
    .pos-held-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
    .pos-held-modal__head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
    .pos-held-modal__head h3 { font-size: 16px; font-weight: 700; margin: 0; }
    .pos-held-modal__head button { background: none; border: none; cursor: pointer; color: #94a3b8; }
    .pos-held-modal__list { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .pos-held-item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #fafafa; }
    .pos-held-item__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .pos-held-time { display: block; font-size: 11px; color: #94a3b8; }
    .pos-held-total { font-size: 16px; font-weight: 800; color: #0f172a; }
    .pos-held-summary { font-size: 12px; color: #64748b; margin: 0 0 12px; line-height: 1.4; }
    .pos-held-actions { display: flex; justify-content: flex-end; gap: 8px; }

    /* Shift Sales Drawer */
    .pos-sales-drawer { background: #fff; border-radius: 18px; width: 100%; max-width: 500px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
    .pos-sales-drawer__head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f1f5f9; }
    .pos-sales-drawer__head h3 { font-size: 16px; font-weight: 700; margin: 0 0 2px; }
    .pos-sales-drawer__head p { font-size: 12px; color: #64748b; margin: 0; }
    .pos-sales-drawer__head button { background: none; border: none; cursor: pointer; color: #94a3b8; }
    .pos-sales-drawer__content { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .pos-sale-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border: 1px solid #f1f5f9; border-radius: 10px; background: #f8fafc; }
    .pos-sale-item__main { display: flex; flex-direction: column; gap: 2px; }
    .pos-sale-item__num { font-size: 13px; font-weight: 700; color: #0f172a; }
    .pos-sale-item__time { font-size: 11px; color: #94a3b8; }
    .pos-sale-item__method { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6366f1; background: #eef2ff; padding: 2px 6px; border-radius: 4px; display: inline-block; width: fit-content; }
    .pos-sale-item__right { display: flex; align-items: center; gap: 12px; }
    .pos-sale-item__total { font-size: 15px; font-weight: 800; color: #0f172a; }
    .pos-reprint-btn { display: flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 6px; background: #fff; border: 1px solid #d1d5db; color: #374151; font-size: 11px; font-weight: 600; text-decoration: none; }
    .pos-reprint-btn:hover { background: #f1f5f9; }

    /* Customer Modal */
    .pos-customer-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 440px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
    .pos-customer-modal__head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #f1f5f9; }
    .pos-customer-modal__head h3 { font-size: 16px; font-weight: 700; margin: 0; }
    .pos-customer-modal__head button { background: none; border: none; cursor: pointer; color: #94a3b8; }
    .pos-customer-modal__tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
    .pos-customer-modal__tabs button { flex: 1; padding: 10px; font-size: 13px; font-weight: 600; border: none; background: none; cursor: pointer; color: #64748b; border-bottom: 2px solid transparent; }
    .pos-customer-modal__tabs button.active { color: #6366f1; border-bottom-color: #6366f1; }
    .pos-customer-modal__search { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    .pos-customer-modal__search input { border: none; outline: none; font-size: 14px; flex: 1; }
    .pos-customer-modal__list { flex: 1; overflow-y: auto; padding: 8px 0; }
    .pos-customer-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border: none; background: none; cursor: pointer; width: 100%; text-align: left; transition: background .15s; }
    .pos-customer-item:hover { background: #f8fafc; }
    .pos-customer-add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; color: #6366f1; font-weight: 600; font-size: 13px; border: none; background: none; cursor: pointer; width: 100%; }
    .pos-customer-add-form { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
    .pos-customer-add-form input { padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
    .pos-customer-walkin { margin: 8px 16px 16px; padding: 12px; border: 2px dashed #e2e8f0; border-radius: 10px; background: none; cursor: pointer; color: #64748b; font-size: 13px; font-weight: 500; }
    .pos-customer-walkin:hover { border-color: #94a3b8; }

    .pos-center { display: flex; align-items: center; justify-content: center; flex: 1; color: #94a3b8; }
    .spin { animation: spin .8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
