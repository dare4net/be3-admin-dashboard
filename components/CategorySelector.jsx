"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { ChevronRight, ChevronDown, Check, Square, MinusSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";

export default function CategorySelector({ selectedIds = [], onChange }) {
    // State for the category tree
    const [nodes, setNodes] = useState([]); // Array of root nodes
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(new Set());
    const [nodeChildren, setNodeChildren] = useState({}); // Map<categoryId, [childNode]>

    useEffect(() => {
        fetchTopLevel();
    }, []);

    const fetchTopLevel = async () => {
        try {
            setLoading(true);
            const res = await api.get("/products/categories/top-level");
            if (res.data.success) {
                setNodes(res.data.categories);
            }
        } catch (error) {
            console.error("Failed to fetch top level categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChildren = async (parentId) => {
        if (nodeChildren[parentId]) return nodeChildren[parentId]; // Return cache if exists

        try {
            const res = await api.get(`/products/categories/${parentId}/children`);
            if (res.data.success) {
                const children = res.data.categories;
                setNodeChildren(prev => ({ ...prev, [parentId]: children }));
                return children;
            }
        } catch (error) {
            console.error(`Failed to fetch children for ${parentId}:`, error);
            return [];
        }
        return [];
    };

    const toggleExpand = async (e, category) => {
        e.stopPropagation();
        const newExpanded = new Set(expanded);
        if (newExpanded.has(category.id)) {
            newExpanded.delete(category.id);
        } else {
            newExpanded.add(category.id);
            // Lazy load children if needed
            if (!nodeChildren[category.id] && category.subcategory_count > 0) {
                await fetchChildren(category.id);
            }
        }
        setExpanded(newExpanded);
    };

    // Recursive helper to collect all descendant IDs (async because it might need to fetch)
    const getAllDescendantIds = async (category) => {
        let ids = [category.id];

        // If we know there are children...
        if (category.subcategory_count > 0) {
            // Get children (fetch if necessary to select them)
            const children = await fetchChildren(category.id);
            for (const child of children) {
                const childIds = await getAllDescendantIds(child);
                ids = [...ids, ...childIds];
            }
        }
        return ids;
    };

    const handleSelect = async (category, isSelected) => {
        let newSelected = [...selectedIds];

        if (isSelected) {
            // Uncheck: Remove self and ALL descendants (if they are currently selected)
            // We only need to remove known IDs, or strictly loaded ones.
            // Actually, for strict correctness, we should remove ANY ID that is a descendant.
            // But we might not know them all if not loaded.
            // Heuristic: Remove self. 
            // If the user hasn't loaded 'Children', they can't have selected 'Children' (unless selected previously by API).
            // ISSUE: A user might have pre-existing permissions for a deep child.
            // If we uncheck parent, should we maintain deep child?
            // "unless you explicitly deselect it". This usually implies unchecking parent clears children.
            // We will do a best effort to clean up known children.

            const removeRecursive = (catId) => {
                newSelected = newSelected.filter(id => id !== catId);
                const children = nodeChildren[catId] || [];
                children.forEach(c => removeRecursive(c.id));
            };
            removeRecursive(category.id);
        } else {
            // Check: Add self and ALL descendants. 
            // This REQUIRES fetching them if not loaded.
            const userWantsToSelect = confirm(`Select ${category.name} and all its subcategories?`);
            if (!userWantsToSelect) {
                // Just select self? Or cancel?
                // Per requirement: "if you select a category, all it s subs gets selected too"
                // Let's assume automatic cascade.
                newSelected.push(category.id);
            } else {
                // Fetch and select tree
                const allIds = await getAllDescendantIds(category);
                // Add unique
                const set = new Set([...newSelected, ...allIds]);
                newSelected = Array.from(set);
            }
        }
        onChange(newSelected);
    };

    // Simpler Handler: Just select self, let user expand to select others? 
    // Requirement: "if you select a category, all it s subs gets selected too unless you explicitly deselect it"
    // So YES, cascade select is required.

    // Improved Handler avoiding confirm dialog
    const toggleSelection = async (category) => {
        const isSelected = selectedIds.includes(category.id);

        if (isSelected) {
            // Deselecting: Remove self.
            // Also remove known children? 
            // The user expectation "unless you explicitly deselect it" works both ways. 
            // Unchecking parent usually unchecks children.
            let idsToRemove = new Set([category.id]);

            // Helper to gather known children to remove
            const gatherKnownChildren = (catId) => {
                if (nodeChildren[catId]) {
                    nodeChildren[catId].forEach(child => {
                        idsToRemove.add(child.id);
                        gatherKnownChildren(child.id);
                    });
                }
            };
            gatherKnownChildren(category.id);

            const newSelected = selectedIds.filter(id => !idsToRemove.has(id));
            onChange(newSelected);
        } else {
            // Selecting: Select self and cascade load+select children
            // We show a loading indicator on the node if we are fetching?
            // For now, simple async/await blocking (UI might freeze slightly or we need local loading state)

            let idsToAdd = [category.id];

            if (category.subcategory_count > 0) {
                // We must fetch to know IDs
                const children = await fetchChildren(category.id);

                // Recursively fetch/collect for interaction
                // We can use a queue or recursive func
                const collect = async (cats) => {
                    for (const c of cats) {
                        idsToAdd.push(c.id);
                        if (c.subcategory_count > 0) {
                            const grandChildren = await fetchChildren(c.id);
                            await collect(grandChildren);
                        }
                    }
                };
                await collect(children);
            }

            const newSet = new Set([...selectedIds, ...idsToAdd]);
            onChange(Array.from(newSet));
        }
    };

    const TreeNode = ({ category, level = 0 }) => {
        const hasChildren = category.subcategory_count > 0;
        const isExpanded = expanded.has(category.id);
        const isSelected = selectedIds.includes(category.id);
        const children = nodeChildren[category.id] || [];

        return (
            <div className="select-none">
                <div
                    className={cn(
                        "flex items-center py-1 px-2 hover:bg-gray-100 rounded-md cursor-pointer group",
                        isSelected && "bg-blue-50"
                    )}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => toggleSelection(category)}
                >
                    {/* Expand Toggle */}
                    <div
                        className={cn(
                            "mr-2 p-0.5 rounded-sm hover:bg-gray-200 text-gray-500",
                            !hasChildren && "invisible"
                        )}
                        onClick={(e) => toggleExpand(e, category)}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>

                    {/* Checkbox Icon */}
                    <div className={cn(
                        "mr-2 w-4 h-4 border rounded-sm flex items-center justify-center transition-colors",
                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white group-hover:border-gray-400"
                    )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    <span className={cn("text-sm", isSelected ? "text-blue-900 font-medium" : "text-gray-700")}>
                        {category.name}
                    </span>

                    {hasChildren && (
                        <span className="ml-2 text-xs text-gray-400">
                            ({category.subcategory_count})
                        </span>
                    )}
                </div>

                {/* Children */}
                {isExpanded && (
                    <div className="mt-1">
                        {children.length > 0 ? (
                            children.map(child => (
                                <TreeNode key={child.id} category={child} level={level + 1} />
                            ))
                        ) : (
                            // Loading state for children
                            <div className="py-1 pl-8 text-xs text-gray-400 flex items-center">
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Loading subcategories...
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden flex flex-col h-[300px]">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                    {selectedIds.length === 0
                        ? "Unrestricted Access (All Categories)"
                        : `${selectedIds.length} categories selected`}
                </span>

                {selectedIds.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange([])}
                        className="h-7 text-xs text-gray-500 hover:text-red-600"
                    >
                        Clear Selection
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 p-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">Loading category tree...</span>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {nodes.map(node => (
                            <TreeNode key={node.id} category={node} />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
