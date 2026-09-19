"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import BusinessTab from "../settings/BusinessTab";
import LogisticsTab from "../settings/LogisticsTab";
import { Loader2, Briefcase, MapPin } from "lucide-react";

export default function BusinessPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/auth/me");
                setUser(res.data.user);
            } catch (err) {
                console.error("Failed to fetch user:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Business Profile", icon: Briefcase },
        { id: "logistics", label: "Delivery Settings", icon: MapPin },
    ];

    return (
        <div className="w-full space-y-6 max-w-5xl">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Business Management</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your business profile and delivery logistics.</p>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="pt-2">
                {activeTab === "profile" && <BusinessTab user={user} onUpdate={(updated) => setUser(updated)} />}
                {activeTab === "logistics" && <LogisticsTab user={user} onUpdate={(updated) => setUser(updated)} />}
            </div>
        </div>
    );
}
