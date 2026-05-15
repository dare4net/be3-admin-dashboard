"use client";

import { LayoutTemplate, Trash2, Eye, Shuffle, ChevronDown, Monitor, Tablet, Smartphone } from "lucide-react";
import ColorPicker from "@/components/config/ColorPicker";

export function DeviceToggle({ selected, onChange }) {
    const devices = [
        { id: 'desktop', icon: Monitor, label: 'Desktop' },
        { id: 'tablet', icon: Tablet, label: 'Tablet' },
        { id: 'mobile', icon: Smartphone, label: 'Mobile' }
    ];

    return (
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {devices.map((device) => {
                const Icon = device.icon;
                const isActive = selected === device.id;
                return (
                    <button
                        key={device.id}
                        type="button"
                        onClick={() => onChange(device.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            isActive 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                        title={device.label}
                    >
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="hidden md:inline">{device.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function ToggleButton({ value, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500 ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
            <span
                className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                style={{ transform: value ? 'translateX(1.25rem)' : 'translateX(0)' }}
            />
        </button>
    );
}

export function Input({ label, value, onChange, type = "text", ...props }) {
    const isNumeric = type === "number" || (typeof value === 'string' && /^-?\d*\.?\d+(px|em|rem|%|vh|vw)?$/.test(value)) || props.placeholder?.includes('px');

    const handleAdjust = (delta) => {
        if (!value && value !== 0) {
            onChange(delta > 0 ? '1' : '-1');
            return;
        }
        const match = String(value).match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
            const num = parseFloat(match[1]);
            const unit = match[2] || (props.placeholder?.includes('px') ? 'px' : '');
            onChange(`${num + delta}${unit}`);
        } else {
            onChange(String(delta));
        }
    };

    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <div className="relative group">
                <input
                    type={type === 'number' ? 'text' : type}
                    value={value !== undefined && value !== null ? value : ''}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={(e) => {
                        let val = e.target.value;
                        if (props.placeholder?.includes('px') && /^-?\d*\.?\d+$/.test(val) && val !== '' && val !== '-' && val !== '.') {
                            onChange(`${val}px`);
                        }
                    }}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isNumeric ? 'pr-20' : ''}`}
                    {...props}
                />
                {isNumeric && (
                    <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                        <button type="button" onClick={() => handleAdjust(-1)} className="px-2 h-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded transition-colors flex items-center justify-center">-</button>
                        <button type="button" onClick={() => handleAdjust(1)} className="px-2 h-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded transition-colors flex items-center justify-center">+</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function Textarea({ label, value, onChange, rows = 3 }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                rows={rows}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
        </div>
    );
}

export function Select({ label, value, onChange, options }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

export function CollapsibleSection({ title, children, isOpen, onToggle, icon }) {
    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4 bg-white shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {icon}
                    </div>
                    <span className={`font-bold text-sm ${isOpen ? 'text-blue-900' : 'text-gray-700'}`}>{title}</span>
                </div>
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
            </button>
            {isOpen && <div className="p-5 border-t border-gray-100 space-y-5 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
}

export function MultiSelect({ label, value = [], onChange, options, placeholder = "Select options..." }) {
    return (
        <div className="space-y-1">
            {label && <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
            <select
                multiple
                value={value}
                onChange={e => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    onChange(selected);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="py-1 px-2 border-b border-gray-50 last:border-0">
                        {opt.label}
                    </option>
                ))}
            </select>
            <p className="text-[10px] text-gray-400 italic">Hold Ctrl/Cmd to select multiple</p>
        </div>
    );
}

export function RandomizationConfig({ config, updateNestedConfig, categories, collections, attributes, widgetType }) {
    const isProduct = ['product_grid', 'product_carousel'].includes(widgetType);
    const isCategory = ['category_grid', 'category_carousel'].includes(widgetType);

    const randomize = config.randomize || {};

    const handleToggleType = (type, current) => {
        const updated = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        return updated.length > 0 ? updated : [type];
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-purple-900">Enable Randomization</span>
                        <span className="text-[10px] text-purple-700 italic">Make widget content dynamic and unpredictable</span>
                    </div>
                    <ToggleButton
                        value={randomize.enabled}
                        onChange={v => {
                            if (!config.randomize) {
                                updateNestedConfig('randomize', {
                                    enabled: v,
                                    interval: 'session',
                                    randomizeSource: false,
                                    allowedSourceTypes: isProduct ? ['all', 'category', 'collection', 'clause'] : ['top-level', 'all-subcategories', 'random'],
                                    allowedCategories: [],
                                    allowedCollections: [],
                                    allowedAttributes: [],
                                    randomizeSort: false,
                                    allowedSorts: ['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'random'],
                                    randomizeLimit: false,
                                    limitRange: { min: 4, max: 12 },
                                    randomizeFeatured: false,
                                    randomizeCategorySource: false,
                                    allowedCategorySourceTypes: ['all', 'top-level', 'all-subcategories', 'random']
                                });
                            } else {
                                updateNestedConfig('randomize.enabled', v);
                            }
                        }}
                    />
                </div>
            </div>

            {randomize.enabled && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <Select
                            label="Randomization Interval"
                            value={randomize.interval || 'session'}
                            onChange={v => updateNestedConfig('randomize.interval', v)}
                            options={[
                                { value: 'page_load', label: 'Every Page Load' },
                                { value: 'session', label: 'Once Per Session (Recommended)' },
                                { value: 'hourly', label: 'Every Hour' },
                                { value: 'daily', label: 'Once Per Day' }
                            ]}
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">
                            {randomize.interval === 'page_load' && "Refreshes every time the page is viewed."}
                            {randomize.interval === 'session' && "Keeps content consistent for the user's visit."}
                            {randomize.interval === 'hourly' && "Updates content every hour."}
                            {randomize.interval === 'daily' && "Updates content once every 24 hours."}
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">What to Randomize</h4>

                        {isProduct && (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Randomize Content Source</span>
                                        <span className="text-[10px] text-gray-500 italic">Switch between categories/collections</span>
                                    </div>
                                    <ToggleButton value={randomize.randomizeSource} onChange={v => updateNestedConfig('randomize.randomizeSource', v)} />
                                </div>

                                {randomize.randomizeSource && (
                                    <div className="pl-4 border-l-2 border-purple-100 space-y-4 mt-2">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-purple-900 uppercase">Allowed Source Types</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['all', 'category', 'collection', 'clause'].map(type => (
                                                    <label key={type} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer transition-colors border border-transparent hover:border-purple-100">
                                                        <input
                                                            type="checkbox"
                                                            checked={(randomize.allowedSourceTypes || []).includes(type)}
                                                            onChange={e => updateNestedConfig('randomize.allowedSourceTypes', handleToggleType(type, randomize.allowedSourceTypes || []))}
                                                            className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                                                        />
                                                        <span className="text-xs capitalize">{type}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <MultiSelect
                                            label="Filter Categories (Optional)"
                                            value={randomize.allowedCategories || []}
                                            onChange={v => updateNestedConfig('randomize.allowedCategories', v)}
                                            options={categories.map(c => ({ value: c.id, label: c.name }))}
                                        />

                                        <MultiSelect
                                            label="Filter Collections (Optional)"
                                            value={randomize.allowedCollections || []}
                                            onChange={v => updateNestedConfig('randomize.allowedCollections', v)}
                                            options={collections.map(c => ({ value: c.id, label: c.name }))}
                                        />

                                        <MultiSelect
                                            label="Filter Attributes (Optional)"
                                            value={randomize.allowedAttributes || []}
                                            onChange={v => updateNestedConfig('randomize.allowedAttributes', v)}
                                            options={attributes.filter(a => (a.clauses || []).length > 0).map(a => ({ value: a.code, label: a.label }))}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Randomize Sort Order</span>
                                    <ToggleButton value={randomize.randomizeSort} onChange={v => updateNestedConfig('randomize.randomizeSort', v)} />
                                </div>

                                {randomize.randomizeSort && (
                                    <div className="pl-4 border-l-2 border-purple-100 mt-2">
                                        <MultiSelect
                                            label="Allowed Sort Orders"
                                            value={randomize.allowedSorts || ['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'random']}
                                            onChange={v => updateNestedConfig('randomize.allowedSorts', v)}
                                            options={[
                                                { value: 'newest', label: 'Newest First' },
                                                { value: 'oldest', label: 'Oldest First' },
                                                { value: 'price_asc', label: 'Price: Low to High' },
                                                { value: 'price_desc', label: 'Price: High to Low' },
                                                { value: 'name_asc', label: 'Name: A-Z' },
                                                { value: 'name_desc', label: 'Name: Z-A' },
                                                { value: 'random', label: 'Random' }
                                            ]}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Randomize Limit (Count)</span>
                                    <ToggleButton value={randomize.randomizeLimit} onChange={v => updateNestedConfig('randomize.randomizeLimit', v)} />
                                </div>

                                {randomize.randomizeLimit && (
                                    <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-purple-100">
                                        <Input label="Min" type="number" value={randomize.limitRange?.min || 4} onChange={v => updateNestedConfig('randomize.limitRange.min', parseInt(v))} />
                                        <Input label="Max" type="number" value={randomize.limitRange?.max || 12} onChange={v => updateNestedConfig('randomize.limitRange.max', parseInt(v))} />
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Randomize Featured Toggle</span>
                                    <ToggleButton value={randomize.randomizeFeatured} onChange={v => updateNestedConfig('randomize.randomizeFeatured', v)} />
                                </div>
                            </>
                        )}

                        {isCategory && (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Randomize Source Type</span>
                                        <span className="text-[10px] text-gray-500 italic">Switch between top-level/sub/random</span>
                                    </div>
                                    <ToggleButton value={randomize.randomizeCategorySource} onChange={v => updateNestedConfig('randomize.randomizeCategorySource', v)} />
                                </div>

                                {randomize.randomizeCategorySource && (
                                    <div className="pl-4 border-l-2 border-purple-100 mt-2">
                                        <MultiSelect
                                            label="Allowed Category Source Types"
                                            value={randomize.allowedCategorySourceTypes || ['all', 'top-level', 'all-subcategories', 'random']}
                                            onChange={v => updateNestedConfig('randomize.allowedCategorySourceTypes', v)}
                                            options={[
                                                { value: 'all', label: 'All (with Products)' },
                                                { value: 'top-level', label: 'Top-Level' },
                                                { value: 'all-subcategories', label: 'All Subcategories' },
                                                { value: 'random', label: 'Random Selection' }
                                            ]}
                                        />
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-3">
                                    <Select
                                        label="Sort Order (after randomization)"
                                        value={config.sortOrder || 'alphabetical'}
                                        onChange={v => updateNestedConfig('sortOrder', v)}
                                        options={[
                                            { value: 'alphabetical', label: 'Alphabetical (A–Z)' },
                                            { value: 'random', label: 'Shuffle on Load' }
                                        ]}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        Applied to the randomized selection after the service draws it.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function TestimonialsListEditor({ value = [], onChange }) {
    const addTestimonial = () => {
        onChange([
            ...value,
            { id: Date.now(), name: 'Happy Client', role: 'Customer', content: 'Great service and quality products!', rating: 5, date: new Date().toISOString().split('T')[0] }
        ]);
    };

    const updateTestimonial = (index, field, val) => {
        const newTestimonials = [...value];
        newTestimonials[index] = { ...newTestimonials[index], [field]: val };
        onChange(newTestimonials);
    };

    const removeTestimonial = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Testimonials List</label>
                <button
                    type="button"
                    onClick={addTestimonial}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                    + Add Testimonial
                </button>
            </div>

            <div className="space-y-3">
                {value.map((item, index) => (
                    <div key={item.id || index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Testimonial {index + 1}</h5>
                            <button onClick={() => removeTestimonial(index)} className="text-red-500 hover:text-red-700">
                                <span className="sr-only">Delete</span>
                                <Trash2 size={12} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Name" value={item.name} onChange={v => updateTestimonial(index, 'name', v)} placeholder="John Doe" />
                            <Input label="Role" value={item.role} onChange={v => updateTestimonial(index, 'role', v)} placeholder="Verified Buyer" />
                        </div>

                        <Textarea label="Content" value={item.content} onChange={v => updateTestimonial(index, 'content', v)} rows={2} />

                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Image URL" value={item.image || ''} onChange={v => updateTestimonial(index, 'image', v)} placeholder="https://..." />
                            <Input label="Date" type="date" value={item.date || ''} onChange={v => updateTestimonial(index, 'date', v)} />
                        </div>

                        <Select label="Rating" value={item.rating || 5} onChange={v => updateTestimonial(index, 'rating', parseInt(v))} options={[5, 4, 3, 2, 1].map(r => ({ value: r, label: '⭐'.repeat(r) }))} />
                    </div>
                ))}
                {value.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4 border-2 border-dashed rounded-lg">No testimonials yet. Add one to get started!</p>
                )}
            </div>
        </div>
    );
}

export function AnnouncementMessagesEditor({ value = [], onChange }) {
    const addMessage = () => {
        onChange([...value, { text: '', link: '', linkText: 'Learn More' }]);
    };

    const updateMessage = (index, field, val) => {
        const newMessages = [...value];
        newMessages[index] = { ...newMessages[index], [field]: val };
        onChange(newMessages);
    };

    const removeMessage = (index) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Announcement Messages</label>
                <button
                    type="button"
                    onClick={addMessage}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                    + Add Message
                </button>
            </div>

            <div className="space-y-3">
                {value.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message {index + 1}</h5>
                            <button onClick={() => removeMessage(index)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <Input label="Message Text" value={item.text} onChange={v => updateMessage(index, 'text', v)} />
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Link URL" value={item.link} onChange={v => updateMessage(index, 'link', v)} />
                            <Input label="Link Text" value={item.linkText} onChange={v => updateMessage(index, 'linkText', v)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function IconSelector({ label, value, onChange }) {
    return (
        <Select
            label={label}
            value={value}
            onChange={onChange}
            options={[
                { value: '', label: 'No Icon' },
                { value: 'megaphone', label: '📣 Megaphone' },
                { value: 'sparkles', label: '✨ Sparkles' },
                { value: 'tag', label: '🏷️ Sale Tag' },
                { value: 'truck', label: '🚚 Delivery' },
                { value: 'info', label: 'ℹ️ Info' },
                { value: 'gift', label: '🎁 Gift' }
            ]}
        />
    );
}
