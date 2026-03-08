"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Users, Paintbrush, Folder, Tags, Palette, List, FileText, ChevronRight, Building2, BarChart3, MessageSquare, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/dashboard/Sidebar";
import BrandedLoading from "@/components/ui/BrandedLoading";
import OnboardingSlides from "@/components/dashboard/OnboardingSlides";
import ProductTour from "@/components/dashboard/ProductTour";

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
        requiredPermission: "admin.access" // All users with admin access
    },
    {
        name: "Business",
        href: "/dashboard/business",
        icon: Building2,
        requiredRole: "Vendor",
        allowSuperAdmin: true
    },
    {
        name: "Catalog",
        href: "/dashboard/catalog",
        icon: Package,
        relatedPaths: ['/dashboard/products'],
        requiredPermissions: ["products.view", "categories.view", "collections.view"] // Any of these
    },
    {
        name: "Orders",
        href: "/dashboard/orders",
        icon: ShoppingCart,
        requiredPermission: "orders.view",
        hideForAdmin: false,
        vendorOnly: true // Custom hint for filtering
    },
    {
        name: "Sales",
        href: "/dashboard/sales",
        icon: ShoppingCart,
        relatedPaths: ['/dashboard/orders', '/dashboard/customers'],
        requiredPermissions: ["orders.view", "customers.view"], // Any of these
        hideForVendor: true // Hide the grouped "Sales" for vendors
    },
    {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        requiredPermission: "admin.access"
    },
    {
        name: "Storefront",
        href: "/dashboard/storefront",
        icon: Paintbrush,
        relatedPaths: ['/dashboard/menus'],
        requiredPermissions: ["pagebuilder.view", "pages.view", "layouts.view", "themes.view", "banners.view"] // Any
    },
    {
        name: "Messages",
        href: "/dashboard/messages",
        icon: MessageSquare,
        requiredPermission: "chat.access" // Assuming a permission for chat access
    },
    {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        requiredPermission: "settings.view"
    },
];

export default function DashboardLayout({ children }) {
    const { user, loading, logout, globalLoading, setGlobalLoading } = useAuth();
    const { hasPermission, hasAnyPermission, hasRole } = usePermissions();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Onboarding and Tour States
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        // Only trigger the "persistent splash" if we AREN'T coming directly from the Login page
        const skipSplash = sessionStorage.getItem('skip-dashboard-splash');

        if (!skipSplash) {
            setGlobalLoading(true);
        } else {
            // Clear the flag so future refreshes trigger the splash
            sessionStorage.removeItem('skip-dashboard-splash');
        }
    }, []);

    useEffect(() => {
        if (!loading && user) {
            // Force show for testing as requested
            setShowOnboarding(true);

            // Check if mobile to bypass tour
            const isMobile = window.innerWidth < 768;
            if (!isMobile) {
                // We'll trigger the tour manually or let onboarding trigger it
            }
        }
    }, [user, loading]);

    const handleOnboardingComplete = () => {
        localStorage.setItem('onboarding-completed', 'true');
        setShowOnboarding(false);
        // Automatically start tour after onboarding, except on mobile
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
            setShowTour(true);
        }
    };

    const handleTourComplete = () => {
        localStorage.setItem('tour-completed', 'true');
        setShowTour(false);
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    // DashboardLayout no longer returns BrandedLoading directly; 
    // it's managed globally by RootWrapper based on AuthContext state.

    // Filter navigation based on user permissions
    const filteredNavigation = navigation.filter(item => {
        const isVendor = hasRole("Vendor");
        const isSuperAdmin = hasPermission("*");

        if (item.vendorOnly && !isVendor && !isSuperAdmin) return false;
        if (item.hideForVendor && isVendor && !isSuperAdmin) return false;

        if (item.requiredRole) {
            const hasRequestedRole = hasRole(item.requiredRole);
            const canBypass = item.allowSuperAdmin && isSuperAdmin;
            if (!hasRequestedRole && !canBypass) return false;
        }

        if (!hasPermission || !hasAnyPermission) return true;

        if (item.requiredPermission) return hasPermission(item.requiredPermission);

        if (item.requiredPermissions && item.requiredPermissions.length > 0) {
            return hasAnyPermission(item.requiredPermissions);
        }

        return true;
    });

    const getBreadcrumbs = () => {
        const crumbs = [];
        const pathGroups = {
            '/dashboard/products': { label: 'Catalog', href: '/dashboard/catalog' },
            '/dashboard/orders': { label: 'Sales', href: '/dashboard/sales' },
            '/dashboard/customers': { label: 'Sales', href: '/dashboard/sales' },
            '/dashboard/menus': { label: 'Storefront', href: '/dashboard/storefront' },
        };

        let parentGroup = null;
        for (const [prefix, group] of Object.entries(pathGroups)) {
            if (pathname.startsWith(prefix)) {
                parentGroup = group;
                break;
            }
        }

        if (parentGroup) {
            crumbs.push({ label: parentGroup.label, href: parentGroup.href, isLast: false });
        } else if (pathname.startsWith('/dashboard/storefront')) {
            crumbs.push({ label: 'Storefront', href: '/dashboard/storefront', isLast: pathname === '/dashboard/storefront' });
        } else if (pathname.startsWith('/dashboard/catalog')) {
            crumbs.push({ label: 'Catalog', href: '/dashboard/catalog', isLast: pathname === '/dashboard/catalog' });
        } else if (pathname.startsWith('/dashboard/sales')) {
            crumbs.push({ label: 'Sales', href: '/dashboard/sales', isLast: pathname === '/dashboard/sales' });
        } else if (pathname.startsWith('/dashboard/business')) {
            crumbs.push({ label: 'Business', href: '/dashboard/business', isLast: true });
        } else {
            crumbs.push({ label: 'Dashboard', href: '/dashboard', isLast: pathname === '/dashboard' });
        }

        const segments = pathname.split('/').filter(p => p !== '' && p !== 'dashboard');
        let pathAccumulator = '/dashboard';
        segments.forEach((segment, index) => {
            pathAccumulator += `/${segment}`;
            if (['catalog', 'sales', 'storefront', 'settings'].includes(segment)) return;
            const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            const isLast = index === segments.length - 1;
            crumbs.push({ label, href: pathAccumulator, isLast });
        });

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Sidebar
                navigation={filteredNavigation}
                user={user}
                logout={logout}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            {/* Main content */}
            <div className={cn(
                "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                isCollapsed ? "md:pl-20" : "md:pl-64"
            )}>
                {/* Top Header with Breadcrumbs */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-8 shadow-sm">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="mr-4 md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <nav className="flex overflow-hidden" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 whitespace-nowrap">
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

                <main className="p-4 md:p-6 flex-1 overflow-x-hidden">
                    {children}
                </main>

                <OnboardingSlides
                    isOpen={showOnboarding}
                    onClose={() => setShowOnboarding(false)}
                    onComplete={handleOnboardingComplete}
                />

                <ProductTour
                    isOpen={showTour}
                    onComplete={handleTourComplete}
                />
            </div>
        </div>
    );
}
