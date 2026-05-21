"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Save, Loader2, Store, LayoutTemplate, Shield, Users, Settings as SettingsIcon, MapPin, Globe } from "lucide-react";
import Link from 'next/link';
import RolesTab from "./RolesTab";
import UsersTab from "./UsersTab";
import MasterTopologyTab from "./MasterTopologyTab";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subdomain: "",
        font_family: "Inter"
    });
    const [activeTab, setActiveTab] = useState("store");
    const [user, setUser] = useState(null);
    const [profileForm, setProfileForm] = useState({
        first_name: "",
        last_name: "",
        business_name: "",
        password: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tenantRes, userRes] = await Promise.all([
                api.get("/tenants/current"),
                api.get("/auth/me")
            ]);

            if (tenantRes.data.success) {
                setTenant(tenantRes.data.tenant);
                setFormData({
                    name: tenantRes.data.tenant.name,
                    subdomain: tenantRes.data.tenant.subdomain,
                    font_family: tenantRes.data.tenant.settings?.font_family || 'Inter'
                });
            }

            if (userRes.data.success) {
                setUser(userRes.data.user);
                setProfileForm({
                    first_name: userRes.data.user.first_name || "",
                    last_name: userRes.data.user.last_name || "",
                    business_name: userRes.data.user.business_name || "",
                    password: ""
                });
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStoreSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.patch("/tenants/current", {
                name: formData.name,
                settings: {
                    ...tenant.settings,
                    font_family: formData.font_family
                }
            });
            if (res.data.success) {
                setTenant(res.data.tenant);
                alert("Store settings updated!");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update store settings");
        } finally {
            setSaving(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updateData = {
                first_name: profileForm.first_name,
                last_name: profileForm.last_name,
                business_name: profileForm.business_name
            };
            if (profileForm.password) {
                updateData.password = profileForm.password;
            }

            const res = await api.patch("/auth/me", updateData);
            if (res.data.success) {
                setUser(res.data.user);
                setProfileForm(prev => ({ ...prev, password: "" }));
                alert("Profile updated!");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] grayscale opacity-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Configuration...</p>
            </div>
        );
    }

    const tabs = [
        { id: "store", label: "Store Identity", icon: Store },
        { id: "roles", label: "Security Roles", icon: Shield },
        { id: "users", label: "Staff & Access", icon: Users },
        { id: "topology", label: "Master Topology", icon: Globe },
        { id: "profile", label: "My Profile", icon: SettingsIcon },
    ];

    return (
        <div className="w-full space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SettingsIcon className="w-6 h-6 text-gray-900" />
                    <h1 className="text-2xl font-black text-gray-900">Settings</h1>
                </div>
            </div>

            {/* Horizontal Scrollable Tabs on Mobile */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <div className="flex space-x-2 bg-gray-100/50 p-1 rounded-lg border border-gray-100 min-w-full md:min-w-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-white text-blue-600 rounded shadow-none border border-gray-100"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === "store" && (
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Global Instance Configuration</h2>
                        </div>
                        <form onSubmit={handleStoreSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Store Registry Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                        required
                                    />
                                    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">Public branding label for headers and invoices.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Allocated Subdomain</label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-xs font-mono text-gray-500">
                                        <span className="font-black text-gray-900">{formData.subdomain}</span>
                                        <span>.be3.app</span>
                                    </div>
                                    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter italic">Immutable system identifier.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Aesthetic Typography</label>
                                    <select
                                        value={formData.font_family || 'Inter'}
                                        onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none bg-white"
                                    >
                                        <option value="Inter">Inter (System Default)</option>
                                        <option value="Manrope">Manrope (Clean Geometric)</option>
                                        <option value="Outfit">Outfit (Product Modern)</option>
                                        <option value="Montserrat">Montserrat (Classic Geometric)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                <Link
                                    href="/dashboard/storefront/layouts"
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-all"
                                >
                                    Manage Layouts
                                </Link>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Sync Store Settings
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "roles" && <RolesTab />}
                {activeTab === "users" && <UsersTab />}
                {activeTab === "topology" && <MasterTopologyTab />}

                {activeTab === "profile" && (
                    <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Personal Identification Context</h2>
                        </div>
                        <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Login Credentials (Email)</label>
                                    <input
                                        type="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-lg text-sm font-mono text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Reset Security Pin (Password)</label>
                                    <input
                                        type="password"
                                        value={profileForm.password}
                                        onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Leave empty to maintain status quo"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Commit Profile Updates
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Danger Zone Refinement */}
            <div className="p-6 bg-red-50/30 rounded-lg border border-red-100">
                <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Destructive Operations Zone</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-4">
                    Permanent deletion of this instance. IRREVERSIBLE ACTION.
                </p>
                <button disabled className="px-6 py-2.5 border border-red-200 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white opacity-50 cursor-not-allowed transition-all">
                    Initiate Instance Purge (In Development)
                </button>
            </div>
        </div>
    );
}
