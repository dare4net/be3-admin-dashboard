// Stats Array Editor - Visual editor for stats/counters
'use client';

import { useState } from 'react';
import IconSelector from './IconSelector';
import ColorPicker from './ColorPicker';
import { GripVertical, Trash2, Plus } from 'lucide-react';

export default function StatsArrayEditor({ value = [], onChange }) {
    const stats = value;

    const addStat = () => {
        onChange([...stats, {
            value: 1000,
            label: 'Stat Label',
            suffix: '+',
            icon: 'users',
            iconColor: '#3b82f6',
            format: 'number',
            decimals: 0,
            animationDuration: 2000
        }]);
    };

    const updateStat = (index, updates) => {
        const newStats = [...stats];
        newStats[index] = { ...newStats[index], ...updates };
        onChange(newStats);
    };

    const removeStat = (index) => {
        onChange(stats.filter((_, i) => i !== index));
    };

    const [expandedIndex, setExpandedIndex] = useState(null);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Stats ({stats.length})
                </label>
                <button
                    type="button"
                    onClick={addStat}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Stat
                </button>
            </div>

            <div className="space-y-3">
                {stats.map((stat, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Stat Header */}
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <p className="font-bold text-lg">{stat.value}{stat.suffix || ''}</p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeStat(index);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Stat Details (Collapsed) */}
                        {expandedIndex === index && (
                            <div className="p-4 space-y-4 bg-white">
                                {/* Value & Label */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                                        <input
                                            type="number"
                                            value={stat.value || 0}
                                            onChange={(e) => updateStat(index, { value: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                                        <input
                                            type="text"
                                            value={stat.label || ''}
                                            onChange={(e) => updateStat(index, { label: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Prefix & Suffix */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Prefix</label>
                                        <input
                                            type="text"
                                            value={stat.prefix || ''}
                                            onChange={(e) => updateStat(index, { prefix: e.target.value })}
                                            placeholder="$"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Suffix</label>
                                        <input
                                            type="text"
                                            value={stat.suffix || ''}
                                            onChange={(e) => updateStat(index, { suffix: e.target.value })}
                                            placeholder="+"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Icon */}
                                <IconSelector
                                    label="Icon (Optional)"
                                    value={stat.icon}
                                    onChange={(icon) => updateStat(index, { icon })}
                                />

                                {/* Icon Color */}
                                {stat.icon && (
                                    <ColorPicker
                                        label="Icon Color"
                                        value={stat.iconColor}
                                        onChange={(color) => updateStat(index, { iconColor: color })}
                                    />
                                )}

                                {/* Format */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
                                    <select
                                        value={stat.format || 'number'}
                                        onChange={(e) => updateStat(index, { format: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="number">Number</option>
                                        <option value="currency">Currency</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                </div>

                                {/* Animation Duration */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Animation Duration (ms): {stat.animationDuration || 2000}
                                    </label>
                                    <input
                                        type="range"
                                        min="500"
                                        max="5000"
                                        step="100"
                                        value={stat.animationDuration || 2000}
                                        onChange={(e) => updateStat(index, { animationDuration: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {stats.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm">No stats added yet</p>
                        <p className="text-xs mt-1">Click "Add Stat" to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
