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
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                        <h4 className="font-semibold text-sm text-blue-900 border-b pb-2">Layout Configuration</h4>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Display Sidebar Filters</label>
                            <ToggleButton
                                value={config.sidebarEnabled !== false}
                                onChange={v => updateConfig('sidebarEnabled', v)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Show Mobile Filters</label>
                            <ToggleButton
                                value={config.showFilters !== false}
                                onChange={v => updateConfig('showFilters', v)}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                        <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Results Grid (Columns)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Desktop" type="number" value={config.columns?.desktop || 5} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) })} min={1} max={6} />
                            <Input label="Tablet" type="number" value={config.columns?.tablet || 3} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) })} min={1} max={6} />
                            <Input label="Mobile" type="number" value={config.columns?.mobile || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) })} min={1} max={6} />
                        </div>
                        <p className="text-xs text-gray-500 italic">Adjust how many products appear per row in the search results.</p>
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

