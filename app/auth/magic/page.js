"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/components/providers/AuthContext";

export default function AdminMagicLinkPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login, setGlobalLoading } = useAuth();
    const token = searchParams.get("token");

    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [error, setError] = useState("");

    const handleProceed = async () => {
        if (!token) {
            setStatus("error");
            setError("No token found in link. Please request a new one from WhatsApp.");
            return;
        }

        setStatus("loading");
        setGlobalLoading(true);

        try {
            // Include tenant ID from env if needed for /consume
            const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
            const headers = tenantId ? { "X-Tenant-ID": tenantId } : {};

            const res = await api.post("/wa-auth/magic/consume", { token }, { headers });

            if (!res.data?.success) {
                setStatus("error");
                setError(
                    res.data?.reason === "invalid_or_expired"
                        ? "This link has expired or already been used. Please request a new one from WhatsApp."
                        : "Something went wrong. Please try again."
                );
                return;
            }

            const { jwt, destination = "/", metadata } = res.data;

            // Set the JWT locally to fetch full user details including permissions
            localStorage.setItem("token", jwt);
            api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;

            // Fetch full profile from /auth/me for admin dashboard hydration
            const meRes = await api.get("/auth/me");
            const fullUser = meRes.data.user || meRes.data;
            const permissions = meRes.data.permissions || [];
            const roles = meRes.data.roles || [];
            const allowedCategories = meRes.data.allowedCategories || [];
            const hasUnrestrictedCategoryAccess = meRes.data.hasUnrestrictedCategoryAccess !== undefined
                ? meRes.data.hasUnrestrictedCategoryAccess
                : true;

            // Optional: Store metadata securely
            if (metadata?.source === 'wa_tools') {
                sessionStorage.setItem("wa_tools_origin", "true");
            }

            // Hydrate the dashboard provider
            login(jwt, fullUser, permissions, roles, allowedCategories, hasUnrestrictedCategoryAccess);

            setStatus("success");

            // Redirect using the destination embedded in the magic link
            setTimeout(() => router.push(destination), 1000);

        } catch (err) {
            console.error("Magic link verification error:", err);
            setStatus("error");
            setError(
                err.response?.data?.reason === "invalid_or_expired"
                    ? "This link has expired or already been used."
                    : "Could not verify your link. Please check your connection and try again."
            );
        } finally {
            setGlobalLoading(false);
        }
    };

    const icon = status === "success"
        ? <CheckCircle className="w-8 h-8 text-green-500" />
        : status === "error"
            ? <XCircle className="w-8 h-8 text-red-500" />
            : <MessageCircle className="w-8 h-8 text-green-500" />;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm text-center">

                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
                    {icon}
                </div>

                <h1 className="text-lg font-bold text-gray-900 mb-1">
                    {status === "success"
                        ? "Authentication Successful ✅"
                        : status === "error"
                            ? "Link Invalid"
                            : "WhatsApp Secure Sign-In"}
                </h1>

                <p className="text-sm text-gray-500 mb-6">
                    {status === "success"
                        ? "Redirecting you to the dashboard…"
                        : status === "error"
                            ? error
                            : "Tap the button below to securely enter your dashboard via WhatsApp."}
                </p>

                {status === "idle" && (
                    <button
                        onClick={handleProceed}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md shadow-blue-500/10"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Enter Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}

                {status === "loading" && (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                )}

                {status === "error" && (
                    <a
                        href="/auth/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Go to Standard Login
                    </a>
                )}
            </div>
        </div>
    );
}
