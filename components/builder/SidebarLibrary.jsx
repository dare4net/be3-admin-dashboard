import {
    Type, Image, Box, Columns, List, MessageSquare,
    Video, ShoppingBag, LayoutTemplate, Star, Percent,
    CreditCard, Layout, Heading, Divide, GripHorizontal, Code,
    Clock, Sparkles, DollarSign, ChevronsUpDown, FolderKanban, Megaphone
} from "lucide-react";

export const WIDGET_GROUPS = [
    {
        title: "Layout",
        widgets: [
            { type: 'container', name: 'Container', icon: <Box size={20} />, description: 'Layout wrapper' },
            { type: 'columns', name: 'Columns', icon: <Columns size={20} />, description: 'Multi-column grid' },
            { type: 'divider', name: 'Divider', icon: <Divide size={20} />, description: 'Horizontal line' },
            { type: 'spacer', name: 'Spacer', icon: <GripHorizontal size={20} />, description: 'Empty space' },
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
            { type: 'announcement_bar', name: 'Announcement Bar', icon: <Megaphone size={20} />, description: 'Top/bottom bar' },
        ]
    },
    {
        title: "Commerce",
        widgets: [
            { type: 'product_grid', name: 'Product Grid', icon: <ShoppingBag size={20} />, description: 'Product list' },
            { type: 'product_carousel', name: 'Product Carousel', icon: <ShoppingBag size={20} />, description: 'Sliding products' },
            { type: 'category_grid', name: 'Category Grid', icon: <LayoutTemplate size={20} />, description: 'Category list' },
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
    }
];

export default function SidebarLibrary({ onAddWidget }) {
    return (
        <div className="w-80 bg-gray-50 border-r overflow-y-auto p-4 flex flex-col gap-6 h-full">
            <h2 className="font-bold text-gray-900 text-lg">Widget Library</h2>

            {WIDGET_GROUPS.map((group) => (
                <div key={group.title}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                        {group.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {group.widgets.map((widget) => (
                            <button
                                key={widget.type}
                                onClick={() => onAddWidget(widget.type)}
                                className="flex flex-col items-center justify-center p-3 bg-white border rounded-lg hover:border-blue-500 hover:shadow-sm transition text-center gap-2 group"
                            >
                                <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                                    {widget.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                                        {widget.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
