"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to login by default
        router.push("/auth/login");
    }, [router]);

    return null;
}
