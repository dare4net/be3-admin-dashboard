"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import AdminNotificationBell from "@/components/notifications/NotificationBell";

export default function Sidebar({
    navigation,
    user,
    logout,
    isMobileOpen,
    setIsMobileOpen,
    isCollapsed,
    setIsCollapsed
}) {
    const pathname = usePathname();

    const isNavItemActive = (item) => {
        if (item.exact) return pathname === item.href;
        if (pathname.startsWith(item.href)) return true;
        if (item.relatedPaths) {
            return item.relatedPaths.some(path => pathname.startsWith(path));
        }
        return false;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 transition-all duration-300 ease-in-out border-r border-gray-800",
                    isCollapsed ? "w-20" : "w-64",
                    // Mobile transform logic
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Header / Logo */}
                <div className={cn(
                    "flex items-center h-16 px-4 bg-gray-900 border-b border-gray-800",
                    isCollapsed ? "justify-center" : "justify-between"
                )}>
                    {!isCollapsed && (
                        <Link href="/dashboard" className="text-xl font-bold text-white truncate">
                            Be3 Admin
                        </Link>
                    )}
                    {isCollapsed && (
                        <Link href="/dashboard" className="text-xl font-bold text-white">
                            Be3
                        </Link>
                    )}

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:flex p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden p-2 text-gray-400 hover:text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav id="sidebar-nav" className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
                    {navigation.map((item) => {
                        const isActive = isNavItemActive(item);
                        return (
                            <Link
                                key={item.name}
                                id={`sidebar-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)} // Close on mobile click
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all group relative",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                    isCollapsed && "justify-center px-2"
                                )}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <item.icon className={cn(
                                    "flex-shrink-0 w-5 h-5 transition-all",
                                    isActive && "text-white"
                                )} />

                                <span className={cn(
                                    "truncate transition-all duration-300",
                                    isCollapsed ? "hidden" : "w-auto opacity-100"
                                )}>
                                    {item.name}
                                </span>

                                {/* Hover Tooltip for Collapsed State */}
                                {isCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div id="user-profile" className="p-4 border-t border-gray-800 bg-gray-900">
                    {!isCollapsed ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium shadow-sm">
                                    {user?.email?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                                    <p className="text-xs text-gray-500 truncate">Store Admin</p>
                                </div>
                            </div>
                            <AdminNotificationBell isCollapsed={false} />
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium shadow-sm cursor-help" title={user?.email}>
                                {user?.email?.[0]?.toUpperCase()}
                            </div>
                            <AdminNotificationBell isCollapsed={true} />
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
