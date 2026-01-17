"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Users, Paintbrush, Folder, Tags, Palette, List, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true
    },
    {
        name: "Catalog",
        href: "/dashboard/catalog",
        icon: Package,
        relatedPaths: ['/dashboard/products']
    },
    {
        name: "Sales",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        relatedPaths: ['/dashboard/orders', '/dashboard/customers']
    },
    {
        name: "Storefront",
        href: "/dashboard/storefront",
        icon: Paintbrush,
        relatedPaths: ['/dashboard/menus']
    },
    {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings
    },
];

export default function DashboardLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    // Checking if nav item is active
    const isNavItemActive = (item) => {
        if (item.exact) return pathname === item.href;
        if (pathname.startsWith(item.href)) return true;
        if (item.relatedPaths) {
            return item.relatedPaths.some(path => pathname.startsWith(path));
        }
        return false;
    };

    // Smart Breadcrumbs
    const getBreadcrumbs = () => {
        const crumbs = [];

        // Define groupings mapping
        const pathGroups = {
            '/dashboard/products': { label: 'Catalog', href: '/dashboard/catalog' },
            '/dashboard/orders': { label: 'Sales', href: '/dashboard/sales' },
            '/dashboard/customers': { label: 'Sales', href: '/dashboard/sales' },
            '/dashboard/menus': { label: 'Storefront', href: '/dashboard/storefront' },
        };

        // Check if current path belongs to a group
        let parentGroup = null;
        for (const [prefix, group] of Object.entries(pathGroups)) {
            if (pathname.startsWith(prefix)) {
                parentGroup = group;
                break;
            }
        }

        // Add Root Crumb (Group or Dashboard)
        if (parentGroup) {
            crumbs.push({ label: parentGroup.label, href: parentGroup.href, isLast: false });
        } else if (pathname.startsWith('/dashboard/storefront')) {
            crumbs.push({ label: 'Storefront', href: '/dashboard/storefront', isLast: pathname === '/dashboard/storefront' });
        } else if (pathname.startsWith('/dashboard/catalog')) {
            crumbs.push({ label: 'Catalog', href: '/dashboard/catalog', isLast: pathname === '/dashboard/catalog' });
        } else if (pathname.startsWith('/dashboard/sales')) {
            crumbs.push({ label: 'Sales', href: '/dashboard/sales', isLast: pathname === '/dashboard/sales' });
        } else if (pathname.startsWith('/dashboard/settings')) {
            crumbs.push({ label: 'Settings', href: '/dashboard/settings', isLast: pathname === '/dashboard/settings' });
        } else {
            // Default to Dashboard if not matching any group
            crumbs.push({ label: 'Dashboard', href: '/dashboard', isLast: pathname === '/dashboard' });
        }

        // Add Segments
        // We filter out common prefixes to avoid duplicates
        const segments = pathname.split('/').filter(p => p !== '' && p !== 'dashboard');

        let pathAccumulator = '/dashboard';
        segments.forEach((segment, index) => {
            pathAccumulator += `/${segment}`;

            // Skip if this segment is implicit in the parent group (e.g. 'catalog', 'sales')
            if (['catalog', 'sales', 'storefront', 'settings'].includes(segment)) return;

            const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            const isLast = index === segments.length - 1;
            crumbs.push({ label, href: pathAccumulator, isLast });
        });

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-gray-900">
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 bg-gray-800">
                        <Link href="/dashboard" className="text-xl font-bold text-white">Admin Dashboard</Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navigation.map((item) => {
                            const isActive = isNavItemActive(item);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-gray-800">
                        <div className="flex items-center gap-3 px-4 py-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                {user.email?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                                <p className="text-xs text-gray-400 truncate">Store Admin</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="pl-64 flex flex-col min-h-screen">
                {/* Top Header with Breadcrumbs */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2">
                            {/* Always show Dashboard icon as base ?? No User said Dashboard isn't source */}
                            {/* So we only list crumbs */}

                            {breadcrumbs.map((crumb, index) => (
                                <li key={crumb.href + index}>
                                    <div className="flex items-center">
                                        {index > 0 && <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />}

                                        {crumb.isLast ? (
                                            <span className={`text-sm font-medium text-gray-700 ${index > 0 ? 'ml-2' : ''}`}>
                                                {crumb.label}
                                            </span>
                                        ) : (
                                            <Link href={crumb.href} className={`text-sm font-medium text-gray-500 hover:text-gray-700 ${index > 0 ? 'ml-2' : ''}`}>
                                                {crumb.label}
                                            </Link>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </header>

                <main className="p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
