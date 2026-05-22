"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { User, Mail, Lock, Building2, Globe, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        companyName: "",
        subdomain: "",
        name: "",
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/signup", formData);

            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setSuccess(true);

            setTimeout(() => {
                router.push("/dashboard");
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-4 animate-in zoom-in-95 duration-500">
                <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center text-green-600 shadow-md shadow-green-500/5">
                        <CheckCircle2 size={32} className="animate-in scale-110 duration-700 delay-150" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Success!</h2>
                <p className="text-gray-500 text-xs font-medium">Workspace is ready.</p>
                <div className="mt-6 flex justify-center">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register</h1>
                <p className="text-gray-500 text-xs font-medium mt-1">Start your store in seconds</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 animate-in shake duration-500">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-[11px] font-bold tracking-tight">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                            placeholder="Nexus Gear"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Subdomain</label>
                        <input
                            type="text"
                            required
                            pattern="[a-z0-9-]+"
                            className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-xs rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                            placeholder="nexus"
                            value={formData.subdomain}
                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-xs rounded-xl py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-xs rounded-xl py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                    <input
                        type="password"
                        required
                        minLength={8}
                        className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-xs rounded-xl py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-300"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-500/5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Building...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-sm">Create Store</span>
                            <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-50 text-center">
                <p className="text-gray-500 text-[11px] font-medium">
                    Already an admin?{" "}
                    <Link href="/auth/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
