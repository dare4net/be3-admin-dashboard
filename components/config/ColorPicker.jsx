// Color Picker Component - Native HTML5 color input
'use client';

export default function ColorPicker({ label, value, onChange }) {
    return (
        <div className="space-y-1">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            <div className="flex items-center gap-2">
                {/* Native HTML5 color picker */}
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-16 rounded border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                />

                {/* Hex display */}
                <input
                    type="text"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm uppercase"
                    maxLength={7}
                />
            </div>
        </div>
    );
}
