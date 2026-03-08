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
import { WIDGET_GROUPS } from "@/components/builder/SidebarLibrary";
import ProductForms from "./forms/ProductForms";
import CategoryForms from "./forms/CategoryForms";
import PricingForms from "./forms/PricingForms";
import HeroBannerForms from "./forms/HeroBannerForms";
import LayoutForms from "./forms/LayoutForms";
import AtomicForms from "./forms/AtomicForms";
import NavigationForms from "./forms/NavigationForms";
import SpecialistForms from "./forms/SpecialistForms";

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

// Grid Placement Sub-component
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

// Internal UI Components (Minimal set used by GridPlacement, others moved to FormComponents)
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
    const commonProps = {
        widgetType,
        config,
        updateConfig,
        updateNestedConfig,
        categories,
        collections,
        attributes,
        bannerGroups,
        parentType,
        openSections,
        toggleSection
    };

    if (['product_carousel', 'product_grid'].includes(widgetType)) {
        return <ProductForms {...commonProps} />;
    }

    if (['category_carousel', 'category_grid'].includes(widgetType)) {
        return <CategoryForms {...commonProps} />;
    }

    if (['pricing_table'].includes(widgetType)) {
        return <PricingForms {...commonProps} />;
    }

    if (['hero', 'interactive_section', 'promo_banner'].includes(widgetType)) {
        return <HeroBannerForms {...commonProps} />;
    }

    if (['container', 'columns', 'grid', 'carousel_container'].includes(widgetType)) {
        return <LayoutForms {...commonProps} />;
    }

    if (['heading', 'quote', 'text', 'image', 'divider', 'spacer', 'header_logo'].includes(widgetType)) {
        return <AtomicForms {...commonProps} />;
    }

    if (['header_nav', 'header_actions', 'footer_column', 'announcement_bar', 'newsletter'].includes(widgetType)) {
        return <NavigationForms {...commonProps} />;
    }

    return <SpecialistForms {...commonProps} />;
}

/**
 * Default configurations for each widget type.
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
            title: 'Shop by Category',
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
            sectionPaddingBottom: '5px',
            showRating: false,
            categoryTitleColor: '#ffffff',
            categoryTitleFontSizeDesktop: 18,
            categoryTitleFontSizeTablet: 16,
            categoryTitleFontSizeMobile: 14,
            categoryTitleFontWeight: 600,
            categoryTitleAlignment: 'center'
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
            sectionPaddingBottom: '5px',
            showAddToCart: true,
            showPrice: true,
            showFeaturedBadge: true,
            showViewDetails: true,
            showTags: false,
            showAttributes: false,
            showDescription: false,
            showSocialProof: false,
            showRating: false
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
            sectionPaddingBottom: '5px',
            categoryTitleColor: '#ffffff',
            categoryTitleFontSizeDesktop: 18,
            categoryTitleFontSizeTablet: 16,
            categoryTitleFontSizeMobile: 14,
            categoryTitleFontWeight: 600,
            categoryTitleAlignment: 'center'
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
            title: 'Pricing Plans',
            subtitle: 'Choose the best plan for your needs',
            showComparisonTable: false,
            enableTooltips: true,
            columns: { desktop: 3, tablet: 2, mobile: 1 },
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
            ],
            theme: {
                accentColor: '#3b82f6',
                cardBg: '#ffffff',
                textColor: '#111827',
                priceColor: '#111827',
                includedFeatureColor: '#10b981',
                excludedFeatureColor: '#9ca3af',
                highlightBestValue: true
            }
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
