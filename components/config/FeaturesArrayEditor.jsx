// Features Array Editor - Visual editor for features list
'use client';

import { useState } from 'react';
import IconSelector from './IconSelector';
import ColorPicker from './ColorPicker';
import { GripVertical, Trash2, Plus } from 'lucide-react';

export default function FeaturesArrayEditor({ value = [], onChange }) {
    const features = value;

    const addFeature = () => {
        onChange([...features, {
            iconType: 'lucide',
            iconName: 'Star',
            iconColor: '#3b82f6',
            iconBackground: '#eff6ff',
            title: 'New Feature',
            description: 'Feature description'
        }]);
    };

    const updateFeature = (index, updates) => {
        const newFeatures = [...features];
        newFeatures[index] = { ...newFeatures[index], ...updates };
        onChange(newFeatures);
    };

    const removeFeature = (index) => {
        onChange(features.filter((_, i) => i !== index));
    };

    const [expandedIndex, setExpandedIndex] = useState(null);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Features ({features.length})
                </label>
                <button
                    type="button"
                    onClick={addFeature}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Feature
                </button>
            </div>

            <div className="space-y-3">
                {features.map((feature, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Feature Header */}
                        <div
                            className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{feature.title || `Feature ${index + 1}`}</p>
                                <p className="text-xs text-gray-500 truncate">{feature.description}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFeature(index);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Feature Details (Collapsed) */}
                        {expandedIndex === index && (
                            <div className="p-4 space-y-4 bg-white">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={feature.title || ''}
                                        onChange={(e) => updateFeature(index, { title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                    <textarea
                                        value={feature.description || ''}
                                        onChange={(e) => updateFeature(index, { description: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>

                                {/* Icon */}
                                <IconSelector
                                    label="Icon"
                                    value={feature.iconName}
                                    onChange={(iconName) => updateFeature(index, { iconName })}
                                />

                                {/* Colors */}
                                <div className="grid grid-cols-2 gap-3">
                                    <ColorPicker
                                        label="Icon Color"
                                        value={feature.iconColor}
                                        onChange={(color) => updateFeature(index, { iconColor: color })}
                                    />
                                    <ColorPicker
                                        label="Icon Background"
                                        value={feature.iconBackground}
                                        onChange={(color) => updateFeature(index, { iconBackground: color })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {features.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm">No features added yet</p>
                        <p className="text-xs mt-1">Click "Add Feature" to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
