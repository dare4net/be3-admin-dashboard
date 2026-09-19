"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";


const SocketContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function SocketProvider({ children }) {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Admin AuthContext doesn't expose token — read from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!token || !user?.id) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        if (socketRef.current?.connected) return;

        const s = io(API_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 5,
        });

        s.on("connect", () => {
            console.log("[AdminSocket] Connected:", s.id);
            s.emit("join:user", user.id);
        });

        s.on("disconnect", (reason) => {
            console.log("[AdminSocket] Disconnected:", reason);
        });

        s.on("connect_error", (err) => {
            console.warn("[AdminSocket] Connection error:", err.message);
        });

        socketRef.current = s;
        setSocket(s);

        return () => {
            s.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, [user?.id]); // re-run when user changes (login/logout)

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
