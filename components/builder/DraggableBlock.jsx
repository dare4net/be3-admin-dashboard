import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, Eye, EyeOff, ChevronRight, ChevronDown } from "lucide-react";
import { WIDGET_GROUPS } from "./SidebarLibrary";

export default function DraggableBlock({ widget, widgets = [], onEdit, onDelete, onToggleVisibility, dirtyWidgetIds }) {
    const [isExpanded, setIsExpanded] = useState(true);

    const isDirty = dirtyWidgetIds?.has(widget.id);

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
    const hasChildren = ['container', 'columns', 'grid', 'carousel_container', 'randomizer'].includes(widget.widget_type);
    const childWidgets = widgets.filter(w => w.parent_id === widget.id).sort((a, b) => a.sort_order - b.sort_order);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex flex-col gap-2"
        >
            <div
                className={`border rounded-xl p-4 flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-all border-l-4 ${!widget.is_active ? 'opacity-60 bg-gray-50' : 'border-l-blue-500'} ${isDirty ? 'ring-2 ring-amber-500/20 border-l-amber-500' : ''}`}
            >
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-move p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                >
                    <GripVertical size={20} />
                </div>

                <div className="flex-1 flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                        {def.icon}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 font-bold text-gray-900 truncate">
                            {widget.config?.adminLabel || def.name}
                            {isDirty && (
                                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-widest animate-pulse flex items-center gap-1 shadow-sm">
                                    <span className="w-1 h-1 bg-white rounded-full" />
                                    Unsaved
                                </span>
                            )}
                            {widget.config?.adminLabel && (
                                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-semibold">
                                    {def.name}
                                </span>
                            )}
                        </div>
                        {widget.config?.title && (
                            <span className="text-xs text-gray-500 truncate">
                                {typeof widget.config.title === 'object' ? widget.config.title.text : widget.config.title}
                            </span>
                        )}
                        {!widget.is_active && (
                            <div className="text-[10px] text-orange-600 font-bold uppercase tracking-tighter mt-0.5">Hidden</div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {hasChildren && childWidgets.length > 0 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-gray-100 rounded text-gray-500"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    )}
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

            {/* Nested Children */}
            {hasChildren && isExpanded && (
                <div className="ml-10 pl-6 border-l-2 border-dashed border-gray-200 py-2 flex flex-col gap-4 min-h-[50px]">
                    {childWidgets.length > 0 ? (
                        childWidgets.map(child => (
                            <DraggableBlock
                                key={child.id}
                                widget={child}
                                widgets={widgets}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleVisibility={onToggleVisibility}
                                dirtyWidgetIds={dirtyWidgetIds}
                            />
                        ))
                    ) : (
                        <div className="text-xs text-gray-400 italic py-2">
                            No widgets inside this container
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
