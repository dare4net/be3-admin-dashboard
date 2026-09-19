"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { Mail, Lock, Globe, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const { login, setGlobalLoading } = useAuth();
    const [formData, setFormData] = useState({ email: "", password: "", subdomain: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalLoading(true);
        setError("");

        try {
            if (!formData.subdomain) {
                throw new Error("Please enter your store subdomain");
            }

            let tenantId = null;
            try {
                const lookupRes = await api.get(`/tenants/lookup?subdomain=${formData.subdomain}`);
                if (lookupRes.data.success) {
                    tenantId = lookupRes.data.tenant.id;
                    localStorage.setItem('temp_tenant_id', tenantId);
                }
            } catch (lookupErr) {
                throw new Error("Store not found with that subdomain");
            }

            const res = await api.post("/auth/login", {
                email: formData.email,
                password: formData.password
            });

            const token = res.data.token || res.data.accessToken;
            const user = res.data.user;
            const permissions = res.data.permissions || [];
            const roles = res.data.roles || [];
            const allowedCategories = res.data.allowedCategories || [];
            const hasUnrestrictedCategoryAccess = res.data.hasUnrestrictedCategoryAccess !== undefined
                ? res.data.hasUnrestrictedCategoryAccess
                : true;
            const refreshToken = res.data.refreshToken;

            if (!token || !user) {
                throw new Error("Invalid response from server");
            }

            if (!permissions || !permissions.includes('admin.access')) {
                throw new Error("Access Denied: You do not have permissions to access the Admin Dashboard.");
            }

            localStorage.removeItem('temp_tenant_id');
            login(token, user, permissions, roles, allowedCategories, hasUnrestrictedCategoryAccess, refreshToken);
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Login</h1>
                <p className="text-gray-500 text-xs font-medium mt-1">Manage your store dashboard</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 animate-in shake duration-500">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-[11px] font-bold tracking-tight">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Subdomain
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                            <Globe size={16} />
                        </div>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                            placeholder="my-store"
                            value={formData.subdomain}
                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                        />
                        <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none">
                            <span className="text-[10px] font-bold text-gray-300">.be3.com</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                        Email
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                            <Mail size={16} />
                        </div>
                        <input
                            type="email"
                            required
                            className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                            placeholder="admin@store.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Password
                        </label>
                        <Link href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            Forgot?
                        </Link>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                            <Lock size={16} />
                        </div>
                        <input
                            type="password"
                            required
                            className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-500/5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Authenticating...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-sm">Sign In</span>
                            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-50 text-center">
                <p className="text-gray-500 text-[11px] font-medium">
                    New store?{" "}
                    <Link href="/auth/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                        Launch now
                    </Link>
                </p>
            </div>
        </div>
    );
}
