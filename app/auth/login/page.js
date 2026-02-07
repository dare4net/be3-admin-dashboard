"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: "", password: "", subdomain: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Clear previous session data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('permissions');
        localStorage.removeItem('refreshToken');

        try {
            // 1. Resolve Tenant
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

            // 2. Login
            const res = await api.post("/auth/login", {
                email: formData.email,
                password: formData.password
            });

            // Backend returns: { success, message, token, user, permissions, roles, allowedCategories, hasUnrestrictedCategoryAccess, refreshToken... }
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

            // RBAC Check
            if (!permissions || !permissions.includes('admin.access')) {
                throw new Error("Access Denied: You do not have permissions to access the Admin Dashboard.");
            }

            console.log('[Login] Received Tokens:', {
                hasAccessToken: !!token,
                hasRefreshToken: !!refreshToken,
                refreshTokenLength: refreshToken ? refreshToken.length : 0,
                permissionsCount: permissions.length,
                rolesCount: roles.length,
                hasUnrestrictedCategoryAccess
            });

            localStorage.removeItem('temp_tenant_id'); // Cleanup
            login(token, user, permissions, roles, allowedCategories, hasUnrestrictedCategoryAccess, refreshToken);
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-2">Admin Dashboard</h1>
                <p className="text-gray-600 text-center mb-8">Sign in to your store</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Store Subdomain
                        </label>
                        <div className="flex rounded-md shadow-sm">
                            <input
                                type="text"
                                required
                                className="flex-1 min-w-0 block w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="my-store"
                                value={formData.subdomain}
                                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                .yourplatform.com
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
