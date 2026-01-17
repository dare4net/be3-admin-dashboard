// Gradient Builder Component
'use client';

import { useState } from 'react';
import ColorPicker from './ColorPicker';

export default function GradientBuilder({ label, value = {}, onChange }) {
    const gradient = {
        type: value.type || 'linear',
        angle: value.angle || 45,
        stops: value.stops || [
            { color: '#3b82f6', position: 0 },
            { color: '#8b5cf6', position: 100 }
        ]
    };

    const updateGradient = (updates) => {
        onChange({ ...gradient, ...updates });
    };

    const updateStop = (index, updates) => {
        const newStops = [...gradient.stops];
        newStops[index] = { ...newStops[index], ...updates };
        updateGradient({ stops: newStops });
    };

    const addStop = () => {
        const newStops = [...gradient.stops, { color: '#ffffff', position: 50 }];
        updateGradient({ stops: newStops });
    };

    const removeStop = (index) => {
        if (gradient.stops.length > 2) {
            const newStops = gradient.stops.filter((_, i) => i !== index);
            updateGradient({ stops: newStops });
        }
    };

    const gradientCss = gradient.type === 'linear'
        ? `linear-gradient(${gradient.angle}deg, ${gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
        : `radial-gradient(${gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`;

    return (
        <div className="space-y-4">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            {/* Preview */}
            <div
                className="h-20 rounded-lg border border-gray-300"
                style={{ background: gradientCss }}
            />

            {/* Type Selector */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => updateGradient({ type: 'linear' })}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${gradient.type === 'linear'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                >
                    Linear
                </button>
                <button
                    type="button"
                    onClick={() => updateGradient({ type: 'radial' })}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${gradient.type === 'radial'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                >
                    Radial
                </button>
            </div>

            {/* Angle (Linear only) */}
            {gradient.type === 'linear' && (
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Angle: {gradient.angle}°
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradient.angle}
                        onChange={(e) => updateGradient({ angle: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>
            )}

            {/* Color Stops */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">Color Stops</label>
                    <button
                        type="button"
                        onClick={addStop}
                        className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        + Add Stop
                    </button>
                </div>

                {gradient.stops.map((stop, index) => (
                    <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                            <ColorPicker
                                label={`Stop ${index + 1}`}
                                value={stop.color}
                                onChange={(color) => updateStop(index, { color })}
                                showPresets={false}
                            />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Position
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={stop.position}
                                onChange={(e) => updateStop(index, { position: parseInt(e.target.value) })}
                                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeStop(index)}
                            disabled={gradient.stops.length <= 2}
                            className="px-2 py-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
