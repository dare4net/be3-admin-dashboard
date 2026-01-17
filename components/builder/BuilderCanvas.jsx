import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function BuilderCanvas({ widgets, children }) {
    const { setNodeRef } = useDroppable({
        id: 'canvas-root',
    });

    return (
        <div
            ref={setNodeRef}
            className="flex-1 bg-gray-100 overflow-y-auto p-8"
        >
            <div className="max-w-4xl mx-auto min-h-[500px] bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                {widgets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg py-20">
                        <p>Drag widgets here or click the sidebar to add</p>
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
