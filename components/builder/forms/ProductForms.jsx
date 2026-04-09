"use client";

import { useState } from "react";
import { Shuffle, Maximize, Sparkles, RotateCcw, X } from "lucide-react";
import ColorPicker from "@/components/config/ColorPicker";
import { Input, Select, CollapsibleSection, RandomizationConfig, ToggleButton, DeviceToggle } from "./FormComponents";

export default function ProductForms({
    widgetType,
    config,
    updateConfig,
    updateNestedConfig,
    categories,
    collections,
    attributes,
    openSections,
    toggleSection
}) {
    const isCarousel = widgetType === 'product_carousel';
    const [selectedDevice, setSelectedDevice] = useState('desktop');

    const resetToDefault = (key) => {
        if (selectedDevice === 'desktop' || !config.responsiveDisplay?.[selectedDevice]) return;

        const newResponsive = { ...config.responsiveDisplay };
        delete newResponsive[selectedDevice][key];

        // If device object is empty, remove it
        if (Object.keys(newResponsive[selectedDevice]).length === 0) {
            delete newResponsive[selectedDevice];
        }

        updateConfig('responsiveDisplay', Object.keys(newResponsive).length > 0 ? newResponsive : undefined);
    };

    const updateResponsiveConfig = (device, key, value) => {
        const newResponsive = {
            ...(config.responsiveDisplay || {}),
            [device]: {
                ...(config.responsiveDisplay?.[device] || {}),
                [key]: value
            }
        };
        updateConfig('responsiveDisplay', newResponsive);
    };

    return (
        <div className="space-y-6">
            {/* Basic Settings */}
            <div className="space-y-4">
                <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Limit" type="number" value={config.limit || 8} onChange={v => updateConfig('limit', parseInt(v))} />
                    <Select label="Sort Order" value={config.sort || 'newest'} onChange={v => updateConfig('sort', v)} options={[
                        { value: 'newest', label: 'Newest First' },
                        { value: 'oldest', label: 'Oldest First' },
                        { value: 'price_asc', label: 'Price: Low to High' },
                        { value: 'price_desc', label: 'Price: High to Low' },
                        { value: 'name_asc', label: 'Name: A-Z' },
                        { value: 'name_desc', label: 'Name: Z-A' },
                        { value: 'random', label: 'Random' }
                    ]} />
                </div>
            </div>

            {/* Content Source */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Content Source</h4>
                <Select
                    label="Source Type"
                    value={config.sourceType || 'all'}
                    onChange={v => updateConfig('sourceType', v)}
                    options={[
                        { value: 'all', label: 'All Products' },
                        { value: 'category', label: 'Specific Category' },
                        { value: 'collection', label: 'Specific Collection' },
                        { value: 'clause', label: 'Attribute Clause' }
                    ]}
                />

                {config.sourceType === 'category' && (
                    <Select label="Select Category" value={config.categoryId || ''} onChange={v => updateConfig('categoryId', v)} options={[{ value: '', label: '-- Choose Category --' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
                )}

                {config.sourceType === 'collection' && (
                    <Select label="Select Collection" value={config.collectionId || ''} onChange={v => updateConfig('collectionId', v)} options={[{ value: '', label: '-- Choose Collection --' }, ...collections.map(c => ({ value: c.id, label: c.name }))]} />
                )}

                {config.sourceType === 'clause' && (
                    <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <Select
                            label="Attribute"
                            value={config.attributeClause?.split(':')[0] || ''}
                            onChange={v => updateConfig('attributeClause', v ? `${v}:` : '')}
                            options={[{ value: '', label: '-- Choose Attribute --' }, ...attributes.map(a => ({ value: a.code, label: a.label }))]}
                        />
                        {config.attributeClause?.split(':')[0] && (
                            <Select
                                label="Clause"
                                value={config.attributeClause?.split(':')[1] || ''}
                                onChange={v => updateConfig('attributeClause', `${config.attributeClause.split(':')[0]}:${v}`)}
                                options={[
                                    { value: '', label: '-- Choose Clause --' },
                                    ...(() => {
                                        const attr = attributes.find(a => a.code === config.attributeClause.split(':')[0]);
                                        try {
                                            const clauses = typeof attr?.clauses === 'string' ? JSON.parse(attr.clauses) : (attr?.clauses || []);
                                            return clauses.map(c => ({ value: c.name || c.value, label: c.label || c.name || c.value }));
                                        } catch { return []; }
                                    })()
                                ]}
                            />
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-gray-700">Filter by Featured Only</span>
                    <ToggleButton value={config.showFeaturedOnly || false} onChange={v => updateConfig('showFeaturedOnly', v)} />
                </div>
            </div>

            {/* Layout Configuration */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Layout (Visible Columns)</h4>
                <div className="grid grid-cols-3 gap-3">
                    <Input label="Desktop" type="number" value={config.columns?.desktop || 4} onChange={v => updateNestedConfig('columns.desktop', parseInt(v))} />
                    <Input label="Tablet" type="number" value={config.columns?.tablet || 2} onChange={v => updateNestedConfig('columns.tablet', parseInt(v))} />
                    <Input label="Mobile" type="number" value={config.columns?.mobile || 1} onChange={v => updateNestedConfig('columns.mobile', parseInt(v))} />
                </div>

                {isCarousel && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-blue-900">Sneak Peek</span>
                            <span className="text-[10px] text-blue-700">Show portion of next product</span>
                        </div>
                        <ToggleButton value={config.peekEffect || false} onChange={v => updateConfig('peekEffect', v)} />
                    </div>
                )}

                <Input label="Grid Gap (e.g. 24px)" value={config.gridGap || ''} onChange={v => updateConfig('gridGap', v)} placeholder="24px" />
            </div>

            {/* Display Elements */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-sm text-gray-900">Display Elements</h4>
                    <DeviceToggle selected={selectedDevice} onChange={setSelectedDevice} />
                </div>

                <div className="space-y-2 pt-2">
                    {[
                        { key: 'showPrice', label: 'Show Price' },
                        { key: 'showAddToCart', label: 'Show "Add to Cart"' },
                        { key: 'showViewDetails', label: 'Show "View Details"' },
                        { key: 'showFeaturedBadge', label: 'Show "Featured" Badge' },
                        { key: 'showVendor', label: 'Show Vendor' },
                        { key: 'showTags', label: 'Show Tags', countKey: 'tagsCount' },
                        { key: 'showDescription', label: 'Show Description' },
                        { key: 'showAttributes', label: 'Show Attributes', countKey: 'attributesCount' },
                        { key: 'showSocialProof', label: 'Show Social Proof' },
                        { key: 'showRating', label: 'Show Rating' }
                    ].map(item => {
                        const isDesktop = selectedDevice === 'desktop';
                        const responsiveValue = config.responsiveDisplay?.[selectedDevice]?.[item.key];
                        const isOverridden = !isDesktop && responsiveValue !== undefined;
                        const valueSource = isOverridden ? responsiveValue : config[item.key];
                        
                        // Default logic: missing means TRUE (ON) unless otherwise specified
                        const value = valueSource === undefined ? true : !!valueSource;

                        // Count resolution
                        const countKey = item.countKey;
                        const responsiveCount = countKey ? config.responsiveDisplay?.[selectedDevice]?.[countKey] : undefined;
                        const isCountOverridden = countKey && !isDesktop && responsiveCount !== undefined;
                        const countValue = isCountOverridden ? responsiveCount : (config[countKey] || (countKey === 'tagsCount' ? 3 : 2));

                        return (
                            <div key={item.key} className="space-y-1 py-1 border-b border-gray-100 last:border-0 group/row">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <label className={`text-sm ${isOverridden ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                                            {item.label}
                                            {isOverridden && <span className="ml-2 text-[8px] uppercase bg-blue-100 px-1 rounded font-normal">Custom</span>}
                                        </label>
                                        {!isDesktop && !isOverridden && <span className="text-[10px] text-gray-400 italic">Inherited from Desktop</span>}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isOverridden && (
                                            <button
                                                onClick={() => resetToDefault(item.key)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                title="Reset to Default"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                        <ToggleButton
                                            value={value}
                                            onChange={v => {
                                                if (isDesktop) updateConfig(item.key, v);
                                                else updateResponsiveConfig(selectedDevice, item.key, v);
                                            }}
                                        />
                                    </div>
                                </div>

                                {value && countKey && (
                                    <div className="flex items-center justify-between pl-4 pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-medium ${isCountOverridden ? 'text-blue-600' : 'text-gray-500'}`}>
                                                Max items to show
                                            </span>
                                            {isCountOverridden && <span className="text-[8px] uppercase bg-blue-100 px-1 rounded text-blue-600">Custom</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isCountOverridden && (
                                                <button
                                                    onClick={() => resetToDefault(countKey)}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="w-2 h-2" />
                                                </button>
                                            )}
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={countValue}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 1;
                                                    if (isDesktop) updateConfig(countKey, val);
                                                    else updateResponsiveConfig(selectedDevice, countKey, val);
                                                }}
                                                className={`w-12 h-6 text-xs text-center border rounded focus:ring-1 focus:outline-none ${isCountOverridden ? 'border-blue-300 text-blue-700 bg-blue-50 focus:ring-blue-400' : 'border-gray-200 text-gray-600 focus:ring-gray-300'}`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Behaviors & Animations */}
            <CollapsibleSection
                title="Behaviors & Animations"
                icon={<Sparkles size={18} />}
                isOpen={openSections.behavior}
                onToggle={() => toggleSection('behavior')}
            >
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Enable Entry Animation</span>
                    <ToggleButton value={config.enableEntryAnimation || false} onChange={v => updateConfig('enableEntryAnimation', v)} />
                </div>
            </CollapsibleSection>

            {/* Styling & Spacing */}
            <CollapsibleSection
                title="Styling & Spacing"
                icon={<Maximize size={18} />}
                isOpen={openSections.styling}
                onToggle={() => toggleSection('styling')}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Show Title</span>
                        <ToggleButton value={config.showTitle !== false} onChange={v => updateConfig('showTitle', v)} />
                    </div>

                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">Full Width Title</span>
                            <ToggleButton value={config.fullWidthTitle || false} onChange={v => updateConfig('fullWidthTitle', v)} />
                        </div>
                        <p className="text-[10px] text-blue-700 leading-tight">
                            Forces the title to ignore container padding. Recommended for background colors.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Title Font Size" value={config.titleFontSize || ''} onChange={v => updateConfig('titleFontSize', v)} placeholder="1.875rem" />
                        <Input label="Title Font Weight" value={config.titleFontWeight || ''} onChange={v => updateConfig('titleFontWeight', v)} placeholder="700" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Title Color" value={config.titleColor || '#111827'} onChange={v => updateConfig('titleColor', v)} />
                        <Select label="Title Alignment" value={config.titleAlign || 'center'} onChange={v => updateConfig('titleAlign', v)} options={[
                            { value: 'left', label: 'Left' },
                            { value: 'center', label: 'Center' },
                            { value: 'right', label: 'Right' }
                        ]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Title Background Color" value={config.titleBackgroundColor || 'transparent'} onChange={v => updateConfig('titleBackgroundColor', v)} />
                        <Input label="Title Padding" value={config.titlePadding || ''} onChange={v => updateConfig('titlePadding', v)} placeholder="0" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Section Padding Top" value={config.sectionPaddingTop || ''} onChange={v => updateConfig('sectionPaddingTop', v)} placeholder="48px" />
                        <Input label="Section Padding Bottom" value={config.sectionPaddingBottom || ''} onChange={v => updateConfig('sectionPaddingBottom', v)} placeholder="48px" />
                    </div>

                    <Input label="Title Bottom Margin" value={config.titleBottomMargin || ''} onChange={v => updateConfig('titleBottomMargin', v)} placeholder="32px" />

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Section & Card Appearance</h5>
                        <ColorPicker label="Section Background" value={config.sectionBackground?.color || '#ffffff'} onChange={v => updateNestedConfig('sectionBackground.color', v)} />

                        <div className="grid grid-cols-2 gap-4">
                            <ColorPicker label="Card Background" value={config.cardStyle?.backgroundColor || '#ffffff'} onChange={v => updateNestedConfig('cardStyle.backgroundColor', v)} />
                            <ColorPicker label="Border Color" value={config.cardStyle?.borderColor || '#e5e7eb'} onChange={v => updateNestedConfig('cardStyle.borderColor', v)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Shadow" value={config.cardStyle?.shadow || 'md'} onChange={v => updateNestedConfig('cardStyle.shadow', v)} options={[
                                { value: 'none', label: 'None' },
                                { value: 'sm', label: 'Small' },
                                { value: 'md', label: 'Medium' },
                                { value: 'lg', label: 'Large' },
                                { value: 'xl', label: 'Extra Large' },
                            ]} />
                            <Input label="Border Radius" value={config.cardStyle?.borderRadius || '12px'} onChange={v => updateNestedConfig('cardStyle.borderRadius', v)} />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title & Linking</h5>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-amber-900">Autogenerate Title</span>
                                    <span className="text-[10px] text-amber-700">Based on source name</span>
                                </div>
                                <ToggleButton value={config.autogenerateTitle || false} onChange={v => updateConfig('autogenerateTitle', v)} />
                            </div>
                            <Input label="Optional Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} placeholder="e.g. New Arrivals" />

                            <div className="pt-2 border-t border-amber-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-amber-900">Show "See All" Button</span>
                                    <ToggleButton value={config.showSeeAll || false} onChange={v => updateConfig('showSeeAll', v)} />
                                </div>
                                {config.showSeeAll && (
                                    <Input label="Button Label" value={config.seeAllLabel || 'See All'} onChange={v => updateConfig('seeAllLabel', v)} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Randomization Section */}
            <CollapsibleSection
                title="Randomization"
                icon={<Shuffle size={18} />}
                isOpen={openSections.randomization}
                onToggle={() => toggleSection('randomization')}
            >
                <RandomizationConfig config={config} updateNestedConfig={updateNestedConfig} categories={categories} collections={collections} attributes={attributes} widgetType={widgetType} />
            </CollapsibleSection>
        </div>
    );
}
