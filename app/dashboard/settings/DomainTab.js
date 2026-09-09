"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Globe, CheckCircle2, AlertCircle, RefreshCw, Loader2, ArrowRight, ShieldCheck, Copy, ExternalLink } from "lucide-react";

export default function DomainTab({ tenant, onUpdateTenant }) {
    const [domain, setDomain] = useState(tenant?.domain || "");
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "be3.shop";
    const targetCname = `${tenant?.subdomain || "yourstore"}.${platformDomain}`;

    const handleSaveDomain = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setVerificationResult(null);

        try {
            const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
            const res = await api.patch("/tenants/current", { domain: cleanDomain });
            if (res.data.success) {
                onUpdateTenant(res.data.tenant);
                setDomain(res.data.tenant.domain || "");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save domain configuration");
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyDns = async () => {
        setVerifying(true);
        setError("");

        try {
            const res = await api.post("/tenants/current/domain/verify", { domain });
            setVerificationResult(res.data);
        } catch (err) {
            setVerificationResult(err.response?.data || { verified: false, message: "DNS verification request failed" });
        } finally {
            setVerifying(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Standard Subdomain Info Box */}
            <div className="bg-white rounded-lg border border-gray-100 p-6 overflow-hidden">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Platform Default Subdomain</h2>
                            <span className="px-2 py-0.5 bg-green-50 border border-green-100 text-green-700 text-[9px] font-bold rounded-full">Active</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Your store is accessible right now on your allocated platform URL:</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <span className="text-xs font-mono font-bold text-gray-900">
                        https://{tenant?.subdomain}.{platformDomain}
                    </span>
                    <a
                        href={`https://${tenant?.subdomain}.${platformDomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-wider hover:underline"
                    >
                        Visit Store <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* Custom Domain Configuration Card */}
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div>
                        <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Custom Domain Mapping</h2>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Connect your custom web address (e.g., store.yourbrand.com)</p>
                    </div>
                    <Globe className="w-5 h-5 text-gray-400" />
                </div>

                <form onSubmit={handleSaveDomain} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Domain URL</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                placeholder="e.g., shop.yourbrand.com"
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300"
                            />
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Domain"}
                            </button>
                        </div>
                        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">
                            Do not include http:// or https://. Just the hostname.
                        </p>
                    </div>
                </form>

                {/* DNS Setup Guide */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Required DNS CNAME Record</h3>
                    <p className="text-xs text-gray-500 font-medium">
                        Log in to your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.) and create the following DNS record:
                    </p>

                    <div className="bg-white border border-gray-100 rounded-lg p-4 font-mono text-xs space-y-3">
                        <div className="grid grid-cols-3 gap-2 pb-2 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            <span>Type</span>
                            <span>Name / Host</span>
                            <span>Points To / Value</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center text-gray-900 font-bold">
                            <span className="text-blue-600">CNAME</span>
                            <span>{domain ? domain.split('.')[0] : "subdomain"}</span>
                            <div className="flex items-center gap-2">
                                <span className="truncate">{targetCname}</span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(targetCname)}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Copy target CNAME"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                                {copied && <span className="text-[9px] text-green-600 font-sans">Copied!</span>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleVerifyDns}
                            disabled={verifying || !tenant?.domain}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Querying DNS...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>Verify DNS Connection</span>
                                </>
                            )}
                        </button>

                        {tenant?.domain && (
                            <span className="text-[10px] text-gray-400 font-mono">Target: {tenant.domain}</span>
                        )}
                    </div>

                    {/* Verification Result Banner */}
                    {verificationResult && (
                        <div className={`p-4 rounded-lg border text-xs flex items-start gap-3 animate-in fade-in duration-300 ${verificationResult.verified
                                ? "bg-green-50 border-green-100 text-green-800"
                                : "bg-amber-50 border-amber-100 text-amber-800"
                            }`}>
                            {verificationResult.verified ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1">
                                <p className="font-bold text-xs">
                                    {verificationResult.verified ? "DNS Connection Live!" : "DNS Verification Pending"}
                                </p>
                                <p className="text-[11px] leading-relaxed opacity-90">{verificationResult.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
