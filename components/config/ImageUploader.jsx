"use client";

import { useState, useRef } from "react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2, ExternalLink } from "lucide-react";

/**
 * Global Image Uploader Component
 * Replaces the old Base64 logic with direct-to-Cloudinary uploads.
 * 
 * @param {string} value - Current image URL
 * @param {function} onChange - Callback when image is changed
 * @param {string} folder - Destination folder on Cloudinary
 * @param {string} label - Input label
 * @param {string} aspectRatio - CSS aspect ratio for preview
 */
export default function ImageUploader({ 
    label, 
    value, 
    onChange, 
    aspectRatio = "16/9",
    folder = "general"
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [urlMode, setUrlMode] = useState(true);
    const fileInputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        setIsUploading(true);

        // Cleanup old image if it exists on Cloudinary
        if (value && value.includes('cloudinary.com')) {
            api.delete('/media/delete', { params: { url: value } }).catch(e => console.error("Old asset cleanup failed", e));
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const response = await api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                onChange(response.data.url);
                setUrlMode(true); // Switch back to URL mode to show the new link
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Verify Cloudinary credentials in backend.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                {label && (
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {label}
                    </label>
                )}
                <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setUrlMode(true)}
                        className={cn(
                            "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                            urlMode ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Link
                    </button>
                    <button
                        type="button"
                        onClick={() => setUrlMode(false)}
                        className={cn(
                            "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all",
                            !urlMode ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Upload
                    </button>
                </div>
            </div>

            <div className="relative group/uploader">
                {urlMode ? (
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="url"
                                value={value || ''}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder="Paste image link here..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="px-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "relative border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer",
                            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-gray-50 hover:border-blue-200",
                            isUploading && "pointer-events-none opacity-50"
                        )}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                            className="hidden"
                        />
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Processing...</span>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-300 group-hover/uploader:text-blue-400 transition-colors" />
                                <p className="text-[11px] font-bold text-gray-900">Cloudinary Direct Push</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Drop or Click to Upload</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Premium Preview Drawer */}
            {value && (
                <div 
                    className="relative rounded-[24px] border border-gray-100 overflow-hidden bg-gray-50 group/preview"
                    style={{ aspectRatio: aspectRatio }}
                >
                    <img
                        src={value}
                        alt="Asset preview"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-all flex items-center justify-center gap-3 backdrop-blur-[2px]">
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white rounded-full hover:scale-110 transition-transform shadow-xl"
                        >
                            <ExternalLink className="w-4 h-4 text-gray-900" />
                        </a>
                        <button
                            type="button"
                            onClick={async () => {
                                if (value.includes('cloudinary.com')) {
                                    try {
                                        await api.delete('/media/delete', { params: { url: value } });
                                    } catch (e) {
                                        console.error("Cleanup failed:", e);
                                    }
                                }
                                onChange('');
                            }}
                            className="p-3 bg-white rounded-full hover:scale-110 transition-transform shadow-xl text-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-[8px] font-black text-gray-900 uppercase tracking-widest">Active Asset</span>
                    </div>
                </div>
            )}
        </div>
    );
}
