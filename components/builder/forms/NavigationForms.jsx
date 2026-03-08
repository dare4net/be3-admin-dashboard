"use client";

import ColorPicker from "@/components/config/ColorPicker";
import { ToggleButton, Input, Select, AnnouncementMessagesEditor, IconSelector } from "./FormComponents";

export default function NavigationForms({
    widgetType,
    config,
    updateConfig
}) {
    switch (widgetType) {
        case 'header_nav':
            return (
                <>
                    <Select label="Menu Location" value={config.menuLocation || 'header'} onChange={v => updateConfig('menuLocation', v)} options={[{ value: 'header', label: 'Primary Header' }, { value: 'secondary', label: 'Secondary Header' }, { value: 'mobile', label: 'Mobile Menu' }]} />
                    <Select label="Alignment" value={config.align || 'center'} onChange={v => updateConfig('align', v)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
                </>
            );

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

        case 'footer_column':
            return (
                <div className="space-y-4">
                    <Input label="Column Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Select label="Menu View" value={config.menuLocation || 'footer_1'} onChange={v => updateConfig('menuLocation', v)} options={[1, 2, 3, 4, 5, 6].map(n => ({ value: `footer_${n}`, label: `Footer Column ${n}` }))} />
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <span className="text-sm">Show Social Icons</span>
                        <ToggleButton value={config.showSocials || false} onChange={v => updateConfig('showSocials', v)} />
                    </div>
                </div>
            );

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
                            <input type="checkbox" checked={config.sticky || false} onChange={e => updateConfig('sticky', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">📌 Sticky (Fixed Position)</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={config.dismissible !== false} onChange={e => updateConfig('dismissible', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">❌ Dismissible</span>
                        </label>
                        <Input label="Rotate Interval (ms)" type="number" value={config.rotateInterval || 3000} onChange={v => updateConfig('rotateInterval', parseInt(v))} disabled={!config.autoRotate} />
                    </div>

                    <div className="mt-4 space-y-4">
                        <Input label="Dismiss Cookie Duration (days)" type="number" value={config.dismissCookieDuration || 7} onChange={v => updateConfig('dismissCookieDuration', parseInt(v))} />

                        <Select label="Position" value={config.position || 'top'} onChange={v => updateConfig('position', v)} options={[
                            { value: 'top', label: '⬆️ Top of page' },
                            { value: 'bottom', label: '⬇️ Bottom of page' }
                        ]} />

                        <IconSelector label="Icon (optional)" value={config.icon || ''} onChange={v => updateConfig('icon', v)} />

                        <div className="grid grid-cols-2 gap-4">
                            <ColorPicker
                                label="Background Color"
                                value={config.backgroundColor || '#3b82f6'}
                                onChange={v => updateConfig('backgroundColor', v)}
                            />
                            <ColorPicker
                                label="Text Color"
                                value={config.textColor || '#ffffff'}
                                onChange={v => updateConfig('textColor', v)}
                            />
                        </div>
                    </div>
                </>
            );

        default:
            return null;
    }
}
