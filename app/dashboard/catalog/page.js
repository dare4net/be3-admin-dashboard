"use client";

import Link from "next/link";
import { Package, Folder, Tags, List } from "lucide-react";

const sections = [
    {
        name: "Products",
        description: "Manage your product inventory, prices, and stock",
        href: "/dashboard/products",
        icon: Package,
        color: "bg-blue-100 text-blue-600"
    },
    {
        name: "Categories",
        description: "Organize products into browsing categories",
        href: "/dashboard/products/categories",
        icon: Folder,
        color: "bg-yellow-100 text-yellow-600"
    },
    {
        name: "Attributes",
        description: "Manage custom product attributes and variations",
        href: "/dashboard/products/attributes",
        icon: Tags,
        color: "bg-purple-100 text-purple-600"
    },
    {
        name: "Collections",
        description: "Create rule-based product groupings",
        href: "/dashboard/products/collections",
        icon: List,
        color: "bg-green-100 text-green-600"
    }
];

export default function CatalogHub() {
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Catalog Management</h1>
            <p className="text-gray-600 mb-8">Manage your products and organization.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
