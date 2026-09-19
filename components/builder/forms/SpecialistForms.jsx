"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Image as ImageIcon, Sparkles, Star, CheckCircle, Video, Code, ShieldCheck } from "lucide-react";
import { AccordionItemsEditor, TabsEditor } from "@/components/config/ContentArrayEditors";
import ColorPicker from "@/components/config/ColorPicker";
import ImageUploader from "@/components/config/ImageUploader";
import IconSelector from "@/components/config/IconSelector";
import { Input, Select, ToggleButton, CollapsibleSection } from "./FormComponents";

export default function SpecialistForms({
    widgetType,
    config = {},
    updateConfig,
    updateNestedConfig,
    menus = [],
    bannerGroups = [],
    openSections = {},
    toggleSection = () => { }
}) {
    switch (widgetType) {
        // ── 1. COUNTDOWN TIMER ──
        case 'countdown_timer':
            return (
                <div className="space-y-4">
                    <Input
                        label="Title"
                        value={config.title || ''}
                        onChange={v => updateConfig('title', v)}
                        placeholder="e.g. Flash Sale Ending Soon!"
                    />
                    <Input
                        label="Subtitle"
                        value={config.subtitle || ''}
                        onChange={v => updateConfig('subtitle', v)}
                        placeholder="e.g. Grab your favorites before time runs out"
                    />

                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Target Date & Time</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Target Date/Time (UTC/ISO)"
                                type="text"
                                value={config.targetDate || '2026-12-31T23:59:59'}
                                onChange={v => updateConfig('targetDate', v)}
                                placeholder="YYYY-MM-DDTHH:mm:ss"
                            />
                            <Select
                                label="Timezone"
                                value={config.timezone || 'UTC'}
                                onChange={v => updateConfig('timezone', v)}
                                options={[
                                    { value: 'UTC', label: 'UTC' },
                                    { value: 'GMT', label: 'GMT' },
                                    { value: 'EST', label: 'EST / Eastern' },
                                    { value: 'PST', label: 'PST / Pacific' },
                                    { value: 'WAT', label: 'WAT / West Africa' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Display Units</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'showDays', label: 'Show Days' },
                                { key: 'showHours', label: 'Show Hours' },
                                { key: 'showMinutes', label: 'Show Minutes' },
                                { key: 'showSeconds', label: 'Show Seconds' },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    <ToggleButton value={config[key] !== false} onChange={v => updateConfig(key, v)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Layout"
                            value={config.layout || 'horizontal'}
                            onChange={v => updateConfig('layout', v)}
                            options={[
                                { value: 'horizontal', label: 'Horizontal Row' },
                                { value: 'vertical', label: 'Vertical Stack' },
                                { value: 'circular', label: 'Circular Badges' }
                            ]}
                        />
                        <Select
                            label="Color Scheme"
                            value={config.colorScheme || 'primary'}
                            onChange={v => updateConfig('colorScheme', v)}
                            options={[
                                { value: 'primary', label: 'Theme Primary' },
                                { value: 'danger', label: 'Urgent Red' },
                                { value: 'success', label: 'Active Green' },
                                { value: 'custom', label: 'Gradient Accent' }
                            ]}
                        />
                    </div>

                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 space-y-3">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">When Timer Expires</h4>
                        <Select
                            label="Expiry Action"
                            value={config.onExpiry?.action || 'hide'}
                            onChange={v => updateNestedConfig('onExpiry.action', v)}
                            options={[
                                { value: 'hide', label: 'Hide Countdown' },
                                { value: 'show-message', label: 'Show Expired Message' },
                                { value: 'redirect', label: 'Redirect to URL' }
                            ]}
                        />
                        {config.onExpiry?.action === 'show-message' && (
                            <Input
                                label="Message"
                                value={config.onExpiry?.message || 'Sale Ended!'}
                                onChange={v => updateNestedConfig('onExpiry.message', v)}
                            />
                        )}
                        {config.onExpiry?.action === 'redirect' && (
                            <Input
                                label="Redirect URL"
                                value={config.onExpiry?.redirectUrl || ''}
                                onChange={v => updateNestedConfig('onExpiry.redirectUrl', v)}
                                placeholder="e.g. /products"
                            />
                        )}
                    </div>
                </div>
            );

        // ── 2. BEFORE / AFTER SLIDER ──
        case 'before_after_slider':
            return (
                <div className="space-y-4">
                    <Input
                        label="Section Title (Optional)"
                        value={config.title || ''}
                        onChange={v => updateConfig('title', v)}
                        placeholder="e.g. See The Difference"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Before Image</h4>
                            <ImageUploader
                                label="Upload Before Image"
                                value={config.beforeImage?.url || ''}
                                onChange={url => updateNestedConfig('beforeImage.url', url)}
                                folder="storefront/before_after"
                            />
                            <Input
                                label="Before Label"
                                value={config.beforeImage?.label || 'Before'}
                                onChange={v => updateNestedConfig('beforeImage.label', v)}
                            />
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">After Image</h4>
                            <ImageUploader
                                label="Upload After Image"
                                value={config.afterImage?.url || ''}
                                onChange={url => updateNestedConfig('afterImage.url', url)}
                                folder="storefront/before_after"
                            />
                            <Input
                                label="After Label"
                                value={config.afterImage?.label || 'After'}
                                onChange={v => updateNestedConfig('afterImage.label', v)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Initial Split Position (%)"
                            type="number"
                            value={config.defaultPosition || 50}
                            onChange={v => updateConfig('defaultPosition', parseInt(v))}
                            min={0}
                            max={100}
                        />
                        <Select
                            label="Orientation"
                            value={config.orientation || 'horizontal'}
                            onChange={v => updateConfig('orientation', v)}
                            options={[
                                { value: 'horizontal', label: 'Left / Right Split' },
                                { value: 'vertical', label: 'Top / Bottom Split' }
                            ]}
                        />
                    </div>
                </div>
            );

        // ── 3. TABS ──
        case 'tabs':
            return (
                <div className="space-y-4">
                    <TabsEditor
                        value={config.tabs || [
                            { id: 'tab1', label: 'Overview', content: 'Product overview content.' },
                            { id: 'tab2', label: 'Specifications', content: 'Detailed technical specs.' }
                        ]}
                        onChange={v => updateConfig('tabs', v)}
                    />

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Select
                            label="Tab Position"
                            value={config.tabPosition || 'top'}
                            onChange={v => updateConfig('tabPosition', v)}
                            options={[
                                { value: 'top', label: 'Top' },
                                { value: 'left', label: 'Left (Sidebar)' },
                                { value: 'right', label: 'Right' },
                                { value: 'bottom', label: 'Bottom' }
                            ]}
                        />
                        <Select
                            label="Tab Style"
                            value={config.tabStyle || 'underline'}
                            onChange={v => updateConfig('tabStyle', v)}
                            options={[
                                { value: 'underline', label: 'Underline Highlight' },
                                { value: 'pills', label: 'Rounded Pills' },
                                { value: 'boxed', label: 'Boxed Tabs' }
                            ]}
                        />
                    </div>

                    {menus.length > 0 && (
                        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                            <span className="text-xs font-bold text-indigo-900 uppercase">Optional Menu Link</span>
                            <Select
                                label="Populate from Menu (Auto)"
                                value={config.menuId || ''}
                                onChange={v => updateConfig('menuId', v)}
                                options={[
                                    { value: '', label: 'None (Use Custom Tabs Above)' },
                                    ...menus.map(m => ({ value: m.id || m.location, label: m.name || m.location }))
                                ]}
                            />
                        </div>
                    )}
                </div>
            );

        // ── 4. FEATURES / USP GRID ──
        case 'features':
            return <FeaturesEditor config={config} updateConfig={updateConfig} />;

        // ── 5. TESTIMONIALS & REVIEWS ──
        case 'testimonials':
            return <TestimonialsEditor config={config} updateConfig={updateConfig} />;

        // ── 6. STATS / COUNTERS ──
        case 'stats':
            return <StatsEditor config={config} updateConfig={updateConfig} />;

        // ── 7. FAQ ──
        case 'faq':
            return (
                <div className="space-y-4">
                    <Input
                        label="FAQ Section Title"
                        value={config.title || 'Frequently Asked Questions'}
                        onChange={v => updateConfig('title', v)}
                    />
                    <AccordionItemsEditor
                        value={config.faqs || config.items || [
                            { title: 'How long does delivery take?', content: 'Standard shipping takes 3-5 business days.' },
                            { title: 'What is your refund policy?', content: 'We offer a 30-day no-questions-asked refund guarantee.' }
                        ]}
                        onChange={v => {
                            updateConfig('faqs', v);
                            updateConfig('items', v);
                        }}
                    />
                </div>
            );

        // ── 8. ABOUT US / STORY ──
        case 'about':
            return (
                <div className="space-y-4">
                    <Input
                        label="Title"
                        value={config.title || 'Our Story'}
                        onChange={v => updateConfig('title', v)}
                    />
                    <Input
                        label="Subtitle"
                        value={config.subtitle || 'Built for shoppers, powered by passion'}
                        onChange={v => updateConfig('subtitle', v)}
                    />
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">About Story Content</label>
                        <textarea
                            value={config.content || ''}
                            onChange={e => updateConfig('content', e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Write your brand's mission and story..."
                        />
                    </div>
                    <ImageUploader
                        label="Featured Brand Image"
                        value={config.image || ''}
                        onChange={url => updateConfig('image', url)}
                        folder="storefront/about"
                    />
                </div>
            );

        // ── 9. BLOG GRID ──
        case 'blog_grid':
            return (
                <div className="space-y-4">
                    <Input
                        label="Section Title"
                        value={config.title || 'Latest Articles'}
                        onChange={v => updateConfig('title', v)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Post Limit"
                            type="number"
                            value={config.limit || 3}
                            onChange={v => updateConfig('limit', parseInt(v))}
                            min={1}
                            max={12}
                        />
                        <Select
                            label="Layout Mode"
                            value={config.layout || 'grid'}
                            onChange={v => updateConfig('layout', v)}
                            options={[
                                { value: 'grid', label: 'Cards Grid' },
                                { value: 'list', label: 'Stacked List' }
                            ]}
                        />
                    </div>
                </div>
            );

        // ── 10. CUSTOM HTML ──
        case 'custom_html':
            return (
                <div className="space-y-4">
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                        ⚠️ Custom HTML is rendered as raw markup on your storefront. Ensure tags are safe and correctly closed.
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Raw HTML Code</label>
                        <textarea
                            value={config.html || ''}
                            onChange={e => updateConfig('html', e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 font-mono text-xs border border-gray-300 rounded-lg bg-gray-900 text-green-400"
                            placeholder="<div>\n  <h3>Custom Banner</h3>\n</div>"
                        />
                    </div>
                </div>
            );

        // ── 11. TRUST BADGES ──
        case 'trust_badges':
            return <TrustBadgesEditor config={config} updateConfig={updateConfig} />;

        // ── 12. VIDEO ──
        case 'video':
            return (
                <div className="space-y-4">
                    <Input
                        label="Video Title (Optional)"
                        value={config.title || ''}
                        onChange={v => updateConfig('title', v)}
                    />
                    <Input
                        label="Video URL (YouTube, Vimeo, or MP4 Link)"
                        value={config.url || ''}
                        onChange={v => updateConfig('url', v)}
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium">Autoplay</span>
                            <ToggleButton value={config.autoplay || false} onChange={v => updateConfig('autoplay', v)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium">Loop</span>
                            <ToggleButton value={config.loop !== false} onChange={v => updateConfig('loop', v)} />
                        </div>
                    </div>
                </div>
            );

        // ── 13. GALLERY ──
        case 'gallery':
            return <GalleryEditor config={config} updateConfig={updateConfig} />;

        // ── 14. SEARCH BAR ──
        case 'search_bar':
            return (
                <div className="space-y-4">
                    <Input label="Placeholder Text" value={config.placeholder || 'Search products…'} onChange={v => updateConfig('placeholder', v)} />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                            <span className="text-sm font-medium">Enable Autocomplete</span>
                            <ToggleButton value={config.autocomplete !== false} onChange={v => updateConfig('autocomplete', v)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                            <span className="text-sm font-medium">Wrap in Container</span>
                            <ToggleButton value={config.container !== false} onChange={v => updateConfig('container', v)} />
                        </div>
                    </div>
                    {config.autocomplete !== false && (
                        <Input label="Autocomplete Limit" type="number" value={config.autocomplete_limit || 8} onChange={v => updateConfig('autocomplete_limit', parseInt(v))} min={1} max={20} />
                    )}
                </div>
            );

        // ── 15. SEARCH FILTERS ──
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

        // ── 16. NEWSLETTER ──
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

        // ── 17. ACCORDION ──
        case 'accordion':
            return (
                <div className="space-y-4">
                    <AccordionItemsEditor
                        value={config.items || []}
                        onChange={v => updateConfig('items', v)}
                    />
                </div>
            );

        // ── 18. RANDOMIZER ──
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

        // ── 19. SEARCH RESULTS ──
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

        // ── 20. SEARCH PAGE LAYOUT ──
        case 'search_page_layout':
            return (
                <div className="space-y-6">
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
                </div>
            );

        // ── 21. FEATURED PRODUCT ──
        case 'featured_product':
            return (
                <div className="space-y-4">
                    <Input label="Section Title" value={config.title || 'Product of the Month'} onChange={v => updateConfig('title', v)} />
                    <Input label="Product ID (Manual Override)" value={config.productId || ''} onChange={v => updateConfig('productId', v)} placeholder="e.g. PRD-123" />
                </div>
            );

        default:
            return (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                    <p className="font-medium text-gray-900 mb-1">Standard Configuration</p>
                    <p className="text-xs text-gray-500">Edit the title or attributes above, or use custom styling.</p>
                </div>
            );
    }
}

// ── Sub-Editor: Features Array ──
function FeaturesEditor({ config, updateConfig }) {
    const features = config.features || [
        { icon: 'ShieldCheck', title: 'Secure Checkout', description: 'Bank-grade SSL encrypted payments' },
        { icon: 'Truck', title: 'Fast Delivery', description: 'Dispatched within 24 hours' }
    ];
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addFeature = () => {
        updateConfig('features', [
            ...features,
            { icon: 'Sparkles', title: 'New Feature', description: 'Feature description here' }
        ]);
    };

    const updateFeature = (index, updates) => {
        const next = [...features];
        next[index] = { ...next[index], ...updates };
        updateConfig('features', next);
    };

    const removeFeature = (index) => {
        updateConfig('features', features.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Feature Items ({features.length})</label>
                <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Feature
                </button>
            </div>

            <div className="space-y-3">
                {features.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <p className="font-bold text-sm text-gray-900">{item.title || `Feature ${index + 1}`}</p>
                                <p className="text-xs text-gray-500 truncate">{item.description}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFeature(index); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                                <IconSelector
                                    label="Icon"
                                    value={item.icon || 'Star'}
                                    onChange={icon => updateFeature(index, { icon })}
                                />
                                <Input
                                    label="Title"
                                    value={item.title || ''}
                                    onChange={title => updateFeature(index, { title })}
                                />
                                <Input
                                    label="Description"
                                    value={item.description || ''}
                                    onChange={description => updateFeature(index, { description })}
                                />
                                <Input
                                    label="Optional Link URL"
                                    value={item.link || ''}
                                    onChange={link => updateFeature(index, { link })}
                                    placeholder="e.g. /about"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Sub-Editor: Testimonials Array ──
function TestimonialsEditor({ config, updateConfig }) {
    const list = config.testimonials || [
        { name: 'Sarah Jenkins', role: 'Verified Buyer', content: 'Absolute game changer. Incredible quality and fast shipping!', rating: 5 }
    ];
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addReview = () => {
        updateConfig('testimonials', [
            ...list,
            { name: 'Customer Name', role: 'Verified Buyer', content: 'Loved the service and product!', rating: 5 }
        ]);
    };

    const updateReview = (index, updates) => {
        const next = [...list];
        next[index] = { ...next[index], ...updates };
        updateConfig('testimonials', next);
    };

    const removeReview = (index) => {
        updateConfig('testimonials', list.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Reviews ({list.length})</label>
                <button
                    type="button"
                    onClick={addReview}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Review
                </button>
            </div>

            <div className="space-y-3">
                {list.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <p className="font-bold text-sm text-gray-900">{item.name || `Reviewer ${index + 1}`}</p>
                                <p className="text-xs text-amber-600">{'★'.repeat(item.rating || 5)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeReview(index); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Name"
                                        value={item.name || ''}
                                        onChange={name => updateReview(index, { name })}
                                    />
                                    <Input
                                        label="Role / Subtitle"
                                        value={item.role || ''}
                                        onChange={role => updateReview(index, { role })}
                                    />
                                </div>
                                <Input
                                    label="Rating (1-5)"
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={item.rating || 5}
                                    onChange={v => updateReview(index, { rating: parseInt(v) })}
                                />
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">Review Content</label>
                                    <textarea
                                        value={item.content || ''}
                                        onChange={e => updateReview(index, { content: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Sub-Editor: Stats Array ──
function StatsEditor({ config, updateConfig }) {
    const list = config.stats || [
        { label: 'Happy Customers', value: '50,000+' },
        { label: 'Products Shipped', value: '120k+' },
        { label: '5-Star Ratings', value: '4.9/5' }
    ];
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addStat = () => {
        updateConfig('stats', [...list, { label: 'New Metric', value: '100+' }]);
    };

    const updateStat = (index, updates) => {
        const next = [...list];
        next[index] = { ...next[index], ...updates };
        updateConfig('stats', next);
    };

    const removeStat = (index) => {
        updateConfig('stats', list.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Stats Counters ({list.length})</label>
                <button
                    type="button"
                    onClick={addStat}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Metric
                </button>
            </div>

            <div className="space-y-3">
                {list.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <span className="font-bold text-sm text-blue-600 mr-2">{item.value}</span>
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeStat(index); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Value / Number"
                                        value={item.value || ''}
                                        onChange={value => updateStat(index, { value })}
                                        placeholder="e.g. 50k+"
                                    />
                                    <Input
                                        label="Label"
                                        value={item.label || ''}
                                        onChange={label => updateStat(index, { label })}
                                        placeholder="e.g. Happy Shoppers"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Sub-Editor: Trust Badges ──
function TrustBadgesEditor({ config, updateConfig }) {
    return (
        <div className="space-y-4">
            <Select
                label="Badge Presentation Style"
                value={config.style || 'simple'}
                onChange={v => updateConfig('style', v)}
                options={[
                    { value: 'simple', label: 'Simple Inline Icons' },
                    { value: 'cards', label: 'Feature Cards' },
                    { value: 'seals', label: 'Security Seals & Cards' }
                ]}
            />
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Badges</h4>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: 'showShipping', label: 'Free Worldwide Shipping' },
                        { key: 'showSecure', label: '256-Bit SSL Encryption' },
                        { key: 'showGuarantee', label: '30-Day Money Back' },
                        { key: 'showSupport', label: '24/7 Dedicated Support' },
                    ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                            <ToggleButton value={config[key] !== false} onChange={v => updateConfig(key, v)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Sub-Editor: Gallery Images ──
function GalleryEditor({ config, updateConfig }) {
    const images = config.images || [];
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addImage = () => {
        updateConfig('images', [...images, { url: '', caption: '', alt: '' }]);
    };

    const updateImage = (index, updates) => {
        const next = [...images];
        next[index] = { ...next[index], ...updates };
        updateConfig('images', next);
    };

    const removeImage = (index) => {
        updateConfig('images', images.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Gallery Images ({images.length})</label>
                <button
                    type="button"
                    onClick={addImage}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Image
                </button>
            </div>

            <div className="space-y-3">
                {images.map((img, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            {img.url ? (
                                <img src={img.url} alt="" className="w-8 h-8 rounded object-cover border" />
                            ) : (
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                            )}
                            <div className="flex-1 truncate">
                                <p className="font-bold text-sm text-gray-900 truncate">{img.caption || `Image ${index + 1}`}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-4 space-y-3 bg-white border-t border-gray-100">
                                <ImageUploader
                                    label="Image"
                                    value={img.url || ''}
                                    onChange={url => updateImage(index, { url })}
                                    folder="storefront/gallery"
                                />
                                <Input
                                    label="Caption"
                                    value={img.caption || ''}
                                    onChange={caption => updateImage(index, { caption })}
                                    placeholder="Optional caption"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
