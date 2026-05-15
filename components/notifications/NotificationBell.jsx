"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { useSocket } from "@/components/providers/SocketContext";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AdminNotificationBell({ isCollapsed = false }) {
    const { user } = useAuth();
    const socket = useSocket();
    const pathname = usePathname();

    // Admin AuthContext doesn't expose token — read from localStorage
    const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const tenantId = user?.tenant_id;

    const [unreadCount, setUnreadCount] = useState(0);

    const authHeaders = () => ({
        Authorization: `Bearer ${getToken()}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json',
    });

    const fetchCount = useCallback(async () => {
        if (!user || !tenantId) return;
        try {
            const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: authHeaders() });
            const data = await res.json();
            setUnreadCount(data.count || 0);
        } catch {}
    }, [user, tenantId]);

    // Load count on mount
    useEffect(() => { if (user) fetchCount(); }, [user, fetchCount]);

    // Real-time badge increment via socket
    useEffect(() => {
        if (!socket) return;
        const handleNew = () => setUnreadCount(c => c + 1);
        socket.on('notification.new', handleNew);
        return () => socket.off('notification.new', handleNew);
    }, [socket]);

    // Reset badge when user visits the notifications page
    useEffect(() => {
        if (pathname === '/dashboard/notifications') {
            setUnreadCount(0);
        }
    }, [pathname]);

    if (!user) return null;

    const isActive = pathname === '/dashboard/notifications';

    // ── Collapsed: icon + badge only ────────────────────────
    if (isCollapsed) {
        return (
            <Link
                href="/dashboard/notifications"
                className={cn(
                    "relative flex items-center justify-center p-2 rounded-lg transition-all group",
                    isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center ring-2 ring-gray-900">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {/* Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                    Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                </div>
            </Link>
        );
    }

    // ── Expanded: full sidebar row ───────────────────────────
    return (
        <Link
            href="/dashboard/notifications"
            className={cn(
                "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all",
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
        >
            <Bell className="flex-shrink-0 w-5 h-5" />
            <span className="truncate">Notifications</span>
            {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
