"use client";

import { useState, useRef } from "react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2, CheckCircle2, Link as LinkIcon, ExternalLink, Info } from "lucide-react";

/**
 * Premium Image Upload Component (Enhanced)
 * Handles both direct-to-Cloudinary uploads and manual URL linking.
 * 
 * @param {string} value - Current image URL
 * @param {function} onChange - Callback when image is updated
 * @param {string} folder - Cloudinary folder (products, categories, collections, etc.)
 * @param {string} label - Input label
 * @param {string} className - Additional CSS classes
 */
export default function PremiumImageUpload({ 
    value, 
    onChange, 
    folder = "general", 
    label = "Upload Image",
    className 
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error'
    const [dragActive, setDragActive] = useState(false);
    const [mode, setMode] = useState("upload"); // "upload" | "link"
    const fileInputRef = useRef(null);

    const handleFile = async (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file");
            return;
        }

        setIsUploading(true);
        setUploadStatus(null);

        // Delete old image if it exists and is on Cloudinary
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
                setUploadStatus('success');
                setTimeout(() => setUploadStatus(null), 3000);
            }
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus('error');
            alert(error.response?.data?.error || "Upload failed.");
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
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        {label}
                    </label>
                    <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setMode("upload")}
                            className={cn(
                                "px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all",
                                mode === "upload" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("link")}
                            className={cn(
                                "px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all",
                                mode === "link" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            URL
                        </button>
                    </div>
                </div>
                {value && (
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
                            onChange("");
                        }}
                        className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                        <X className="w-3 h-3" /> Clear Asset
                    </button>
                )}
            </div>

            <div className="flex gap-6 items-start flex-col lg:flex-row">
                <div className="flex-1 w-full space-y-4">
                    {mode === "upload" ? (
                        <div 
                            className={cn(
                                "relative w-full min-h-[140px] rounded-[32px] border-2 border-dashed transition-all duration-300 group",
                                dragActive ? "border-blue-600 bg-blue-50/50 scale-[1.02]" : "border-gray-100 bg-gray-50/30 hover:border-blue-300 hover:bg-white",
                                isUploading && "opacity-50 pointer-events-none",
                                value && "border-solid border-blue-50 bg-blue-50/10"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                accept="image/*"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />

                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Syncing...</span>
                                    </div>
                                ) : uploadStatus === 'success' ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <CheckCircle2 className="w-8 h-8 text-green-500 animate-bounce" />
                                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Optimized & Saved</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className={cn(
                                            "w-12 h-12 rounded-full mb-4 flex items-center justify-center transition-all duration-500 shadow-sm",
                                            value ? "bg-blue-600 text-white" : "bg-white text-gray-300 group-hover:bg-blue-600 group-hover:text-white"
                                        )}>
                                            {value ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-900 mb-1">
                                            {value ? "Asset Linked" : "Drop asset or click"}
                                        </p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            Cloudinary Direct Push
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="url"
                                value={value?.includes('cloudinary.com') ? '' : (value || '')}
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    onChange(val);
                                    // Auto-sync removed - moved to backend Save event
                                }}
                                placeholder="Paste external link..."
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-sm focus:ring-8 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300"
                            />
                            <LinkIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-4">
                            <Info className="w-3 h-3 inline mr-1" /> External URLs will be automatically optimized on save
                        </p>
                    </div>
                    )}
                </div>

                {/* Preview Panel */}
                {value && (
                    <div className="w-full sm:w-[140px] aspect-square rounded-[32px] overflow-hidden border-4 border-white shadow-xl shadow-gray-200/50 bg-gray-50 flex-shrink-0 group relative">
                        <img 
                            src={value} 
                            alt="Asset preview" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/400?text=Invalid+Asset"; }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={value} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2 px-2">
                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                Edge Delivery Optimization Active
            </p>
        </div>
    );
}
