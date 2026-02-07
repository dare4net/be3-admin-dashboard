"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2, Plus, Search, Shield, Trash2, Edit, Save, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import CategorySelector from "@/components/CategorySelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function UsersTab() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Edit Modal State
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        roles: [], // Array of role objects
        categoryIds: [], // Array of category IDs
        business_name: ""
    });
    const [saving, setSaving] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get("/users"), // Assuming this endpoint exists, or I need to create it
                api.get("/roles")
            ]);

            if (usersRes.data.success) setUsers(usersRes.data.users);
            if (rolesRes.data.success) setRoles(rolesRes.data.roles);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (user) => {
        setEditingUser(user);
        setIsEditOpen(true);
        setSaving(true); // Show loading while fetching details

        try {
            // Fetch detailed permissions/categories for this user
            // We fetch user details from /auth/users/:id because it accurately returns assigned roles
            const [userRes, permRes] = await Promise.all([
                api.get(`/auth/users/${user.id}`),
                api.get(`/api/permissions/user/${user.id}`)
            ]);

            setEditForm({
                roles: userRes.data.user.roles || [],
                categoryIds: permRes.data.categoryAccess?.allowedCategories || [],
                business_name: userRes.data.user.business_name || ""
            });
        } catch (error) {
            console.error("Failed to fetch user permissions:", error);
            // Fallback to basic info if API fails
            setEditForm({ roles: [], categoryIds: [] });
        } finally {
            setSaving(false);
        }
    };

    const handleRoleToggle = (role) => {
        const hasRole = editForm.roles.some(r => r.id === role.id);
        let newRoles;
        if (hasRole) {
            newRoles = editForm.roles.filter(r => r.id !== role.id);
        } else {
            newRoles = [...editForm.roles, role];
        }
        setEditForm({ ...editForm, roles: newRoles });
    };

    const handleSave = async () => {
        if (!editingUser) return;
        setSaving(true);

        try {
            // 1. Update Roles
            // Calculate changes (simple diffing logic could be added here, but for now we reconstruct)
            // Actually API likely needs add/remove logic or a sync endpoint. 
            // My Roles API currently only supports assign/remove one by one. 
            // Let's iterate for now or I should have added a sync endpoint. 
            // For now, I'll stick to just Category Permissions as that's the main request, 
            // AND I'll try to sync roles if possible. 
            // Actually, let's focus on the Category Permission since that was the blocked user request.
            // Role management is complicated without a sync endpoint. 
            // Wait, I can use the assign/remove endpoints.

            const originalRoles = (await api.get(`/api/permissions/user/${editingUser.id}`)).data.roles || [];
            const originalRoleIds = originalRoles.map(r => r.id);
            const newRoleIds = editForm.roles.map(r => r.id);

            const toAdd = newRoleIds.filter(id => !originalRoleIds.includes(id));
            const toRemove = originalRoleIds.filter(id => !newRoleIds.includes(id));

            for (const roleId of toAdd) {
                await api.post(`/roles/${roleId}/users`, { userId: editingUser.id });
            }
            for (const roleId of toRemove) {
                await api.delete(`/roles/${roleId}/users/${editingUser.id}`);
            }

            // 1.5 Update Business Name (if changed)
            if (editForm.business_name !== editingUser.business_name) {
                await api.patch(`/auth/users/${editingUser.id}`, {
                    business_name: editForm.business_name
                });
            }

            // 2. Update Categories
            await api.post(`/api/permissions/user/${editingUser.id}/categories`, {
                categoryIds: editForm.categoryIds
            });

            // Refresh list
            await fetchData();
            setIsEditOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Failed to save permissions:", error);
            alert("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.first_name + ' ' + u.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Invite User
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Roles</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                    <div className="text-gray-500 text-xs">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {/* We don't have roles in the user list API yet typically, but let's assume or fetch */}
                                        {/* For now just a placeholder or needing a better fetch */}
                                        <Badge variant="outline" className="bg-gray-50">View to see roles</Badge>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {user.status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleEditClick(user)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
                                    >
                                        <Shield className="w-3 h-3" />
                                        Manage Access
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <div className="p-6 border-b">
                        <DialogHeader>
                            <DialogTitle>Manage Access: {editingUser?.first_name} {editingUser?.last_name}</DialogTitle>
                            <DialogDescription>
                                Configure roles and data access permissions for this user.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <ScrollArea className="flex-1 p-6 overflow-y-auto">
                        {saving && editForm.roles.length === 0 && !editForm.categoryIds.length ? (
                            <div className="py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-6">
                                {/* Roles Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-gray-900">Assigned Roles</h3>
                                    </div>

                                    {/* Business Name Field */}
                                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
                                        <label className="block text-sm font-medium text-blue-900 mb-1">
                                            Business Name (for Vendors)
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.business_name}
                                            onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            placeholder="Enter vendor business name"
                                        />
                                        <p className="text-[10px] text-blue-700 mt-1 italic">
                                            If this user is a Vendor, their products will be tagged with this name.
                                        </p>
                                    </div>

                                    {/* Current Roles Display */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {editForm.roles.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No roles assigned</p>
                                        ) : (
                                            editForm.roles.map(role => (
                                                <Badge key={role.id} variant="secondary" className="px-2 py-1 flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-100">
                                                    {role.name}
                                                    <X
                                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                                        onClick={() => handleRoleToggle(role)}
                                                    />
                                                </Badge>
                                            ))
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-xs text-gray-500 mb-2">Available Roles (Click to add):</p>
                                        <div className="flex flex-wrap gap-2">
                                            {roles.filter(r => !editForm.roles.some(ur => ur.id === r.id)).map(role => (
                                                <div
                                                    key={role.id}
                                                    onClick={() => handleRoleToggle(role)}
                                                    className="cursor-pointer px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    {role.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-4"></div>

                                {/* Category Access Section */}
                                <div className="space-y-3 pb-4">
                                    <h3 className="text-sm font-medium text-gray-900">Category Access</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <CategorySelector
                                            selectedIds={editForm.categoryIds}
                                            onChange={(ids) => setEditForm(prev => ({ ...prev, categoryIds: ids }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-6 border-t bg-gray-50">
                        <DialogFooter>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
