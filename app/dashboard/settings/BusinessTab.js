"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Save, Loader2, Building2, LayoutText, Smartphone, Globe } from "lucide-react";
import ImageUploader from "@/components/config/ImageUploader";
import LocationManagement from "./LocationManagement";
import { cn } from "@/lib/utils";

export default function BusinessTab({ user, onUpdate }) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        business_name: user?.business_name || "",
        business_thumbnail: user?.business_thumbnail || "",
        business_backdrop: user?.business_backdrop || "",
        checkout_style: user?.checkout_style || "inhouse",
        whatsapp_phone: user?.whatsapp_phone || ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.patch("/auth/me", {
                business_name: formData.business_name,
                business_thumbnail: formData.business_thumbnail,
                business_backdrop: formData.business_backdrop,
                checkout_style: formData.checkout_style,
                whatsapp_phone: formData.whatsapp_phone
            });
            if (res.data.success) {
                onUpdate(res.data.user);
                alert("Business settings updated!");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update business settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Profile Configuration</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Business Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                                    placeholder="e.g. Acme Corporation"
                                    required
                                />
                                <p className="text-[10px] font-medium text-gray-400">
                                    This updates your global brand identity across all storefronts.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Storefront Checkout</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Transaction Protocol
                                        </label>
                                        <select
                                            value={formData.checkout_style}
                                            onChange={(e) => setFormData({ ...formData, checkout_style: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none"
                                        >
                                            <option value="inhouse">In-house (Standard Gateway)</option>
                                            <option value="whatsapp">WhatsApp (Direct Conversational)</option>
                                        </select>
                                    </div>

                                    {formData.checkout_style === "whatsapp" && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                WhatsApp Protocol Number
                                            </label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="2348012345678"
                                                    value={formData.whatsapp_phone}
                                                    onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-mono focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-[10px] font-medium text-gray-400">
                                                Country code only (e.g. 234...). No "+" or spaces.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Media Assets */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Branding Assets</label>

                                <div className="space-y-6">
                                    <div className="group">
                                        <ImageUploader
                                            label="Primary Logo (1:1 / 16:9)"
                                            value={formData.business_thumbnail}
                                            onChange={(url) => setFormData({ ...formData, business_thumbnail: url })}
                                            aspectRatio="16/9"
                                            folder="businesses"
                                        />
                                    </div>

                                    <div className="group">
                                        <ImageUploader
                                            label="Storefront Hero Backdrop (21:9)"
                                            value={formData.business_backdrop}
                                            onChange={(url) => setFormData({ ...formData, business_backdrop: url })}
                                            aspectRatio="21/9"
                                            folder="businesses"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-none"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Update Business Profile
                        </button>
                    </div>
                </form>
            </div>

            <LocationManagement userId={user?.id} />
        </div>
    );
}
