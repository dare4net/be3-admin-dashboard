"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, HelpCircle, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    {
        targetId: "sidebar-dashboard",
        title: "Main Dashboard",
        content: "This is your primary overview. Get high-level insights and a snapshot of your entire store's health at a glance.",
        placement: "right",
    },
    {
        targetId: "sidebar-business",
        title: "Business Profile",
        content: "Configure your store details, business information, and legal settings here. Keep this up-to-date for your customers.",
        placement: "right",
    },
    {
        targetId: "sidebar-catalog",
        title: "Catalog Management",
        content: "Manage your products, categories, and collections. This is where the magic happens for your inventory.",
        placement: "right",
    },
    {
        targetId: "sidebar-orders",
        title: "Order Control",
        content: "Handle incoming orders, manage fulfillment, and keep track of your shipping status for every customer.",
        placement: "right",
    },
    {
        targetId: "sidebar-sales",
        title: "Sales Insights",
        content: "Deep dive into your sales performance. Monitor trends, customer behavior, and regional success metrics.",
        placement: "right",
    },
    {
        targetId: "sidebar-analytics",
        title: "Revenue Analytics",
        content: "Advanced visual reports for your revenue growth. Use our built-in charts to forecast your business trajectory.",
        placement: "right",
    },
    {
        targetId: "sidebar-storefront",
        title: "Storefront Design",
        content: "Customize your public store view. Edit layouts, banners, and menus to perfectly reflect your brand identity.",
        placement: "right",
    },
    {
        targetId: "period-selector",
        title: "Timeframe Selection",
        content: "Swiftly filter your data across different time periods. Switch between Today, 7D, or even custom ranges.",
        placement: "bottom",
    },
    {
        targetId: "stats-grid",
        title: "Real-time Metrics",
        content: "Track your core KPIs: Revenue, Order count, and Conversion rate. These are updated instantly as sales occur.",
        placement: "top",
    },
    {
        targetId: "user-profile",
        title: "Account & Security",
        content: "Manage your administrator profile, update security settings, or logout securely from your workspace.",
        placement: "top",
    },
];

export default function ProductTour({ isOpen, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
        }
        return () => window.removeEventListener('resize', updatePosition);
    }, [isOpen, currentStep]);

    const updatePosition = () => {
        const step = STEPS[currentStep];
        const element = document.getElementById(step.targetId);
        if (element) {
            const rect = element.getBoundingClientRect();
            let top = 0;
            let left = 0;

            if (step.placement === "right") {
                top = rect.top + rect.height / 2;
                left = rect.right + 24;
            } else if (step.placement === "bottom") {
                top = rect.bottom + 24;
                left = rect.left + rect.width / 2;
            } else if (step.placement === "top") {
                top = rect.top - 24;
                left = rect.left + rect.width / 2;
            }

            setCoords({ top, left });
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
        }
    };

    if (!isOpen) return null;

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[150] pointer-events-none">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-auto" onClick={handleSkip} />

            <div
                className={cn(
                    "absolute z-[160] w-[340px] bg-white rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.15)] p-8 pointer-events-auto animate-in fade-in zoom-in-95 duration-300 border border-gray-100",
                    step.placement === 'right' ? '-translate-y-1/2' :
                        step.placement === 'bottom' ? '-translate-x-1/2' :
                            step.placement === 'top' ? '-translate-x-1/2 -translate-y-full' : ''
                )}
                style={{
                    top: coords.top,
                    left: coords.left
                }}
            >
                {/* Arrow */}
                <div className={cn(
                    "absolute w-5 h-5 bg-white border-l border-t border-gray-100 rotate-45",
                    step.placement === 'right' ? '-left-2.5 top-1/2 -translate-y-1/2 border-r-0 border-b-0' :
                        step.placement === 'bottom' ? '-top-2.5 left-1/2 -translate-x-1/2' :
                            step.placement === 'top' ? '-bottom-2.5 left-1/2 -translate-x-1/2 rotate-[225deg]' : ''
                )} />

                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <HelpCircle size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 tracking-tight">{step.title}</h3>
                    </div>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {step.content}
                </p>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                            {currentStep + 1} / {STEPS.length}
                        </span>
                        <button
                            onClick={handleSkip}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors group"
                            title="Skip Tutorial"
                        >
                            <span>Skip</span>
                            <FastForward size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <button
                            onClick={() => isLast ? onComplete() : setCurrentStep(prev => prev + 1)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                            {isLast ? "Done" : "Next"}
                            {!isLast && <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
