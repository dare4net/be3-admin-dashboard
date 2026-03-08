"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { MapPin, Plus, Trash2, Star, Loader2, Globe, Map, ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LocationManagement({ userId }) {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        scope: "city",
        continent: "",
        country: "",
        state: "",
        city: "",
        address: "",
        postal_code: "",
        is_primary: false
    });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await api.get("/location");
            if (res.data.success) {
                setLocations(res.data.locations);
            }
        } catch (error) {
            console.error("Failed to fetch locations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/location/${editingId}`, formData);
            } else {
                await api.post("/location", formData);
            }
            await fetchLocations();
            resetForm();
            alert("Location saved successfully!");
        } catch (error) {
            console.error("Failed to save location:", error);
            alert("Failed to save location");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this location?")) return;
        try {
            await api.delete(`/location/${id}`);
            await fetchLocations();
        } catch (error) {
            console.error("Failed to delete location:", error);
            alert("Failed to delete location");
        }
    };

    const handleSetPrimary = async (id) => {
        try {
            await api.put(`/location/${id}/primary`);
            await fetchLocations();
        } catch (error) {
            console.error("Failed to set primary:", error);
            alert("Failed to set as primary");
        }
    };

    const handleEdit = (location) => {
        setEditingId(location.id);
        setFormData({
            scope: location.scope,
            continent: location.continent || "",
            country: location.country || "",
            state: location.state || "",
            city: location.city || "",
            address: location.address || "",
            postal_code: location.postal_code || "",
            is_primary: location.is_primary
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            scope: "city",
            continent: "",
            country: "",
            state: "",
            city: "",
            address: "",
            postal_code: "",
            is_primary: false
        });
        setEditingId(null);
        setShowForm(false);
    };

    const formatLocation = (location) => {
        switch (location.scope) {
            case "worldwide": return "Worldwide";
            case "continent": return location.continent || "Continental";
            case "country": return location.country || "Country-wide";
            case "state": return `${location.state}${location.country ? ', ' + location.country : ''}`;
            case "city": return `${location.city}${location.state ? ', ' + location.state : ''}${location.country ? ', ' + location.country : ''}`;
            case "specific": return location.address || location.city || "Specific Location";
            default: return "Location";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 grayscale opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Operational Presence</h2>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none"
                    >
                        <Plus className="w-4 h-4" />
                        Provision Node
                    </button>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* Form Overlay-like section */}
                {showForm && (
                    <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                {editingId ? "Update Location Context" : "Register New Point"}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <Plus className="w-4 h-4 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility Scope</label>
                                    <select
                                        value={formData.scope}
                                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none"
                                        required
                                    >
                                        <option value="worldwide">Worldwide</option>
                                        <option value="continent">Continent</option>
                                        <option value="country">Country</option>
                                        <option value="state">State/Province</option>
                                        <option value="city">City</option>
                                        <option value="specific">Specific Address</option>
                                    </select>
                                </div>

                                {formData.scope !== "worldwide" && (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Country Domain</label>
                                            <input
                                                type="text"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                placeholder="e.g. Nigeria"
                                                required={formData.scope !== "continent"}
                                            />
                                        </div>

                                        {["state", "city", "specific"].includes(formData.scope) && (
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Region / State</label>
                                                <input
                                                    type="text"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                    placeholder="e.g. Lagos"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {["city", "specific"].includes(formData.scope) && (
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">City Identity</label>
                                                <input
                                                    type="text"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                    placeholder="e.g. Ikeja"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {formData.scope === "specific" && (
                                            <div className="col-span-1 md:col-span-2 space-y-6">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Physical Address</label>
                                                    <input
                                                        type="text"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                        placeholder="45 Corporate Way..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Postal Index</label>
                                                    <input
                                                        type="text"
                                                        value={formData.postal_code}
                                                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-sm font-mono focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                        placeholder="101233"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="is_primary"
                                    checked={formData.is_primary}
                                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all cursor-pointer"
                                />
                                <label htmlFor="is_primary" className="text-[10px] font-black text-gray-900 uppercase tracking-widest cursor-pointer select-none">
                                    Primary Operational Hub (Ships From)
                                </label>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={resetForm} className="px-6 py-2.5 bg-white border border-gray-100 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                                    Discard
                                </button>
                                <button type="submit" disabled={saving} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-none">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                                    {editingId ? "Update Node" : "Submit Node"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Locations Grid/List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-gray-50/50 border border-dashed border-gray-100 rounded-lg">
                            <Map className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Operational Nodes Mapped</p>
                        </div>
                    ) : (
                        locations.map((loc) => (
                            <div
                                key={loc.id}
                                className={cn(
                                    "p-5 rounded-lg border transition-all flex flex-col justify-between min-h-[140px]",
                                    loc.is_primary ? "bg-blue-50/50 border-blue-100" : "bg-white border-gray-100 hover:border-blue-200"
                                )}
                            >
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div className={cn("p-2 rounded-lg", loc.is_primary ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-400")}>
                                            {loc.scope === "worldwide" ? <Globe className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                        </div>
                                        {loc.is_primary && (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest rounded-full">
                                                <Star className="w-2.5 h-2.5 fill-current" />
                                                Primary Hub
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-black text-gray-900 text-sm leading-tight uppercase tracking-tight">{formatLocation(loc)}</h4>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 opacity-60">Status: {loc.scope}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-1 pt-4 border-t border-gray-50/50">
                                    {!loc.is_primary && (
                                        <button
                                            onClick={() => handleSetPrimary(loc.id)}
                                            className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Promote to Primary"
                                        >
                                            <Star className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(loc)}
                                        className="p-2 text-gray-300 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                                        title="Edit Node"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(loc.id)}
                                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Sever Link"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
