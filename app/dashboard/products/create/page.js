"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { 
    Folder, ChevronRight, ArrowLeft, X, Check 
} from "lucide-react";
import ProductForm from "@/components/products/ProductForm";

export default function CreateProductPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);

    // Workflow State
    const [step, setStep] = useState('category_selection'); // 'category_selection' | 'form'
    const [currentParentId, setCurrentParentId] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories');
            if (res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    const hasChildren = (catId) => {
        return categories.some(c => c.parent_id === catId);
    };

    const getChildren = (parentId) => {
        return categories.filter(c =>
            parentId === null ? !c.parent_id : c.parent_id === parentId
        );
    };

    const handleSelectCategory = (category) => {
        setSelectedCategory(category);
        setStep('form');
    };

    const handleCategoryClick = (category) => {
        if (hasChildren(category.id)) {
            setCurrentParentId(category.id);
        } else {
            handleSelectCategory(category);
        }
    };

    const handleBackUp = () => {
        if (currentParentId === null) return;
        const current = categories.find(c => c.id === currentParentId);
        setCurrentParentId(current ? (current.parent_id || null) : null);
    };

    // ------------------------------------------------------------------
    // RENDER: STEP 1 - CATEGORY SELECTION
    // ------------------------------------------------------------------
    if (step === 'category_selection') {
        const currentOptions = getChildren(currentParentId);
        const parentCategory = categories.find(c => c.id === currentParentId);

        return (
            <div className="w-full space-y-4 max-w-5xl mx-auto">
                <div className="flex flex-col gap-1 mb-6">
                    <h1 className="text-2xl font-black text-gray-900">Category Selection</h1>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Pick a classification context for your product</p>
                </div>

                <div className="bg-white rounded-[32px] shadow-none border border-gray-100 p-8 min-h-[400px]">
                    <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest overflow-x-auto whitespace-nowrap pb-2">
                        <button
                            onClick={() => setCurrentParentId(null)}
                            className={cn("hover:text-blue-600 transition", currentParentId === null ? 'text-gray-900' : 'text-gray-400')}
                        >
                            All Categories
                        </button>
                        {parentCategory && (
                            <>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <span className="text-gray-900">{parentCategory.name}</span>
                            </>
                        )}
                    </div>

                    {currentParentId !== null && (
                        <button onClick={handleBackUp} className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-700 mb-8 uppercase tracking-[0.2em] transition-all">
                            <ArrowLeft className="w-4 h-4" /> Return to Parent
                        </button>
                    )}

                    <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                        {currentOptions.map(cat => (
                            <div
                                key={cat.id}
                                className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all shadow-none"
                            >
                                <div
                                    onClick={() => handleCategoryClick(cat)}
                                    className="w-14 h-14 bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer shadow-sm"
                                >
                                    {cat.image_url ? (
                                        <img src={cat.image_url} className="w-full h-full object-cover rounded-2xl" alt="" />
                                    ) : (
                                        <Folder className="w-6 h-6" />
                                    )}
                                </div>

                                <div
                                    onClick={() => handleCategoryClick(cat)}
                                    className="flex-1 min-w-0 cursor-pointer"
                                >
                                    <span className="font-black text-sm text-gray-900 block truncate leading-tight group-hover:text-blue-600 transition-colors">{cat.name}</span>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                        {hasChildren(cat.id) ? 'Explore Sub-folders' : 'Select Direct context'}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSelectCategory(cat); }}
                                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-500/10"
                                        title="Select this category"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    {hasChildren(cat.id) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCategoryClick(cat); }}
                                            className="p-2.5 bg-white text-gray-400 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center border border-gray-100"
                                            title="View subcategories"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // RENDER: STEP 2 - MODERN PRODUCT FORM
    // ------------------------------------------------------------------
    return (
        <div className="w-full space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Finalize Product</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Context:</span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{selectedCategory?.name}</span>
                            <button 
                                onClick={() => setStep('category_selection')} 
                                className="text-[10px] font-black uppercase text-gray-300 hover:text-blue-600 underline tracking-[0.2em] transition-colors"
                            >
                                Change
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-3 text-gray-400 hover:text-gray-900 bg-white border border-gray-100 rounded-2xl transition-all shadow-sm"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <ProductForm 
                categoryId={selectedCategory?.id} 
                onSuccess={() => router.push("/dashboard/products")}
                onCancel={() => setStep('category_selection')}
            />
        </div>
    );
}
