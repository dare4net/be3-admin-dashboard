"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { LayoutTemplate, Plus, Check, Loader2, Copy, AlertCircle } from "lucide-react";
import Link from 'next/link';

export default function LayoutsPage() {
    const [layouts, setLayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of layout being acted on
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newLayoutName, setNewLayoutName] = useState("");
    const [cloneFromId, setCloneFromId] = useState(""); // "" means start empty

    useEffect(() => {
        fetchLayouts();
    }, []);

    const fetchLayouts = async () => {
        try {
            const res = await api.get("/page-builder/layouts");
            if (res.data.success) {
                setLayouts(res.data.layouts);
            }
        } catch (err) {
            console.error("Failed to fetch layouts", err);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (layoutId) => {
        if (!confirm("Are you sure you want to activate this layout? This will instantly change your live storefront.")) return;

        setActionLoading(layoutId);
        try {
            const res = await api.post(`/page-builder/layouts/${layoutId}/activate`);
            if (res.data.success) {
                // Refresh list or manually update local state
                setLayouts(prev => prev.map(l => ({
                    ...l,
                    is_active: l.id === layoutId
                })));
                alert("Layout activated!");
            }
        } catch (err) {
            console.error("Failed to activate layout", err);
            alert("Failed to activate layout");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newLayoutName.trim()) return;

        setActionLoading("create");
        try {
            const payload = {
                name: newLayoutName,
                description: `Created on ${new Date().toLocaleDateString()}`
            };

            if (cloneFromId) {
                payload.clone_from_layout_id = cloneFromId;
            }

            const res = await api.post("/page-builder/layouts", payload);
            if (res.data.success) {
                setLayouts([res.data.layout, ...layouts]);
                setShowCreateModal(false);
                setNewLayoutName("");
                setCloneFromId("");
                alert("Layout created!");
            }
        } catch (err) {
            console.error("Failed to create layout", err);
            alert("Failed to create layout");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <LayoutTemplate className="w-6 h-6" />
                        Store Layouts
                    </h1>
                    <p className="text-gray-500 mt-1">Manage different versions of your storefront.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    New Layout
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {layouts.map((layout) => (
                    <div
                        key={layout.id}
                        className={`relative group bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ${layout.is_active
                            ? "border-blue-500 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                    >
                        {layout.is_active && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                ACTIVE
                            </div>
                        )}

                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{layout.name}</h3>
                            <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                                {layout.description || "No description provided."}
                            </p>

                            <div className="flex flex-col gap-3">
                                {!layout.is_active ? (
                                    <button
                                        onClick={() => handleActivate(layout.id)}
                                        disabled={actionLoading === layout.id}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                                    >
                                        {actionLoading === layout.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            "Activate"
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-full text-center py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm border border-blue-100">
                                        Currently Live
                                    </div>
                                )}

                                <Link
                                    href={`/dashboard/storefront/builder?layoutId=${layout.id}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-colors"
                                >
                                    Edit Content
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Create New Layout</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Layout Name</label>
                                <input
                                    type="text"
                                    value={newLayoutName}
                                    onChange={(e) => setNewLayoutName(e.target.value)}
                                    placeholder="e.g. Summer Sale 2026"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start From (Optional)</label>
                                <select
                                    value={cloneFromId}
                                    onChange={(e) => setCloneFromId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">Empty Layout</option>
                                    <option disabled>--- Clone Existing ---</option>
                                    {layouts.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Copy className="w-3 h-3" />
                                    Cloning will copy all current widgets to the new layout.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newLayoutName.trim() || actionLoading === "create"}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                                >
                                    {actionLoading === "create" && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Layout
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
