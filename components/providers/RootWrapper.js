"use client";

import { useAuth } from "@/components/providers/AuthContext";
import BrandedLoading from "@/components/ui/BrandedLoading";
import { useState, useEffect } from "react";

export default function RootWrapper({ children }) {
    const { minSplashActive, globalLoading, loadingMessage, user, loading } = useAuth();
    // LOADING SCREEN DISABLED - Always show content immediately
    const [isInternalVisible, setIsInternalVisible] = useState(false);

    // Visibility logic:
    // 1. Initial 3s Splash (minSplashActive) ALWAYS shows the loader.
    // 2. After 3s:
    //    - If loading user state (loading), keep loader.
    //    - If authenticated (user) AND globalLoading is true, keep loader.
    //    - Otherwise, show children.

    // useEffect(() => {
    //     const shouldShow = minSplashActive || loading || (!!user && globalLoading);
    //     setIsInternalVisible(shouldShow);
    // }, [minSplashActive, loading, user, globalLoading]);

    return (
        <>
            {/* {isInternalVisible && <BrandedLoading message={loadingMessage} />} */}
            <div className={isInternalVisible ? "hidden" : "block"}>
                {children}
            </div>
        </>
    );
}
