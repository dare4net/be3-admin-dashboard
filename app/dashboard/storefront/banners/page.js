"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Layout, Edit, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function BannersPage() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/modules/banner/groups');
            setGroups(res.data.data);
        } catch (err) {
            console.error("Failed to fetch banner groups", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this banner group?")) return;
        try {
            await api.delete(`/modules/banner/groups/${id}`);
            fetchGroups(); // Refresh
        } catch (err) {
            console.error("Failed to delete group", err);
            alert("Failed to delete group");
        }
    };

    const handleCreate = async () => {
        const name = prompt("Enter a name for the new Banner Group:");
        if (!name) return;

        try {
            const res = await api.post('/modules/banner/groups', { name, banners: [] });
            router.push(`/dashboard/storefront/banners/${res.data.data.id}`);
        } catch (err) {
            console.error("Failed to create group", err);
            alert("Failed to create group");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Banner Groups</h1>
                    <p className="text-gray-600">Create collections of banners to display on your storefront.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create New Group
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No banner groups yet</h3>
                    <p className="text-gray-500 mb-6">Create your first banner group to get started.</p>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Group
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/dashboard/storefront/banners/${group.id}`}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(group.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{group.name}</h3>
                            <p className="text-sm text-gray-500 mt-auto">
                                Created {new Date(group.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
