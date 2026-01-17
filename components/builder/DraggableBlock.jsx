import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { WIDGET_GROUPS } from "./SidebarLibrary";

export default function DraggableBlock({ widget, onEdit, onDelete, onToggleVisibility }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: widget.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    // Find widget definition to get name/icon
    const findWidgetDef = (type) => {
        for (const group of WIDGET_GROUPS) {
            const found = group.widgets.find(w => w.type === type);
            if (found) return found;
        }
        return { name: type, icon: null };
    };

    const def = findWidgetDef(widget.widget_type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`border rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow ${!widget.is_active ? 'opacity-60 bg-gray-50' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-move p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
                <GripVertical size={20} />
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                    <span className="text-gray-500">{def.icon}</span>
                    {def.name}
                    {widget.config?.title && (
                        <span className="text-sm font-normal text-gray-500">
                            - {typeof widget.config.title === 'object' ? widget.config.title.text : widget.config.title}
                        </span>
                    )}
                </div>
                {!widget.is_active && (
                    <div className="text-xs text-orange-600 font-medium mt-1">Hidden</div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onToggleVisibility(widget)}
                    className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                    title={widget.is_active ? 'Hide' : 'Show'}
                >
                    {widget.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                    onClick={() => onEdit(widget)}
                    className="p-2 hover:bg-gray-100 rounded text-blue-600 hover:bg-blue-50"
                    title="Edit"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onDelete(widget.id)}
                    className="p-2 hover:bg-gray-100 rounded text-red-600 hover:bg-red-50"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
