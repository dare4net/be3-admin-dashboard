"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Check, X, Shield, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RolesTab() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", permissions: [] });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get("/roles"),
                api.get("/api/permissions")
            ]);
            setRoles(rolesRes.data.roles || []);
            setPermissions(permsRes.data.permissions || []);
        } catch (error) {
            console.error("Failed to fetch roles data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingRole(null);
        setFormData({ name: "", description: "", permissions: [] });
        setIsModalOpen(true);
    };

    const handleEdit = async (role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: []
        });
        setIsModalOpen(true);

        try {
            const res = await api.get(`/roles/${role.id}/permissions`);
            if (res.data.success) {
                setFormData(prev => ({ ...prev, permissions: res.data.permissions }));
            }
        } catch (e) {
            console.error("Failed to fetch role permissions", e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let roleId = editingRole?.id;

            if (!editingRole) {
                const res = await api.post("/roles", {
                    name: formData.name,
                    description: formData.description
                });
                roleId = res.data.role.id;
            }

            await api.put(`/roles/${roleId}/permissions`, { permissions: formData.permissions });

            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save role");
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = (permId) => {
        setFormData(prev => {
            const newPerms = prev.permissions.includes(permId)
                ? prev.permissions.filter(id => id !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: newPerms };
        });
    };

    const groupedPermissions = permissions.reduce((acc, perm) => {
        const module = perm.module || 'Other';
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex justify-center p-12 grayscale opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-gray-100 shadow-none">
                <div>
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Defined Access Roles</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{roles.length} System Profiles</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none"
                >
                    <Plus className="w-4 h-4" /> Provision Role
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role Identification</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Responsibility Description</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{role.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-[11px] font-medium text-gray-500 uppercase tracking-tight">
                                    {role.description || "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button onClick={() => handleEdit(role)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal - Aligned with Be3 Aesthetic */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-none border border-gray-200">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">{editingRole ? 'Update Role Mapping' : 'Register New Role'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-8">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Role Name *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!!editingRole}
                                        placeholder="e.g. WAREHOUSE_MANAGER"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Scope Description</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-200"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detailed responsibility breakdown..."
                                    />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Capability Matrix</h4>
                                    <div className="space-y-6">
                                        {Object.entries(groupedPermissions).map(([module, perms]) => (
                                            <div key={module} className="bg-gray-50 rounded-lg border border-gray-100 p-5">
                                                <h5 className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-4">{module} Namespace</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {perms.map(perm => (
                                                        <label key={perm.id} className="group flex items-center gap-3 p-2 hover:bg-white rounded transition-all cursor-pointer border border-transparent hover:border-gray-100">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.includes(perm.id)}
                                                                onChange={() => togglePermission(perm.id)}
                                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                                            />
                                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight group-hover:text-gray-900 transition-colors">{perm.description || perm.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-10 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-none"
                            >
                                {saving ? "Synchronizing..." : editingRole ? "Update Role" : "Commit Role"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
