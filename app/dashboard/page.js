"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch products count
            const productsRes = await api.get("/products");
            setStats((prev) => ({
                ...prev,
                products: productsRes.data.pagination?.total || 0,
            }));
        } catch (err) {
            console.error("Failed to fetch stats", err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            name: "Total Products",
            value: stats.products,
            icon: Package,
            color: "bg-blue-500",
        },
        {
            name: "Orders",
            value: stats.orders,
            icon: ShoppingCart,
            color: "bg-green-500",
        },
        {
            name: "Revenue",
            value: `$${stats.revenue.toFixed(2)}`,
            icon: DollarSign,
            color: "bg-purple-500",
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back, {user?.email}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat) => (
                    <div
                        key={stat.name}
                        className="bg-white rounded-lg shadow p-6 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-sm text-gray-600">{stat.name}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {loading ? "..." : stat.value}
                            </p>
                        </div>
                        <div className={`${stat.color} p-3 rounded-lg`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/dashboard/products/create"
                        className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                        <Package className="w-6 h-6 text-blue-600" />
                        <div>
                            <p className="font-medium text-gray-900">Add New Product</p>
                            <p className="text-sm text-gray-600">Create a product listing</p>
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/products"
                        className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <div>
                            <p className="font-medium text-gray-900">View Products</p>
                            <p className="text-sm text-gray-600">Manage your catalog</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
