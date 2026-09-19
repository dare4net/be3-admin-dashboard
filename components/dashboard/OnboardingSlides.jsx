"use client";

import React, { useState } from "react";
import { X, ChevronRight, ChevronLeft, Building2, Package, ShoppingCart, BarChart3, Rocket, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
    {
        title: "Welcome to Be3 Admin",
        description: "Your all-in-one command center for e-commerce excellence. Let's take a quick look at what you can do.",
        icon: Building2,
        color: "blue",
    },
    {
        title: "Manage Your Catalog",
        description: "Add products, create collections, and organize categories with ease using our advanced catalog tools.",
        icon: Package,
        color: "blue",
    },
    {
        title: "Track Your Sales",
        description: "Monitor orders in real-time and get deep insights into your business performance and customer trends.",
        icon: ShoppingCart,
        color: "blue",
    },
    {
        title: "Powerful Analytics",
        description: "Visualize your growth with beautiful charts and actionable data points to help you scale faster.",
        icon: BarChart3,
        color: "blue",
    },
    {
        title: "Ready to Launch?",
        description: "Your store is pre-configured and ready for your first product. Let's start building your empire!",
        icon: Rocket,
        color: "blue",
    },
];

export default function OnboardingSlides({ isOpen, onClose, onComplete }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    if (!isOpen) return null;

    const slide = SLIDES[currentSlide];
    const isLastSlide = currentSlide === SLIDES.length - 1;

    const next = () => {
        if (isLastSlide) {
            onComplete();
        } else {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const prev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSkip} />

            <div className="relative w-full max-w-[480px] bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 transform sm:scale-100 scale-[0.85]">
                {/* Minimalist Graphic Area */}
                <div className="h-44 flex items-center justify-center bg-gray-50 border-b border-gray-100">
                    <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm text-blue-600">
                        <slide.icon size={48} className="animate-in slide-in-from-bottom-2 duration-500" />
                    </div>
                </div>

                <div className="p-8 sm:p-10 text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{slide.title}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                        {slide.description}
                    </p>

                    {/* Minimalist Progress Indicators */}
                    <div className="flex justify-center gap-2 mb-8">
                        {SLIDES.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-300",
                                    i === currentSlide ? "w-8 bg-blue-600" : "w-1 bg-gray-200"
                                )}
                            />
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={prev}
                                disabled={currentSlide === 0}
                                className="p-2 text-gray-400 hover:text-gray-900 disabled:opacity-0 transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <button
                                onClick={handleSkip}
                                className="px-3 py-1.5 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-all"
                            >
                                Skip
                            </button>
                        </div>

                        <button
                            onClick={next}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/10"
                        >
                            {isLastSlide ? "Get Started" : "Next"}
                            {!isLastSlide && <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
