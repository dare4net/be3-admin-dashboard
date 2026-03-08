"use client";

import { useState } from "react";
import {
    LayoutTemplate,
    Eye,
    Sparkles,
    Trash2,
    Shuffle,
    Maximize,
    ChevronDown,
    Plus,
    X,
    Type,
    Zap,
    Box,
    MousePointer2,
    ShieldCheck
} from "lucide-react";
import ColorPicker from "@/components/config/ColorPicker";
import IconSelector from "@/components/config/IconSelector";
import ImageUploader from "@/components/config/ImageUploader";
import GradientBuilder from "@/components/config/GradientBuilder";
import FeaturesArrayEditor from "@/components/config/FeaturesArrayEditor";
import StatsArrayEditor from "@/components/config/StatsArrayEditor";
import PricingPlansEditor from "@/components/config/PricingPlansEditor";
import { AccordionItemsEditor, TabsEditor } from "@/components/config/ContentArrayEditors";
import CTAsArrayEditor from "@/components/config/CTAsArrayEditor";
import AnnouncementMessagesEditor from "@/components/config/AnnouncementMessagesEditor";
import { WIDGET_GROUPS } from "@/components/builder/SidebarLibrary";

// Flatten groups for lookups
const ALL_WIDGET_TYPES = WIDGET_GROUPS.flatMap(g => g.widgets);

/**
 * WidgetEditorModal Component
 * Extracted from monolithic page.js for better maintainability and responsiveness.
 */
export default function WidgetEditorModal({
    widget,
    onSave,
    onClose,
    categories = [],
    collections = [],
    attributes = [],
    bannerGroups = [],
    widgets = []
}) {
    const [formData, setFormData] = useState(widget);
    const [activeDevice, setActiveDevice] = useState('desktop');
    const [openSections, setOpenSections] = useState({
        randomization: false,
        content: true,
        background: false,
        overlay: false,
        buttons: false,
        layout: false,
        interaction: false,
        styling: false,
        behavior: false
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const parentWidget = widgets.find(w => w.id === formData.parent_id);
    const parentType = parentWidget?.widget_type;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const updateConfig = (key, value) => {
        setFormData(prev => ({
            ...prev,
            config: { ...prev.config, [key]: value }
        }));
    };

    const updateNestedConfig = (path, value) => {
        setFormData(prev => {
            const config = { ...prev.config };
            const keys = path.split('.');
            let current = config;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (typeof current[key] === 'string') {
                    current[key] = { text: current[key] };
                } else if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }

            current[keys[keys.length - 1]] = value;

            return {
                ...prev,
                config
            };
        });
    };

    const widgetDef = ALL_WIDGET_TYPES.find(w => w.type === widget.widget_type);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex items-center gap-3 bg-gray-50">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        {widgetDef?.icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {widget.id ? 'Edit' : 'Add'} {widgetDef?.name}
                        </h3>
                        <p className="text-xs text-gray-500">{widgetDef?.description}</p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="widget-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Parent Selector */}
                        {widgets.some(w => ['container', 'columns', 'grid', 'carousel_container', 'randomizer'].includes(w.widget_type) && w.id !== widget.id) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Container</label>
                                <select
                                    value={formData.parent_id || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value || null }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                >
                                    <option value="">None (Root Level)</option>
                                    {widgets
                                        .filter(w => ['container', 'columns', 'grid', 'carousel_container', 'randomizer'].includes(w.widget_type) && w.id !== widget.id)
                                        .map(w => {
                                            const wDef = ALL_WIDGET_TYPES.find(d => d.type === w.widget_type);
                                            const titleText = typeof w.config?.title === 'object' ? w.config.title.text : w.config?.title;
                                            const label = w.config?.adminLabel || titleText || wDef?.name || w.widget_type;
                                            return (
                                                <option key={w.id} value={w.id}>
                                                    {label} (ID: {w.id.toString().slice(-4)})
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>
                        )}

                        {/* Grid Placement */}
                        {parentType === 'grid' && (
                            <GridPlacement
                                activeDevice={activeDevice}
                                setActiveDevice={setActiveDevice}
                                parentWidget={parentWidget}
                                formData={formData}
                                updateConfig={updateConfig}
                            />
                        )}

                        {/* Dynamic Form Rendering */}
                        {renderWidgetForm(
                            widget.widget_type,
                            formData.config,
                            updateConfig,
                            updateNestedConfig,
                            categories,
                            collections,
                            attributes,
                            bannerGroups,
                            parentType,
                            openSections,
                            toggleSection
                        )}
                    </form>
                </div>

                <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
                    <button onClick={onClose} className="px-5 py-2 hover:bg-gray-200 rounded-lg font-medium text-gray-600 transition-colors">
                        Cancel
                    </button>
                    <button
                        form="widget-form"
                        type="submit"
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}

// Sub-components and Helpers will be added in chunks
function GridPlacement({ activeDevice, setActiveDevice, parentWidget, formData, updateConfig }) {
    return (
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                        <LayoutTemplate size={16} /> Grid Placement
                    </h4>
                    <div className="flex bg-orange-200/50 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setActiveDevice('desktop')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeDevice === 'desktop' ? 'bg-white text-orange-800 shadow-sm' : 'text-orange-600 hover:text-orange-800'}`}
                        >
                            DESKTOP
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveDevice('mobile')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeDevice === 'mobile' ? 'bg-white text-orange-800 shadow-sm' : 'text-orange-600 hover:text-orange-800'}`}
                        >
                            MOBILE
                        </button>
                    </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full uppercase tracking-wider">
                    Parent: {activeDevice === 'desktop' ? (parentWidget?.config?.columnCount || 3) : (parentWidget?.config?.mobileColumnCount || 1)}x{parentWidget?.config?.rowCount || 1}
                </span>
            </div>

            {activeDevice === 'desktop' ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                    <Input
                        label="Column Start"
                        type="number"
                        value={formData.config?.gridColStart || ''}
                        onChange={v => updateConfig('gridColStart', parseInt(v))}
                        placeholder="Auto"
                        min={1}
                        max={parentWidget?.config?.columnCount || 12}
                    />
                    <Input
                        label="Column Span"
                        type="number"
                        value={formData.config?.gridColSpan || 1}
                        onChange={v => updateConfig('gridColSpan', parseInt(v))}
                        min={1}
                        max={parentWidget?.config?.columnCount || 12}
                    />
                    <Input
                        label="Row Start"
                        type="number"
                        value={formData.config?.gridRowStart || ''}
                        onChange={v => updateConfig('gridRowStart', parseInt(v))}
                        placeholder="Auto"
                        min={1}
                        max={parentWidget?.config?.rowCount || 12}
                    />
                    <Input
                        label="Row Span"
                        type="number"
                        value={formData.config?.gridRowSpan || 1}
                        onChange={v => updateConfig('gridRowSpan', parseInt(v))}
                        min={1}
                        max={parentWidget?.config?.rowCount || 12}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-2 duration-200">
                    <Input
                        label="Mobile Col Start"
                        type="number"
                        value={formData.config?.mobileGridColStart || ''}
                        onChange={v => updateConfig('mobileGridColStart', parseInt(v))}
                        placeholder="Auto"
                        min={1}
                        max={parentWidget?.config?.mobileColumnCount || 1}
                    />
                    <Input
                        label="Mobile Col Span"
                        type="number"
                        value={formData.config?.mobileGridColSpan || 1}
                        onChange={v => updateConfig('mobileGridColSpan', parseInt(v))}
                        min={1}
                        max={parentWidget?.config?.mobileColumnCount || 1}
                    />
                    <Input
                        label="Mobile Row Start"
                        type="number"
                        value={formData.config?.mobileGridRowStart || ''}
                        onChange={v => updateConfig('mobileGridRowStart', parseInt(v))}
                        placeholder="Auto"
                        min={1}
                        max={parentWidget?.config?.rowCount || 12}
                    />
                    <Input
                        label="Mobile Row Span"
                        type="number"
                        value={formData.config?.mobileGridRowSpan || 1}
                        onChange={v => updateConfig('mobileGridRowSpan', parseInt(v))}
                        min={1}
                        max={parentWidget?.config?.rowCount || 12}
                    />
                </div>
            )}
        </div>
    );
}

// Internal UI Components
function Input({ label, value, onChange, type = "text", ...props }) {
    const isNumeric = type === "number" || (typeof value === 'string' && /^-?\d*\.?\d+(px|em|rem|%|vh|vw)?$/.test(value)) || props.placeholder?.includes('px');

    const handleAdjust = (delta) => {
        if (!value && value !== 0) {
            onChange(delta > 0 ? '1' : '-1');
            return;
        }
        const match = String(value).match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
            const num = parseFloat(match[1]);
            const unit = match[2] || (props.placeholder?.includes('px') ? 'px' : '');
            onChange(`${num + delta}${unit}`);
        } else {
            onChange(String(delta));
        }
    };

    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <div className="relative group">
                <input
                    type={type === 'number' ? 'text' : type}
                    value={value !== undefined && value !== null ? value : ''}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={(e) => {
                        let val = e.target.value;
                        if (props.placeholder?.includes('px') && /^-?\d*\.?\d+$/.test(val) && val !== '' && val !== '-' && val !== '.') {
                            onChange(`${val}px`);
                        }
                    }}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isNumeric ? 'pr-20' : ''}`}
                    {...props}
                />
                {isNumeric && (
                    <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                        <button type="button" onClick={() => handleAdjust(-1)} className="px-2 h-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded transition-colors flex items-center justify-center">-</button>
                        <button type="button" onClick={() => handleAdjust(1)} className="px-2 h-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded transition-colors flex items-center justify-center">+</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Textarea({ label, value, onChange, rows = 3 }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={rows}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
        </div>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function CollapsibleSection({ title, children, isOpen, onToggle, icon }) {
    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4 bg-white shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {icon}
                    </div>
                    <span className={`font-bold text-sm ${isOpen ? 'text-blue-900' : 'text-gray-700'}`}>{title}</span>
                </div>
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </button>
            {isOpen && <div className="p-5 border-t border-gray-100 space-y-5 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
}

// Carousel Image List Editor
function CarouselImageEditor({ images = [], onChange }) {
    const handleAdd = () => onChange([...images, { url: '', alt: '' }]);
    const handleRemove = (index) => onChange(images.filter((_, i) => i !== index));
    const handleUpdate = (index, field, value) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], [field]: value };
        onChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase">Carousel Images</label>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    ADD IMAGE
                </button>
            </div>
            {images.map((img, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 relative group animate-in slide-in-from-right-2">
                    <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200"
                    >
                        <Trash2 size={12} />
                    </button>
                    <div className="space-y-3">
                        <ImageUploader
                            label={`Image ${index + 1}`}
                            value={img.url}
                            onChange={(v) => handleUpdate(index, 'url', v)}
                        />
                        <Input
                            label="Alt Text"
                            placeholder="e.g. Summer Collection Banner"
                            value={img.alt || ''}
                            onChange={(v) => handleUpdate(index, 'alt', v)}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Default configurations for each widget type.
 * Moved from page.js to centralize widget logic.
 */
export function getDefaultConfig(widgetType) {
    const defaults = {
        container: { adminLabel: '', padding: '40px', backgroundColor: '', width: 'container' },
        columns: { adminLabel: '', count: 3, gap: '4' },
        grid: { adminLabel: '', columnCount: 3, rowCount: 2, gap: 16, mobileColumnCount: 1 },
        randomizer: { adminLabel: '', minDisplay: 1, maxDisplay: 3 },
        carousel_container: {
            adminLabel: '',
            itemsPerRowDesktop: 4,
            itemsPerRowTablet: 3,
            itemsPerRowMobile: 2,
            gap: 'md',
            infiniteLoop: true,
            autoPlay: false,
            autoPlayInterval: 3000,
            showArrows: 'hover',
            showDots: true,
            transitionDuration: 500,
            padding: 'py-8',
            backgroundColor: 'transparent',
            peekEffect: false
        },
        category_carousel: {
            sectionTitle: 'Shop by Category',
            showSectionTitle: true,
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            gap: 'md',
            gridGap: '12px',
            infiniteLoop: true,
            peekEffect: false,
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
        divider: { style: 'solid', color: '#e5e7eb', height: '1px' },
        spacer: { height: '32px' },
        heading: { text: 'Your Title Here', tag: 'h2', align: 'center' },
        text: { content: 'Lorem ipsum dolor sit amet...', size: '1rem', color: '' },
        quote: { text: 'Outstanding service!', author: 'John Doe' },
        image: { url: '', alt: '', caption: '' },
        header_logo: { height: '32', altText: 'Store Logo' },
        header_nav: { align: 'center', menuLocation: 'header' },
        header_actions: { showCart: true, showAccount: true, showSearch: false },
        footer_column: { title: 'Quick Links', menuLocation: 'footer_1', width: 'col-span-1' },
        hero: {
            title: 'Welcome',
            subtitle: 'Shop with us',
            ctaText: 'Shop Now',
            ctaLink: '/products',
            backgroundImage: '',
            backgroundType: 'image',
            carousel: {
                images: [],
                transition: 'fade',
                interval: 5000
            },
            overlay: {
                enabled: true,
                type: 'solid',
                color: '#000000',
                opacity: 0.4,
                pattern: { preset: 'polygons', primaryColor: '#ffffff', secondaryColor: '#3b82f6', speed: 5, density: 50 },
                mesh: { color1: '#3b82f6', color2: '#8b5cf6', color3: '#ec4899', color4: '#f59e0b', speed: 10 }
            }
        },
        interactive_section: {
            title: 'Section Title',
            subtitle: 'Section Description',
            backgroundType: 'image',
            backgroundImage: '',
            carousel: { images: [], transition: 'fade', interval: 5000 },
            hoverEffect: 'none',
            sectionLink: '',
            titleTag: 'h2',
            overlay: {
                enabled: true,
                type: 'solid',
                color: '#000000',
                opacity: 0.4
            }
        },
        product_grid: {
            title: 'Featured',
            limit: 8,
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            gridGap: '12px',
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
        product_carousel: {
            title: 'Best Sellers',
            limit: 8,
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            peekEffect: false,
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
        category_grid: {
            title: 'Shop by Category',
            style: 'grid',
            columns: { desktop: 5, tablet: 3, mobile: 2 },
            gridGap: '12px',
            titleFontSize: '1.2rem',
            fullWidthTitle: true,
            titlePadding: '10px',
            titleBottomMargin: '15px',
            sectionPaddingTop: '5px',
            sectionPaddingBottom: '5px'
        },
        featured_product: { productId: '', title: 'Product of the Month' },
        promo_banner: { title: 'Sale', backgroundColor: '#3b82f6', textColor: '#ffffff' },
        testimonials: { testimonials: [{ name: 'John', content: 'Great!', rating: 5 }] },
        features: { features: [{ icon: '✨', title: 'Feature 1', description: 'Desc' }] },
        newsletter: { title: 'Subscribe', buttonText: 'Join' },
        faq: { faqs: [{ question: 'Q?', answer: 'A' }] },
        about: { title: 'Our Story', content: 'We are...' },
        stats: { stats: [{ label: 'Sales', value: '1000+' }] },
        blog_grid: { limit: 3 },
        trust_badges: { style: 'simple' },
        custom_html: { html: '<div>Your HTML here</div>' },
        video: { url: '', title: '' },
        gallery: { images: [] },
        countdown_timer: {
            targetDate: '2026-12-31T23:59:59',
            title: 'Limited Time Offer',
            showDays: true,
            showHours: true,
            showMinutes: true,
            showSeconds: true
        },
        before_after_slider: {
            beforeImage: { url: '', label: 'Before' },
            afterImage: { url: '', label: 'After' },
            defaultPosition: 50
        },
        pricing_table: {
            plans: [
                {
                    name: 'Basic',
                    price: 9.99,
                    currency: 'USD',
                    features: [
                        { text: 'Feature 1', included: true },
                        { text: 'Feature 2', included: true },
                        { text: 'Feature 3', included: false }
                    ],
                    ctaText: 'Get Started',
                    ctaLink: '/signup'
                }
            ]
        },
        accordion: {
            items: [
                { title: 'Question 1', content: 'Answer 1', defaultOpen: true },
                { title: 'Question 2', content: 'Answer 2' }
            ]
        },
        tabs: {
            tabs: [
                { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
                { id: 'tab2', label: 'Tab 2', content: 'Content 2' }
            ]
        },
        announcement_bar: {
            message: 'Free shipping on orders over $50!',
            link: '',
            position: 'top',
            backgroundColor: '#3b82f6',
            textColor: '#ffffff'
        },
        search_bar: {
            placeholder: 'Search products…',
            autocomplete: true,
            autocomplete_limit: 8,
            container: true
        },
        search_filters: {
            container: true,
            showTitle: true
        },
        search_results: {
            container: true,
            showHeader: true,
            columns: { desktop: 4, tablet: 2, mobile: 1 }
        },
        search_page_layout: {
            columns: { desktop: 4, tablet: 2, mobile: 1 },
            sidebarEnabled: true,
            showFilters: true
        }
    };
    return defaults[widgetType] || {};
}

/**
 * Main switchboard for rendering widget configuration forms.
 */
function renderWidgetForm(
    widgetType,
    config,
    updateConfig,
    updateNestedConfig,
    categories = [],
    collections = [],
    attributes = [],
    bannerGroups = [],
    parentType = null,
    openSections = {},
    toggleSection = () => { }
) {
    // Atomic & Layout renders
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

        case 'heading':
            return (
                <>
                    <Input label="Heading Text" value={config.text || ''} onChange={v => updateConfig('text', v)} />
                    <Select label="Tag" value={config.tag || 'h2'} onChange={v => updateConfig('tag', v)} options={['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(t => ({ value: t, label: t.toUpperCase() }))} />
                    <Select label="Alignment" value={config.align || 'left'} onChange={v => updateConfig('align', v)} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
                </>
            );

        case 'quote':
            return (
                <>
                    <Textarea label="Quote Text" value={config.text || ''} onChange={v => updateConfig('text', v)} rows={4} />
                    <Input label="Author" value={config.author || ''} onChange={v => updateConfig('author', v)} />
                </>
            );

        case 'text':
            return (
                <>
                    <Textarea label="Content" value={config.content || ''} onChange={v => updateConfig('content', v)} rows={5} />
                    <Input label="Text Color" type="color" value={config.color || '#000000'} onChange={v => updateConfig('color', v)} />
                </>
            );

        case 'image':
            return (
                <>
                    <Input label="Image URL" value={config.url || ''} onChange={v => updateConfig('url', v)} />
                    <Input label="Alt Text" value={config.alt || ''} onChange={v => updateConfig('alt', v)} />
                    <Input label="Caption (optional)" value={config.caption || ''} onChange={v => updateConfig('caption', v)} />
                </>
            );

        case 'divider':
            return (
                <>
                    <Select label="Style" value={config.style || 'solid'} onChange={v => updateConfig('style', v)} options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
                    <Input label="Color" type="color" value={config.color || '#e5e7eb'} onChange={v => updateConfig('color', v)} />
                    <Input label="Height (px)" type="number" value={parseInt(config.height) || 1} onChange={v => updateConfig('height', `${v}px`)} />
                    <Select label="Width" value={config.width || '100%'} onChange={v => updateConfig('width', v)} options={[{ value: '100%', label: 'Full (100%)' }, { value: '75%', label: 'Wide (75%)' }, { value: '50%', label: 'Half (50%)' }, { value: '25%', label: 'Quarter (25%)' }]} />
                </>
            );

        case 'spacer':
            return (
                <>
                    <Input label="Height (px)" type="number" value={parseInt(config.height) || 32} onChange={v => updateConfig('height', `${v}px`)} />
                    <p className="text-xs text-gray-400 mt-1">Adjust vertical spacing between widgets.</p>
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
                            </div>
                        </div>
                    </CollapsibleSection>
                </>
            );

        case 'product_carousel':
        case 'product_grid':
            return (
                <>
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
                                { value: 'random', label: 'Random' },
                            ]} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Cols (PC)" type="number" value={config.columns?.desktop || 4} onChange={v => updateNestedConfig('columns.desktop', parseInt(v))} />
                        <Input label="Cols (Tab)" type="number" value={config.columns?.tablet || 2} onChange={v => updateNestedConfig('columns.tablet', parseInt(v))} />
                        <Input label="Cols (Mob)" type="number" value={config.columns?.mobile || 1} onChange={v => updateNestedConfig('columns.mobile', parseInt(v))} />
                    </div>

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
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showAddToCart !== false} onChange={e => updateConfig('showAddToCart', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">🛒 Add to Cart</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showPrice !== false} onChange={e => updateConfig('showPrice', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">💰 Show Price</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showFeaturedBadge !== false} onChange={e => updateConfig('showFeaturedBadge', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">⭐ Featured Badge</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showViewDetails !== false} onChange={e => updateConfig('showViewDetails', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">👁️ View Button</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showTags || false} onChange={e => updateConfig('showTags', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">🏷️ Show Tags</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showAttributes || false} onChange={e => updateConfig('showAttributes', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">✨ Show Attributes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showDescription || false} onChange={e => updateConfig('showDescription', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">📝 Description</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showSocialProof || false} onChange={e => updateConfig('showSocialProof', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">❤️ Social Proof</span>
                        </label>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                        <h4 className="font-medium text-sm">🎨 Card Styling</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker
                                label="Card Background"
                                value={config.cardStyle?.backgroundColor || '#ffffff'}
                                onChange={v => updateNestedConfig('cardStyle.backgroundColor', v)}
                            />
                            <ColorPicker
                                label="Border Color"
                                value={config.cardStyle?.borderColor || '#e5e7eb'}
                                onChange={v => updateNestedConfig('cardStyle.borderColor', v)}
                            />
                        </div>
                        <Select label="Shadow" value={config.cardStyle?.shadow || 'md'} onChange={v => updateNestedConfig('cardStyle.shadow', v)} options={[
                            { value: 'none', label: 'None' },
                            { value: 'sm', label: 'Small' },
                            { value: 'md', label: 'Medium' },
                            { value: 'lg', label: 'Large' },
                            { value: 'xl', label: 'Extra Large' }
                        ]} />
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                        <h4 className="font-medium text-sm">🌈 Colors</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Text" value={config.colors?.text || '#111827'} onChange={v => updateNestedConfig('colors.text', v)} />
                            <ColorPicker label="Price" value={config.colors?.price || '#111827'} onChange={v => updateNestedConfig('colors.price', v)} />
                            <ColorPicker label="Accent/Button" value={config.colors?.accent || '#3b82f6'} onChange={v => updateNestedConfig('colors.accent', v)} />
                            <ColorPicker label="Badge Bg" value={config.colors?.badgeBackground || '#fbbf24'} onChange={v => updateNestedConfig('colors.badgeBackground', v)} />
                        </div>
                    </div>

                    <CollapsibleSection title="Randomization" icon={<Shuffle size={18} />} isOpen={openSections.randomization} onToggle={() => toggleSection('randomization')}>
                        <RandomizationConfig config={config} updateNestedConfig={updateNestedConfig} categories={categories} collections={collections} attributes={attributes} widgetType={widgetType} />
                    </CollapsibleSection>
                </>
            );

            if (widgetType === 'featured_product') return (
                <>
                    <Input label="Section Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Input label="Product ID" value={config.productId || ''} onChange={v => updateConfig('productId', v)} />
                    <p className="text-xs text-gray-500 mt-1 italic">Enter the ID of the product you want to highlight.</p>
                </>
            );

            if (widgetType === 'category_grid') return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Select label="Source Type" value={config.sourceType || 'top-level'} onChange={v => updateConfig('sourceType', v)} options={[
                        { value: 'top-level', label: 'Top-Level' },
                        { value: 'subcategories', label: 'Subcategories' },
                        { value: 'manual', label: 'Manual' }
                    ]} />
                    {config.sourceType === 'manual' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Categories</label>
                            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-2 p-1">
                                        <input
                                            type="checkbox"
                                            checked={(config.manualCategoryIds || []).includes(cat.id)}
                                            onChange={e => {
                                                const current = config.manualCategoryIds || [];
                                                updateConfig('manualCategoryIds', e.target.checked ? [...current, cat.id] : current.filter(id => id !== cat.id));
                                            }}
                                        />
                                        <span className="text-sm">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );

        case 'hero':
        case 'interactive_section':
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
                </div>
            );

        case 'promo_banner':
            return (
                <>
                    <Input label="Banner Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <ColorPicker label="Background" value={config.backgroundColor || '#3b82f6'} onChange={v => updateConfig('backgroundColor', v)} />
                        <ColorPicker label="Text Color" value={config.textColor || '#ffffff'} onChange={v => updateConfig('textColor', v)} />
                    </div>
                </>
            );

        case 'newsletter':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Input label="Subtitle" value={config.subtitle || ''} onChange={v => updateConfig('subtitle', v)} />
                    <Input label="Placeholder" value={config.placeholder || ''} onChange={v => updateConfig('placeholder', v)} />
                    <Input label="Button Text" value={config.buttonText || ''} onChange={v => updateConfig('buttonText', v)} />

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Layout" value={config.layout || 'inline'} onChange={v => updateConfig('layout', v)} options={[
                            { value: 'inline', label: 'Inline' },
                            { value: 'stacked', label: 'Stacked' },
                            { value: 'minimal', label: 'Minimal' }
                        ]} />
                        <Input label="Button Loading Text" value={config.loadingText || 'Sending...'} onChange={v => updateConfig('loadingText', v)} />
                    </div>

                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-sm">Background</h4>
                        <ColorPicker label="Section Background" value={config.backgroundColor || '#f3f4f6'} onChange={v => updateConfig('backgroundColor', v)} />
                        <ColorPicker label="Text Color" value={config.textColor || '#1f2937'} onChange={v => updateConfig('textColor', v)} />
                    </div>

                    <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                        <h4 className="font-medium text-sm">⌨️ Input Style</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Input Bg" value={config.inputStyle?.backgroundColor || '#ffffff'} onChange={v => updateNestedConfig('inputStyle.backgroundColor', v)} />
                            <ColorPicker label="Border" value={config.inputStyle?.borderColor || '#e5e7eb'} onChange={v => updateNestedConfig('inputStyle.borderColor', v)} />
                            <ColorPicker label="Text" value={config.inputStyle?.textColor || '#1f2937'} onChange={v => updateNestedConfig('inputStyle.textColor', v)} />
                            <Input label="Radius" value={config.inputStyle?.borderRadius || '8px'} onChange={v => updateNestedConfig('inputStyle.borderRadius', v)} />
                        </div>
                    </div>

                    <div className="p-4 bg-gray-900 text-white rounded-lg space-y-3">
                        <h4 className="font-medium text-sm">🔘 Button Style</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Button Bg" value={config.buttonStyle?.backgroundColor || '#111827'} onChange={v => updateNestedConfig('buttonStyle.backgroundColor', v)} />
                            <ColorPicker label="Text Color" value={config.buttonStyle?.textColor || '#ffffff'} onChange={v => updateNestedConfig('buttonStyle.textColor', v)} />
                            <Input label="Radius" value={config.buttonStyle?.borderRadius || '8px'} onChange={v => updateNestedConfig('buttonStyle.borderRadius', v)} className="text-black" />
                        </div>
                    </div>
                </>
            );

        case 'testimonials':
            return (
                <>
                    <Input label="Section Title" value={config.title || 'What Our Customers Say'} onChange={v => updateConfig('title', v)} />
                    <ColorPicker label="Title Color" value={config.titleColor || '#111827'} onChange={v => updateConfig('titleColor', v)} />

                    <TestimonialsListEditor
                        value={config.testimonials || []}
                        onChange={v => updateConfig('testimonials', v)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Layout" value={config.layout || 'carousel'} onChange={v => updateConfig('layout', v)} options={[
                            { value: 'carousel', label: 'Carousel' },
                            { value: 'grid', label: 'Grid' }
                        ]} />
                        <Input label="Autoplay Interval (ms)" type="number" value={config.interval || 5000} onChange={v => updateConfig('interval', parseInt(v))} />
                    </div>

                    <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.autoPlay !== false} onChange={e => updateConfig('autoPlay', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Auto Play</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showImage !== false} onChange={e => updateConfig('showImage', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Image</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showRole !== false} onChange={e => updateConfig('showRole', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Role</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.showDate !== false} onChange={e => updateConfig('showDate', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium">Show Date</span>
                        </label>
                    </div>

                    <ColorPicker label="Section Background" value={config.backgroundColor || '#f9fafb'} onChange={v => updateConfig('backgroundColor', v)} />

                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-3">
                        <h4 className="font-medium text-sm">🎨 Card Style</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Card Bg" value={config.cardStyle?.backgroundColor || '#ffffff'} onChange={v => updateNestedConfig('cardStyle.backgroundColor', v)} />
                            <ColorPicker label="Text Color" value={config.cardStyle?.textColor || '#374151'} onChange={v => updateNestedConfig('cardStyle.textColor', v)} />
                            <ColorPicker label="Star Color" value={config.cardStyle?.starColor || '#facc15'} onChange={v => updateNestedConfig('cardStyle.starColor', v)} />
                        </div>
                        <Select label="Shadow" value={config.cardStyle?.shadow || 'xl'} onChange={v => updateNestedConfig('cardStyle.shadow', v)} options={[
                            { value: 'none', label: 'None' },
                            { value: 'sm', label: 'Small' },
                            { value: 'xl', label: 'Soft Large' }
                        ]} />
                    </div>
                </>
            );
        case 'about':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Textarea label="Content" value={config.content || ''} onChange={v => updateConfig('content', v)} rows={5} />
                    <Input label="Image URL" value={config.image || ''} onChange={v => updateConfig('image', v)} />
                </>
            );
        case 'video':
            return (
                <>
                    <Input label="Video URL (YouTube/Vimeo)" value={config.url || ''} onChange={v => updateConfig('url', v)} />
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={config.autoplay || false} onChange={e => updateConfig('autoplay', e.target.checked)} /> Autoplay (Muted)</label>
                </>
            );
        case 'custom_html':
            return (
                <Textarea label="HTML Content" value={config.html || ''} onChange={v => updateConfig('html', v)} rows={12} className="font-mono text-xs" />
            );

        case 'trust_badges':
            return (
                <div className="space-y-4">
                    <Select label="Style" value={config.style || 'simple'} onChange={v => updateConfig('style', v)} options={[
                        { value: 'simple', label: 'Simple Icons' },
                        { value: 'card', label: 'Glass Cards' },
                        { value: 'minimal', label: 'Minimal Text' },
                        { value: 'outline', label: 'Outline' }
                    ]} />
                    <Input label="Section Title (Optional)" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <ColorPicker label="Accent Color" value={config.accentColor || '#3b82f6'} onChange={v => updateConfig('accentColor', v)} />

                    <div className="pt-4 border-t space-y-4">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custom Badges</h5>
                            <button type="button" onClick={() => updateConfig('badges', [...(config.badges || []), { title: 'New Badge', text: '', icon: 'ShieldCheck' }])} className="text-blue-600 hover:text-blue-700 font-bold text-xs uppercase">+ Add Custom</button>
                        </div>
                        {(config.badges || []).map((b, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative group">
                                <button type="button" onClick={() => updateConfig('badges', config.badges.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                                <div className="space-y-2">
                                    <Input label="Badge Title" value={b.title} onChange={v => {
                                        const newB = [...config.badges];
                                        newB[i] = { ...newB[i], title: v };
                                        updateConfig('badges', newB);
                                    }} />
                                    <ImageUploader label="Custom Icon/Image" value={b.imageUrl || ''} onChange={v => {
                                        const newB = [...config.badges];
                                        newB[i] = { ...newB[i], imageUrl: v };
                                        updateConfig('badges', newB);
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'features':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <div className="pt-4 border-t">
                        <FeaturesArrayEditor
                            value={config.features || []}
                            onChange={v => updateConfig('features', v)}
                        />
                    </div>
                </>
            );

        case 'stats':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <div className="pt-4 border-t">
                        <StatsArrayEditor
                            value={config.stats || []}
                            onChange={v => updateConfig('stats', v)}
                        />
                    </div>
                </>
            );

        case 'faq':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <div className="space-y-4 pt-4 border-t">
                        {(config.faqs || []).map((f, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                                <button type="button" onClick={() => updateConfig('faqs', config.faqs.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                <div className="space-y-3">
                                    <Input label="Question" value={f.question} onChange={v => {
                                        const newF = [...config.faqs];
                                        newF[i] = { ...newF[i], question: v };
                                        updateConfig('faqs', newF);
                                    }} />
                                    <Textarea label="Answer" value={f.answer} onChange={v => {
                                        const newF = [...config.faqs];
                                        newF[i] = { ...newF[i], answer: v };
                                        updateConfig('faqs', newF);
                                    }} />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => updateConfig('faqs', [...(config.faqs || []), { question: '', answer: '' }])} className="w-full py-2 border-2 border-dashed rounded-lg text-blue-600 font-bold text-xs uppercase hover:bg-blue-50">Add FAQ</button>
                    </div>
                </>
            );

        case 'gallery':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <div className="pt-4 border-t">
                        <CarouselImageEditor
                            images={config.images || []}
                            onChange={v => updateConfig('images', v)}
                        />
                    </div>
                </>
            );

        case 'blog_grid':
            return (
                <>
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Input label="Limit" type="number" value={config.limit || 3} onChange={v => updateConfig('limit', parseInt(v))} />
                </>
            );

        case 'countdown_timer':
            return (
                <div className="space-y-4">
                    <Input label="Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Target Date" type="datetime-local" value={config.targetDate?.split('.')[0] || ''} onChange={v => updateConfig('targetDate', v)} />
                        <Select label="Timezone" value={config.timezone || 'auto'} onChange={v => updateConfig('timezone', v)} options={[
                            { value: 'auto', label: 'User Local' },
                            { value: 'UTC', label: 'UTC' }
                        ]} />
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t mt-4">
                        <label className="flex flex-col items-center gap-1 cursor-pointer p-2 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.showDays !== false} onChange={e => updateConfig('showDays', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-[10px] font-bold uppercase">Days</span>
                        </label>
                        <label className="flex flex-col items-center gap-1 cursor-pointer p-2 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.showHours !== false} onChange={e => updateConfig('showHours', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-[10px] font-bold uppercase">Hours</span>
                        </label>
                        <label className="flex flex-col items-center gap-1 cursor-pointer p-2 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.showMinutes !== false} onChange={e => updateConfig('showMinutes', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-[10px] font-bold uppercase">Mins</span>
                        </label>
                        <label className="flex flex-col items-center gap-1 cursor-pointer p-2 bg-gray-50 rounded-lg">
                            <input type="checkbox" checked={config.showSeconds !== false} onChange={e => updateConfig('showSeconds', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-[10px] font-bold uppercase">Secs</span>
                        </label>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                        <h4 className="font-medium text-sm">🎨 Layout & Style</h4>
                        <Select label="Layout" value={config.layout || 'horizontal'} onChange={v => updateConfig('layout', v)} options={[
                            { value: 'horizontal', label: '↔️ Horizontal' },
                            { value: 'vertical', label: '↕️ Vertical Stacked' },
                            { value: 'circular', label: '⭕ Circular Rings' }
                        ]} />
                        <Select label="Digit Style" value={config.digitStyle || 'static'} onChange={v => updateConfig('digitStyle', v)} options={[
                            { value: 'static', label: '✨ Clean & Modern' },
                            { value: 'flip', label: '⏲️ Mechanical Flip' },
                            { value: 'rotate', label: '🌀 3D Rotate' }
                        ]} />
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                        <h4 className="font-medium text-sm">🌈 Colors</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Digit Bg" value={config.digitBg || '#111827'} onChange={v => updateConfig('digitBg', v)} />
                            <ColorPicker label="Digit Text" value={config.digitColor || '#ffffff'} onChange={v => updateConfig('digitColor', v)} />
                            <ColorPicker label="Label Text" value={config.labelColor || '#4b5563'} onChange={v => updateConfig('labelColor', v)} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-red-900">Urgency Pulse</span>
                            <span className="text-[10px] text-red-700">Pulses red when under 24h</span>
                        </div>
                        <ToggleButton value={config.pulseWhenLow || false} onChange={v => updateConfig('pulseWhenLow', v)} />
                    </div>
                </div>
            );

        case 'before_after_slider':
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Before Image</label>
                            <ImageUploader value={config.beforeImage?.url || ''} onChange={v => updateNestedConfig('beforeImage.url', v)} />
                            <Input label="Label" value={config.beforeImage?.label || 'Before'} onChange={v => updateNestedConfig('beforeImage.label', v)} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">After Image</label>
                            <ImageUploader value={config.afterImage?.url || ''} onChange={v => updateNestedConfig('afterImage.url', v)} />
                            <Input label="Label" value={config.afterImage?.label || 'After'} onChange={v => updateNestedConfig('afterImage.label', v)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Slider Position: {config.defaultPosition || 50}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.defaultPosition || 50}
                            onChange={e => updateConfig('defaultPosition', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>
            );

        case 'pricing_table':
            return (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <Input label="Admin Label" value={config.adminLabel || ''} onChange={v => updateConfig('adminLabel', v)} placeholder="e.g. Subscription Tiers" />
                    </div>

                    <PricingPlansEditor
                        value={config.plans || []}
                        onChange={v => updateConfig('plans', v)}
                    />

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
                        <div className="grid grid-cols-2 gap-3">
                            <ColorPicker label="Accent Color" value={config.theme?.accentColor || '#3b82f6'} onChange={v => updateNestedConfig('theme.accentColor', v)} />
                            <ColorPicker label="Card Background" value={config.theme?.cardBg || '#ffffff'} onChange={v => updateNestedConfig('theme.cardBg', v)} />
                            <ColorPicker label="Text Color" value={config.theme?.textColor || '#111827'} onChange={v => updateNestedConfig('theme.textColor', v)} />
                            <ColorPicker label="Price Color" value={config.theme?.priceColor || '#111827'} onChange={v => updateNestedConfig('theme.priceColor', v)} />
                        </div>
                        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm">Highlight Best Value</span>
                            <ToggleButton value={config.theme?.highlightBestValue !== false} onChange={v => updateNestedConfig('theme.highlightBestValue', v)} />
                        </div>
                    </CollapsibleSection>
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

        case 'tabs':
            return (
                <div className="space-y-4">
                    <TabsEditor
                        value={config.tabs || []}
                        onChange={v => updateConfig('tabs', v)}
                    />
                </div>
            );

        case 'header_logo':
            return (
                <>
                    <ImageUploader label="Logo Image" value={config.url || ''} onChange={v => updateConfig('url', v)} />
                    <Input label="Height (px)" type="number" value={config.height || 32} onChange={v => updateConfig('height', parseInt(v))} />
                    <Input label="Alt Text" value={config.altText || ''} onChange={v => updateConfig('altText', v)} />
                </>
            );

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
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Show Cart</span>
                        <ToggleButton value={config.showCart !== false} onChange={v => updateConfig('showCart', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Show Account</span>
                        <ToggleButton value={config.showAccount !== false} onChange={v => updateConfig('showAccount', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Show Search</span>
                        <ToggleButton value={config.showSearch !== false} onChange={v => updateConfig('showSearch', v)} />
                    </div>
                </div>
            );

        case 'footer_column':
            return (
                <>
                    <Input label="Column Title" value={config.title || ''} onChange={v => updateConfig('title', v)} />
                    <Select label="Menu View" value={config.menuLocation || 'footer_1'} onChange={v => updateConfig('menuLocation', v)} options={[1, 2, 3, 4].map(n => ({ value: `footer_${n}`, label: `Footer Column ${n}` }))} />
                </>
            );

        case 'category_carousel':
            return (
                <>
                    <Input label="Title" value={config.sectionTitle || ''} onChange={v => updateConfig('sectionTitle', v)} />
                    <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500">Uses global category settings for display.</p>
                    </div>
                </>
            );

        case 'announcement_bar':
            return (
                <>
                    <AnnouncementMessagesEditor
                        value={config.messages || (config.message ? [{ text: config.message }] : [])}
                        onChange={v => updateConfig('messages', v)}
                    />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <ColorPicker label="Background" value={config.backgroundColor || '#3b82f6'} onChange={v => updateConfig('backgroundColor', v)} />
                        <ColorPicker label="Text Color" value={config.textColor || '#ffffff'} onChange={v => updateConfig('textColor', v)} />
                    </div>
                </>
            );

        case 'search_bar':
        case 'search_filters':
        case 'search_results':
        case 'search_page_layout':
            return (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-blue-900">Search Component</h4>
                        <p className="text-xs text-blue-700">Configurations for this component are managed via the Search Settings module.</p>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

function RandomizationConfig({ config, updateNestedConfig, categories, collections, attributes, widgetType }) {
    const isProduct = ['product_grid', 'product_carousel'].includes(widgetType);
    return (
        <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-purple-900">Enable Randomization</span>
                    </div>
                    <ToggleButton
                        value={config.randomize?.enabled}
                        onChange={v => {
                            if (!config.randomize) {
                                updateNestedConfig('randomize', {
                                    enabled: true,
                                    interval: 'session',
                                    randomizeSource: false,
                                    allowedSourceTypes: ['all', 'category', 'collection', 'clause'],
                                    randomizeSort: false,
                                    randomizeLimit: false,
                                    limitRange: { min: 4, max: 12 }
                                });
                            } else {
                                updateNestedConfig('randomize.enabled', v);
                            }
                        }}
                    />
                </div>
            </div>
            {config.randomize?.enabled && (
                <div className="space-y-4">
                    <Select
                        label="Interval"
                        value={config.randomize.interval || 'session'}
                        onChange={v => updateNestedConfig('randomize.interval', v)}
                        options={[
                            { value: 'page_load', label: 'Every Load' },
                            { value: 'session', label: 'Per Session' },
                            { value: 'hourly', label: 'Hourly' },
                            { value: 'daily', label: 'Daily' }
                        ]}
                    />
                    {isProduct && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm">Randomize Source</span>
                                <ToggleButton value={config.randomize.randomizeSource} onChange={v => updateNestedConfig('randomize.randomizeSource', v)} />
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm">Randomize Sort</span>
                                <ToggleButton value={config.randomize.randomizeSort} onChange={v => updateNestedConfig('randomize.randomizeSort', v)} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ToggleButton({ value, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}

