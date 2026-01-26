'use client';

import { useState } from 'react';

export default function SEOMetaEditor({ page, onChange }) {
    const [activeTab, setActiveTab] = useState('basic');

    // Helper to update nested fields
    const updateField = (field, value) => {
        onChange({ ...page, [field]: value });
    };

    return (
        <div className="seo-editor border border-gray-200 rounded-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex gap-0 border-b bg-gray-50">
                <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className={`flex-1 py-3 px-6 font-medium transition-colors ${activeTab === 'basic'
                        ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    📄 Basic SEO
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('social')}
                    className={`flex-1 py-3 px-6 font-medium transition-colors ${activeTab === 'social'
                        ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    🌐 Social Media
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('advanced')}
                    className={`flex-1 py-3 px-6 font-medium transition-colors ${activeTab === 'advanced'
                        ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    ⚙️ Advanced
                </button>
            </div>

            <div className="p-6">
                {/* Basic SEO Tab */}
                {activeTab === 'basic' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Page Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={page.title || ''}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                maxLength={60}
                                placeholder="Enter page title (50-60 characters recommended)"
                            />
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-gray-500">Appears in browser tab and search results</p>
                                <p className={`text-xs font-medium ${(page.title?.length || 0) >= 50 && (page.title?.length || 0) <= 60
                                    ? 'text-green-600'
                                    : 'text-orange-500'
                                    }`}>
                                    {page.title?.length || 0}/60
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Meta Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={page.meta_description || ''}
                                onChange={(e) => updateField('meta_description', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                maxLength={160}
                                placeholder="Describe your page content (150-160 characters recommended)"
                            />
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-gray-500">Shown in search engine results</p>
                                <p className={`text-xs font-medium ${(page.meta_description?.length || 0) >= 150
                                    ? 'text-green-600'
                                    : 'text-orange-500'
                                    }`}>
                                    {page.meta_description?.length || 0}/160
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Canonical URL (Optional)
                            </label>
                            <input
                                type="url"
                                value={page.canonical_url || ''}
                                onChange={(e) => updateField('canonical_url', e.target.value)}
                                placeholder="https://yourstore.com/page-slug"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Preferred URL for duplicate content prevention</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Search Engine Indexing
                            </label>
                            <select
                                value={page.robots || 'index,follow'}
                                onChange={(e) => updateField('robots', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="index,follow">✅ Index & Follow Links (Default)</option>
                                <option value="noindex,follow">🚫 Don't Index, Follow Links</option>
                                <option value="index,nofollow">✅ Index, Don't Follow Links</option>
                                <option value="noindex,nofollow">🚫 Don't Index or Follow</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Controls how search engines crawl this page</p>
                        </div>
                    </div>
                )}

                {/* Social Media Tab */}
                {activeTab === 'social' && (
                    <div className="space-y-8">
                        {/* Open Graph */}
                        <div className="border-b border-gray-200 pb-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="text-2xl">👍</span>
                                Open Graph (Facebook, LinkedIn, WhatsApp)
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        OG Title
                                    </label>
                                    <input
                                        type="text"
                                        value={page.og_title || ''}
                                        onChange={(e) => updateField('og_title', e.target.value)}
                                        placeholder={page.title || 'Defaults to page title'}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave blank to use page title</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        OG Description
                                    </label>
                                    <textarea
                                        value={page.og_description || ''}
                                        onChange={(e) => updateField('og_description', e.target.value)}
                                        placeholder={page.meta_description || 'Defaults to meta description'}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={2}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave blank to use meta description</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        OG Image URL
                                    </label>
                                    <input
                                        type="url"
                                        value={page.og_image || ''}
                                        onChange={(e) => updateField('og_image', e.target.value)}
                                        placeholder="https://yourcdn.com/og-image.jpg (1200x630px recommended)"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {page.og_image && (
                                        <div className="mt-3">
                                            <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                                            <img
                                                src={page.og_image}
                                                alt="OG Preview"
                                                className="max-w-md border border-gray-300 rounded-lg shadow-sm"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x630 pixels</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        OG Type
                                    </label>
                                    <select
                                        value={page.og_type || 'website'}
                                        onChange={(e) => updateField('og_type', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="website">🌐 Website</option>
                                        <option value="article">📰 Article/Blog Post</option>
                                        <option value="product">🛍️ Product</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Twitter Card */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="text-2xl">🐦</span>
                                Twitter Card
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Card Type
                                    </label>
                                    <select
                                        value={page.twitter_card || 'summary_large_image'}
                                        onChange={(e) => updateField('twitter_card', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="summary_large_image">📸 Summary with Large Image</option>
                                        <option value="summary">🖼️ Summary (Small Image)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Twitter Title
                                    </label>
                                    <input
                                        type="text"
                                        value={page.twitter_title || ''}
                                        onChange={(e) => updateField('twitter_title', e.target.value)}
                                        placeholder={page.og_title || page.title || 'Defaults to OG/page title'}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave blank to use OG title or page title</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Structured Data (JSON-LD Schema)
                            </label>
                            <textarea
                                value={page.structured_data ? JSON.stringify(page.structured_data, null, 2) : ''}
                                onChange={(e) => {
                                    try {
                                        if (!e.target.value.trim()) {
                                            updateField('structured_data', null);
                                            return;
                                        }
                                        const parsed = JSON.parse(e.target.value);
                                        updateField('structured_data', parsed);
                                    } catch (err) {
                                        // Invalid JSON, don't update
                                    }
                                }}
                                placeholder={`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company",
  "description": "Company description"
}`}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                rows={12}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-600">
                                    For rich snippets in search results.
                                    <a
                                        href="https://schema.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline ml-1"
                                    >
                                        Learn more at Schema.org →
                                    </a>
                                </p>
                                <a
                                    href="https://search.google.com/test/rich-results"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    Test with Google →
                                </a>
                            </div>
                        </div>

                        {/* Example Templates */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Common Templates:</p>
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => updateField('structured_data', {
                                        "@context": "https://schema.org",
                                        "@type": "Organization",
                                        "name": page.title || "Your Company"
                                    })}
                                    className="text-xs text-blue-700 hover:text-blue-900 underline block"
                                >
                                    + Organization Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateField('structured_data', {
                                        "@context": "https://schema.org",
                                        "@type": "Article",
                                        "headline": page.title || "Article Title",
                                        "description": page.meta_description || "Article description"
                                    })}
                                    className="text-xs text-blue-700 hover:text-blue-900 underline block"
                                >
                                    + Article/Blog Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateField('structured_data', {
                                        "@context": "https://schema.org",
                                        "@type": "Product",
                                        "name": page.title || "Product Name",
                                        "description": page.meta_description || "Product description"
                                    })}
                                    className="text-xs text-blue-700 hover:text-blue-900 underline block"
                                >
                                    + Product Template
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
