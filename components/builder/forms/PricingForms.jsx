"use client";

import { Sparkles } from "lucide-react";
import ColorPicker from "@/components/config/ColorPicker";
import PricingPlansEditor from "@/components/config/PricingPlansEditor";
import { Input, Select, CollapsibleSection, ToggleButton } from "./FormComponents";

export default function PricingForms({
    widgetType,
    config,
    updateConfig,
    updateNestedConfig,
    openSections,
    toggleSection
}) {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <Input label="Admin Label" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Subscription Tiers" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                <Input label="Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} />
            </div>

            <PricingPlansEditor
                value={config.plans || []}
                onChange={v => updateConfig('plans', v)}
            />

            <div className="grid grid-cols-3 gap-3">
                <Input label="Cols (PC)" type="number" value={config.columns?.desktop || 3} onChange={v => updateNestedConfig('columns.desktop', parseInt(v))} />
                <Input label="Cols (Tab)" type="number" value={config.columns?.tablet || 2} onChange={v => updateNestedConfig('columns.tablet', parseInt(v))} />
                <Input label="Cols (Mob)" type="number" value={config.columns?.mobile || 1} onChange={v => updateNestedConfig('columns.mobile', parseInt(v))} />
            </div>

            <Select label="Standard Style" value={config.style || 'modern'} onChange={v => updateConfig('style', v)} options={[
                { value: 'modern', label: 'Modern Cards' },
                { value: 'simple', label: 'Simple Borders' }
            ]} />

            <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">💰 Billing Toggle</span>
                        <span className="text-[10px] text-gray-500">Allow users to switch Monthly / Yearly</span>
                    </div>
                    <ToggleButton
                        value={config.billingToggle?.enabled}
                        onChange={v => updateNestedConfig('billingToggle.enabled', v)}
                    />
                </div>

                {config.billingToggle?.enabled && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Monthly Label" value={config.billingToggle?.monthlyLabel || 'Monthly'} onChange={v => updateNestedConfig('billingToggle.monthlyLabel', v)} />
                            <Input label="Yearly Label" value={config.billingToggle?.yearlyLabel || 'Yearly'} onChange={v => updateNestedConfig('billingToggle.yearlyLabel', v)} />
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <Input
                                label="Yearly Discount %"
                                type="number"
                                value={config.billingToggle?.yearlyDiscount || 20}
                                onChange={v => updateNestedConfig('billingToggle.yearlyDiscount', parseInt(v))}
                            />
                            <p className="text-[10px] text-green-700 mt-1 italic">Calculates automated savings badges for yearly plans.</p>
                        </div>
                    </div>
                )}
            </div>

            <CollapsibleSection title="Theme & Styling" icon={<Sparkles size={18} />} isOpen={openSections.styling} onToggle={() => toggleSection('styling')}>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 mb-4 space-y-4">
                    <h4 className="font-bold text-xs text-purple-900 uppercase">Section Background</h4>
                    <div className="space-y-3">
                        <Select label="Background Type" value={config.theme?.background?.type || 'solid'} onChange={v => updateNestedConfig('theme.background.type', v)} options={[
                            { value: 'solid', label: 'Solid Color' },
                            { value: 'gradient', label: 'Gradient' }
                        ]} />

                        {config.theme?.background?.type === 'gradient' ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorPicker label="Start" value={config.theme?.background?.gradient?.start || '#f9fafb'} onChange={v => updateNestedConfig('theme.background.gradient.start', v)} />
                                    <ColorPicker label="End" value={config.theme?.background?.gradient?.end || '#e5e7eb'} onChange={v => updateNestedConfig('theme.background.gradient.end', v)} />
                                </div>
                                <Select
                                    label="Direction"
                                    value={config.theme?.background?.gradient?.direction || 'to-br'}
                                    onChange={v => updateNestedConfig('theme.background.gradient.direction', v)}
                                    options={[
                                        { value: 'to-r', label: 'Left to Right' },
                                        { value: 'to-br', label: 'Top-Left to Bottom-Right' },
                                        { value: 'to-b', label: 'Top to Bottom' },
                                        { value: 'to-bl', label: 'Top-Right to Bottom-Left' }
                                    ]}
                                />
                            </div>
                        ) : (
                            <ColorPicker label="Background Color" value={config.theme?.background?.color || '#f9fafb'} onChange={v => updateNestedConfig('theme.background.color', v)} />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <ColorPicker label="Accent Color" value={config.theme?.accentColor || '#3b82f6'} onChange={v => updateNestedConfig('theme.accentColor', v)} />
                    <ColorPicker label="Card Background" value={config.theme?.cardBg || '#ffffff'} onChange={v => updateNestedConfig('theme.cardBg', v)} />
                    <ColorPicker label="Card Border" value={config.theme?.cardBorder || '#e5e7eb'} onChange={v => updateNestedConfig('theme.cardBorder', v)} />
                    <ColorPicker label="Text Color" value={config.theme?.textColor || '#111827'} onChange={v => updateNestedConfig('theme.textColor', v)} />
                    <ColorPicker label="Price Color" value={config.theme?.priceColor || '#111827'} onChange={v => updateNestedConfig('theme.priceColor', v)} />
                    <ColorPicker label="Included Feature" value={config.theme?.includedFeatureColor || '#10b981'} onChange={v => updateNestedConfig('theme.includedFeatureColor', v)} />
                    <ColorPicker label="Excluded Feature" value={config.theme?.excludedFeatureColor || '#9ca3af'} onChange={v => updateNestedConfig('theme.excludedFeatureColor', v)} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <Input label="Shadow" value={config.theme?.cardShadow || 'xl'} onChange={v => updateNestedConfig('theme.cardShadow', v)} placeholder="xl" />
                    <Input label="Radius" value={config.theme?.borderRadius || '16px'} onChange={v => updateNestedConfig('theme.borderRadius', v)} placeholder="16px" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Highlight Best Value</span>
                        <ToggleButton value={config.theme?.highlightBestValue !== false} onChange={v => updateNestedConfig('theme.highlightBestValue', v)} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Comparison Table</span>
                        <ToggleButton value={config.showComparisonTable || false} onChange={v => updateConfig('showComparisonTable', v)} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">Enable Tooltips</span>
                        <ToggleButton value={config.enableTooltips !== false} onChange={v => updateConfig('enableTooltips', v)} />
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
}
