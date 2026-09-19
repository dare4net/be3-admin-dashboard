"use client";

import { LayoutTemplate, Eye } from "lucide-react";
import ColorPicker from "@/components/config/ColorPicker";
import { Input, Select, CollapsibleSection, ToggleButton } from "./FormComponents";

export default function LayoutForms({
    widgetType,
    config,
    updateConfig,
    bannerGroups,
    openSections,
    toggleSection
}) {
    switch (widgetType) {
        case 'container':
            return (
                <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <Input label="Admin Label (Optional identification)" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Hero Container" />
                    </div>
                    <Select label="Width" value={config.width || 'container'} onChange={v => updateConfig('width', v)} options={[{ value: 'container', label: 'Fixed Container' }, { value: 'full', label: 'Full Width' }]} />
                    <Input label="Padding (e.g. 40px)" value={config.padding || ''} onChange={v => updateConfig('padding', v)} />
                    <Input label="Background Color" type="color" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
                </>
            );

        case 'columns':
            return (
                <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <Input label="Admin Label (Optional identification)" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Features Grid" />
                    </div>
                    <Select label="Columns" value={config.count || 3} onChange={v => updateConfig('count', parseInt(v))} options={[2, 3, 4, 5, 6].map(n => ({ value: n, label: `${n} Columns` }))} />
                    <Select label="Gap" value={config.gap || '4'} onChange={v => updateConfig('gap', v)} options={[{ value: '0', label: 'None' }, { value: '2', label: 'Small' }, { value: '4', label: 'Medium' }, { value: '8', label: 'Large' }, { value: '12', label: 'Huge' }]} />
                    <Select label="Vertical Align" value={config.align || 'start'} onChange={v => updateConfig('align', v)} options={[{ value: 'start', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }]} />
                </>
            );

        case 'grid':
            return (
                <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <Input label="Admin Label (Optional identification)" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Hero Grid" />
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Columns (Desktop)" type="number" value={config.columnCount || 3} onChange={v => updateConfig('columnCount', parseInt(v))} />
                            <Input label="Columns (Mobile)" type="number" value={config.mobileColumnCount || 1} onChange={v => updateConfig('mobileColumnCount', parseInt(v))} />
                        </div>
                        <Input label="Rows" type="number" value={config.rowCount || 1} onChange={v => updateConfig('rowCount', parseInt(v))} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Gap (px)" type="number" value={config.gap || 16} onChange={v => updateConfig('gap', parseInt(v))} />
                            <ColorPicker label="Background Color" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
                        </div>
                    </div>
                </>
            );

        case 'carousel_container':
            return (
                <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <Input label="Admin Label" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Testimonials Carousel" />
                    </div>

                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-100 mb-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-1 bg-pink-100 text-pink-600 rounded">
                                <LayoutTemplate size={16} />
                            </span>
                            <h4 className="font-bold text-sm text-pink-900">Dynamic Banners</h4>
                        </div>
                        <Select
                            label="Use Banner Group"
                            value={config.bannerGroupId || ''}
                            onChange={v => updateConfig('bannerGroupId', v)}
                            options={[
                                { value: '', label: 'None (Use Widget Children)' },
                                ...bannerGroups.map(bg => ({ value: bg.id, label: bg.name }))
                            ]}
                        />
                    </div>

                    <CollapsibleSection
                        title="Carousel Configuration"
                        icon={<LayoutTemplate size={18} />}
                        isOpen={openSections.layout}
                        onToggle={() => toggleSection('layout')}
                    >
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visible Items per Breakpoint</h5>
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Desktop" type="number" value={config.itemsPerRowDesktop || 4} onChange={v => updateConfig('itemsPerRowDesktop', parseInt(v))} />
                                <Input label="Tablet" type="number" value={config.itemsPerRowTablet || 3} onChange={v => updateConfig('itemsPerRowTablet', parseInt(v))} />
                                <Input label="Mobile" type="number" value={config.itemsPerRowMobile || 2} onChange={v => updateConfig('itemsPerRowMobile', parseInt(v))} />
                            </div>
                        </div>

                        <div className="pt-4 space-y-4 border-t border-gray-100">
                            <Select label="Gap Between Items" value={config.gap || 'md'} onChange={v => updateConfig('gap', v)} options={[
                                { value: 'sm', label: 'Small' },
                                { value: 'md', label: 'Medium' },
                                { value: 'lg', label: 'Large' },
                                { value: 'xl', label: 'Extra Large' }
                            ]} />
                            <Input label="Padding (e.g. py-8)" value={config.padding || 'py-8'} onChange={v => updateConfig('padding', v)} />
                            <ColorPicker label="Background Color" value={config.backgroundColor || 'transparent'} onChange={v => updateConfig('backgroundColor', v)} />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Playback & Controls"
                        icon={<Eye size={18} />}
                        isOpen={openSections.interaction}
                        onToggle={() => toggleSection('interaction')}
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">Infinite Loop</span>
                                    <ToggleButton value={config.infiniteLoop !== false} onChange={v => updateConfig('infiniteLoop', v)} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">Show Dots</span>
                                    <ToggleButton value={config.showDots !== false} onChange={v => updateConfig('showDots', v)} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-blue-900">Sneak Peek</span>
                                        <span className="text-[10px] text-blue-700">Partially show next item</span>
                                    </div>
                                    <ToggleButton value={config.peekEffect || false} onChange={v => updateConfig('peekEffect', v)} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">Autoplay</span>
                                    <ToggleButton value={config.autoPlay || false} onChange={v => updateConfig('autoPlay', v)} />
                                </div>
                            </div>

                            {config.autoPlay && (
                                <Input label="Autoplay Interval (ms)" type="number" value={config.autoPlayInterval || 3000} onChange={v => updateConfig('autoPlayInterval', parseInt(v))} />
                            )}

                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                <Select label="Navigation Arrows" value={config.showArrows || 'hover'} onChange={v => updateConfig('showArrows', v)} options={[
                                    { value: 'always', label: 'Always Visible' },
                                    { value: 'hover', label: 'Visible on Hover' },
                                    { value: 'never', label: 'Hidden' }
                                ]} />
                                <Input label="Transition Speed (ms)" type="number" value={config.transitionDuration || 500} onChange={v => updateConfig('transitionDuration', parseInt(v))} />
                            </div>
                        </div>
                    </CollapsibleSection>
                </>
            );

        default:
            return null;
    }
}
