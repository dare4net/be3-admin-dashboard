import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit2, Trash2, Eye, EyeOff, Copy, ChevronRight, ChevronDown, MoreVertical, ArrowUp, ArrowDown } from "lucide-react";
import { WIDGET_GROUPS } from "./SidebarLibrary";

export default function DraggableBlock({ widget, widgets = [], onEdit, onDelete, onDuplicate, onToggleVisibility, onMoveWidget, dirtyWidgetIds }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                className={`border rounded-xl p-3 flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-all border-l-4 ${!widget.is_active ? 'bg-gray-50/50' : 'border-l-blue-500'} ${isDirty ? 'ring-2 ring-amber-500/20 border-l-amber-500' : ''}`}
            >
                <div
                    {...attributes}
                    {...listeners}
                    className={`hidden md:flex cursor-move p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 ${!widget.is_active ? 'opacity-50' : ''}`}
                >
                    <GripVertical size={18} />
                </div>

                <div className={`flex-1 flex items-center gap-3 overflow-hidden ${!widget.is_active ? 'opacity-50' : ''}`}>
                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                        {def.icon}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 truncate">
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
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-1">
                        <button
                            onClick={() => onToggleVisibility(widget)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            title={widget.is_active ? 'Hide' : 'Show'}
                        >
                            {widget.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                            onClick={() => onDuplicate(widget)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Duplicate"
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            onClick={() => onEdit(widget)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(widget.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Expand/Collapse Button (Shared) */}
                    {hasChildren && childWidgets.length > 0 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                    )}

                    {/* Mobile "More" Menu */}
                    <div className="relative md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 rounded-lg transition-all ${isMenuOpen ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                            title="Actions"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[60]"
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[70] animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Canvas Actions</p>
                                        <p className="text-[11px] font-bold text-gray-900 truncate mt-0.5">{widget.config?.adminLabel || def.name}</p>
                                    </div>
                                    <button
                                        onClick={() => { onToggleVisibility(widget); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                    >
                                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50">
                                            {widget.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </div>
                                        <span>{widget.is_active ? 'Hide Widget' : 'Show Widget'}</span>
                                    </button>
                                    <div className="h-px bg-gray-50 my-1 mx-4" />
                                    <button
                                        onClick={() => { onMoveWidget(widget.id, 'up'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                    >
                                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50">
                                            <ArrowUp size={14} />
                                        </div>
                                        <span>Move Up</span>
                                    </button>
                                    <button
                                        onClick={() => { onMoveWidget(widget.id, 'down'); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                    >
                                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50">
                                            <ArrowDown size={14} />
                                        </div>
                                        <span>Move Down</span>
                                    </button>
                                    <div className="h-px bg-gray-50 my-1 mx-4" />
                                    <button
                                        onClick={() => { onDuplicate(widget); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors"
                                    >
                                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-green-50">
                                            <Copy size={14} />
                                        </div>
                                        <span>Duplicate</span>
                                    </button>
                                    <button
                                        onClick={() => { onEdit(widget); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                    >
                                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50">
                                            <Edit2 size={14} />
                                        </div>
                                        <span>Edit Settings</span>
                                    </button>
                                    <div className="h-px bg-gray-50 my-1 mx-4" />
                                    <button
                                        onClick={() => { onDelete(widget.id); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <div className="p-1.5 bg-red-50 rounded-lg">
                                            <Trash2 size={14} />
                                        </div>
                                        <span>Remove Widget</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
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
                                onDuplicate={onDuplicate}
                                onToggleVisibility={onToggleVisibility}
                                onMoveWidget={onMoveWidget}
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
