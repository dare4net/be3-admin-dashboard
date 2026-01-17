// Pricing Plans Array Editor - Visual editor for pricing plans
'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Plus, Star } from 'lucide-react';
import ColorPicker from './ColorPicker';

export default function PricingPlansEditor({ value = [], onChange }) {
    const plans = value;
    const [expandedIndex, setExpandedIndex] = useState(null);

    const addPlan = () => {
        onChange([...plans, {
            name: 'New Plan',
            price: 9.99,
            billingPeriod: 'month',
            currency: 'USD',
            featured: false,
            features: [
                { text: 'Feature 1', included: true },
                { text: 'Feature 2', included: true }
            ],
            ctaText: 'Get Started',
            ctaLink: '/signup'
        }]);
    };

    const updatePlan = (index, updates) => {
        const newPlans = [...plans];
        newPlans[index] = { ...newPlans[index], ...updates };
        onChange(newPlans);
    };

    const removePlan = (index) => {
        onChange(plans.filter((_, i) => i !== index));
    };

    const addFeature = (planIndex) => {
        const newPlans = [...plans];
        newPlans[planIndex].features = [...(newPlans[planIndex].features || []), { text: 'New Feature', included: true }];
        onChange(newPlans);
    };

    const updateFeature = (planIndex, featureIndex, updates) => {
        const newPlans = [...plans];
        newPlans[planIndex].features[featureIndex] = { ...newPlans[planIndex].features[featureIndex], ...updates };
        onChange(newPlans);
    };

    const removeFeature = (planIndex, featureIndex) => {
        const newPlans = [...plans];
        newPlans[planIndex].features = newPlans[planIndex].features.filter((_, i) => i !== featureIndex);
        onChange(newPlans);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Pricing Plans ({plans.length})
                </label>
                <button
                    type="button"
                    onClick={addPlan}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Plan
                </button>
            </div>

            <div className="space-y-3">
                {plans.map((plan, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Plan Header */}
                        <div
                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 ${plan.featured ? 'bg-blue-50' : 'bg-gray-50'}`}
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            {plan.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            <div className="flex-1">
                                <p className="font-medium text-sm">{plan.name}</p>
                                <p className="text-xs text-gray-500">${plan.price}/{plan.billingPeriod}</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removePlan(index);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Plan Details */}
                        {expandedIndex === index && (
                            <div className="p-4 space-y-4 bg-white">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Plan Name</label>
                                        <input
                                            type="text"
                                            value={plan.name || ''}
                                            onChange={(e) => updatePlan(index, { name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={plan.price || 0}
                                            onChange={(e) => updatePlan(index, { price: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Billing Period</label>
                                        <select
                                            value={plan.billingPeriod || 'month'}
                                            onChange={(e) => updatePlan(index, { billingPeriod: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            <option value="month">Monthly</option>
                                            <option value="year">Yearly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                                        <input
                                            type="text"
                                            value={plan.currency || 'USD'}
                                            onChange={(e) => updatePlan(index, { currency: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Featured Toggle */}
                                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={plan.featured || false}
                                        onChange={(e) => updatePlan(index, { featured: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium">⭐ Featured Plan (Highlight)</span>
                                </label>

                                {/* CTA */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">CTA Text</label>
                                        <input
                                            type="text"
                                            value={plan.ctaText || ''}
                                            onChange={(e) => updatePlan(index, { ctaText: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">CTA Link</label>
                                        <input
                                            type="text"
                                            value={plan.ctaLink || ''}
                                            onChange={(e) => updatePlan(index, { ctaLink: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Features List */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-gray-600">Features</label>
                                        <button
                                            type="button"
                                            onClick={() => addFeature(index)}
                                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                        >
                                            + Add Feature
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {(plan.features || []).map((feature, fIndex) => (
                                            <div key={fIndex} className="flex gap-2 items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={feature.included}
                                                    onChange={(e) => updateFeature(index, fIndex, { included: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <input
                                                    type="text"
                                                    value={feature.text}
                                                    onChange={(e) => updateFeature(index, fIndex, { text: e.target.value })}
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(index, fIndex)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {plans.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm">No pricing plans added yet</p>
                        <p className="text-xs mt-1">Click "Add Plan" to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
