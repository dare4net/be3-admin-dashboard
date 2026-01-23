"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import {
    Layout,
    Grid,
    Filter,
    Save,
    Loader2,
    Search,
    Eye,
    ChevronRight,
    SearchCheck,
    Smartphone,
    Tablet,
    Monitor
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function SearchCustomizationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [layoutWidget, setLayoutWidget] = useState(null);
    const [widgets, setWidgets] = useState([]);

    // Default config state
    const [config, setConfig] = useState({
        columns: { desktop: 5, tablet: 3, mobile: 2 },
        sidebarEnabled: true,
        showFilters: true,
        resultsPerPage: 20,
        defaultSort: 'relevance'
    });

    useEffect(() => {
        fetchSearchWidgets();
    }, []);

    const fetchSearchWidgets = async () => {
        try {
            setLoading(true);
            const res = await api.get("/page-builder/widgets?page=search&includeInactive=true");
            if (res.data?.success) {
                const fetchedWidgets = res.data.widgets || [];
                setWidgets(fetchedWidgets);

                // Find the search_page_layout widget
                const mainLayout = fetchedWidgets.find(w => w.widget_type === 'search_page_layout');
                if (mainLayout) {
                    setLayoutWidget(mainLayout);

                    // Parse config if it's a string
                    let parsedConfig = mainLayout.config || {};
                    if (typeof parsedConfig === 'string') {
                        try {
                            parsedConfig = JSON.parse(parsedConfig);
                        } catch (e) {
                            console.error("Failed to parse widget config", e);
                            parsedConfig = {};
                        }
                    }

                    // Merge saved config with defaults
                    setConfig(prev => ({
                        ...prev,
                        ...parsedConfig
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch search widgets", error);
            toast.error("Failed to load search settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        console.log("handleSave triggered. currentConfig:", config);
        console.log("layoutWidget state:", layoutWidget);
        try {
            setSaving(true);

            if (layoutWidget) {
                console.log("Updating existing widget with ID:", layoutWidget.id);
                // Update existing
                const res = await api.put(`/page-builder/widgets/${layoutWidget.id}`, {
                    config: config
                });
                console.log("Update response:", res.data);
            } else {
                console.log("Creating new widget for search page...");
                // Create new for the search page
                const res = await api.post("/page-builder/widgets", {
                    page_type: 'search',
                    widget_type: 'search_page_layout',
                    config: config,
                    title: 'Search Page Layout',
                    sort_order: 0,
                    is_active: true
                });
                console.log("Create response:", res.data);
                if (res.data?.success) {
                    setLayoutWidget(res.data.widget);
                }
            }

            toast.success("Search settings saved successfully!");
        } catch (error) {
            console.error("CRITICAL: Failed to save search settings", error);
            if (error.response) {
                console.error("Server responded with:", error.response.status, error.response.data);
            }
            toast.error("Failed to save settings: " + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const updateNestedConfig = (path, value) => {
        const keys = path.split('.');
        setConfig(prev => {
            const newConfig = { ...prev };
            let current = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newConfig;
        });
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSave();
            }}
            className="max-w-5xl mx-auto space-y-6 relative"
        >
            {saving && (
                <div className="fixed inset-0 bg-white/20 backdrop-blur-[1px] z-50 flex items-center justify-center cursor-wait">
                    <div className="bg-white p-4 rounded-xl shadow-2xl border border-blue-100 flex items-center gap-3">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="font-semibold text-gray-700">Saving Settings...</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Search Page Customization</h1>
                    <p className="text-gray-500">Configure how search results and filters appear to your customers.</p>
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md active:scale-95"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Grid Layout Settings */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold">
                            <Grid className="w-5 h-5 text-blue-500" />
                            Grid Layout (Columns)
                        </div>
                        <div className="p-6 grid grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Monitor className="w-4 h-4 text-gray-400" /> Desktop
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={config.columns?.desktop || 5}
                                    onChange={(e) => updateNestedConfig('columns.desktop', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                />
                                <p className="text-xs text-gray-400">Large screen grid count</p>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Tablet className="w-4 h-4 text-gray-400" /> Tablet
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="6"
                                    value={config.columns?.tablet || 3}
                                    onChange={(e) => updateNestedConfig('columns.tablet', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                />
                                <p className="text-xs text-gray-400">Medium screen grid count</p>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Smartphone className="w-4 h-4 text-gray-400" /> Mobile
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    value={config.columns?.mobile || 2}
                                    onChange={(e) => updateNestedConfig('columns.mobile', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                />
                                <p className="text-xs text-gray-400">Phone screen grid count</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Sidebar Settings */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold">
                            <Filter className="w-5 h-5 text-green-500" />
                            Behavior & Visibility
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-gray-900">Desktop Sidebar</h4>
                                    <p className="text-sm text-gray-500">Show filters in a sticky sidebar on large screens.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={config.sidebarEnabled !== false}
                                        onChange={(e) => setConfig(prev => ({ ...prev, sidebarEnabled: e.target.checked }))}
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-gray-900">Enable Filters</h4>
                                    <p className="text-sm text-gray-500">Allow customers to filter search results by price, category, etc.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={config.showFilters !== false}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showFilters: e.target.checked }))}
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Default Sorting */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold">
                            <Search className="w-5 h-5 text-indigo-500" />
                            Search Defaults
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">Default Sorting</label>
                                <select
                                    value={config.defaultSort || 'relevance'}
                                    onChange={(e) => setConfig(prev => ({ ...prev, defaultSort: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                >
                                    <option value="relevance">Most Relevant</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="date_desc">Newest First</option>
                                    <option value="date_asc">Oldest First</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700">Results Per Page</label>
                                <input
                                    type="number"
                                    min="4"
                                    max="100"
                                    value={config.resultsPerPage || 20}
                                    onChange={(e) => setConfig(prev => ({ ...prev, resultsPerPage: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview/Info */}
                <div className="space-y-6">
                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <SearchCheck className="w-6 h-6" />
                                Pro Tip
                            </h3>
                            <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                A 5-column grid works best for electronics and accessories, while a 3-column grid is better for items requiring larger images like fashion or furniture.
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-white/10 rounded-full w-fit">
                                <Eye className="w-4 h-4" /> Live preview coming soon
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
                            <Search className="w-48 h-48" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h4 className="font-semibold text-gray-900 border-b border-gray-50 pb-2">Technical Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Component:</span>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">SearchPageLayout</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Page ID:</span>
                                <span className="font-semibold text-gray-700">search</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Config:</span>
                                <span className="text-green-600 font-semibold uppercase">Active</span>
                            </div>
                        </div>
                    </div>

                    <a
                        href="/search"
                        target="_blank"
                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:text-blue-600 group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                            <span className="font-medium">View Search Page</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </form>
    );
}
