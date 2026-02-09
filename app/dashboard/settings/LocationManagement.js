"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { MapPin, Plus, Trash2, Star, Loader2, Globe, Map } from "lucide-react";

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
            case "worldwide":
                return "Worldwide";
            case "continent":
                return location.continent || "Continental";
            case "country":
                return location.country || "Country-wide";
            case "state":
                return `${location.state}${location.country ? ', ' + location.country : ''}`;
            case "city":
                return `${location.city}${location.state ? ', ' + location.state : ''}${location.country ? ', ' + location.country : ''}`;
            case "specific":
                return location.city && location.state
                    ? `${location.city}, ${location.state}`
                    : location.address || "Specific Location";
            default:
                return "Location";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Business Locations
                </h3>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Location
                    </button>
                )}
            </div>

            {/* Location Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Scope
                        </label>
                        <select
                            value={formData.scope}
                            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                            {["continent", "country", "state", "city", "specific"].includes(formData.scope) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., United States"
                                        required={formData.scope !== "continent"}
                                    />
                                </div>
                            )}

                            {["state", "city", "specific"].includes(formData.scope) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., California"
                                        required
                                    />
                                </div>
                            )}

                            {["city", "specific"].includes(formData.scope) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., Los Angeles"
                                        required
                                    />
                                </div>
                            )}

                            {formData.scope === "specific" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Street Address
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="123 Main Street"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.postal_code}
                                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="90001"
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_primary"
                            checked={formData.is_primary}
                            onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_primary" className="text-sm text-gray-700">
                            Set as primary location (Ships From address)
                        </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                            {editingId ? "Update" : "Add"} Location
                        </button>
                    </div>
                </form>
            )}

            {/* Locations List */}
            <div className="space-y-2">
                {locations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Map className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No locations added yet</p>
                    </div>
                ) : (
                    locations.map((location) => (
                        <div
                            key={location.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {location.scope === "worldwide" ? (
                                    <Globe className="w-5 h-5 text-blue-600" />
                                ) : (
                                    <MapPin className="w-5 h-5 text-gray-600" />
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{formatLocation(location)}</span>
                                        {location.is_primary && (
                                            <span
                                                className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full cursor-help"
                                                title="This location is used as the 'Ships From' address on product pages"
                                            >
                                                <Star className="w-3 h-3 fill-current" />
                                                Primary (Ships From)
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500 capitalize">{location.scope}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!location.is_primary && (
                                    <button
                                        onClick={() => handleSetPrimary(location.id)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Set as primary"
                                    >
                                        <Star className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEdit(location)}
                                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(location.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
