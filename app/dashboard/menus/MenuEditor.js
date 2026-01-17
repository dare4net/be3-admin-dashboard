"use client";

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Plus, X, ArrowUp, ArrowDown, ExternalLink, GripVertical } from 'lucide-react';

export default function MenuEditor({ menu }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // New Item State
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemType, setNewItemType] = useState('custom');

    useEffect(() => {
        if (menu) {
            fetchItems();
        }
    }, [menu]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/menus/${menu.id}/items`);
            setItems(res.data.items || []);
        } catch (error) {
            console.error("Failed to fetch items:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        const newItem = {
            // Temporary ID for UI
            id: `temp-${Date.now()}`,
            label: newItemLabel,
            url: newItemUrl,
            type: newItemType,
            position: items.length
        };
        setItems([...items, newItem]);
        setNewItemLabel('');
        setNewItemUrl('');
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleMoveItem = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const newItems = [...items];
        const itemToMove = newItems[index];
        newItems.splice(index, 1);
        newItems.splice(direction === 'up' ? index - 1 : index + 1, 0, itemToMove);
        setItems(newItems);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payloadItems = items.map((item, index) => ({
                label: item.label,
                url: item.url,
                type: item.type,
                position: index,
                parent_id: null
            }));

            await axios.post(`/api/menus/${menu.id}/items`, { items: payloadItems });
            alert('Menu saved successfully!');
            fetchItems();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save menu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex flex-row items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-lg">Editing: {menu.name}</h3>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Menu'}
                </button>
            </div>
            <div className="p-6 space-y-8">

                {/* Items List */}
                <div className="space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded border text-gray-400">
                            No links in this menu. Add one below.
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 bg-white border rounded shadow-sm group">
                                <div className="text-gray-400 cursor-move">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{item.label}</div>
                                    <div className="text-xs text-gray-500">{item.url}</div>
                                </div>
                                <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleMoveItem(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleMoveItem(index, 'down')}
                                        disabled={index === items.length - 1}
                                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-1 hover:bg-red-50 text-red-500 rounded"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Item Form */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-4 text-sm uppercase text-gray-500">Add Menu Item</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Label</label>
                            <input
                                type="text"
                                value={newItemLabel}
                                onChange={(e) => setNewItemLabel(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="Link Text (e.g. About Us)"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Destination URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newItemUrl}
                                    onChange={(e) => setNewItemUrl(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                                    placeholder="/about or https://google.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={handleAddItem}
                                disabled={!newItemLabel || !newItemUrl}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Add to Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
