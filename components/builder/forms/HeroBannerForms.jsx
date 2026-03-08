"use client";

import { LayoutTemplate, Type, Eye, Zap, Box, MousePointer2, Maximize } from "lucide-react";
import ColorPicker from "@/components/config/ColorPicker";
import ImageUploader from "@/components/config/ImageUploader";
import GradientBuilder from "@/components/config/GradientBuilder";
import CarouselImageEditor from "@/components/config/CarouselImageEditor";
import CTAsArrayEditor from "@/components/config/CTAsArrayEditor";
import { Input, Select, CollapsibleSection, ToggleButton } from "./FormComponents";

export default function HeroBannerForms({
    widgetType,
    config,
    updateConfig,
    updateNestedConfig,
    openSections,
    toggleSection
}) {
    if (widgetType === 'promo_banner') {
        return (
            <>
                <Input label="Banner Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                <div className="grid grid-cols-2 gap-4">
                    <ColorPicker label="Background" value={config.backgroundColor || '#3b82f6'} onChange={v => updateConfig('backgroundColor', v)} />
                    <ColorPicker label="Text Color" value={config.textColor || '#ffffff'} onChange={v => updateConfig('textColor', v)} />
                </div>
            </>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <LayoutTemplate size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-sm text-blue-900">{widgetType === 'hero' ? 'Hero Section' : 'Interactive Section'}</h4>
                    <p className="text-xs text-blue-700">Configure layout, typography, and advanced visual effects.</p>
                </div>
            </div>

            <CollapsibleSection
                title="Layout & Typography"
                icon={<Type size={18} />}
                isOpen={openSections.layout}
                onToggle={() => toggleSection('layout')}
            >
                <div className="space-y-4">
                    <Select
                        label="Section Height"
                        value={config.height || 'medium'}
                        onChange={v => updateConfig('height', v)}
                        options={[
                            { value: 'small', label: '🤏 Small (400px)' },
                            { value: 'medium', label: '📏 Medium (600px)' },
                            { value: 'large', label: '🦒 Large (800px)' },
                            { value: 'screen', label: '🖥️ Full Screen' }
                        ]}
                    />

                    <Select
                        label="Content Alignment"
                        value={config.align || 'center'}
                        onChange={v => updateConfig('align', v)}
                        options={[
                            { value: 'left', label: '⬅️ Left Aligned' },
                            { value: 'center', label: '↔️ Center Aligned' },
                            { value: 'right', label: '➡️ Right Aligned' },
                            { value: 'split', label: '⚡ Split Screen' }
                        ]}
                    />
                </div>

                <div className="space-y-4 border-t pt-4 mt-4">
                    <Input
                        label="Title Text"
                        value={config.title?.text || config.title || ''}
                        onChange={v => typeof config.title === 'string' ? updateConfig('title', { text: v }) : updateNestedConfig('title.text', v)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <ColorPicker label="Color" value={config.title?.color || '#ffffff'} onChange={v => updateNestedConfig('title.color', v)} />
                        <Select
                            label="Weight"
                            value={config.title?.fontWeight || '700'}
                            onChange={v => updateNestedConfig('title.fontWeight', v)}
                            options={[
                                { value: '400', label: 'Normal' },
                                { value: '700', label: 'Bold' },
                                { value: '900', label: 'Black' }
                            ]}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Animation"
                            value={config.title?.animation?.type || 'none'}
                            onChange={v => updateNestedConfig('title.animation.type', v)}
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'fade-up', label: '⬆️ Fade Up' },
                                { value: 'fade-down', label: '⬇️ Fade Down' },
                                { value: 'fade', label: '✨ Fade In' },
                                { value: 'slide-left', label: '⬅️ Slide Left' },
                                { value: 'slide-right', label: '➡️ Slide Right' },
                                { value: 'zoom', label: '🔍 Zoom In' }
                            ]}
                        />
                        <Input
                            label="Delay (ms)"
                            type="number"
                            value={config.title?.animation?.delay || 0}
                            onChange={v => updateNestedConfig('title.animation.delay', parseInt(v))}
                        />
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4 mt-4">
                    <Input
                        label="Subtitle Text"
                        value={config.subtitle?.text || config.subtitle || ''}
                        onChange={v => typeof config.subtitle === 'string' ? updateConfig('subtitle', { text: v }) : updateNestedConfig('subtitle.text', v)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <ColorPicker label="Color" value={config.subtitle?.color || '#ffffff'} onChange={v => updateNestedConfig('subtitle.color', v)} />
                        <Input
                            label="Delay (ms)"
                            type="number"
                            value={config.subtitle?.animation?.delay || 200}
                            onChange={v => updateNestedConfig('subtitle.animation.delay', parseInt(v))}
                        />
                    </div>
                    <Select
                        label="Animation"
                        value={config.subtitle?.animation?.type || 'none'}
                        onChange={v => updateNestedConfig('subtitle.animation.type', v)}
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'fade-up', label: '⬆️ Fade Up' },
                            { value: 'fade-down', label: '⬇️ Fade Down' },
                            { value: 'fade', label: '✨ Fade In' },
                            { value: 'slide-left', label: '⬅️ Slide Left' },
                            { value: 'slide-right', label: '➡️ Slide Right' },
                            { value: 'slide-up', label: '🔝 Slide Up' },
                            { value: 'zoom', label: '🔍 Zoom In' }
                        ]}
                    />
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Background & Media"
                icon={<Eye size={18} />}
                isOpen={openSections.background}
                onToggle={() => toggleSection('background')}
            >
                <Select
                    label="Background Type"
                    value={config.backgroundType || 'image'}
                    onChange={v => updateConfig('backgroundType', v)}
                    options={[
                        { value: 'image', label: '🖼️ Single Image' },
                        { value: 'carousel', label: 'Carousel' },
                        { value: 'video', label: '🎬 Video' },
                        { value: 'gradient', label: '🌈 Gradient' },
                        { value: 'particles', label: '✨ Particles' },
                        { value: 'solid', label: '🎨 Solid Color' }
                    ]}
                />

                {config.backgroundType === 'carousel' && (
                    <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mt-4">
                        <CarouselImageEditor
                            images={config.carousel?.images || []}
                            onChange={v => updateNestedConfig('carousel.images', v)}
                        />
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Select
                                label="Transition"
                                value={config.carousel?.transition || 'fade'}
                                onChange={v => updateNestedConfig('carousel.transition', v)}
                                options={[
                                    { value: 'fade', label: '✨ Soft Fade' },
                                    { value: 'slide', label: '↔️ Smooth Slide' }
                                ]}
                            />
                            <Input
                                label="Interval (ms)"
                                type="number"
                                value={config.carousel?.interval || 5000}
                                onChange={v => updateNestedConfig('carousel.interval', parseInt(v))}
                            />
                        </div>
                    </div>
                )}

                {(config.backgroundType === 'image' || !config.backgroundType) && (
                    <ImageUploader
                        label="Background Image"
                        value={config.backgroundImage || ''}
                        onChange={v => updateConfig('backgroundImage', v)}
                        aspectRatio="16/9"
                    />
                )}

                {config.backgroundType === 'video' && (
                    <Input label="Video URL (MP4)" value={config.videoUrl || ''} onChange={v => updateConfig('videoUrl', v)} placeholder="https://..." />
                )}

                {config.backgroundType === 'gradient' && (
                    <GradientBuilder
                        label="Background Gradient"
                        value={config.gradient || {}}
                        onChange={v => updateConfig('gradient', v)}
                    />
                )}

                {config.backgroundType === 'particles' && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg mt-4">
                        <Input label="Particle Count" type="number" value={config.particles?.count || 50} onChange={v => updateNestedConfig('particles.count', parseInt(v))} />
                        <ColorPicker label="Particle Color" value={config.particles?.color || '#ffffff'} onChange={v => updateNestedConfig('particles.color', v)} />
                        <Input label="Particle Speed" type="number" step="0.1" value={config.particles?.speed || 1} onChange={v => updateNestedConfig('particles.speed', parseFloat(v))} />
                    </div>
                )}

                {config.backgroundType === 'solid' && (
                    <ColorPicker
                        label="Background Color"
                        value={config.backgroundColor || '#1e3a8a'}
                        onChange={v => updateConfig('backgroundColor', v)}
                    />
                )}
            </CollapsibleSection>

            <CollapsibleSection
                title="Hover & Interaction"
                icon={<Zap size={18} />}
                isOpen={openSections.interaction}
                onToggle={() => toggleSection('interaction')}
            >
                <Input
                    label="Section Click URL"
                    placeholder="e.g. /shop or https://..."
                    value={config.sectionLink || ''}
                    onChange={v => updateConfig('sectionLink', v)}
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">Makes the entire section clickable.</p>

                <div className="pt-4 border-t mt-4">
                    <Select
                        label="Hover Animation"
                        value={config.hoverEffect || 'none'}
                        onChange={v => updateConfig('hoverEffect', v)}
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'zoom', label: '🔍 Subtle Zoom' },
                            { value: 'lift', label: '🚀 Floating Lift' },
                            { value: 'brighten', label: '✨ Brighter Color' },
                            { value: 'glass', label: '💎 Frosted Glass' }
                        ]}
                    />
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Advanced Overlay"
                icon={<Box size={18} />}
                isOpen={openSections.overlay}
                onToggle={() => toggleSection('overlay')}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Enable Overlay</span>
                    <ToggleButton
                        value={config.overlay?.enabled}
                        onChange={v => updateNestedConfig('overlay.enabled', v)}
                    />
                </div>

                {config.overlay?.enabled && (
                    <div className="space-y-4">
                        <Select
                            label="Overlay Type"
                            value={config.overlay?.type || 'solid'}
                            onChange={v => updateNestedConfig('overlay.type', v)}
                            options={[
                                { value: 'solid', label: '🎨 Solid Color' },
                                { value: 'gradient', label: '🌈 Custom Gradient' },
                                { value: 'mesh', label: '🕸️ Mesh Gradient' },
                                { value: 'pattern', label: '✨ Animated Pattern' }
                            ]}
                        />

                        {config.overlay?.type === 'mesh' && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                                <ColorPicker label="Color 1" value={config.overlay?.mesh?.color1 || '#3b82f6'} onChange={v => updateNestedConfig('overlay.mesh.color1', v)} />
                                <ColorPicker label="Color 2" value={config.overlay?.mesh?.color2 || '#8b5cf6'} onChange={v => updateNestedConfig('overlay.mesh.color2', v)} />
                                <ColorPicker label="Color 3" value={config.overlay?.mesh?.color3 || '#ec4899'} onChange={v => updateNestedConfig('overlay.mesh.color3', v)} />
                                <ColorPicker label="Color 4" value={config.overlay?.mesh?.color4 || '#f59e0b'} onChange={v => updateNestedConfig('overlay.mesh.color4', v)} />
                            </div>
                        )}

                        {config.overlay?.type === 'pattern' && (
                            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                                <Select
                                    label="Pattern Preset"
                                    value={config.overlay?.pattern?.preset || 'polygons'}
                                    onChange={v => updateNestedConfig('overlay.pattern.preset', v)}
                                    options={[
                                        { value: 'polygons', label: '📐 Floating Polygons' },
                                        { value: 'waves', label: '🌊 Liquid Waves' },
                                        { value: 'abstract', label: '☁️ Abstract Nebula' },
                                        { value: 'grid', label: '📏 Minimal Grid' }
                                    ]}
                                />
                            </div>
                        )}

                        {config.overlay?.type === 'gradient' && (
                            <GradientBuilder
                                label="Overlay Gradient"
                                value={config.overlay?.gradient || {}}
                                onChange={v => updateNestedConfig('overlay.gradient', v)}
                            />
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Opacity: {config.overlay?.opacity || 0.5}</label>
                            <input type="range" min="0" max="1" step="0.1" value={config.overlay?.opacity || 0.5} onChange={e => updateNestedConfig('overlay.opacity', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                    </div>
                )}
            </CollapsibleSection>

            <CollapsibleSection
                title="Call to Actions"
                icon={<MousePointer2 size={18} />}
                isOpen={openSections.buttons}
                onToggle={() => toggleSection('buttons')}
            >
                <CTAsArrayEditor
                    value={config.ctas || []}
                    onChange={v => updateConfig('ctas', v)}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Layout & Scaling"
                icon={<Maximize size={18} />}
                isOpen={openSections.scaling}
                onToggle={() => toggleSection('scaling')}
            >
                <div className="space-y-4">
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.parallax?.enabled || false}
                            onChange={e => updateNestedConfig('parallax.enabled', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Parallax Effect</span>
                    </label>

                    {config.parallax?.enabled && (
                        <div className="space-y-2 pl-4 border-l-2 border-blue-500">
                            <label className="block text-xs font-bold text-gray-500 uppercase">Parallax Speed: {config.parallax?.speed || 0.5}</label>
                            <input type="range" min="0.1" max="1" step="0.1" value={config.parallax?.speed || 0.5} onChange={e => updateNestedConfig('parallax.speed', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                    )}

                    <div className="pt-4 border-t space-y-4">
                        <Input label="Height - Desktop (e.g. 600px)" value={config.height?.desktop || '600px'} onChange={v => updateNestedConfig('height.desktop', v)} />
                        <Input label="Height - Mobile (e.g. 400px)" value={config.height?.mobile || '400px'} onChange={v => updateNestedConfig('height.mobile', v)} />
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
}
