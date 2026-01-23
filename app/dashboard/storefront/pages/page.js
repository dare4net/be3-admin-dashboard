"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, Settings, Layout } from "lucide-react";
import Link from "next/link";
import SEOMetaEditor from "@/components/page-builder/SEOMetaEditor";

export default function PagesManagement() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        meta_description: '',
        is_published: false,
        show_in_nav: false,
        show_header: true,
        show_footer: true,
        // SEO Fields
        og_title: '',
        og_description: '',
        og_image: '',
        og_type: 'website',
        twitter_card: 'summary_large_image',
        twitter_title: '',
        twitter_description: '',
        twitter_image: '',
        canonical_url: '',
        robots: 'index,follow',
        structured_data: null
    });

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await api.get('/page-builder/pages?includeUnpublished=true');
            if (res.data.success) {
                setPages(res.data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch pages', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingPage(null);
        setFormData({
            title: '',
            slug: '',
            meta_description: '',
            is_published: false,
            show_in_nav: false,
            show_header: true,
            show_footer: true,
            // SEO Fields
            og_title: '',
            og_description: '',
            og_image: '',
            og_type: 'website',
            twitter_card: 'summary_large_image',
            twitter_title: '',
            twitter_description: '',
            twitter_image: '',
            canonical_url: '',
            robots: 'index,follow',
            structured_data: null
        });
        setIsModalOpen(true);
    };

    const handleEdit = (page) => {
        setEditingPage(page);
        setFormData({
            title: page.title,
            slug: page.slug,
            meta_description: page.meta_description || '',
            is_published: page.is_published,
            show_in_nav: page.show_in_nav,
            show_header: page.show_header !== false, // Default to true if undefined
            show_footer: page.show_footer !== false,
            // SEO Fields
            og_title: page.og_title || '',
            og_description: page.og_description || '',
            og_image: page.og_image || '',
            og_type: page.og_type || 'website',
            twitter_card: page.twitter_card || 'summary_large_image',
            twitter_title: page.twitter_title || '',
            twitter_description: page.twitter_description || '',
            twitter_image: page.twitter_image || '',
            canonical_url: page.canonical_url || '',
            robots: page.robots || 'index,follow',
            structured_data: page.structured_data || null
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPage) {
                await api.put(`/page-builder/pages/${editingPage.id}`, formData);
            } else {
                await api.post('/page-builder/pages', formData);
            }
            await fetchPages();
            setIsModalOpen(false);
        } catch (error) {
            alert('Failed to save page');
        }
    };

    const handleDelete = async (page) => {
        if (page.is_system) {
            alert('Cannot delete system page');
            return;
        }
        if (!confirm(`Delete page "${page.title}"?`)) return;

        try {
            await api.delete(`/page-builder/pages/${page.id}`);
            await fetchPages();
        } catch (error) {
            alert('Failed to delete page');
        }
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleTitleChange = (title) => {
        setFormData(prev => ({
            ...prev,
            title,
            slug: editingPage ? prev.slug : generateSlug(title) // Only auto-generate for new pages
        }));
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Page Management</h1>
                    <p className="text-gray-600">Manage your website pages and routes</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/dashboard/storefront/settings"
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                        title="Upload Logo, Social Links"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </Link>
                    <Link
                        href="/dashboard/storefront/builder?page=header"
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                        <Layout className="w-4 h-4" />
                        Edit Header
                    </Link>
                    <Link
                        href="/dashboard/storefront/builder?page=footer"
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                        <Layout className="w-4 h-4" />
                        Edit Footer
                    </Link>
                    <Link
                        href="/dashboard/storefront/builder"
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                        <FileText className="w-4 h-4" />
                        Page Builder
                    </Link>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Page
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pages.map((page) => (
                            <tr key={page.id}>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{page.title}</div>
                                    {page.meta_description && (
                                        <div className="text-sm text-gray-500 line-clamp-1">{page.meta_description}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">/{page.slug}</code>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${page.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {page.is_published ? '● Published' : '○ Draft'}
                                        </span>
                                        {page.show_in_nav && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                In Navigation
                                            </span>
                                        )}
                                        {page.is_system && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                System Page
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(page)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {!page.is_system && (
                                        <button
                                            onClick={() => handleDelete(page)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
                            <h3 className="text-lg font-bold">
                                {editingPage ? 'Edit Page' : 'Create New Page'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Page Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    placeholder="e.g., About Us"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">URL Slug *</label>
                                <div className="flex items-center">
                                    <span className="text-gray-500 mr-2">/</span>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        required
                                        disabled={editingPage?.is_system}
                                        className="flex-1 px-3 py-2 border rounded-lg disabled:bg-gray-100"
                                        placeholder="about-us"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">This will be the page URL</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
                                <textarea
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows={3}
                                    placeholder="Brief description for search engines"
                                />
                            </div>

                            <div className="flex gap-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_published}
                                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Published (visible to public)</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_in_nav}
                                        onChange={(e) => setFormData({ ...formData, show_in_nav: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Show in navigation menu</span>
                                </label>
                            </div>

                            <div className="flex gap-6 border-t pt-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_header}
                                        onChange={(e) => setFormData({ ...formData, show_header: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Show Header</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.show_footer}
                                        onChange={(e) => setFormData({ ...formData, show_footer: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Show Footer</span>
                                </label>
                            </div>

                            {/* SEO Meta Editor */}
                            <div className="border-t pt-6 mt-6">
                                <h4 className="text-md font-semibold mb-4 text-gray-800">Search Engine Optimization</h4>
                                <SEOMetaEditor
                                    page={formData}
                                    onChange={(updated) => setFormData(updated)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingPage ? 'Update Page' : 'Create Page'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
