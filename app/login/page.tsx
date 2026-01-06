"use client";

import { redirect } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const handleSignIn = () => {
        console.log("Clicked");
        redirect("/dashboard")
    }

    return (
        <main className="min-h-dvh flex items-center justify-center p-6">
            <div className="max-w-sm w-full border rounded-lg p-6 shadow-sm">
                <h1 className="text-xl font-semibold mb-4">Sign in</h1>
                <p className="text-sm text-muted-foreground mb-6">
                    Continue with your Google account to proceed.
                </p>
                <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md bg-black text-white hover:opacity-90 disabled:opacity-60 px-4 py-2 w-full mb-3"
                >
                    {loading ? "Redirecting…" : "Sign in with Google"}
                </button>
            </div>
        </main>
    );
}
