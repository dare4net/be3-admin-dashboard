"use client";

import { Box, LayoutTemplate, Eye, Sparkles, Type, Zap, RotateCw, MousePointer2, Settings, Shuffle } from "lucide-react";
import ColorPicker from "@/components/config/ColorPicker";
import { Input, Select, CollapsibleSection, ToggleButton, RandomizationConfig } from "./FormComponents";

export default function CategoryForms({
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
    const isCarousel = ['category_carousel', 'clause_carousel'].includes(widgetType);
    const isClause = ['clause_grid', 'clause_carousel'].includes(widgetType);

    return (
        <>
            <div className="space-y-4">
                <Input label="Title" value={config.title || (isCarousel ? 'Shop by Category' : 'Categories')} onChange={v => updateConfig('title', v)} />
                <Input label="Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} />
            </div>

            {/* Clause Configuration (only for clause widgets) */}
            {isClause && (
                <CollapsibleSection
                    title="Clause Traversal"
                    icon={<Box size={18} />}
                    isOpen={openSections.content}
                    onToggle={() => toggleSection('content')}
                >
                    <Select
                        label="Traversal Mode"
                        value={config.traversalMode || 'category_fixed_attribute_traverse_clauses'}
                        onChange={v => updateConfig('traversalMode', v)}
                        options={[
                            { value: 'category_fixed_attribute_traverse_clauses', label: '1 Category + 1 Attribute → N Clauses' },
                            { value: 'category_fixed_traverse_attributes', label: '1 Category → N Attributes (1 clause each)' },
                            { value: 'traverse_categories_fixed_attribute', label: 'N Categories + 1 Attribute' },
                            { value: 'controlled_random', label: 'Controlled Random' }
                        ]}
                    />

                    {/* Attribute selector (modes 1 & 3) */}
                    {['category_fixed_attribute_traverse_clauses', 'traverse_categories_fixed_attribute'].includes(config.traversalMode) && (
                        <Select
                            label="Attribute"
                            value={config.attributeCode || ''}
                            onChange={v => updateConfig('attributeCode', v)}
                            options={[
                                { value: '', label: 'Select Attribute' },
                                ...attributes.map(a => ({ value: a.code, label: a.label || a.code }))
                            ]}
                        />
                    )}

                    {/* Single category (modes 1 & 2) */}
                    {['category_fixed_attribute_traverse_clauses', 'category_fixed_traverse_attributes'].includes(config.traversalMode) && (
                        <Select
                            label="Category"
                            value={config.categoryId || ''}
                            onChange={v => updateConfig('categoryId', v)}
                            options={[
                                { value: '', label: 'Select Category' },
                                ...categories.map(c => ({ value: c.id, label: c.name }))
                            ]}
                        />
                    )}

                    {/* Category source (modes 3 & 4) */}
                    {['traverse_categories_fixed_attribute', 'controlled_random'].includes(config.traversalMode) && (
                        <>
                            <Select
                                label="Category Source"
                                value={config.sourceType || 'top-level'}
                                onChange={v => updateConfig('sourceType', v)}
                                options={[
                                    { value: 'top-level', label: 'Top-Level Categories' },
                                    { value: 'subcategories', label: 'Subcategories of...' },
                                    { value: 'descendants', label: 'All Descendants of...' }
                                ]}
                            />
                            {['subcategories', 'descendants'].includes(config.sourceType) && (
                                <Select
                                    label="Parent Category"
                                    value={config.parentCategoryId || ''}
                                    onChange={v => updateConfig('parentCategoryId', v)}
                                    options={[
                                        { value: '', label: 'Select Parent' },
                                        ...categories.map(c => ({ value: c.id, label: c.name }))
                                    ]}
                                />
                            )}
                        </>
                    )}

                    <Input label="Max Items" type="number" value={config.maxItems || 12} onChange={v => updateConfig('maxItems', parseInt(v))} />

                    {config.traversalMode === 'controlled_random' && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Allow Repeat Attributes</span>
                            <ToggleButton value={config.allowRepeatAttribute || false} onChange={v => updateConfig('allowRepeatAttribute', v)} />
                        </div>
                    )}
                </CollapsibleSection>
            )}

            {/* Context-Aware Mode (category widgets only) */}
            {!isClause && (
            <div className="p-4 rounded-xl border-2 border-teal-200 bg-teal-50 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={16} className="text-teal-600" />
                        <span className="font-bold text-sm text-teal-900">Context-Aware Mode</span>
                    </div>
                    <ToggleButton
                        value={config.contextAware || false}
                        onChange={v => updateConfig('contextAware', v)}
                    />
                </div>
                <p className="text-xs text-teal-700 leading-snug">
                    When enabled, the category list is automatically driven by the current page.
                    On vendor pages it shows only that vendor&apos;s categories (via the ledger);
                    on category pages it shows child categories of the current one.
                    Source Type below is used as fallback on non-context pages.
                </p>
            </div>
            )}

            {/* Category Selection (category widgets only) */}
            {!isClause && (
            <CollapsibleSection
                title="Category Selection"
                icon={<Box size={18} />}
                isOpen={openSections.content}
                onToggle={() => toggleSection('content')}
            >
                <Select
                    label="Source Type"
                    value={config.sourceType || 'top-level'}
                    onChange={v => updateConfig('sourceType', v)}
                    options={[
                        { value: 'all', label: 'All Categories (with Products)' },
                        { value: 'top-level', label: 'All Top-Level Categories' },
                        { value: 'subcategories', label: 'Subcategories of Parent' },
                        { value: 'all-subcategories', label: 'All Subcategories' },
                        { value: 'random', label: 'Random Selection' },
                        { value: 'manual', label: 'Manual Selection' }
                    ]}
                />

                {config.sourceType === 'subcategories' && (
                    <Select
                        label="Parent Category"
                        value={config.parentCategoryId || ''}
                        onChange={v => updateConfig('parentCategoryId', v)}
                        options={[
                            { value: '', label: 'Select Parent Category' },
                            ...categories.map(c => ({ value: c.id, label: c.name }))
                        ]}
                    />
                )}

                {config.sourceType === 'manual' && (
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-700 uppercase">Select Categories</label>
                        <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-white space-y-1">
                            {categories.map(cat => (
                                <label key={cat.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={(config.manualCategoryIds || []).includes(cat.id)}
                                        onChange={e => {
                                            const current = config.manualCategoryIds || [];
                                            const newIds = e.target.checked
                                                ? [...current, cat.id]
                                                : current.filter(id => id !== cat.id);
                                            updateConfig('manualCategoryIds', newIds);
                                        }}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500">{(config.manualCategoryIds || []).length} categories selected</p>
                    </div>
                )}

                {config.sourceType === 'random' && (
                    <Input label="Random Count" type="number" value={config.randomCount || 6} onChange={v => updateConfig('randomCount', parseInt(v))} />
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Select
                        label="Sort Order"
                        value={config.sortOrder || 'alphabetical'}
                        onChange={v => updateConfig('sortOrder', v)}
                        options={[
                            { value: 'alphabetical', label: 'Alphabetical' },
                            { value: 'random', label: 'Random' },
                            { value: 'manual', label: 'Manual' }
                        ]}
                    />
                    <Input label="Max Categories" type="number" value={config.maxCategories || 12} onChange={v => updateConfig('maxCategories', parseInt(v))} />
                </div>
            </CollapsibleSection>
            )}

            <CollapsibleSection
                title="Layout & Structure"
                icon={<LayoutTemplate size={18} />}
                isOpen={openSections.layout}
                onToggle={() => toggleSection('layout')}
            >
                {!isCarousel && (
                    <div className="space-y-4">
                        <Select
                            label="Style"
                            value={config.style || 'grid'}
                            onChange={v => updateConfig('style', v)}
                            options={[
                                { value: 'grid', label: 'Grid' },
                                { value: 'list', label: 'List' }
                            ]}
                        />
                        <Select
                            label="Layout Mode"
                            value={config.layoutMode || 'grid'}
                            onChange={v => updateConfig('layoutMode', v)}
                            options={[
                                { value: 'grid', label: 'Standard Grid' },
                                { value: 'bento', label: 'Bento Grid (Mosaic)' }
                            ]}
                        />
                    </div>
                )}

                {config.layoutMode === 'bento' && !isCarousel ? (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 space-y-2 mb-4">
                        <h4 className="font-semibold text-sm text-purple-900 flex items-center gap-2">
                            <LayoutTemplate size={16} /> Bento Layout Active
                        </h4>
                        <p className="text-xs text-purple-700">
                            Column counts are automatically managed by the Bento Mosaic pattern to create an optimal dynamic layout.
                        </p>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                        <h4 className="font-semibold text-sm text-gray-900 border-b pb-2">Columns (Per Breakpoint)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="Desktop" type="number" value={config.columns?.desktop || 4} onChange={v => updateConfig('columns', { ...(config.columns || {}), desktop: parseInt(v) || 4 })} />
                            <Input label="Tablet" type="number" value={config.columns?.tablet || 3} onChange={v => updateConfig('columns', { ...(config.columns || {}), tablet: parseInt(v) || 3 })} />
                            <Input label="Mobile" type="number" value={config.columns?.mobile || 2} onChange={v => updateConfig('columns', { ...(config.columns || {}), mobile: parseInt(v) || 2 })} />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {isCarousel && (
                        <Select label="Gap (Carousel)" value={config.gap || 'md'} onChange={v => updateConfig('gap', v)} options={[
                            { value: 'sm', label: 'Small' },
                            { value: 'md', label: 'Medium' },
                            { value: 'lg', label: 'Large' },
                            { value: 'xl', label: 'Extra Large' }
                        ]} />
                    )}
                    <Input label="Grid Gap (px)" value={config.gridGap || '16px'} onChange={v => updateConfig('gridGap', v)} placeholder="16px" />
                </div>

                <Input
                    label="Global Scale (Multiplier)"
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.globalScale || 1.0}
                    onChange={v => updateConfig('globalScale', parseFloat(v))}
                />
            </CollapsibleSection>

            {isCarousel && (
                <CollapsibleSection
                    title="Carousel Behavior"
                    icon={<Eye size={18} />}
                    isOpen={openSections.interaction}
                    onToggle={() => toggleSection('interaction')}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-blue-900">Sneak Peek</span>
                                <span className="text-[10px] text-blue-700">Show portion of next category</span>
                            </div>
                            <ToggleButton value={config.peekEffect || false} onChange={v => updateConfig('peekEffect', v)} />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Autoplay</span>
                            <ToggleButton value={config.autoPlay || false} onChange={v => updateConfig('autoPlay', v)} />
                        </div>

                        {config.autoPlay && (
                            <Input label="Interval (ms)" type="number" value={config.autoPlayInterval || 3000} onChange={v => updateConfig('autoPlayInterval', parseInt(v))} />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                <input type="checkbox" checked={config.infiniteLoop !== false} onChange={e => updateConfig('infiniteLoop', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                                <span className="text-sm font-medium">Infinite Loop</span>
                            </label>
                            <Input label="Items to Scroll" type="number" value={config.itemsToScroll || 1} onChange={v => updateConfig('itemsToScroll', parseInt(v))} />
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            <CollapsibleSection
                title="Appearance & Styling"
                icon={<Sparkles size={18} />}
                isOpen={openSections.styling}
                onToggle={() => toggleSection('styling')}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Card Shape"
                            value={config.cardShape || 'rounded-square'}
                            onChange={v => updateConfig('cardShape', v)}
                            options={[
                                { value: 'square', label: '⬜ Square' },
                                { value: 'circle', label: '⭕ Circle' },
                                { value: 'rounded-square', label: '▢ Rounded Square' },
                                { value: 'hexagon', label: '⬡ Hexagon' }
                            ]}
                        />
                        <Select
                            label="Aspect Ratio"
                            value={config.aspectRatio || '1:1'}
                            onChange={v => updateConfig('aspectRatio', v)}
                            options={[
                                { value: '1:1', label: 'Square (1:1)' },
                                { value: '4:3', label: 'Standard (4:3)' },
                                { value: '16:9', label: 'Widescreen (16:9)' }
                            ]}
                        />
                    </div>

                    {config.cardShape === 'rounded-square' && (
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Radius (PC)" type="number" value={config.borderRadius || 16} onChange={v => updateConfig('borderRadius', parseInt(v))} />
                            <Input label="Radius (Mob)" type="number" value={config.mobileBorderRadius !== undefined ? config.mobileBorderRadius : (config.borderRadius || 16) / 2} onChange={v => updateConfig('mobileBorderRadius', parseInt(v))} />
                        </div>
                    )}

                    <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 space-y-4">
                        <h4 className="font-bold text-sm text-red-900 flex items-center gap-2">
                            <Eye size={16} /> Image & Overlay
                        </h4>
                        <Select
                            label="Image Fit"
                            value={config.imageFit || 'cover'}
                            onChange={v => updateConfig('imageFit', v)}
                            options={[
                                { value: 'cover', label: 'Cover' },
                                { value: 'contain', label: 'Contain' },
                                { value: 'fill', label: 'Fill' }
                            ]}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                label="Overlay Type"
                                value={config.overlayType || 'gradient'}
                                onChange={v => updateConfig('overlayType', v)}
                                options={[
                                    { value: 'none', label: 'None' },
                                    { value: 'gradient', label: 'Gradient' },
                                    { value: 'solid', label: 'Solid' }
                                ]}
                            />
                            <Input label="Zoom on Hover" type="number" min="1" max="2" step="0.1" value={config.imageZoomOnHover || 1.1} onChange={v => updateConfig('imageZoomOnHover', parseFloat(v))} />
                        </div>
                        {config.overlayType !== 'none' && (
                            <div className="grid grid-cols-1 gap-3 p-3 bg-white/50 rounded-lg">
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorPicker label="Overlay Color" value={config.overlayColor || '#000000'} onChange={v => updateConfig('overlayColor', v)} />
                                    <Input label="Overlay Opacity (%)" type="number" min="0" max="100" value={config.overlayOpacity || 40} onChange={v => updateConfig('overlayOpacity', parseInt(v))} />
                                </div>
                                {config.overlayType === 'gradient' && (
                                    <Select
                                        label="Gradient Direction"
                                        value={config.overlayGradientDirection || 'to-t'}
                                        onChange={v => updateConfig('overlayGradientDirection', v)}
                                        options={[
                                            { value: 'to-t', label: 'To Top' },
                                            { value: 'to-b', label: 'To Bottom' },
                                            { value: 'to-l', label: 'To Left' },
                                            { value: 'to-r', label: 'To Right' },
                                            { value: 'to-tl', label: 'To Top Left' },
                                            { value: 'to-tr', label: 'To Top Right' },
                                            { value: 'to-bl', label: 'To Bottom Left' },
                                            { value: 'to-br', label: 'To Bottom Right' }
                                        ]}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <Select
                        label="Card Style"
                        value={config.cardStyle || 'elevated'}
                        onChange={v => updateConfig('cardStyle', v)}
                        options={[
                            { value: 'flat', label: 'Flat' },
                            { value: 'bordered', label: 'Bordered' },
                            { value: 'elevated', label: 'Elevated' },
                            { value: 'glassmorphic', label: '✨ Glassmorphic' }
                        ]}
                    />

                    {config.cardStyle === 'bordered' && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                            <Input label="Border Width" type="number" value={config.borderWidth || 2} onChange={v => updateConfig('borderWidth', parseInt(v))} />
                            <ColorPicker label="Border Color" value={config.borderColor || '#e5e7eb'} onChange={v => updateConfig('borderColor', v)} />
                        </div>
                    )}

                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.backgroundGradient || false} onChange={e => updateConfig('backgroundGradient', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Use Background Gradient</span>
                        </label>

                        {config.backgroundGradient ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorPicker label="Start" value={config.gradientStart || '#f9fafb'} onChange={v => updateConfig('gradientStart', v)} />
                                    <ColorPicker label="End" value={config.gradientEnd || '#e5e7eb'} onChange={v => updateConfig('gradientEnd', v)} />
                                </div>
                                <Select
                                    label="Direction"
                                    value={config.gradientDirection || 'to-br'}
                                    onChange={v => updateConfig('gradientDirection', v)}
                                    options={[
                                        { value: 'to-r', label: 'Left to Right' },
                                        { value: 'to-br', label: 'Top-Left to Bottom-Right' },
                                        { value: 'to-b', label: 'Top to Bottom' },
                                        { value: 'to-bl', label: 'Top-Right to Bottom-Left' }
                                    ]}
                                />
                            </div>
                        ) : (
                            <ColorPicker label="Background Color" value={config.backgroundColor || '#ffffff'} onChange={v => updateConfig('backgroundColor', v)} />
                        )}
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 space-y-3">
                        <Select
                            label="Shadow Style"
                            value={config.shadowStyle || 'medium'}
                            onChange={v => updateConfig('shadowStyle', v)}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'soft', label: 'Soft' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'hard', label: 'Hard' },
                                { value: 'custom', label: 'Custom' }
                            ]}
                        />
                        {config.shadowStyle === 'custom' && (
                            <div className="space-y-3">
                                <ColorPicker label="Shadow Color" value={config.shadowColor || 'rgba(0, 0, 0, 0.1)'} onChange={v => updateConfig('shadowColor', v)} />
                                <div className="grid grid-cols-2 gap-2 p-2 bg-white rounded border border-yellow-200">
                                    <Input label="Blur" type="number" value={config.shadowBlur || 20} onChange={v => updateConfig('shadowBlur', parseInt(v))} />
                                    <Input label="Spread" type="number" value={config.shadowSpread || 0} onChange={v => updateConfig('shadowSpread', parseInt(v))} />
                                    <Input label="Offset X" type="number" value={config.shadowOffsetX || 0} onChange={v => updateConfig('shadowOffsetX', parseInt(v))} />
                                    <Input label="Offset Y" type="number" value={config.shadowOffsetY || 8} onChange={v => updateConfig('shadowOffsetY', parseInt(v))} />
                                    <Input label="Opacity" type="number" step="0.1" value={config.shadowOpacity || 0.1} onChange={v => updateConfig('shadowOpacity', parseFloat(v))} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Typography & Content"
                icon={<Type size={18} />}
                isOpen={openSections.typography}
                onToggle={() => toggleSection('typography')}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <Select
                            label="Content Pos (PC)"
                            value={config.contentPositionDesktop || 'overlay'}
                            onChange={v => updateConfig('contentPositionDesktop', v)}
                            options={[
                                { value: 'overlay', label: '🖼️ Overlay' },
                                { value: 'below', label: '⬇️ Below Image' }
                            ]}
                        />
                        <Select
                            label="Content Pos (Mob)"
                            value={config.contentPositionMobile || 'below'}
                            onChange={v => updateConfig('contentPositionMobile', v)}
                            options={[
                                { value: 'overlay', label: '🖼️ Overlay' },
                                { value: 'below', label: '⬇️ Below Image' }
                            ]}
                        />
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-3">
                        <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Font Sizes (px)</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <Input label="Desktop" type="number" value={config.categoryTitleFontSizeDesktop || config.titleFontSizeDesktop || 18} onChange={v => updateConfig('categoryTitleFontSizeDesktop', parseInt(v))} />
                            <Input label="Tablet" type="number" value={config.categoryTitleFontSizeTablet || config.titleFontSizeTablet || 16} onChange={v => updateConfig('categoryTitleFontSizeTablet', parseInt(v))} />
                            <Input label="Mobile" type="number" value={config.categoryTitleFontSizeMobile || config.titleFontSizeMobile || 14} onChange={v => updateConfig('categoryTitleFontSizeMobile', parseInt(v))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Weight" type="number" min="100" max="900" step="100" value={config.categoryTitleFontWeight || config.titleFontWeight || 600} onChange={v => updateConfig('categoryTitleFontWeight', parseInt(v))} />
                            <ColorPicker label="Text Color" value={config.categoryTitleColor || config.titleColor || '#ffffff'} onChange={v => updateConfig('categoryTitleColor', v)} />
                        </div>
                        <Select
                            label="Text Alignment"
                            value={config.categoryTitleAlignment || config.titleAlignment || 'center'}
                            onChange={v => updateConfig('categoryTitleAlignment', v)}
                            options={[
                                { value: 'left', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'right', label: 'Right' }
                            ]}
                        />
                        <div className="flex items-center justify-between pt-2 border-t mt-2">
                            <span className="text-sm font-medium">Show Product Count</span>
                            <ToggleButton value={config.showProductCount !== false} onChange={v => updateConfig('showProductCount', v)} />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Hover & Effects"
                icon={<Zap size={18} />}
                isOpen={openSections.effects}
                onToggle={() => toggleSection('effects')}
            >
                <div className="space-y-4">
                    <Select
                        label="Hover Animation"
                        value={config.hoverAnimation || 'lift'}
                        onChange={v => updateConfig('hoverAnimation', v)}
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'lift', label: '⬆️ Lift' },
                            { value: 'zoom', label: '🔍 Zoom' },
                            { value: 'tilt', label: '↗️ Tilt' },
                            { value: 'glow', label: '✨ Glow' },
                            { value: 'pulse', label: '💫 Pulse' }
                        ]}
                    />

                    {config.hoverAnimation === 'lift' && (
                        <Input label="Lift Height (px)" type="number" value={config.liftHeight || 8} onChange={v => updateConfig('liftHeight', parseInt(v))} />
                    )}
                    {config.hoverAnimation === 'zoom' && (
                        <Input label="Zoom Scale" type="number" min="1" max="1.5" step="0.05" value={config.zoomScale || 1.05} onChange={v => updateConfig('zoomScale', parseFloat(v))} />
                    )}
                    {config.hoverAnimation === 'tilt' && (
                        <Input label="Tilt Angle (deg)" type="number" value={config.tiltAngle || 5} onChange={v => updateConfig('tiltAngle', parseInt(v))} />
                    )}

                    <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Shadow Enhancement</span>
                            <ToggleButton value={config.hoverShadowEnhancement !== false} onChange={v => updateConfig('hoverShadowEnhancement', v)} />
                        </div>
                        <Input label="Hover Overlay Opacity (%)" type="number" min="0" max="100" value={config.overlayOpacityOnHover || 20} onChange={v => updateConfig('overlayOpacityOnHover', parseInt(v))} />
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Entrance Animations"
                icon={<RotateCw size={18} />}
                isOpen={openSections.animations}
                onToggle={() => toggleSection('animations')}
            >
                <div className="space-y-4">
                    <Select
                        label="Entrance Style"
                        value={config.entranceAnimation || 'fade'}
                        onChange={v => updateConfig('entranceAnimation', v)}
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'fade', label: 'Fade In' },
                            { value: 'slide', label: 'Slide Up' },
                            { value: 'zoom', label: 'Zoom In' },
                            { value: 'bounce', label: 'Bounce In' }
                        ]}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Stagger (ms)" type="number" value={config.staggerDelay || 100} onChange={v => updateConfig('staggerDelay', parseInt(v))} />
                        <Input label="Duration (ms)" type="number" value={config.transitionDuration || 300} onChange={v => updateConfig('transitionDuration', parseInt(v))} />
                    </div>
                </div>
            </CollapsibleSection>

            {isCarousel && (
                <CollapsibleSection
                    title="Arrow & Pagination Styling"
                    icon={<MousePointer2 size={18} />}
                    isOpen={openSections.navigation}
                    onToggle={() => toggleSection('navigation')}
                >
                    <div className="space-y-4">
                        <Select
                            label="Show Arrows"
                            value={config.showArrows || 'hover'}
                            onChange={v => updateConfig('showArrows', v)}
                            options={[
                                { value: 'always', label: 'Always Visible' },
                                { value: 'hover', label: 'On Hover' },
                                { value: 'never', label: 'Never' }
                            ]}
                        />
                        {config.showArrows !== 'never' && (
                            <>
                                <Select
                                    label="Arrow Style"
                                    value={config.arrowStyle || 'modern'}
                                    onChange={v => updateConfig('arrowStyle', v)}
                                    options={[
                                        { value: 'classic', label: 'Classic' },
                                        { value: 'modern', label: 'Modern' },
                                        { value: 'minimal', label: 'Minimal' }
                                    ]}
                                />
                                <Select
                                    label="Arrow Shape"
                                    value={config.arrowShape || 'circle'}
                                    onChange={v => updateConfig('arrowShape', v)}
                                    options={[
                                        { value: 'circle', label: 'Circle' },
                                        { value: 'square', label: 'Square' },
                                        { value: 'none', label: 'None' }
                                    ]}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorPicker label="Arrow Color" value={config.arrowColor || '#ffffff'} onChange={v => updateConfig('arrowColor', v)} />
                                    <ColorPicker label="Arrow BG" value={config.arrowBackgroundColor || 'rgba(0, 0, 0, 0.5)'} onChange={v => updateConfig('arrowBackgroundColor', v)} />
                                </div>
                            </>
                        )}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Show Pagination Dots</span>
                            <ToggleButton value={config.showDots !== false} onChange={v => updateConfig('showDots', v)} />
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            <CollapsibleSection
                title="Additional Settings"
                icon={<Settings size={18} />}
                isOpen={openSections.additional}
                onToggle={() => toggleSection('additional')}
            >
                <div className="space-y-4">
                    <Input label="Empty State Message" value={config.emptyMessage || 'No categories available'} onChange={v => updateConfig('emptyMessage', v)} />

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Show "Explore All" CTA</span>
                        <ToggleButton value={config.showExploreCTA !== false} onChange={v => updateConfig('showExploreCTA', v)} />
                    </div>

                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                        <Input label="Badge Label" value={config.badgeLabel || ''} onChange={v => updateConfig('badgeLabel', v)} placeholder="e.g., Hot, New" />
                        {config.badgeLabel && (
                            <Select
                                label="Badge Position"
                                value={config.badgePosition || 'top-right'}
                                onChange={v => updateConfig('badgePosition', v)}
                                options={[
                                    { value: 'top-left', label: 'Top Left' },
                                    { value: 'top-right', label: 'Top Right' },
                                    { value: 'bottom', label: 'Bottom' }
                                ]}
                            />
                        )}
                    </div>

                    <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 space-y-3">
                        <h4 className="font-bold text-xs text-purple-900 uppercase">Section Headers</h4>
                        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">Full Width Title</span>
                                <ToggleButton value={config.fullWidthTitle || false} onChange={v => updateConfig('fullWidthTitle', v)} />
                            </div>
                            <p className="text-[10px] text-blue-700 leading-tight">
                                Forces the title to ignore container padding. Recommended for background colors.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Title Color" value={config.titleColor || '#111827'} onChange={v => updateConfig('titleColor', v)} />
                            <Select label="Title Alignment" value={config.titleAlign || 'center'} onChange={v => updateConfig('titleAlign', v)} options={[
                                { value: 'left', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'right', label: 'Right' }
                            ]} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Title Background Color" value={config.titleBackgroundColor || 'transparent'} onChange={v => updateConfig('titleBackgroundColor', v)} />
                            <Input label="Title Padding" value={config.titlePadding || ''} onChange={v => updateConfig('titlePadding', v)} placeholder="e.g., 20px" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Section Padding Top" value={config.sectionPaddingTop || ''} onChange={v => updateConfig('sectionPaddingTop', v)} placeholder="e.g., 40px" />
                            <Input label="Section Padding Bottom" value={config.sectionPaddingBottom || ''} onChange={v => updateConfig('sectionPaddingBottom', v)} placeholder="e.g., 40px" />
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
        </>
    );
}
