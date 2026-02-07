import { useState } from "react";
import {
    Type, Image, Box, Columns, List, MessageSquare,
    Video, ShoppingBag, LayoutTemplate, Star, Percent,
    CreditCard, Layout, Heading, Divide, GripHorizontal, Code,
    Clock, Sparkles, DollarSign, ChevronsUpDown, FolderKanban, Megaphone,
    Search, SlidersHorizontal, Grid, ChevronRight, ChevronDown, Eye, EyeOff, Edit2, Trash2, Copy
} from "lucide-react";

export const WIDGET_GROUPS = [
    {
        title: "Layout",
        widgets: [
            { type: 'container', name: 'Container', icon: <Box size={20} />, description: 'Layout wrapper' },
            { type: 'columns', name: 'Columns', icon: <Columns size={20} />, description: 'Multi-column grid' },
            { type: 'grid', name: 'CSS Grid', icon: <Grid size={20} />, description: 'Advanced CSS Grid layout' },
            { type: 'carousel_container', name: 'Carousel Container', icon: <Layout size={20} />, description: 'Structural carousel' },
            { type: 'divider', name: 'Divider', icon: <Divide size={20} />, description: 'Horizontal line' },
            { type: 'spacer', name: 'Spacer', icon: <GripHorizontal size={20} />, description: 'Empty space' },
            { type: 'randomizer', name: 'Randomizer', icon: <Sparkles size={20} />, description: 'Randomly display nested widgets' },
        ]
    },
    {
        title: "Typography",
        widgets: [
            { type: 'heading', name: 'Heading', icon: <Heading size={20} />, description: 'H1-H6 titles' },
            { type: 'text', name: 'Text Block', icon: <Type size={20} />, description: 'Rich text paragraph' },
            { type: 'quote', name: 'Quote', icon: <MessageSquare size={20} />, description: 'Blockquote' },
        ]
    },
    {
        title: "Media",
        widgets: [
            { type: 'image', name: 'Image', icon: <Image size={20} />, description: 'Single image' },
            { type: 'video', name: 'Video', icon: <Video size={20} />, description: 'Embed video' },
            { type: 'gallery', name: 'Gallery', icon: <LayoutTemplate size={20} />, description: 'Image grid' },
        ]
    },
    {
        title: "Interactive",
        widgets: [
            { type: 'countdown_timer', name: 'Countdown Timer', icon: <Clock size={20} />, description: 'Countdown to date' },
            { type: 'before_after_slider', name: 'Before/After', icon: <Sparkles size={20} />, description: 'Image comparison' },
            { type: 'pricing_table', name: 'Pricing Table', icon: <DollarSign size={20} />, description: 'Price plans' },
            { type: 'accordion', name: 'Accordion', icon: <ChevronsUpDown size={20} />, description: 'Collapsible FAQ' },
            { type: 'tabs', name: 'Tabs', icon: <FolderKanban size={20} />, description: 'Tabbed content' },
            { type: 'interactive_section', name: 'Interactive Section', icon: <Sparkles size={20} />, description: 'Engaging section with hover effects' },
            { type: 'announcement_bar', name: 'Announcement Bar', icon: <Megaphone size={20} />, description: 'Top/bottom bar' },
        ]
    },
    {
        title: "Commerce",
        widgets: [
            { type: 'product_grid', name: 'Product Grid', icon: <ShoppingBag size={20} />, description: 'Product list' },
            { type: 'product_carousel', name: 'Product Carousel', icon: <ShoppingBag size={20} />, description: 'Sliding products' },
            { type: 'category_grid', name: 'Category Grid', icon: <LayoutTemplate size={20} />, description: 'Category list' },
            { type: 'category_carousel', name: 'Category Carousel', icon: <Sparkles size={20} />, description: 'Premium category carousel' },
            { type: 'hero', name: 'Hero Banner', icon: <Layout size={20} />, description: 'Large promotional area' },
            { type: 'featured_product', name: 'Featured Product', icon: <Star size={20} />, description: 'Spotlight a product' },
            { type: 'promo_banner', name: 'Promo Banner', icon: <Percent size={20} />, description: 'Sale banner' },
            { type: 'trust_badges', name: 'Trust Badges', icon: <CreditCard size={20} />, description: 'Payment icons' },
            { type: 'testimonials', name: 'Testimonials', icon: <MessageSquare size={20} />, description: 'Customer reviews' },
            { type: 'features', name: 'Features', icon: <Star size={20} />, description: 'USP grid' },
            { type: 'newsletter', name: 'Newsletter', icon: <MessageSquare size={20} />, description: 'Email signup' },
            { type: 'faq', name: 'FAQ', icon: <MessageSquare size={20} />, description: 'Questions' },
            { type: 'about', name: 'About Us', icon: <Type size={20} />, description: 'Company info' },
            { type: 'stats', name: 'Stats', icon: <Percent size={20} />, description: 'Numbers/Counters' },
            { type: 'blog_grid', name: 'Blog Grid', icon: <LayoutTemplate size={20} />, description: 'Recent posts' },
            { type: 'custom_html', name: 'Custom HTML', icon: <Code size={20} />, description: 'Raw HTML' },
            // Headers/Footers
            { type: 'header_logo', name: 'Header Logo', icon: <Image size={20} />, description: 'Logo' },
            { type: 'header_nav', name: 'Header Nav', icon: <List size={20} />, description: 'Navigation menu' },
            { type: 'header_actions', name: 'Header Icons', icon: <ShoppingBag size={20} />, description: 'Cart/Account icons' },
            { type: 'footer_column', name: 'Footer Link', icon: <List size={20} />, description: 'Footer link list' },
        ]
    },
    {
        title: "Search",
        widgets: [
            { type: 'search_bar', name: 'Search Bar', icon: <Search size={20} />, description: 'Search input with autocomplete' },
            { type: 'search_filters', name: 'Search Filters', icon: <SlidersHorizontal size={20} />, description: 'Category/price/attribute filters' },
            { type: 'search_results', name: 'Search Results', icon: <Grid size={20} />, description: 'Results grid with sorting' },
            { type: 'search_page_layout', name: 'Search Page Layout', icon: <Layout size={20} />, description: 'Complete search page layout' },
        ]
    }
];

function StructureItem({ widget, widgets, level = 0, onEdit, onDelete, onDuplicate, onToggleVisibility, dirtyWidgetIds }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = ['container', 'columns', 'grid', 'carousel_container', 'randomizer'].includes(widget.widget_type);
    const childWidgets = widgets.filter(w => w.parent_id === widget.id).sort((a, b) => a.sort_order - b.sort_order);

    const findIcon = (type) => {
        for (const group of WIDGET_GROUPS) {
            const found = group.widgets.find(w => w.type === type);
            if (found) return found.icon;
        }
        return <Box size={16} />;
    };

    return (
        <div className="flex flex-col">
            <div
                className={`flex items-center gap-2 group p-2 hover:bg-gray-100 rounded-lg transition-colors ${!widget.is_active ? 'opacity-50' : ''}`}
                style={{ paddingLeft: `${(level * 16) + 8}px` }}
            >
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-0.5 hover:bg-gray-200 rounded text-gray-400"
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <div className="w-4" />
                )}

                <div className="text-gray-400">
                    {findIcon(widget.widget_type)}
                </div>

                <span className="text-sm font-medium text-gray-700 truncate flex-1 flex items-center gap-2">
                    {widget.config?.adminLabel ||
                        (typeof widget.config?.title === 'object' ? widget.config.title.text : widget.config?.title) ||
                        widget.widget_type}
                    {dirtyWidgetIds?.has(widget.id) && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="Unsaved changes" />
                    )}
                </span>

                <div className="hidden group-hover:flex items-center gap-1">
                    <button onClick={() => onToggleVisibility(widget)} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Toggle Visibility">
                        {widget.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button onClick={() => onDuplicate(widget)} className="p-1 hover:bg-gray-100 rounded text-green-600" title="Duplicate">
                        <Copy size={12} />
                    </button>
                    <button onClick={() => onEdit(widget)} className="p-1 hover:bg-gray-100 rounded text-blue-600" title="Edit">
                        <Edit2 size={12} />
                    </button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="flex flex-col">
                    {childWidgets.length > 0 ? (
                        childWidgets.map(child => (
                            <StructureItem
                                key={child.id}
                                widget={child}
                                widgets={widgets}
                                level={level + 1}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onDuplicate={onDuplicate}
                                onToggleVisibility={onToggleVisibility}
                                dirtyWidgetIds={dirtyWidgetIds}
                            />
                        ))
                    ) : (
                        <div
                            className="text-[10px] text-gray-400 italic py-1"
                            style={{ paddingLeft: `${((level + 1) * 16) + 24}px` }}
                        >
                            Empty
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SidebarLibrary({ onAddWidget, widgets = [], onEdit, onDelete, onDuplicate, onToggleVisibility, dirtyWidgetIds }) {
    const [activeTab, setActiveTab] = useState('library'); // 'library' or 'structure'

    return (
        <div className="w-80 bg-white border-r overflow-hidden flex flex-col h-full shadow-lg z-10">
            {/* Tabs */}
            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('library')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'library' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                    Library
                </button>
                <button
                    onClick={() => setActiveTab('structure')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'structure' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                    Structure {widgets.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px]">{widgets.length}</span>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'library' ? (
                    <div className="flex flex-col gap-8">
                        {WIDGET_GROUPS.map((group) => (
                            <div key={group.title}>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">
                                    {group.title}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {group.widgets.map((widget) => (
                                        <button
                                            key={widget.type}
                                            onClick={() => onAddWidget(widget.type)}
                                            className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all text-center gap-3 group"
                                        >
                                            <div className="text-gray-400 group-hover:text-blue-600 transition-colors transform group-hover:scale-110 duration-200">
                                                {widget.icon}
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-600 group-hover:text-blue-700 leading-tight">
                                                {widget.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-1">
                                Page Tree
                            </h3>
                        </div>

                        {widgets.length === 0 ? (
                            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl">
                                <p className="text-sm text-gray-400">Your page is empty</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {widgets.filter(w => !w.parent_id).sort((a, b) => a.sort_order - b.sort_order).map((widget) => (
                                    <StructureItem
                                        key={widget.id}
                                        widget={widget}
                                        widgets={widgets}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onDuplicate={onDuplicate}
                                        onToggleVisibility={onToggleVisibility}
                                        dirtyWidgetIds={dirtyWidgetIds}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
