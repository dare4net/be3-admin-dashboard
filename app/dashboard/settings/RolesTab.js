"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function RolesTab() {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState(null); // Role object or null
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
            setRoles(rolesRes.data.roles);
            setPermissions(permsRes.data.permissions);
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

    const handleDelete = async (roleId) => {
        if (!confirm("Are you sure? This will remove access for users with this role.")) return;
        try {
            // await api.delete(`/roles/${roleId}`);
            alert("Delete not implemented in backend yet");
        } catch (e) {
            alert("Failed to delete role");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let roleId = editingRole?.id;

            if (editingRole) {
                // Update Role Info (Optional: Add PATCH /roles endpoint later)
                // await api.patch(`/roles/${roleId}`, { name: formData.name, description: formData.description });
            } else {
                // Create Role
                const res = await api.post("/roles", {
                    name: formData.name,
                    description: formData.description
                });
                roleId = res.data.role.id;
            }

            // Sync Permissions (using PUT endpoint)
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

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const module = perm.module || 'Other';
        if (!acc[module]) acc[module] = [];
        acc[module].push(perm);
        return acc;
    }, {});

    if (loading) return <div>Loading roles...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Roles & Permissions</h2>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" /> Create Role
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map((role) => (
                            <tr key={role.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{role.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{role.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(role)} className="text-blue-600 hover:text-blue-900 mr-4">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {/* Prevent deleting system roles if needed */}
                                    {/* <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button> */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!!editingRole} // Disable name edit for now
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-3">Permissions</h4>
                                    <div className="space-y-4">
                                        {Object.entries(groupedPermissions).map(([module, perms]) => (
                                            <div key={module} className="border rounded-lg p-4">
                                                <h5 className="font-medium capitalize mb-2 text-gray-800">{module}</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {perms.map(perm => (
                                                        <label key={perm.id} className="flex items-center space-x-2 text-sm text-gray-600">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.includes(perm.id)}
                                                                onChange={() => togglePermission(perm.id)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span>{perm.description || perm.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Role"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
