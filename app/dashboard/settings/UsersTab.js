"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2, Plus, Search, Shield, Trash2, Edit, Save, X, Check, UserCircle, Globe, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import CategorySelector from "@/components/CategorySelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function UsersTab() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Edit Modal State
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        roles: [],
        categoryIds: [],
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
                api.get("/users"),
                api.get("/roles")
            ]);

            if (usersRes.data.success) setUsers(usersRes.data.users || []);
            if (rolesRes.data.success) setRoles(rolesRes.data.roles || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = async (user) => {
        setEditingUser(user);
        setIsEditOpen(true);
        setSaving(true);

        try {
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
            setEditForm({ roles: [], categoryIds: [], business_name: "" });
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

            if (editForm.business_name !== editingUser.business_name) {
                await api.patch(`/auth/users/${editingUser.id}`, {
                    business_name: editForm.business_name
                });
            }

            await api.post(`/api/permissions/user/${editingUser.id}/categories`, {
                categoryIds: editForm.categoryIds
            });

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

    if (loading) {
        return (
            <div className="flex justify-center p-12 grayscale opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-lg border border-gray-100 shadow-none">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="SEARCH STAFF REGISTRY..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-none w-full md:w-auto justify-center">
                    <Plus className="w-4 h-4" /> Provision Access
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-none border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Personnel Identity</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Profiles</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Audit Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                    No Personnel Matched Search Params
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                                <UserCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{user.first_name} {user.last_name}</div>
                                                <div className="text-[10px] font-mono text-gray-400 lowercase">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                            {/* Badge styling matches Be3 standard */}
                                            <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-tighter rounded-full border border-gray-100">
                                                Standard Access
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                            user.status === 'active' || !user.status ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                        )}>
                                            {user.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="inline-flex items-center gap-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <Shield className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Manage Access Dialog with Be3 Aesthetic */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white shadow-none border border-gray-200">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <DialogTitle className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                                    Access Protocol: {editingUser?.first_name} {editingUser?.last_name}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">
                                Define authorization scopes and data visibility boundaries.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        {saving && editForm.roles.length === 0 && !editForm.categoryIds.length ? (
                            <div className="py-12 flex justify-center grayscale opacity-50">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Roles Section */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Identification Context</h3>
                                        <div className="bg-blue-50/30 p-5 rounded-lg border border-blue-100">
                                            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                                                Business Entity Association (For Vendors)
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.business_name}
                                                onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-blue-100 rounded-lg text-sm font-black focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-blue-200"
                                                placeholder="e.g. Acme Logistics"
                                            />
                                            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mt-2 italic">
                                                Tags personnel metadata for multi-tenant data isolation.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Assigned Access Profiles</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {editForm.roles.length === 0 ? (
                                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">No Profiles Allocated</p>
                                            ) : (
                                                editForm.roles.map(role => (
                                                    <span key={role.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest rounded-lg">
                                                        {role.name}
                                                        <X
                                                            className="w-3.5 h-3.5 cursor-pointer hover:text-blue-200 transition-colors"
                                                            onClick={() => handleRoleToggle(role)}
                                                        />
                                                    </span>
                                                ))
                                            )}
                                        </div>

                                        <div className="pt-4">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Available Profile Library:</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {roles.filter(r => !editForm.roles.some(ur => ur.id === r.id)).map(role => (
                                                    <div
                                                        key={role.id}
                                                        onClick={() => handleRoleToggle(role)}
                                                        className="group cursor-pointer p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between hover:border-blue-200 hover:bg-white transition-all"
                                                    >
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{role.name}</span>
                                                        <Plus className="w-3 h-3 text-gray-300 group-hover:text-blue-600 transition-colors" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Access Section */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">Data Visibility Boundary</h3>
                                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                                        <CategorySelector
                                            selectedIds={editForm.categoryIds}
                                            onChange={(ids) => setEditForm(prev => ({ ...prev, categoryIds: ids }))}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter text-center">
                                        Limits product visibility in the catalog to selected namespaces.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <DialogFooter className="flex flex-row justify-end gap-3">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="px-6 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-10 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-none"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Commit Changes
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
