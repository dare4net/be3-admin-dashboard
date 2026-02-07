"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Save, Loader2, Building2 } from "lucide-react";
import ImageUploader from "@/components/config/ImageUploader";

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
                alert("Business settings updated! Your collection will be synchronized automatically.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update business settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Business Settings
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                    </label>
                    <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Your business name"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Changing this will update your product collection name, slug, and tags.
                    </p>
                </div>

                <div>
                    <ImageUploader
                        label="Business Thumbnail / Logo"
                        value={formData.business_thumbnail}
                        onChange={(url) => setFormData({ ...formData, business_thumbnail: url })}
                        aspectRatio="16/9"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This image will be used as the logo for your vendor collection.
                    </p>
                </div>

                <div>
                    <ImageUploader
                        label="Storefront Backdrop"
                        value={formData.business_backdrop}
                        onChange={(url) => setFormData({ ...formData, business_backdrop: url })}
                        aspectRatio="21/9"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This image will be used as the hero backdrop for your storefront collection.
                    </p>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4 text-[16px]">Checkout Settings</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Checkout Style
                            </label>
                            <select
                                value={formData.checkout_style}
                                onChange={(e) => setFormData({ ...formData, checkout_style: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="inhouse">In-house (Standard Payment)</option>
                                <option value="whatsapp">WhatsApp (Direct Chat)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Choose how you want customers to complete their purchases.
                            </p>
                        </div>

                        {formData.checkout_style === "whatsapp" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    WhatsApp Phone Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., 2348012345678"
                                    value={formData.whatsapp_phone}
                                    onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Include country code without + or spaces.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Business Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
