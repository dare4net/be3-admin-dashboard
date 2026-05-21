"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Truck, Map, Settings, Loader2, Save, Plus, Trash2, Globe, AlertCircle, Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogisticsTab() {
    const [loading, setLoading] = useState(true);
    const [savingBase, setSavingBase] = useState(false);
    const [savingZone, setSavingZone] = useState(false);

    // Master configs
    const [baseConfig, setBaseConfig] = useState({
        base_fee: "",
        processing_min: "",
        processing_max: ""
    });
    const [zones, setZones] = useState([]);
    const [topology, setTopology] = useState({ countries: [], states: [], landmarks: [] });

    // Zone editor form
    const [showZoneForm, setShowZoneForm] = useState(false);
    const [zoneForm, setZoneForm] = useState({
        id: null,
        location_name: "",
        location_type: "country", // country, state, landmark
        location_id: "",
        multiplier: 1.0,
        transit_min: "",
        transit_max: ""
    });

    useEffect(() => {
        fetchConfigs();
        fetchCountries();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await api.get("/shipping/vendor-config");
            if (res.data.success) {
                const conf = res.data.config;
                if (conf) {
                    setBaseConfig({
                        base_fee: conf.global_base_fee || "",
                        processing_min: conf.global_processing_min || "",
                        processing_max: conf.global_processing_max || ""
                    });
                }
                setZones(res.data.zones || []);
            }
        } catch (error) {
            console.error("Failed to fetch shipping configs", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await api.get("/shipping/topology/countries");
            if (res.data.success) {
                setTopology(prev => ({ ...prev, countries: res.data.countries || [] }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStates = async (countryId) => {
        try {
            const res = await api.get(`/shipping/topology/states?country_id=${countryId}`);
            if (res.data.success) {
                setTopology(prev => ({ ...prev, states: res.data.states || [] }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLandmarks = async (stateId) => {
        try {
            const res = await api.get(`/shipping/topology/landmarks?state_id=${stateId}`);
            if (res.data.success) {
                setTopology(prev => ({ ...prev, landmarks: res.data.landmarks || [] }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleBaseSubmit = async (e) => {
        e.preventDefault();
        setSavingBase(true);
        try {
            await api.put("/shipping/vendor-config", {
                global_base_fee: parseFloat(baseConfig.base_fee),
                global_processing_min: parseInt(baseConfig.processing_min),
                global_processing_max: parseInt(baseConfig.processing_max)
            });
            alert("Global Logistics Rules Updated!");
        } catch (error) {
            console.error(error);
            alert("Failed to update base rules.");
        } finally {
            setSavingBase(false);
        }
    };

    const handleZoneTypeChange = async (e) => {
        const type = e.target.value;
        setZoneForm({ ...zoneForm, location_type: type, location_id: "" });

        // Auto-fetch if needed for UX chaining, but usually we cascade dynamically below.
        if (type === 'state' && topology.countries.length > 0) {
            // we need them to select a country first, then fetch states.
        }
    };

    const handleZoneSubmit = async (e) => {
        e.preventDefault();
        if (!zoneForm.location_id) {
            alert("Please select a valid location node.");
            return;
        }

        setSavingZone(true);
        try {
            await api.post("/shipping/vendor-config/zones", {
                location_type: zoneForm.location_type,
                location_id: parseInt(zoneForm.location_id),
                multiplier: parseFloat(zoneForm.multiplier),
                transit_min: parseInt(zoneForm.transit_min),
                transit_max: parseInt(zoneForm.transit_max)
            });
            await fetchConfigs();
            setShowZoneForm(false);
            setZoneForm({ id: null, location_name: "", location_type: "country", location_id: "", multiplier: 1.0, transit_min: "", transit_max: "" });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || "Failed to save zone rules");
        } finally {
            setSavingZone(false);
        }
    };

    const handleEditZone = (zone) => {
        setZoneForm({
            id: zone.id,
            location_name: getLocationName(zone),
            location_type: zone.location_type,
            location_id: zone.location_id,
            multiplier: zone.multiplier,
            transit_min: zone.transit_min,
            transit_max: zone.transit_max
        });
        setShowZoneForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setShowZoneForm(false);
        setZoneForm({ id: null, location_name: "", location_type: "country", location_id: "", multiplier: 1.0, transit_min: "", transit_max: "" });
    };

    const removeZone = async (id) => {
        if (!confirm("Remove this logisitics zone? Users in this area might lose coverage unless a higher parent zone covers them.")) return;
        try {
            await api.delete(`/shipping/vendor-config/zones/${id}`);
            fetchConfigs();
        } catch (error) {
            alert("Failed to remove zone.");
        }
    };

    // Derived Name Lookups
    const getLocationName = (zone) => {
        if (zone.location_type === 'country') return zone.country_name || "Unknown Country";
        if (zone.location_type === 'state') return zone.state_name || "Unknown State";
        if (zone.location_type === 'landmark') return zone.landmark_name || "Unknown Landmark";
        return zone.location_id;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 grayscale opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Global Base Defaults */}
            <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-gray-900" />
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Global Processing & Base Rates</h2>
                    </div>
                </div>
                <form onSubmit={handleBaseSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Standard Fee ($)</label>
                            <input
                                type="number" step="0.01" required
                                value={baseConfig.base_fee}
                                onChange={(e) => setBaseConfig({ ...baseConfig, base_fee: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            />
                            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">Your lowest universal delivery fee.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Processing Days</label>
                            <input
                                type="number" required
                                value={baseConfig.processing_min}
                                onChange={(e) => setBaseConfig({ ...baseConfig, processing_min: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            />
                            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">Fastest time to package order.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Processing Days</label>
                            <input
                                type="number" required
                                value={baseConfig.processing_max}
                                onChange={(e) => setBaseConfig({ ...baseConfig, processing_max: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            />
                            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">Longest time to package order.</p>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 mt-4 border-t border-gray-50">
                        <button type="submit" disabled={savingBase} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-[filter,transform] hover:brightness-110 active:scale-95 shadow-none disabled:opacity-50">
                            {savingBase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Sync Global Rules
                        </button>
                    </div>
                </form>
            </div>

            {/* Zonal Modifiers */}
            <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Map className="w-5 h-5 text-gray-900" />
                        <div>
                            <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Zonal Exceptions & Multipliers</h2>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure delivery boundaries and dynamic fee cascading.</p>
                        </div>
                    </div>
                    {!showZoneForm && (
                        <button onClick={() => setShowZoneForm(true)} className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            <Plus className="w-3.5 h-3.5" /> Bind New Zone
                        </button>
                    )}
                </div>

                {showZoneForm && (
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <form onSubmit={handleZoneSubmit} className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">{zoneForm.id ? "Edit Ruleset" : "New Zonal Rule Engine"}</h3>
                                <button type="button" onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-900">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Granularity</label>
                                    <select
                                        disabled={!!zoneForm.id}
                                        value={zoneForm.location_type}
                                        onChange={handleZoneTypeChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="country">Country Wide</option>
                                        <option value="state">Specific State</option>
                                        <option value="landmark">Specific Landmark / City / LGA</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Bind to Node</label>
                                    {zoneForm.id ? (
                                        <div className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-lg text-sm font-black text-gray-600">
                                            {zoneForm.location_name}
                                        </div>
                                    ) : zoneForm.location_type === 'country' ? (
                                        <select
                                            required
                                            value={zoneForm.location_id}
                                            onChange={(e) => setZoneForm({ ...zoneForm, location_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-100 outline-none"
                                        >
                                            <option value="">Select Country...</option>
                                            {topology.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    ) : zoneForm.location_type === 'state' ? (
                                        <div className="flex gap-2">
                                            <select
                                                onChange={(e) => fetchStates(e.target.value)}
                                                className="w-1/2 px-4 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-bold uppercase focus:ring-4 focus:ring-blue-50 outline-none"
                                            >
                                                <option value="">Filter Country...</option>
                                                {topology.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <select
                                                required
                                                value={zoneForm.location_id}
                                                onChange={(e) => setZoneForm({ ...zoneForm, location_id: e.target.value })}
                                                className="w-1/2 px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-50 outline-none"
                                            >
                                                <option value="">Target State...</option>
                                                {topology.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    ) : zoneForm.location_type === 'landmark' ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <select
                                                    onChange={(e) => fetchStates(e.target.value)}
                                                    className="w-1/2 px-4 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-bold uppercase outline-none"
                                                >
                                                    <option value="">Country</option>
                                                    {topology.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <select
                                                    onChange={(e) => fetchLandmarks(e.target.value)}
                                                    className="w-1/2 px-4 py-3 bg-white border border-gray-100 rounded-lg text-[10px] font-bold uppercase outline-none"
                                                >
                                                    <option value="">State</option>
                                                    {topology.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <select
                                                required
                                                value={zoneForm.location_id}
                                                onChange={(e) => setZoneForm({ ...zoneForm, location_id: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm focus:ring-4 focus:ring-blue-50 outline-none"
                                            >
                                                <option value="">Target Landmark...</option>
                                                {topology.landmarks.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                            </select>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-[#000]">Cost Multiplier (x)</label>
                                    <input
                                        type="number" step="0.01" required
                                        value={zoneForm.multiplier}
                                        onChange={(e) => setZoneForm({ ...zoneForm, multiplier: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black outline-none"
                                    />
                                    <p className="text-[9px] text-gray-400">e.g. 1.5x of Base Fee</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-[#000]">Min Transit Days</label>
                                    <input
                                        type="number" required
                                        value={zoneForm.transit_min}
                                        onChange={(e) => setZoneForm({ ...zoneForm, transit_min: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-[#000]">Max Transit Days</label>
                                    <input
                                        type="number" required
                                        value={zoneForm.transit_max}
                                        onChange={(e) => setZoneForm({ ...zoneForm, transit_max: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={savingZone} className="flex items-center gap-2 px-8 py-2.5 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-none">
                                    {savingZone && <Loader2 className="w-4 h-4 animate-spin" />} {zoneForm.id ? "Update Ruleset" : "Bind Ruleset"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="p-6">
                    {zones.length === 0 ? (
                        <div className="text-center py-10">
                            <Truck className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Logistical Zones Bound</p>
                            <p className="text-xs text-gray-400 mt-2">To start servicing users, configure your countries or states above.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="pb-4 font-black">Coverage Unit</th>
                                        <th className="pb-4 font-black">Level</th>
                                        <th className="pb-4 font-black">Fee Multiplier</th>
                                        <th className="pb-4 font-black">Transit Window</th>
                                        <th className="pb-4 text-right font-black">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {zones.map(z => (
                                        <tr key={z.id} className="border-b border-gray-50 hover:bg-gray-50/50 group transition-colors">
                                            <td className="py-4 text-sm font-bold text-gray-900">{getLocationName(z)}</td>
                                            <td className="py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest",
                                                    z.location_type === 'country' ? "bg-purple-50 text-purple-600" :
                                                        z.location_type === 'state' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                                                )}>{z.location_type}</span>
                                            </td>
                                            <td className="py-4 text-sm font-mono font-bold text-gray-500">{parseFloat(z.multiplier).toFixed(2)}x</td>
                                            <td className="py-4 text-sm font-medium text-gray-900">{z.transit_min} - {z.transit_max} Days</td>
                                            <td className="py-4 text-right flex items-center justify-end gap-1">
                                                <button onClick={() => handleEditZone(z)} className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => removeZone(z.id)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
