"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Save, Loader2, Store, LayoutTemplate } from "lucide-react";
import Link from 'next/link';
import RolesTab from "./RolesTab";
import UsersTab from "./UsersTab";

export default function SettingsPage() {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        subdomain: ""
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
                window.location.reload();
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
                setProfileForm(prev => ({ ...prev, password: "" })); // Clear password
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
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Store className="w-6 h-6" />
                Settings
            </h1>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                <button
                    onClick={() => setActiveTab("store")}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-gray-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === "store" ? "bg-white shadow" : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
                        }`}
                >
                    Store Settings
                </button>
                <button
                    onClick={() => setActiveTab("roles")}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-gray-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === "roles" ? "bg-white shadow" : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
                        }`}
                >
                    Roles
                </button>
                <button
                    onClick={() => setActiveTab("users")}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-gray-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === "users" ? "bg-white shadow" : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
                        }`}
                >
                    Users & Access
                </button>
            </div>

            {activeTab === "store" ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleStoreSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Store Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">This validation name appears in your storefront header.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subdomain
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg text-gray-500">
                                <span className="font-medium text-gray-900">{formData.subdomain}</span>
                                <span>.yourplatform.com</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Subdomains cannot be changed after creation.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Font Family
                            </label>
                            <select
                                value={formData.font_family || 'Inter'}
                                onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            >
                                <option value="Inter">Inter (Default)</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Lato">Lato</option>
                                <option value="Raleway">Raleway</option>
                                <option value="Montserrat">Montserrat</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Select the primary font for your storefront.</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <Link
                                href="/dashboard/storefront/layouts"
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                <LayoutTemplate className="w-4 h-4" />
                                Manage Layouts
                            </Link>

                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            ) : activeTab === "roles" ? (
                <RolesTab />
            ) : activeTab === "users" ? (
                <UsersTab />
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={profileForm.first_name}
                                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={profileForm.last_name}
                                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div >

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name (for Vendors)</label>
                            <input
                                type="text"
                                value={profileForm.business_name}
                                onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Your business or vendor identity"
                            />
                            <p className="text-xs text-gray-500 mt-1">This name will be used for your product collections and tags.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={profileForm.password}
                                onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Leave blank to keep current password"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Update Profile
                            </button>
                        </div>
                    </form >
                </div >
            )
            }

            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 text-red-600">Danger Zone</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Once you delete your store, there is no going back. Please be certain.
                </p>
                <button disabled className="px-4 py-2 border border-red-200 text-red-600 rounded-lg bg-red-50 opacity-50 cursor-not-allowed">
                    Delete Store (Coming Soon)
                </button>
            </div>
        </div >
    );
}
