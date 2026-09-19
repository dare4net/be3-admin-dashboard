"use client";

import React, { useState, useEffect } from "react";

export default function BrandedLoading({ message = "Initializing workspace..." }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Slower more steady increment
                return prev + Math.floor(Math.random() * 5) + 2;
            });
        }, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#2563eb] overflow-hidden">
            {/* Geometric Pattern Background */}
            <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="swiggle" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M0 50 Q 25 25, 50 50 T 100 50" fill="none" stroke="white" strokeWidth="2" />
                            <path d="M0 20 Q 25 45, 50 20 T 100 20" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
                            <path d="M0 80 Q 25 55, 50 80 T 100 80" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#swiggle)" />
                </svg>
            </div>

            {/* Central White Card */}
            <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-700">
                <div className="bg-white px-12 py-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center">
                    <h1 className="text-7xl font-[1000] text-[#2563eb] tracking-tighter leading-none">Be3</h1>
                </div>
                <p className="text-white/80 font-bold tracking-[0.2em] uppercase text-[10px]">Multi-store platform</p>
            </div>

            {/* Bottom Loader */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 flex flex-col items-center gap-3">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase opacity-80">
                    <span>{progress}%</span>
                    <span className="animate-pulse">Loading Workspace</span>
                </div>
            </div>
        </div>
    );
}
