import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Admin Dashboard",
    description: "Manage your eCommerce store",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
