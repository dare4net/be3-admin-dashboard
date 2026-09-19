"use client";

import { Trash2 } from "lucide-react";
import ImageUploader from "./ImageUploader";

export default function CarouselImageEditor({ images = [], onChange }) {
    const handleAdd = () => onChange([...images, { url: '', alt: '' }]);
    const handleRemove = (index) => onChange(images.filter((_, i) => i !== index));
    const handleUpdate = (index, field, value) => {
        const newImages = [...images];
        newImages[index] = { ...newImages[index], [field]: value };
        onChange(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase">Carousel Images</label>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    ADD IMAGE
                </button>
            </div>
            {images.map((img, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 relative group animate-in slide-in-from-right-2">
                    <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200"
                    >
                        <Trash2 size={12} />
                    </button>
                    <div className="space-y-3">
                        <ImageUploader
                            label={`Image ${index + 1}`}
                            value={img.url}
                            onChange={(v) => handleUpdate(index, 'url', v)}
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Alt Text</label>
                            <input
                                type="text"
                                placeholder="e.g. Summer Collection Banner"
                                value={img.alt || ''}
                                onChange={(e) => handleUpdate(index, 'alt', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
