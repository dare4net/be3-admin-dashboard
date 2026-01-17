"use client";

import Link from "next/link";
import { Paintbrush, FileText, List, Palette, Settings, Layout } from "lucide-react";

const sections = [
    {
        name: "Theme Editor",
        description: "Customize your store's look and feel (Colors, Typography)",
        href: "/dashboard/storefront/themes",
        icon: Palette,
        color: "bg-purple-100 text-purple-600"
    },
    {
        name: "Page Builder",
        description: "Drag-and-drop builder for your store pages",
        href: "/dashboard/storefront/builder",
        icon: Paintbrush,
        color: "bg-blue-100 text-blue-600"
    },
    {
        name: "Pages",
        description: "Manage and create new pages for your site",
        href: "/dashboard/storefront/pages",
        icon: FileText,
        color: "bg-green-100 text-green-600"
    },
    {
        name: "Menus",
        description: "Configure your navigation headers and footers",
        href: "/dashboard/menus",
        icon: List,
        color: "bg-yellow-100 text-yellow-600"
    },
    {
        name: "Global Settings",
        description: "Manage Logo, Copyright, and Social Media links",
        href: "/dashboard/storefront/settings",
        icon: Settings,
        color: "bg-gray-100 text-gray-600"
    }
];

export default function StorefrontHub() {
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Storefront Management</h1>
            <p className="text-gray-600 mb-8">Manage every aspect of your customer-facing store.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center gap-4 mb-3">
                            <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {item.name}
                            </h3>
                        </div>
                        <p className="text-gray-500 text-sm">
                            {item.description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
