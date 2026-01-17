"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Check, Palette, PowerOff } from "lucide-react";

export default function ThemesPage() {
    const router = useRouter();
    const [themes, setThemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    useEffect(() => {
        fetchThemes();
    }, []);

    const fetchThemes = async () => {
        try {
            const res = await api.get('/page-builder/themes');
            if (res.data.success) {
                setThemes(res.data.themes);
            }
        } catch (error) {
            console.error('Failed to fetch themes', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (themeId) => {
        if (!confirm('Activate this theme? This will apply its styles to the storefront immediately.')) return;

        setActivating(themeId);
        try {
            await api.post(`/page-builder/themes/${themeId}/activate`);
            // Refresh list to update "is_active" flags
            await fetchThemes();
            alert('Theme activated successfully');
        } catch (error) {
            console.error('Failed to activate theme', error);
            alert('Failed to activate theme');
        } finally {
            setActivating(null);
        }
    };

    const handleDeactivate = async () => {
        if (!confirm('Deactivate the current theme? The storefront will revert to default styles.')) return;

        setDeactivating(true);
        try {
            await api.post('/page-builder/themes/deactivate');
            await fetchThemes();
            alert('Theme deactivated successfully');
        } catch (error) {
            console.error('Failed to deactivate theme', error);
            alert('Failed to deactivate theme');
        } finally {
            setDeactivating(false);
        }
    };

    const handleDelete = async (themeId) => {
        // ... (existing handleDelete)
        if (!confirm('Are you sure you want to delete this theme?')) return;

        try {
            await api.delete(`/page-builder/themes/${themeId}`);
            setThemes(prev => prev.filter(t => t.id !== themeId));
        } catch (error) {
            console.error('Failed to delete theme', error);
            alert('Failed to delete theme');
        }
    };

    // ... (existing handleCreate)
    const handleCreate = async () => {
        const name = prompt('Enter theme name:');
        if (!name) return;

        try {
            const res = await api.post('/page-builder/themes', {
                name,
                variables: {
                    // Default Light Theme
                    primary: '#3b82f6',
                    secondary: '#1e40af',
                    accent: '#f59e0b',
                    background: '#ffffff',
                    text: '#111827',
                    font_heading: 'Inter',
                    font_body: 'Inter',
                    radius: '0.5rem'
                }
            });
            if (res.data.success) {
                router.push(`/dashboard/storefront/themes/${res.data.theme.id}`);
            }
        } catch (error) {
            console.error('Failed to create theme', error);
            alert('Failed to create theme');
        }
    };

    if (loading) return <div className="p-8">Loading themes...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Storefront Themes</h1>
                    <p className="text-gray-500">Manage the look and feel of your store</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5" />
                    New Theme
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map(theme => (
                    <div key={theme.id} className={`border rounded-lg overflow-hidden bg-white shadow-sm ${theme.is_active ? 'ring-2 ring-blue-500' : ''}`}>
                        {/* Preview Header */}
                        <div
                            className="h-32 bg-gray-100 flex items-center justify-center relative"
                            style={{ backgroundColor: theme.variables?.background || '#f3f4f6' }}
                        >
                            <div className="text-center">
                                <h3 className="font-bold text-lg" style={{ color: theme.variables?.text || '#000' }}>
                                    {theme.name}
                                </h3>
                                <div className="flex gap-2 justify-center mt-2">
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.variables?.primary || '#ccc' }}></div>
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.variables?.secondary || '#ccc' }}></div>
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.variables?.accent || '#ccc' }}></div>
                                </div>
                            </div>

                            {theme.is_active && (
                                <div className="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow">
                                    <Check className="w-3 h-3" />
                                    Active
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t">
                            <div className="flex justify-between items-center">
                                <Link
                                    href={`/dashboard/storefront/themes/${theme.id}`}
                                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium text-sm"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Customize
                                </Link>

                                <div className="flex gap-2">
                                    {theme.is_active ? (
                                        <button
                                            onClick={handleDeactivate}
                                            disabled={deactivating}
                                            className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-sm font-medium border border-orange-200 flex items-center gap-1"
                                            title="Deactivate Theme (Revert to Default)"
                                        >
                                            <PowerOff className="w-3 h-3" />
                                            {deactivating ? '...' : 'Deactivate'}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleDelete(theme.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                title="Delete Theme"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleActivate(theme.id)}
                                                disabled={activating === theme.id}
                                                className="px-3 py-1 bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded text-sm font-medium border"
                                            >
                                                {activating === theme.id ? '...' : 'Activate'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {themes.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <Palette className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No themes found. Create one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
