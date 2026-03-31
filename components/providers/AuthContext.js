"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [allowedCategories, setAllowedCategories] = useState([]);
    const [hasUnrestrictedCategoryAccess, setHasUnrestrictedCategoryAccess] = useState(true);
    const [loading, setLoading] = useState(true); // Default to true to prevent race condition
    const [minSplashActive, setMinSplashActive] = useState(true); // Default to true for branding
    const router = useRouter();

    useEffect(() => {
        // Enforce branding visibility
        const timer = setTimeout(() => setMinSplashActive(false), 2000);

        // Check if user is logged in on mount
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            const permsData = localStorage.getItem('permissions');
            const rolesData = localStorage.getItem('roles');
            const categoriesData = localStorage.getItem('allowedCategories');
            const unrestrictedAccess = localStorage.getItem('hasUnrestrictedCategoryAccess');

            if (token && userData) {
                try {
                    setUser(JSON.parse(userData));
                    if (permsData) setPermissions(JSON.parse(permsData));
                    if (rolesData) setRoles(JSON.parse(rolesData));
                    if (categoriesData) setAllowedCategories(JSON.parse(categoriesData));
                    if (unrestrictedAccess !== null) setHasUnrestrictedCategoryAccess(unrestrictedAccess === 'true');
                } catch (e) {
                    console.error("Auth initialization error:", e);
                    logout(); // Clear potentially corrupted data
                }
            }
            setLoading(false); // Signal that initial auth check is complete
        }

        return () => clearTimeout(timer);
    }, []);

    const login = (token, userData, userPerms = [], userRoles = [], categories = [], unrestrictedAccess = true, refreshToken = null) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('permissions', JSON.stringify(userPerms));
        localStorage.setItem('roles', JSON.stringify(userRoles));
        localStorage.setItem('allowedCategories', JSON.stringify(categories));
        localStorage.setItem('hasUnrestrictedCategoryAccess', String(unrestrictedAccess));

        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }

        setUser(userData);
        setPermissions(userPerms);
        setRoles(userRoles);
        setAllowedCategories(categories);
        setHasUnrestrictedCategoryAccess(unrestrictedAccess);

        // Flag to skip the dashboard-data splash screen immediately after login
        sessionStorage.setItem('skip-dashboard-splash', 'true');

        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        localStorage.removeItem('roles');
        localStorage.removeItem('allowedCategories');
        localStorage.removeItem('hasUnrestrictedCategoryAccess');

        setUser(null);
        setPermissions([]);
        setRoles([]);
        setAllowedCategories([]);
        setHasUnrestrictedCategoryAccess(true);
        router.push('/auth/login');
    };

    const [globalLoading, setGlobalLoading] = useState(false); // DISABLED - prevents all loading screens
    const [loadingMessage, setLoadingMessage] = useState("Preparing Dashboard...");

    return (
        <AuthContext.Provider value={{
            user,
            permissions,
            roles,
            allowedCategories,
            hasUnrestrictedCategoryAccess,
            loading,
            minSplashActive,
            globalLoading,
            setGlobalLoading,
            loadingMessage,
            setLoadingMessage,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
