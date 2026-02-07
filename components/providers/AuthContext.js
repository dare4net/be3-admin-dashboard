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
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on mount
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            const permsData = localStorage.getItem('permissions');
            const rolesData = localStorage.getItem('roles');
            const categoriesData = localStorage.getItem('allowedCategories');
            const unrestrictedAccess = localStorage.getItem('hasUnrestrictedCategoryAccess');

            if (token && userData) {
                setUser(JSON.parse(userData));

                if (permsData) {
                    try {
                        setPermissions(JSON.parse(permsData));
                    } catch (e) {
                        setPermissions([]);
                    }
                }

                if (rolesData) {
                    try {
                        setRoles(JSON.parse(rolesData));
                    } catch (e) {
                        setRoles([]);
                    }
                }

                if (categoriesData) {
                    try {
                        setAllowedCategories(JSON.parse(categoriesData));
                    } catch (e) {
                        setAllowedCategories([]);
                    }
                }

                if (unrestrictedAccess !== null) {
                    setHasUnrestrictedCategoryAccess(unrestrictedAccess === 'true');
                }
            }
            setLoading(false);
        }
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

    return (
        <AuthContext.Provider value={{
            user,
            permissions,
            roles,
            allowedCategories,
            hasUnrestrictedCategoryAccess,
            loading,
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
