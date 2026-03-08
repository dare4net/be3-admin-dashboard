import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthContext";

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
                    <RootWrapper>
                        {children}
                    </RootWrapper>
                </AuthProvider>
            </body>
        </html>
    );
}
