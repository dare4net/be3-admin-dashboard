// Icon Selector Component - Browse and select Lucide icons
'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';

const popularIcons = [
    'Star', 'Heart', 'ShoppingCart', 'User', 'Mail', 'Phone', 'MapPin', 'Calendar',
    'Clock', 'Search', 'Settings', 'Check', 'X', 'ChevronRight', 'ChevronLeft',
    'ArrowRight', 'ArrowLeft', 'Plus', 'Minus', 'Trash2', 'Edit2', 'Eye', 'EyeOff',
    'Download', 'Upload', 'Share2', 'Link', 'ExternalLink', 'Home', 'Menu',
    'Package', 'Truck', 'CreditCard', 'DollarSign', 'Percent', 'Tag', 'Gift',
    'Zap', 'Shield', 'Lock', 'Unlock', 'Bell', 'MessageSquare', 'Send',
    'Image', 'Film', 'Music', 'File', 'Folder', 'Database', 'Server',
    'Smartphone', 'Tablet', 'Monitor', 'Laptop', 'Printer', 'Wifi', 'Bluetooth'
];

export default function IconSelector({ label, value, onChange }) {
    const [showPicker, setShowPicker] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredIcons = searchTerm
        ? popularIcons.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()))
        : popularIcons;

    const CurrentIcon = value && LucideIcons[value] ? LucideIcons[value] : LucideIcons.Star;

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            <div className="flex gap-2">
                {/* Icon Display Button */}
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="flex items-center justify-center w-12 h-10 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white"
                >
                    <CurrentIcon className="w-5 h-5 text-gray-700" />
                </button>

                {/* Icon Name Display (Read-only) */}
                <input
                    type="text"
                    value={value || ''}
                    readOnly
                    placeholder="Click to select icon..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 cursor-pointer"
                    onClick={() => setShowPicker(true)}
                />
            </div>

            {/* Icon Picker Modal */}
            {showPicker && (
                <>
                    {/* Overlay to close picker */}
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setShowPicker(false)}
                    />

                    <div className="relative z-[101] mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-2xl">
                        <div className="p-3 border-b">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search icons..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="p-3 max-h-64 overflow-y-auto grid grid-cols-6 gap-2">
                            {filteredIcons.map((iconName) => {
                                const Icon = LucideIcons[iconName];
                                if (!Icon) return null;

                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => {
                                            onChange(iconName);
                                            setShowPicker(false);
                                            setSearchTerm('');
                                        }}
                                        className={`flex items-center justify-center p-3 rounded-lg hover:bg-blue-50 transition-colors ${value === iconName ? 'bg-blue-100 ring-2 ring-blue-500' : 'border border-gray-200'
                                            }`}
                                        title={iconName}
                                    >
                                        <Icon className="w-5 h-5 text-gray-700" />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
                            {filteredIcons.length} icons • Visit lucide.dev for more
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
