"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on mount
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            const permsData = localStorage.getItem('permissions');

            if (token && userData) {
                setUser(JSON.parse(userData));
                if (permsData) {
                    try {
                        setPermissions(JSON.parse(permsData));
                    } catch (e) {
                        setPermissions([]);
                    }
                }
            }
            setLoading(false);
        }
    }, []);

    const login = (token, userData, userPerms = [], refreshToken = null) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('permissions', JSON.stringify(userPerms));
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        setUser(userData);
        setPermissions(userPerms);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        setUser(null);
        setPermissions([]);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ user, permissions, loading, login, logout }}>
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
