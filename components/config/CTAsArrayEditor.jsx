// Multiple CTAs Editor for Hero Widget
'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import IconSelector from './IconSelector';
import ColorPicker from './ColorPicker';

export default function CTAsArrayEditor({ value = [], onChange }) {
    const ctas = value;
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addCTA = () => {
        onChange([...ctas, {
            text: 'New Button',
            link: '/link',
            style: 'primary',
            icon: '',
            animation: { type: 'fade-up', duration: 800, delay: 0 }
        }]);
    };

    const updateCTA = (index, updates) => {
        const newCTAs = [...ctas];
        newCTAs[index] = { ...newCTAs[index], ...updates };
        onChange(newCTAs);
    };

    const removeCTA = (index) => {
        onChange(ctas.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Call-to-Action Buttons ({ctas.length})
                </label>
                <button
                    type="button"
                    onClick={addCTA}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <Plus className="w-3 h-3" />
                    Add CTA
                </button>
            </div>

            <div className="space-y-2">
                {ctas.map((cta, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                            className="flex items-center gap-2 p-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${cta.style === 'primary' ? 'bg-blue-100 text-blue-700' :
                                    cta.style === 'outline' ? 'bg-gray-100 text-gray-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                    {cta.style || 'primary'}
                                </span>
                                <span className="ml-2 text-sm">{cta.text || 'Button'}</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeCTA(index);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>

                        {expandedIndex === index && (
                            <div className="p-3 space-y-3 bg-white border-t">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                                        <input
                                            type="text"
                                            value={cta.text || ''}
                                            onChange={(e) => updateCTA(index, { text: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Link URL</label>
                                        <input
                                            type="text"
                                            value={cta.link || ''}
                                            onChange={(e) => updateCTA(index, { link: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Style</label>
                                    <select
                                        value={cta.style || 'primary'}
                                        onChange={(e) => updateCTA(index, { style: e.target.value })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    >
                                        <option value="primary">Primary (Solid)</option>
                                        <option value="outline">Outline</option>
                                        <option value="ghost">Ghost</option>
                                        <option value="secondary">Secondary</option>
                                        <option value="custom">Custom Color</option>
                                    </select>
                                </div>

                                {cta.style === 'custom' && (
                                    <ColorPicker
                                        label="Custom Button Color"
                                        value={cta.customColor || '#3b82f6'}
                                        onChange={(color) => updateCTA(index, { customColor: color })}
                                    />
                                )}

                                <IconSelector
                                    label="Icon (optional)"
                                    value={cta.icon || ''}
                                    onChange={(icon) => updateCTA(index, { icon })}
                                />

                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Animation</label>
                                        <select
                                            value={cta.animation?.type || 'fade-up'}
                                            onChange={(e) => updateCTA(index, { animation: { ...cta.animation, type: e.target.value } })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        >
                                            <option value="fade-up">Fade Up</option>
                                            <option value="fade-down">Fade Down</option>
                                            <option value="fade">Fade</option>
                                            <option value="slide-up">Slide Up</option>
                                            <option value="slide-left">Slide Left</option>
                                            <option value="slide-right">Slide Right</option>
                                            <option value="zoom">Zoom</option>
                                            <option value="none">None</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Duration (ms)</label>
                                        <input
                                            type="number"
                                            value={cta.animation?.duration || 800}
                                            onChange={(e) => updateCTA(index, { animation: { ...cta.animation, duration: parseInt(e.target.value) } })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Delay (ms)</label>
                                        <input
                                            type="number"
                                            value={cta.animation?.delay || 0}
                                            onChange={(e) => updateCTA(index, { animation: { ...cta.animation, delay: parseInt(e.target.value) } })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {ctas.length === 0 && (
                    <div className="text-center py-4 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-xs">No CTAs added</p>
                    </div>
                )}
            </div>
        </div>
    );
}
