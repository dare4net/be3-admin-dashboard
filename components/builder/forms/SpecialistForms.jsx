"use client";

import { AccordionItemsEditor } from "@/components/config/ContentArrayEditors";
import { Input, Select, ToggleButton } from "./FormComponents";

export default function SpecialistForms({
    widgetType,
    config,
    updateConfig
}) {
    switch (widgetType) {
        case 'search_bar':
            return (
                <>
                    <Input label="Placeholder Text" value={config.placeholder || 'Search products…'} onChange={v => updateConfig('placeholder', v)} />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <span className="text-sm font-medium">Enable Autocomplete</span>
                            <ToggleButton value={config.autocomplete !== false} onChange={v => updateConfig('autocomplete', v)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <span className="text-sm font-medium">Wrap in Container</span>
                            <ToggleButton value={config.container !== false} onChange={v => updateConfig('container', v)} />
                        </div>
                    </div>
                    {config.autocomplete !== false && (
                        <Input label="Autocomplete Limit" type="number" value={config.autocomplete_limit || 8} onChange={v => updateConfig('autocomplete_limit', parseInt(v))} min={1} max={20} />
                    )}
                    <p className="text-xs text-gray-500 mt-2">This widget connects to the search API and shows autocomplete suggestions as users type.</p>
                </>
            );

        case 'search_filters':
            return (
                <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 text-xs italic">
                        This widget renders on the sidebar of catalog pages automatically. Configuration below affects its local behavior.
                    </div>
                    <Input label="Title" value={config.title || 'Filters'} onChange={v => updateConfig('title', v)} />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Collapsible</span>
                            <ToggleButton value={config.collapsible !== false} onChange={v => updateConfig('collapsible', v)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Show Item Count</span>
                            <ToggleButton value={config.showCount !== false} onChange={v => updateConfig('showCount', v)} />
                        </div>
                    </div>
                </div>
            );

        case 'newsletter':
            return (
                <div className="space-y-4">
                    <Input label="Title" value={config.title || 'Subscribe to our newsletter'} onChange={v => updateConfig('title', v)} />
                    <Input label="Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Placeholder" value={config.placeholder || 'Enter your email'} onChange={v => updateConfig('placeholder', v)} />
                        <Input label="Button Text" value={config.buttonText || 'Subscribe'} onChange={v => updateConfig('buttonText', v)} />
                    </div>
                </div>
            );

        case 'accordion':
            return (
                <div className="space-y-4">
                    <AccordionItemsEditor
                        value={config.items || []}
                        onChange={v => updateConfig('items', v)}
                    />
                </div>
            );

        case 'randomizer':
            return (
                <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <Input label="Admin Label" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. A/B Content Test" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Min to Display" type="number" value={config.minDisplay || 1} onChange={v => updateConfig('minDisplay', parseInt(v))} />
                        <Input label="Max to Display" type="number" value={config.maxDisplay || 1} onChange={v => updateConfig('maxDisplay', parseInt(v))} />
                    </div>
                </>
            );

        case 'search_results':
            return (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.showHeader !== false} onChange={e => updateConfig('showHeader', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Header (count + sort)</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.container !== false} onChange={e => updateConfig('container', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Wrap in Container</span>
                        </label>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Grid Columns</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label="Desktop" type="number" value={config.columns?.desktop || 4} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) })} min={1} max={6} />
                            <Input label="Tablet" type="number" value={config.columns?.tablet || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) })} min={1} max={6} />
                            <Input label="Mobile" type="number" value={config.columns?.mobile || 1} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) })} min={1} max={6} />
                        </div>
                    </div>
                </>
            );

        case 'search_page_layout':
            return (
                <div className="space-y-6">

                    {/* ── 1. Layout ── */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                        <h4 className="font-semibold text-sm text-blue-900 border-b border-blue-200 pb-2">Layout</h4>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Sidebar Filters (Desktop)</label>
                            <ToggleButton value={config.sidebarEnabled !== false} onChange={v => updateConfig('sidebarEnabled', v)} />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Mobile Filter Button</label>
                            <ToggleButton value={config.showFilters !== false} onChange={v => updateConfig('showFilters', v)} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Results Grid Columns</p>
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Desktop" type="number" value={config.columns?.desktop || 5} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) })} min={1} max={6} />
                                <Input label="Tablet" type="number" value={config.columns?.tablet || 3} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) })} min={1} max={6} />
                                <Input label="Mobile" type="number" value={config.columns?.mobile || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) })} min={1} max={6} />
                            </div>
                        </div>
                    </div>

                    {/* ── 2. Search UI ── */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
                        <h4 className="font-semibold text-sm text-purple-900 border-b border-purple-200 pb-2">Search UI</h4>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Show Search Bar</label>
                                <p className="text-xs text-gray-400">Text search input at the top of the page</p>
                            </div>
                            <ToggleButton value={config.showSearchBar !== false} onChange={v => updateConfig('showSearchBar', v)} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Show Image Search Bar</label>
                                <p className="text-xs text-gray-400">Upload an image to search by visual similarity</p>
                            </div>
                            <ToggleButton value={config.showImageSearchBar !== false} onChange={v => updateConfig('showImageSearchBar', v)} />
                        </div>
                    </div>

                    {/* ── 3. Results Header ── */}
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-4">
                        <h4 className="font-semibold text-sm text-amber-900 border-b border-amber-200 pb-2">Results Header</h4>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Show Active Filters Bar</label>
                                <p className="text-xs text-gray-400">Dismissible chips for each active filter</p>
                            </div>
                            <ToggleButton value={config.showActiveFiltersBar !== false} onChange={v => updateConfig('showActiveFiltersBar', v)} />
                        </div>
                    </div>

                    {/* ── 4. Product Card ── */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                        <h4 className="font-semibold text-sm text-gray-900 border-b border-gray-200 pb-2">Product Card</h4>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'showPrice', label: 'Price' },
                                { key: 'showAddToCart', label: 'Add to Cart' },
                                { key: 'showFeaturedBadge', label: 'Featured Badge' },
                                { key: 'showDeliveryBadge', label: 'Delivery Badges' },
                                { key: 'showDescription', label: 'Description' },
                                { key: 'showTags', label: 'Tags' },
                                { key: 'showAttributes', label: 'Attributes' },
                                { key: 'showSocialProof', label: 'Social Proof' },
                                { key: 'showRating', label: 'Rating ★' },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    <ToggleButton
                                        value={config[key] !== false && config[key] !== undefined ? config[key] : (key === 'showTags' || key === 'showAttributes' || key === 'showRating' ? false : true)}
                                        onChange={v => updateConfig(key, v)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Card Scale</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.2"
                                    step="0.05"
                                    value={config.cardScale ?? 0.9}
                                    onChange={e => updateConfig('cardScale', parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="text-sm font-mono font-bold text-gray-700 w-10 text-right">
                                    {(config.cardScale ?? 0.9).toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">Controls relative size of card content (0.5 = compact, 1.2 = large)</p>
                        </div>
                    </div>
                </div>
            );


        case 'featured_product':
            return (
                <div className="space-y-4">
                    <Input label="Section Title" value={config.title || 'Product of the Month'} onChange={v => updateConfig('title', v)} />
                    <Input label="Product ID (Manual Override)" value={config.productId || ''} onChange={v => updateConfig('productId', v)} placeholder="e.g. PRD-123" />
                    <p className="text-xs text-gray-500 italic">This widget displays a single prominent product. If Product ID is empty, the latest featured product will be shown.</p>
                </div>
            );

        default:
            return null;
    }
}

