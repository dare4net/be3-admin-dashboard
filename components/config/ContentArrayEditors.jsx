// Simple Array Editors for Accordion, Tabs content
'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import IconSelector from './IconSelector';

export function AccordionItemsEditor({ value = [], onChange }) {
    const items = value;
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addItem = () => {
        onChange([...items, { title: 'New Question', content: 'Answer here', defaultOpen: false }]);
    };

    const updateItem = (index, updates) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...updates };
        onChange(newItems);
    };

    const removeItem = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Accordion Items ({items.length})
                </label>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Item
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{item.title || `Item ${index + 1}`}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(index);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-4 space-y-3 bg-white">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={item.title || ''}
                                        onChange={(e) => updateItem(index, { title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                                    <textarea
                                        value={item.content || ''}
                                        onChange={(e) => updateItem(index, { content: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={item.defaultOpen || false}
                                        onChange={(e) => updateItem(index, { defaultOpen: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm">Open by default</span>
                                </label>
                            </div>
                        )}
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm">No items added yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TabsEditor({ value = [], onChange }) {
    const tabs = value;
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addTab = () => {
        onChange([...tabs, { id: `tab${Date.now()}`, label: 'New Tab', content: 'Tab content here' }]);
    };

    const updateTab = (index, updates) => {
        const newTabs = [...tabs];
        newTabs[index] = { ...newTabs[index], ...updates };
        onChange(newTabs);
    };

    const removeTab = (index) => {
        onChange(tabs.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Tabs ({tabs.length})
                </label>
                <button
                    type="button"
                    onClick={addTab}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Tab
                </button>
            </div>

            <div className="space-y-3">
                {tabs.map((tab, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{tab.label || `Tab ${index + 1}`}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeTab(index);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-4 space-y-3 bg-white">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tab Label</label>
                                    <input
                                        type="text"
                                        value={tab.label || ''}
                                        onChange={(e) => updateTab(index, { label: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tab ID</label>
                                    <input
                                        type="text"
                                        value={tab.id || ''}
                                        onChange={(e) => updateTab(index, { id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <IconSelector
                                    label="Icon (optional)"
                                    value={tab.icon || ''}
                                    onChange={(icon) => updateTab(index, { icon })}
                                />
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                                    <textarea
                                        value={tab.content || ''}
                                        onChange={(e) => updateTab(index, { content: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {tabs.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm">No tabs added yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
