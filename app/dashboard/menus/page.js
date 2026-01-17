"use client";

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Plus, Trash, Edit, List } from 'lucide-react';
import MenuEditor from './MenuEditor';

export default function MenusPage() {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newMenuName, setNewMenuName] = useState('');
    const [newMenuLocation, setNewMenuLocation] = useState('');

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            const res = await axios.get('/api/menus');
            setMenus(res.data.menus);
        } catch (error) {
            console.error("Failed to fetch menus:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMenu = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/menus', {
                name: newMenuName,
                location: newMenuLocation || null
            });
            setMenus([res.data.menu, ...menus]);
            setIsCreating(false);
            setNewMenuName('');
            setNewMenuLocation('');
            setSelectedMenu(res.data.menu);
        } catch (error) {
            alert(error.response?.data?.error || "Failed to create menu");
        }
    };

    const handleDeleteMenu = async (id) => {
        if (!confirm('Are you sure you want to delete this menu?')) return;
        try {
            await axios.delete(`/api/menus/${id}`);
            setMenus(menus.filter(m => m.id !== id));
            if (selectedMenu?.id === id) setSelectedMenu(null);
        } catch (error) {
            console.error("Failed to delete menu:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Menus</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    disabled={isCreating}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Create Menu
                </button>
            </div>

            {isCreating && (
                <div className="mb-6 bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="font-semibold text-lg">New Menu</h3>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleCreateMenu} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium">Menu Name</label>
                                <input
                                    type="text"
                                    value={newMenuName}
                                    onChange={(e) => setNewMenuName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="e.g. Main Menu"
                                    required
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium">Location (Optional)</label>
                                <select
                                    value={newMenuLocation}
                                    onChange={(e) => setNewMenuLocation(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                >
                                    <option value="">-- None --</option>
                                    <option value="header">Header</option>
                                    <option value="footer_1">Footer Column 1</option>
                                    <option value="footer_2">Footer Column 2</option>
                                    <option value="footer_3">Footer Column 3</option>
                                </select>
                            </div>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                            <button type="button" className="px-4 py-2 border rounded-md hover:bg-gray-50" onClick={() => setIsCreating(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Menu List */}
                <div className="col-span-1 space-y-4">
                    {menus.map(menu => (
                        <div
                            key={menu.id}
                            onClick={() => setSelectedMenu(menu)}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedMenu?.id === menu.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-900">{menu.name}</h3>
                                    {menu.location && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                            {menu.location}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMenu(menu.id); }}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {menus.length === 0 && !loading && (
                        <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-400">
                            No menus found
                        </div>
                    )}
                </div>

                {/* Menu Editor (Right Side) */}
                <div className="col-span-1 md:col-span-3">
                    {selectedMenu ? (
                        <MenuEditor menu={selectedMenu} />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed p-12 text-gray-400">
                            Select a menu to edit items
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
