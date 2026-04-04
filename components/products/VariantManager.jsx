"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
    Plus, Trash2, Edit3, Loader2, Save,
    AlertCircle, CheckCircle2, ChevronRight,
    Package, Tag, DollarSign, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VariantManager({ productId, categoryId }) {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);

    // Form for new variant
    const [newVariant, setNewVariant] = useState({
        variant_label: "",
        sku: "",
        price: "",
        status: "active"
    });

    useEffect(() => {
        if (productId) fetchVariants();
    }, [productId]);

    const fetchVariants = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/products/${productId}/variants`);
            if (res.data.success) {
                setVariants(res.data.variants);
            }
        } catch (err) {
            setError("Failed to load variants");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVariant = async (e) => {
        e.preventDefault();
        if (!newVariant.variant_label || !newVariant.sku || !newVariant.price) {
            setError("Please fill in all required fields");
            return;
        }

        setCreating(true);
        setError(null);
        try {
            const res = await api.post("/products", {
                ...newVariant,
                parent_id: productId,
                category_id: categoryId,
                category_ids: categoryId ? [categoryId] : [],
                status: "active",
                price: parseFloat(newVariant.price)
            });

            if (res.data.success) {
                setVariants([...variants, res.data.product]);
                setNewVariant({ variant_label: "", sku: "", price: "", status: "active" });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create variant");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteVariant = async (vid) => {
        if (!confirm("Are you sure you want to delete this variant?")) return;

        setDeletingId(vid);
        try {
            await api.delete(`/products/${vid}`);
            setVariants(variants.filter(v => v.id !== vid));
        } catch (err) {
            setError("Failed to delete variant");
        } finally {
            setDeletingId(null);
        }
    };

    const generateSKU = () => {
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        setNewVariant(prev => ({ ...prev, sku: `VAR-${random}` }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Variation Library...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex items-center justify-between p-6 bg-blue-50/30 border border-blue-100/50 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-blue-50 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Active Variations</h3>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{variants.length} configurations linked to parent</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-600">
                        <Plus className="w-4 h-4 rotate-45" />
                    </button>
                </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleCreateVariant} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Create New Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Variant Label</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                            placeholder="e.g. 16GB / 512GB"
                            value={newVariant.variant_label}
                            onChange={(e) => setNewVariant({ ...newVariant, variant_label: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Variant SKU</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-mono focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                value={newVariant.sku}
                                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value.toUpperCase() })}
                            />
                            <button
                                type="button"
                                onClick={generateSKU}
                                className="absolute right-1 top-1 p-1.5 bg-white border border-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <Plus className="w-3 h-3 text-blue-600" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Delta Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            value={newVariant.price}
                            onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full h-[40px] bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3" /> Link Variant</>}
                    </button>
                </div>
            </form>

            {/* Variants List */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Configuration</th>
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">SKU Identity</th>
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Price Point</th>
                            <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Link Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {variants.map(v => (
                            <tr key={v.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-white transition-colors">
                                            <Package className="w-4 h-4 text-gray-300" />
                                        </div>
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{v.variant_label || v.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{v.sku}</td>
                                <td className="px-6 py-4 font-black text-xs text-blue-600">${v.price}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => window.open(`/dashboard/products/${v.id}/edit`, '_blank')}
                                            className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Edit full variant details"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteVariant(v.id)}
                                            disabled={deletingId === v.id}
                                            className="p-2 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            {deletingId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {variants.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center grayscale opacity-30">
                                    <Package className="w-8 h-8 mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest italic">No Variations mapped to this parent</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
