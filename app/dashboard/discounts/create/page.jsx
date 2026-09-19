"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, Percent, DollarSign, Truck, Calendar, AlertCircle, Layers } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const TYPES = [
    { value: 'percentage',    label: '% Discount',    icon: Percent,    desc: 'e.g. 20% off the order total' },
    { value: 'fixed',         label: 'Fixed Amount',  icon: DollarSign, desc: 'e.g. ₦500 off the order total' },
    { value: 'free_shipping', label: 'Free Shipping', icon: Truck,      desc: 'Remove shipping cost from order' },
];

const APPLICABILITY = [
    { value: 'all', label: 'All Items' },
    { value: 'categories', label: 'Specific Categories' },
];

export default function CreateCouponPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        code: '',
        description: '',
        type: 'percentage',
        value: '',
        min_order_value: '',
        max_uses: '',
        max_uses_per_user: '',
        applicable_to: 'all',
        applicable_ids: [],
        starts_at: new Date().toISOString().slice(0, 16),
        expires_at: '',
        is_active: true,
    });
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCats = async () => {
            try {
                const res = await api.get('/products/categories/vendor-active');
                // Ensure array, whether standard payload or paginated wrapper
                setCategories(Array.isArray(res.data) ? res.data : (res.data.categories || res.data.data || []));
            } catch (e) { console.error('Failed to load categories', e); }
        };
        loadCats();
    }, []);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        set('code', code);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.code.trim()) return setError('Coupon code is required');
        if (form.type !== 'free_shipping' && (!form.value || parseFloat(form.value) <= 0)) {
            return setError('Discount value must be greater than 0');
        }
        if (form.type === 'percentage' && parseFloat(form.value) > 100) {
            return setError('Percentage cannot exceed 100%');
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                code: form.code.toUpperCase().trim(),
                value: form.type === 'free_shipping' ? 0 : parseFloat(form.value),
                min_order_value: parseFloat(form.min_order_value || 0),
                max_uses: form.max_uses ? parseInt(form.max_uses) : null,
                max_uses_per_user: form.max_uses_per_user ? parseInt(form.max_uses_per_user) : null,
                applicable_to: form.applicable_to,
                applicable_ids: form.applicable_ids,
                expires_at: form.expires_at || null,
            };

            const res = await api.post('/discounts', payload);
            if (res.data.success) {
                toast.success('Coupon created!');
                router.push('/dashboard/discounts');
            }
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to create coupon');
        } finally {
            setLoading(false);
        }
    };

    const selectedType = TYPES.find(t => t.value === form.type);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Back */}
            <Link href="/dashboard/discounts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Discounts
            </Link>

            <div>
                <h1 className="text-2xl font-black text-gray-900">Create Coupon</h1>
                <p className="text-sm text-gray-400 mt-1">Set up a discount code for your customers</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Code */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Coupon Code</h2>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text" required
                                value={form.code}
                                onChange={e => set('code', e.target.value.toUpperCase())}
                                placeholder="SUMMER20"
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono font-bold tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                        </div>
                        <button type="button" onClick={generateCode}
                            className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all whitespace-nowrap">
                            Generate
                        </button>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Description (optional)</label>
                        <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
                            placeholder="Summer sale discount"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                    </div>
                </div>

                {/* Type */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Discount Type</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {TYPES.map(({ value, label, icon: Icon, desc }) => (
                            <button key={value} type="button" onClick={() => set('type', value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                                    ${form.type === value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                                <Icon className={`w-5 h-5 ${form.type === value ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className={`text-xs font-bold ${form.type === value ? 'text-blue-700' : 'text-gray-600'}`}>{label}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400">{selectedType?.desc}</p>

                    {form.type !== 'free_shipping' && (
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
                                {form.type === 'percentage' ? 'Discount %' : 'Discount Amount (₦)'}
                            </label>
                            <div className="relative">
                                {form.type === 'percentage'
                                    ? <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    : <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                }
                                <input type="number" min="0" step="any" value={form.value} onChange={e => set('value', e.target.value)}
                                    placeholder={form.type === 'percentage' ? '20' : '500'}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Rules */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Rules & Limits</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Min Order Value (₦)</label>
                            <input type="number" min="0" value={form.min_order_value} onChange={e => set('min_order_value', e.target.value)}
                                placeholder="0 = no minimum"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Max Uses (Total)</label>
                            <input type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)}
                                placeholder="Unlimited"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Max Uses Per User</label>
                            <input type="number" min="1" value={form.max_uses_per_user} onChange={e => set('max_uses_per_user', e.target.value)}
                                placeholder="Unlimited"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
                                <Calendar className="inline w-3 h-3 mr-1" />
                                Starts At
                            </label>
                            <input type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
                                <Calendar className="inline w-3 h-3 mr-1" />
                                Expires At
                            </label>
                            <input type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
                        </div>
                    </div>
                </div>

                {/* Applicability */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-400" /> Applies To
                    </h2>
                    <div className="flex gap-6">
                        {APPLICABILITY.map(app => (
                            <label key={app.value} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="applicable_to" value={app.value} checked={form.applicable_to === app.value} onChange={() => {
                                    set('applicable_to', app.value);
                                    if (app.value !== 'categories') set('applicable_ids', []);
                                }} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                                <span className="text-sm font-medium text-gray-800">{app.label}</span>
                            </label>
                        ))}
                    </div>
                    
                    {form.applicable_to === 'categories' && (
                        <div className="pt-2">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Select Categories</label>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.applicable_ids.length === 0 && <span className="text-sm text-gray-400">No categories selected.</span>}
                                {form.applicable_ids.map(id => {
                                    const cat = categories.find(c => c.id === id);
                                    return (
                                        <div key={id} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100 shadow-sm">
                                            {cat?.name || id}
                                            <button type="button" onClick={() => set('applicable_ids', form.applicable_ids.filter(i => i !== id))} className="text-blue-400 hover:text-blue-600">&times;</button>
                                        </div>
                                    )
                                })}
                            </div>
                            
                            <select
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val && !form.applicable_ids.includes(val)) {
                                        set('applicable_ids', [...form.applicable_ids, val]);
                                    }
                                    e.target.value = "";
                                }}
                            >
                                <option value="">+ Add category...</option>
                                {categories.filter(c => !form.applicable_ids.includes(c.id)).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Active toggle */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-800">Activate immediately</p>
                            <p className="text-xs text-gray-400 mt-0.5">Coupon will be usable as soon as it's created</p>
                        </div>
                        <button type="button" onClick={() => set('is_active', !form.is_active)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Link href="/dashboard/discounts"
                        className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all text-center">
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-all">
                        {loading ? 'Creating...' : 'Create Coupon'}
                    </button>
                </div>
            </form>
        </div>
    );
}
