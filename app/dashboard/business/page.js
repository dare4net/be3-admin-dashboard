"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import BusinessTab from "../settings/BusinessTab";
import { Loader2 } from "lucide-react";

export default function BusinessPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="w-full space-y-4">
            <h1 className="text-2xl font-black text-gray-900 mb-6">Business Management</h1>
            <BusinessTab user={user} onUpdate={(updated) => setUser(updated)} />
        </div>
    );
}
