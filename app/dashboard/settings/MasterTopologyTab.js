"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Loader2, Plus, Trash2, Globe, Map, MapPin } from "lucide-react";

export default function MasterTopologyTab() {
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [landmarks, setLandmarks] = useState([]);

    const [activeCountry, setActiveCountry] = useState(null);
    const [activeState, setActiveState] = useState(null);

    const [loadingCountries, setLoadingCountries] = useState(true);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingLandmarks, setLoadingLandmarks] = useState(false);

    // Form inputs
    const [newCountry, setNewCountry] = useState({ name: "", code: "" });
    const [newState, setNewState] = useState({ name: "", code: "" });
    const [newLandmark, setNewLandmark] = useState({ name: "" });

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        setLoadingCountries(true);
        try {
            const res = await api.get("/shipping/topology/countries");
            setCountries(res.data.countries || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCountries(false);
        }
    };

    const fetchStates = async (countryId) => {
        setLoadingStates(true);
        try {
            const res = await api.get(`/shipping/topology/states?country_id=${countryId}`);
            setStates(res.data.states || []);
            setLandmarks([]);
            setActiveState(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingStates(false);
        }
    };

    const fetchLandmarks = async (stateId) => {
        setLoadingLandmarks(true);
        try {
            const res = await api.get(`/shipping/topology/landmarks?state_id=${stateId}`);
            setLandmarks(res.data.landmarks || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLandmarks(false);
        }
    };

    const handleAddCountry = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/shipping/topology/countries", newCountry);
            setCountries([...countries, res.data.country]);
            setNewCountry({ name: "", code: "" });
        } catch (err) {
            alert("Failed to add country");
        }
    };

    const handleDeleteCountry = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure? This will delete all states and landmarks under this country.")) return;
        try {
            await api.delete(`/shipping/topology/countries/${id}`);
            setCountries(countries.filter(c => c.id !== id));
            if (activeCountry?.id === id) setActiveCountry(null);
        } catch (err) {
            alert("Failed to delete country");
        }
    };

    const handleAddState = async (e) => {
        e.preventDefault();
        if (!activeCountry) return;
        try {
            const res = await api.post("/shipping/topology/states", { ...newState, country_id: activeCountry.id });
            setStates([...states, res.data.state]);
            setNewState({ name: "", code: "" });
        } catch (err) {
            alert("Failed to add state");
        }
    };

    const handleDeleteState = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure? This will delete all landmarks under this state.")) return;
        try {
            await api.delete(`/shipping/topology/states/${id}`);
            setStates(states.filter(s => s.id !== id));
            if (activeState?.id === id) setActiveState(null);
        } catch (err) {
            alert("Failed to delete state");
        }
    };

    const handleAddLandmark = async (e) => {
        e.preventDefault();
        if (!activeState) return;
        try {
            const res = await api.post("/shipping/topology/landmarks", { ...newLandmark, state_id: activeState.id });
            setLandmarks([...landmarks, res.data.landmark]);
            setNewLandmark({ name: "" });
        } catch (err) {
            alert("Failed to add landmark");
        }
    };

    const handleDeleteLandmark = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/shipping/topology/landmarks/${id}`);
            setLandmarks(landmarks.filter(l => l.id !== id));
        } catch (err) {
            alert("Failed to delete landmark");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Master Location Topology</h2>
                <p className="text-xs text-gray-400 mt-1">Manage global delivery zones available across the platform.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0">

                {/* COUNTRIES */}
                <div className="flex flex-col border-r border-gray-100">
                    <div className="p-4 bg-gray-50/50 font-bold text-xs uppercase tracking-widest text-gray-600 border-b border-gray-100 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        Countries
                    </div>
                    <form onSubmit={handleAddCountry} className="flex p-3 gap-2 border-b border-gray-100 bg-white">
                        <input required value={newCountry.name} onChange={e => setNewCountry(prev => ({ ...prev, name: e.target.value }))} placeholder="Country Name" className="flex-1 text-xs px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-blue-500" />
                        <input required value={newCountry.code} onChange={e => setNewCountry(prev => ({ ...prev, code: e.target.value }))} placeholder="Code" className="w-16 text-xs px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-blue-500" />
                        <button type="submit" className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"><Plus className="w-4 h-4" /></button>
                    </form>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingCountries ? <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" /></div> : countries.map(c => (
                            <div
                                key={c.id}
                                onClick={() => { setActiveCountry(c); fetchStates(c.id); }}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${activeCountry?.id === c.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50 text-gray-600 text-sm'}`}
                            >
                                <span>{c.name} <span className="text-[10px] text-gray-400 uppercase ml-1">({c.code})</span></span>
                                <button onClick={(e) => handleDeleteCountry(c.id, e)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* STATES */}
                <div className="flex flex-col border-r border-gray-100">
                    <div className="p-4 bg-gray-50/50 font-bold text-xs uppercase tracking-widest text-gray-600 border-b border-gray-100 flex items-center gap-2">
                        <Map className="w-4 h-4 text-emerald-500" />
                        States / Regions
                    </div>
                    {activeCountry ? (
                        <>
                            <form onSubmit={handleAddState} className="flex p-3 gap-2 border-b border-gray-100 bg-white">
                                <input required value={newState.name} onChange={e => setNewState(prev => ({ ...prev, name: e.target.value }))} placeholder="State Name" className="flex-1 text-xs px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-blue-500" />
                                <button type="submit" className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"><Plus className="w-4 h-4" /></button>
                            </form>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {loadingStates ? <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" /></div>
                                    : states.length === 0 ? <div className="text-center p-4 text-xs text-gray-400">No states added</div>
                                        : states.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => { setActiveState(s); fetchLandmarks(s.id); }}
                                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${activeState?.id === s.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-50 text-gray-600 text-sm'}`}
                                            >
                                                <span>{s.name}</span>
                                                <button onClick={(e) => handleDeleteState(s.id, e)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic bg-gray-50/30">Select a Country</div>
                    )}
                </div>

                {/* LANDMARKS */}
                <div className="flex flex-col">
                    <div className="p-4 bg-gray-50/50 font-bold text-xs uppercase tracking-widest text-gray-600 border-b border-gray-100 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        Landmarks / LGAs
                    </div>
                    {activeState ? (
                        <>
                            <form onSubmit={handleAddLandmark} className="flex p-3 gap-2 border-b border-gray-100 bg-white">
                                <input required value={newLandmark.name} onChange={e => setNewLandmark(prev => ({ ...prev, name: e.target.value }))} placeholder="Landmark Name" className="flex-1 text-xs px-2 py-1.5 border rounded outline-none focus:ring-1 focus:ring-blue-500" />
                                <button type="submit" className="p-1.5 bg-orange-600 text-white rounded hover:bg-orange-700"><Plus className="w-4 h-4" /></button>
                            </form>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {loadingLandmarks ? <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" /></div>
                                    : landmarks.length === 0 ? <div className="text-center p-4 text-xs text-gray-400">No landmarks added</div>
                                        : landmarks.map(l => (
                                            <div key={l.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-gray-600 text-sm transition-colors">
                                                <span>{l.name}</span>
                                                <button onClick={(e) => handleDeleteLandmark(l.id, e)} className="text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic bg-gray-50/30">Select a State</div>
                    )}
                </div>

            </div>
        </div>
    );
}
