// Image Uploader Component with preview and URL input
'use client';

import { useState } from 'react';
import { Upload, X, ExternalLink } from 'lucide-react';

export default function ImageUploader({ label, value, onChange, aspectRatio }) {
    const [dragActive, setDragActive] = useState(false);
    const [urlMode, setUrlMode] = useState(true);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            onChange(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            {/* Toggle between URL and Upload */}
            <div className="flex gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setUrlMode(true)}
                    className={`px-3 py-1 text-xs font-medium rounded ${urlMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    URL
                </button>
                <button
                    type="button"
                    onClick={() => setUrlMode(false)}
                    className={`px-3 py-1 text-xs font-medium rounded ${!urlMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    Upload
                </button>
            </div>

            {/* URL Input Mode */}
            {urlMode ? (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            ) : (
                /* Upload Mode */
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                        Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF up to 10MB
                    </p>
                </div>
            )}

            {/* Image Preview */}
            {value && (
                <div className="relative group">
                    <img
                        src={value}
                        alt="Preview"
                        className="w-full rounded-lg border border-gray-200"
                        style={{ aspectRatio: aspectRatio || 'auto' }}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="p-2 bg-white rounded-full hover:bg-red-50 text-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
