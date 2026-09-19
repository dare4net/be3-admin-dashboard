"use client";

import React from "react";

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#f8fafc] p-4 sm:p-6">
            {/* Subtle Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
                {/* Flat Minimalist Card */}
                <div className="w-full bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border-t-gray-50 flex flex-col items-stretch">
                    {children}
                </div>

                {/* Compact Footer */}
                <div className="mt-8">
                    <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-widest text-center">
                        &copy; {new Date().getFullYear()} Be3 eCommerce
                    </p>
                </div>
            </div>
        </div>
    );
}
