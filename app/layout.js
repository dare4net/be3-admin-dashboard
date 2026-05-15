import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthContext";
import { SocketProvider } from "@/components/providers/SocketContext";
import { Toaster } from "react-hot-toast";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata = {
    title: "Admin Dashboard",
    description: "Manage your eCommerce store",
};

import RootWrapper from "@/components/providers/RootWrapper";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={manrope.className}>
                <AuthProvider>
                    <SocketProvider>
                        <RootWrapper>
                            {children}
                        </RootWrapper>
                        <Toaster position="top-right" />
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
