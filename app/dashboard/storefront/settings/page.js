"use client";

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Save, Loader2, Globe, Layout, Palette } from 'lucide-react';
import ImageUploader from '@/components/config/ImageUploader';

export default function ThemeSettingsPage() {
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [settings, setSettings] = useState({
        logo: '',
        favicon: '',
        copyright: '',
        social: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: '',
            tiktok: '',
            pinterest: '',
            whatsapp: '',
            snapchat: '',
            telegram: '',
            iconColor: '',
            iconHoverColor: '',
        },
        colors: {
            primary: '#000000',
            secondary: '#ffffff'
        }
    });

    useEffect(() => {
        fetchTheme();
    }, []);

    const fetchTheme = async () => {
        try {
            const res = await axios.get('/page-builder/storefront/theme');
            if (res.data.theme) {
                setTheme(res.data.theme);
                // Merge existing variables with defaults
                const existing = res.data.theme.variables || {};
                setSettings(prev => ({
                    ...prev,
                    ...existing,
                    social: { ...prev.social, ...(existing.social || {}) },
                    colors: { ...prev.colors, ...(existing.colors || {}) }
                }));
            }
        } catch (error) {
            console.error("Failed to fetch theme:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        setSaving(true);
        try {
            // Create a default theme
            const res = await axios.post('/page-builder/themes', {
                name: 'Default Theme',
                is_active: true,
                variables: settings
            });
            // Activate it immediately (backend might require 2 steps, let's see)
            // The create usually returns the theme. We need to activate it.
            const newTheme = res.data.theme;

            // Activate
            await axios.post(`/page-builder/themes/${newTheme.id}/activate`);

            setTheme(newTheme);
            alert('Default theme initialized!');
            fetchTheme();
        } catch (error) {
            console.error("Init failed:", error);
            alert("Failed to initialize theme.");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!theme) return;
        setSaving(true);
        try {
            await axios.put(`/page-builder/themes/${theme.id}`, {
                variables: settings
            });
            alert('Settings saved!');
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    if (!theme) {
        return (
            <div className="p-8 text-center max-w-md mx-auto mt-20">
                <Layout className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold mb-2">No Active Theme</h2>
                <p className="text-gray-500 mb-6">Initialize your storefront theme to start customizing settings.</p>
                <button
                    onClick={handleInitialize}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Initializing...' : 'Initialize Default Theme'}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
                    <p className="text-gray-500">Customize your storefront appearance and global content.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* General Settings */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Globe className="w-5 h-5 text-gray-400" />
                            General Branding
                        </h3>

                        <div>
                            <ImageUploader
                                label="Storefront Primary Logo"
                                value={settings.logo}
                                onChange={url => setSettings({ ...settings, logo: url })}
                                folder="storefront/logos"
                                aspectRatio="16/9"
                            />
                            <p className="text-xs text-gray-500 mt-2">Upload directly to Cloudinary or switch to Link mode to paste an external image URL.</p>
                        </div>

                        <div>
                            <ImageUploader
                                label="Favicon / Icon (1:1)"
                                value={settings.favicon}
                                onChange={url => setSettings({ ...settings, favicon: url })}
                                folder="storefront/favicons"
                                aspectRatio="1/1"
                            />
                            <p className="text-xs text-gray-500 mt-2">Square browser favicon or app icon.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Footer Copyright Text</label>
                            <input
                                type="text"
                                value={settings.copyright}
                                onChange={e => setSettings({ ...settings, copyright: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder="© 2024 My Store. All rights reserved."
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Palette className="w-5 h-5 text-gray-400" />
                            Social Media Links
                        </h3>
                        <p className="text-xs text-gray-500">Only platforms with a URL entered here will show icons on your storefront.</p>

                        {/* Icon Color Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Icon Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.social.iconColor || '#9ca3af'}
                                        onChange={e => setSettings({ ...settings, social: { ...settings.social, iconColor: e.target.value } })}
                                        className="w-10 h-9 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={settings.social.iconColor || ''}
                                        onChange={e => setSettings({ ...settings, social: { ...settings.social, iconColor: e.target.value } })}
                                        className="flex-1 px-3 py-2 border rounded-md text-xs font-mono"
                                        placeholder="#9ca3af  (default: muted gray)"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Icon Hover Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={settings.social.iconHoverColor || '#ffffff'}
                                        onChange={e => setSettings({ ...settings, social: { ...settings.social, iconHoverColor: e.target.value } })}
                                        className="w-10 h-9 border border-gray-200 rounded-lg cursor-pointer p-0.5"
                                    />
                                    <input
                                        type="text"
                                        value={settings.social.iconHoverColor || ''}
                                        onChange={e => setSettings({ ...settings, social: { ...settings.social, iconHoverColor: e.target.value } })}
                                        className="flex-1 px-3 py-2 border rounded-md text-xs font-mono"
                                        placeholder="#ffffff  (default: white)"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'facebook',  label: 'Facebook',       placeholder: 'https://facebook.com/yourpage' },
                                { key: 'instagram', label: 'Instagram',      placeholder: 'https://instagram.com/yourhandle' },
                                { key: 'twitter',   label: 'Twitter / X',    placeholder: 'https://twitter.com/yourhandle' },
                                { key: 'tiktok',    label: 'TikTok',         placeholder: 'https://tiktok.com/@yourhandle' },
                                { key: 'youtube',   label: 'YouTube',        placeholder: 'https://youtube.com/c/yourchannel' },
                                { key: 'pinterest', label: 'Pinterest',      placeholder: 'https://pinterest.com/yourprofile' },
                                { key: 'linkedin',  label: 'LinkedIn',       placeholder: 'https://linkedin.com/company/...' },
                                { key: 'whatsapp',  label: 'WhatsApp',       placeholder: 'https://wa.me/1234567890' },
                                { key: 'snapchat',  label: 'Snapchat',       placeholder: 'https://snapchat.com/add/yourhandle' },
                                { key: 'telegram',  label: 'Telegram',       placeholder: 'https://t.me/yourusername' },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium mb-1">{label}</label>
                                    <input
                                        type="text"
                                        value={settings.social[key] || ''}
                                        onChange={e => setSettings({ ...settings, social: { ...settings.social, [key]: e.target.value } })}
                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                        placeholder={placeholder}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Preview / Info */}
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <h4 className="font-semibold text-blue-900 mb-2">About Themes</h4>
                        <p className="text-sm text-blue-800 mb-4">
                            These settings control the global appearance of your storefront header and footer.
                        </p>
                        <p className="text-sm text-blue-800">
                            <strong>Active Theme:</strong> {theme.name}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
