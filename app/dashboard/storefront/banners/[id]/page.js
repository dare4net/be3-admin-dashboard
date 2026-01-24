"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Image as ImageIcon, Layers, Folder } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function BannerGroupEditor({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [group, setGroup] = useState({ name: '', banners: [] });

    // Resource selection state
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        fetchGroup();
        fetchResources();
    }, [id]);

    const fetchGroup = async () => {
        try {
            const res = await api.get(`/modules/banner/groups/${id}`);
            // Ensure banners sorted by sort_order
            const data = res.data.data;
            data.banners.sort((a, b) => a.sort_order - b.sort_order);
            setGroup(data);
        } catch (err) {
            console.error("Failed to fetch group", err);
            alert("Failed to load banner group");
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            const [catRes, colRes] = await Promise.all([
                api.get('/products/categories?limit=100'),
                api.get('/products/collections?limit=100')
            ]);
            setCategories(catRes.data.categories || catRes.data.data || []);
            setCollections(colRes.data.collections || colRes.data.data || []);
        } catch (err) {
            // Silently fail or log, as these are auxiliary
            console.warn("Failed to fetch resources for selection", err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Re-assign sort_order based on array index before saving
            const payload = {
                name: group.name,
                banners: group.banners.map((b, index) => ({
                    ...b,
                    sort_order: index
                }))
            };
            await api.put(`/modules/banner/groups/${id}`, payload);
            alert("Saved successfully!");
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const addBanner = () => {
        const newBanner = {
            id: `temp-${Date.now()}`,
            type: 'image',
            url: '',
            image_url: '',
            title: '',
            subtitle: ''
        };
        setGroup(prev => ({ ...prev, banners: [...prev.banners, newBanner] }));
    };

    const removeBanner = (index) => {
        const newBanners = [...group.banners];
        newBanners.splice(index, 1);
        setGroup(prev => ({ ...prev, banners: newBanners }));
    };

    const updateBanner = (index, field, value) => {
        const newBanners = [...group.banners];
        newBanners[index] = { ...newBanners[index], [field]: value };
        setGroup(prev => ({ ...prev, banners: newBanners }));
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newBanners = Array.from(group.banners);
        const [reorderedItem] = newBanners.splice(result.source.index, 1);
        newBanners.splice(result.destination.index, 0, reorderedItem);
        setGroup(prev => ({ ...prev, banners: newBanners }));
    };

    // Helper to get selected resource details for auto-filling (optional enhancement)
    const handleResourceChange = (index, type, resourceId) => {
        let updates = { type, resource_id: resourceId };

        // Auto-fill image/url if possible and empty
        if (type === 'category') {
            const cat = categories.find(c => c.id === resourceId);
            if (cat) {
                updates.title = cat.name;
                updates.image_url = cat.image_url || '';
                updates.url = `/categories/${cat.slug}`;
            }
        } else if (type === 'collection') {
            const col = collections.find(c => c.id === resourceId);
            if (col) {
                updates.title = col.name;
                updates.image_url = col.image_url || '';
                updates.url = `/collections/${col.slug}`;
            }
        }

        const newBanners = [...group.banners];
        newBanners[index] = { ...newBanners[index], ...updates };
        setGroup({ ...group, banners: newBanners });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-100 py-4 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Banner Group</h1>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Group Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                    type="text"
                    value={group.name}
                    onChange={(e) => setGroup({ ...group, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Homepage Hero Slider"
                />
            </div>

            {/* Banners List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Banners</h2>
                    <button
                        onClick={addBanner}
                        className="text-sm flex items-center gap-1 text-blue-600 font-medium hover:underline"
                    >
                        <Plus className="w-4 h-4" />
                        Add Banner
                    </button>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="banners">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-4"
                            >
                                {group.banners.map((banner, index) => (
                                    <Draggable key={banner.id || `temp-${index}`} draggableId={String(banner.id || `temp-${index}`)} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 group"
                                            >
                                                <div className="flex gap-4">
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="mt-2 text-gray-400 cursor-grab hover:text-gray-600"
                                                    >
                                                        <GripVertical className="w-5 h-5" />
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        {/* Type & Actions */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => updateBanner(index, 'type', 'image')}
                                                                    className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${banner.type === 'image' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                                                                >
                                                                    <ImageIcon className="w-3 h-3" /> Image
                                                                </button>
                                                                <button
                                                                    onClick={() => updateBanner(index, 'type', 'category')}
                                                                    className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${banner.type === 'category' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                                                                >
                                                                    <Layers className="w-3 h-3" /> Category
                                                                </button>
                                                                <button
                                                                    onClick={() => updateBanner(index, 'type', 'collection')}
                                                                    className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${banner.type === 'collection' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                                                                >
                                                                    <Folder className="w-3 h-3" /> Collection
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeBanner(index)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded transition"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Dynamic Fields based on Type */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Resource Selector for Cat/Col */}
                                                            {banner.type === 'category' && (
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Category</label>
                                                                    <select
                                                                        value={banner.resource_id || ''}
                                                                        onChange={(e) => handleResourceChange(index, 'category', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                                                                    >
                                                                        <option value="">Select a category...</option>
                                                                        {categories.map(c => (
                                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            {banner.type === 'collection' && (
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Collection</label>
                                                                    <select
                                                                        value={banner.resource_id || ''}
                                                                        onChange={(e) => handleResourceChange(index, 'collection', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                                                                    >
                                                                        <option value="">Select a collection...</option>
                                                                        {collections.map(c => (
                                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                                                                <div className="flex gap-4">
                                                                    <input
                                                                        type="text"
                                                                        value={banner.image_url || ''}
                                                                        onChange={(e) => updateBanner(index, 'image_url', e.target.value)}
                                                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                                        placeholder="https://..."
                                                                    />
                                                                    {banner.image_url && (
                                                                        <div className="w-10 h-10 rounded border overflow-hidden bg-gray-100 flex-shrink-0">
                                                                            <img src={banner.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Link URL (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={banner.url || ''}
                                                                    onChange={(e) => updateBanner(index, 'url', e.target.value)}
                                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                    placeholder="/products/..."
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Title (Optional)</label>
                                                                <input
                                                                    type="text"
                                                                    value={banner.title || ''}
                                                                    onChange={(e) => updateBanner(index, 'title', e.target.value)}
                                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                                    placeholder="Summer Sale"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {group.banners.length === 0 && (
                    <div onClick={addBanner} className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition">
                        <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 font-medium">Click to add your first banner</p>
                    </div>
                )}
            </div>
        </div>
    );
}
