// Announcement Messages Editor - Multiple rotating messages
'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';

export default function AnnouncementMessagesEditor({ value = [], onChange }) {
    const messages = value;
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addMessage = () => {
        onChange([...messages, {
            text: 'New announcement message',
            link: '',
            linkText: 'Learn More'
        }]);
    };

    const updateMessage = (index, updates) => {
        const newMessages = [...messages];
        newMessages[index] = { ...newMessages[index], ...updates };
        onChange(newMessages);
    };

    const removeMessage = (index) => {
        onChange(messages.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Messages ({messages.length})
                </label>
                <button
                    type="button"
                    onClick={addMessage}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <Plus className="w-3 h-3" />
                    Add Message
                </button>
            </div>

            <div className="space-y-2">
                {messages.map((msg, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                            className="flex items-center gap-2 p-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{msg.text || 'Message'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeMessage(index);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-3 space-y-2 bg-white border-t">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Message Text</label>
                                    <input
                                        type="text"
                                        value={msg.text || ''}
                                        onChange={(e) => updateMessage(index, { text: e.target.value })}
                                        placeholder="🎉 Special offer!"
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Link URL (optional)</label>
                                        <input
                                            type="text"
                                            value={msg.link || ''}
                                            onChange={(e) => updateMessage(index, { link: e.target.value })}
                                            placeholder="/sale"
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Link Text</label>
                                        <input
                                            type="text"
                                            value={msg.linkText || ''}
                                            onChange={(e) => updateMessage(index, { linkText: e.target.value })}
                                            placeholder="Learn More"
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="text-center py-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-xs">No messages added</p>
                    </div>
                )}
            </div>
        </div>
    );
}
