"use client";

import Link from "next/link";
import { ShoppingCart, Users } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";

const sections = [
    {
        name: "Orders",
        description: "View and manage customer orders and shipments",
        href: "/dashboard/orders",
        icon: ShoppingCart,
        color: "bg-green-100 text-green-600",
        permission: "orders.view"
    },
    {
        name: "Customers",
        description: "View customer profiles and history",
        href: "/dashboard/customers",
        icon: Users,
        color: "bg-blue-100 text-blue-600",
        permission: "customers.view"
    }
];

export default function SalesHub() {
    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Sales & Customers</h1>
            <p className="text-gray-600 mb-8">Track your revenue and customer base.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((item) => (
                    <PermissionGate key={item.name} permission={item.permission}>
                        <Link
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
                    </PermissionGate>
                ))}
            </div>
        </div>
    );
}
