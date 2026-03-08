import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LayoutTemplate } from "lucide-react";

export default function BuilderCanvas({ widgets, children, previewMode = 'desktop' }) {
    const { setNodeRef } = useDroppable({
        id: 'canvas-root',
    });

    const getWidthClass = () => {
        switch (previewMode) {
            case 'mobile': return 'max-w-xs'; // ~320px
            case 'tablet': return 'max-w-2xl'; // ~672px
            default: return 'max-w-6xl'; // Increased from 5xl
        }
    };

    return (
        <div
            ref={setNodeRef}
            className="flex-1 bg-gray-100/30 overflow-y-auto p-2 md:p-6 transition-all duration-500 ease-in-out scroll-smooth"
        >
            <div className={`${getWidthClass()} mx-auto min-h-[calc(100vh-160px)] bg-white rounded-[1.5rem] shadow-2xl shadow-gray-200/40 border border-white p-4 md:p-8 transition-all duration-500 ease-in-out relative ring-4 ring-gray-100/10`}>
                {/* Device Frame Indicator (Optional) */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-20">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>

                {widgets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl py-20 px-4 text-center">
                        <LayoutTemplate size={48} className="mb-4 text-gray-200" />
                        <p className="text-sm">Drag widgets here or click the library to start building</p>
                    </div>
                ) : (
                    <SortableContext
                        items={widgets.map(w => w.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {children}
                        </div>
                    </SortableContext>
                )}
            </div>
        </div>
    );
}
