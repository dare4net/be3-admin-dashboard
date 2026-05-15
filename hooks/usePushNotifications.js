"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * usePushNotifications (Admin)
 *
 * Requests browser push permission, gets the FCM token,
 * registers it with the backend, and listens for foreground messages.
 *
 * Admin auth reads token from localStorage (AuthContext doesn't expose raw token).
 */
export function usePushNotifications({ onNewNotification } = {}) {
    const { user } = useAuth();
    const registeredRef = useRef(false);

    useEffect(() => {
        if (!user) return;
        if (registeredRef.current) return;
        if (typeof window === "undefined") return;
        if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
        if (Notification.permission === "denied") return;

        const token = localStorage.getItem("token");
        const tenantId = user?.tenant_id;
        if (!token || !tenantId) return;

        let unsubscribeForeground = null;

        const setup = async () => {
            try {
                const fcmToken = await requestFCMToken();
                if (!fcmToken) return;

                // Register with backend
                const res = await fetch(`${API_BASE}/notifications/fcm/token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        "X-Tenant-ID": tenantId,
                    },
                    body: JSON.stringify({ token: fcmToken, platform: "web" }),
                });

                if (res.ok) {
                    registeredRef.current = true;
                    console.log("[AdminPush] FCM token registered ✓");
                }

                // Listen for foreground messages
                unsubscribeForeground = onForegroundMessage((payload) => {
                    const { title, body } = payload.notification || {};
                    const data = payload.data || {};

                    toast.custom((t) => (
                        <div
                            onClick={() => {
                                toast.dismiss(t.id);
                                if (data.actionUrl) window.location.href = data.actionUrl;
                            }}
                            className={`${t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"} transition-all max-w-sm w-full bg-white shadow-xl rounded-xl border border-gray-100 p-4 cursor-pointer flex items-start gap-3`}
                        >
                            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-violet-600 text-lg">🔔</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900">{title}</p>
                                {body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{body}</p>}
                            </div>
                        </div>
                    ), { duration: 6000, position: "top-right" });

                    onNewNotification?.(payload);
                });
            } catch (err) {
                console.warn("[AdminPush] Setup failed:", err.message);
            }
        };

        setup();
        return () => { if (unsubscribeForeground) unsubscribeForeground(); };
    }, [user]);
}
