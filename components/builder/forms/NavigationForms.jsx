"use client";

import ColorPicker from "@/components/config/ColorPicker";
import { ToggleButton, Input, Select, AnnouncementMessagesEditor, IconSelector } from "./FormComponents";
import Link from "next/link";
import { ExternalLink, Menu as MenuIcon } from "lucide-react";

export default function NavigationForms({
    widgetType,
    config,
    updateConfig,
    menus = []
}) {
    switch (widgetType) {
        case 'header_nav': {
            // Build dynamic options from live menus
            const dynamicMenuOptions = [
                { value: 'header', label: 'Default: Primary Header Menu' },
                { value: 'secondary', label: 'Secondary / Top Header Menu' },
                { value: 'mobile', label: 'Mobile Drawer Menu' },
                ...menus.map(m => ({
                    value: m.location || m.id,
                    label: `📂 ${m.name || 'Untitled Menu'} (${m.location || 'custom'})`
                }))
            ];

            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Navigation Menu Source</label>
                        <Link
                            href="/dashboard/storefront/menus"
                            target="_blank"
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                        >
                            Manage Menus <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>

                    <Select
                        label="Assigned Navigation Menu"
                        value={config.menuLocation || 'header'}
                        onChange={v => updateConfig('menuLocation', v)}
                        options={dynamicMenuOptions}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Nav Alignment"
                            value={config.align || 'left'}
                            onChange={v => updateConfig('align', v)}
                            options={[
                                { value: 'left', label: 'Left Aligned' },
                                { value: 'center', label: 'Centered' },
                                { value: 'right', label: 'Right Aligned' }
                            ]}
                        />
                        <Select
                            label="Dropdown Style"
                            value={config.dropdownStyle || 'mega'}
                            onChange={v => updateConfig('dropdownStyle', v)}
                            options={[
                                { value: 'mega', label: 'Rich Mega-Menu' },
                                { value: 'compact', label: 'Compact Dropdown' }
                            ]}
                        />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                        <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider">Subcategory Auto-Dropdown</h4>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Auto-Expand Child Categories</p>
                                <p className="text-xs text-gray-500">Automatically show catalog subcategories on hover</p>
                            </div>
                            <ToggleButton
                                value={config.autoExpandSubcategories !== false}
                                onChange={v => updateConfig('autoExpandSubcategories', v)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Hover Animation"
                            value={config.hoverStyle || 'underline'}
                            onChange={v => updateConfig('hoverStyle', v)}
                            options={[
                                { value: 'underline', label: 'Accent Underline' },
                                { value: 'pill', label: 'Pill Background' },
                                { value: 'glow', label: 'Text Highlight' }
                            ]}
                        />
                        <Input
                            label="Item Spacing (px)"
                            type="number"
                            value={config.spacing || 28}
                            onChange={v => updateConfig('spacing', parseInt(v))}
                        />
                    </div>
                </div>
            );
        }

        case 'header_actions':
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium">Cart Icon</span>
                            <ToggleButton value={config.showCart !== false} onChange={v => updateConfig('showCart', v)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium">Account Icon</span>
                            <ToggleButton value={config.showAccount !== false} onChange={v => updateConfig('showAccount', v)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium">Search Icon</span>
                            <ToggleButton value={config.showSearch !== false} onChange={v => updateConfig('showSearch', v)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium">Wishlist Icon</span>
                            <ToggleButton value={config.showWishlist !== false} onChange={v => updateConfig('showWishlist', v)} />
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                        <h4 className="font-medium text-xs text-blue-900 uppercase">Style</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Button Style" value={config.style || 'ghost'} onChange={v => updateConfig('style', v)} options={[
                                { value: 'ghost', label: 'Ghost' },
                                { value: 'outline', label: 'Outline' },
                                { value: 'filled', label: 'Filled' }
                            ]} />
                            <Input label="Icon Size (px)" type="number" value={config.iconSize || 20} onChange={v => updateConfig('iconSize', parseInt(v))} />
                        </div>
                    </div>
                </div>
            );

        case 'footer_column': {
            const footerMenuOptions = [
                ...[1, 2, 3, 4, 5, 6].map(n => ({ value: `footer_${n}`, label: `Default Footer Column ${n}` })),
                ...menus.map(m => ({
                    value: m.location || m.id,
                    label: `📂 Menu: ${m.name || 'Untitled'} (${m.location || 'custom'})`
                }))
            ];

            return (
                <div className="space-y-4">
                    <Input label="Column Title" value={config.title || ''} onChange={v => updateConfig('title', v)} placeholder="e.g. Quick Links / Shop / About" />
                    
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Footer Menu Source</label>
                        <Link
                            href="/dashboard/storefront/menus"
                            target="_blank"
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                        >
                            Manage Menus <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>

                    <Select
                        label="Assigned Menu / Column"
                        value={config.menuLocation || 'footer_1'}
                        onChange={v => updateConfig('menuLocation', v)}
                        options={footerMenuOptions}
                    />

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-sm font-medium">Show Social Media Links</span>
                        <ToggleButton value={config.showSocials || false} onChange={v => updateConfig('showSocials', v)} />
                    </div>
                </div>
            );
        }

        case 'announcement_bar':
            return (
                <>
                    <AnnouncementMessagesEditor
                        value={config.messages || (config.message ? [{ text: config.message, link: config.link || '', linkText: 'Learn More' }] : [])}
                        onChange={v => updateConfig('messages', v)}
                    />

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.autoRotate !== false} onChange={e => updateConfig('autoRotate', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">🔄 Auto-Rotate Messages</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.dismissible !== false} onChange={e => updateConfig('dismissible', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">❌ Dismissible</span>
                        </label>
                        <Input label="Rotate Interval (ms)" type="number" value={config.rotateInterval || 3000} onChange={v => updateConfig('rotateInterval', parseInt(v))} disabled={!config.autoRotate} />
                        <Input label="Dismiss Duration (days)" type="number" value={config.dismissCookieDuration || 7} onChange={v => updateConfig('dismissCookieDuration', parseInt(v))} />
                    </div>

                    <div className="mt-4 space-y-4">
                        <IconSelector label="Icon (optional)" value={config.icon || ''} onChange={v => updateConfig('icon', v)} />

                        {/* Color Settings — Theme toggle */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">Use Theme Colors</p>
                                    <p className="text-xs text-blue-600 mt-0.5">Automatically follows your active theme's primary color</p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={!config.backgroundColor || config.backgroundColor === 'var(--primary)'}
                                    onClick={() => {
                                        const isUsingTheme = !config.backgroundColor || config.backgroundColor === 'var(--primary)';
                                        if (isUsingTheme) {
                                            // Switch to manual — set a default hex so color picker has something to show
                                            updateConfig('backgroundColor', '#1d4ed8');
                                            updateConfig('textColor', '#ffffff');
                                        } else {
                                            // Switch to theme
                                            updateConfig('backgroundColor', 'var(--primary)');
                                            updateConfig('textColor', 'var(--primary-foreground, #ffffff)');
                                        }
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        !config.backgroundColor || config.backgroundColor === 'var(--primary)'
                                            ? 'bg-blue-600'
                                            : 'bg-gray-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                        !config.backgroundColor || config.backgroundColor === 'var(--primary)'
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Only show manual pickers when not using theme */}
                            {config.backgroundColor && config.backgroundColor !== 'var(--primary)' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <ColorPicker
                                        label="Background Color"
                                        value={config.backgroundColor}
                                        onChange={v => updateConfig('backgroundColor', v)}
                                    />
                                    <ColorPicker
                                        label="Text Color"
                                        value={config.textColor || '#ffffff'}
                                        onChange={v => updateConfig('textColor', v)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            );

        default:
            return null;
    }
}
