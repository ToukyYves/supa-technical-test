"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";

export type Client = {
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};


export default function ClientsPage() {

    const [isLoading, setIsLoading] = useState(false)
    const [isPending, setIsPending] = useState(true)
    const clients: Client[] = []
    const editId = ""
    const errorMsg = "put the error mess here";


    return (
        <DashboardLayout>
            <div className="space-y-6">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Clients</h1>
                </header>

                <section className="border rounded-lg p-4 space-y-3">
                    <h2 className="font-medium" data-testid="create-client-title">Create client</h2>
                    {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                            className="border rounded px-2 py-1"
                            placeholder="Name"
                            data-testid="client-name-input"
                        />
                        <input
                            className="border rounded px-2 py-1"
                            placeholder="Email"
                            data-testid="client-email-input"
                        />
                        <input
                            className="border rounded px-2 py-1"
                            placeholder="Phone (optional)"
                        />
                        <input
                            className="border rounded px-2 py-1"
                            placeholder="Notes (optional)"
                        />
                    </div>
                    <button
                        type="button"
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                        data-testid="create-client-button"
                    >
                        Create
                    </button>
                </section>

                <section className="space-y-3">
                    <h2 className="font-medium" data-testid="clients-list-title">Your clients</h2>
                    {isLoading ? (
                        <p className="text-sm text-gray-600">Loading…</p>
                    ) : clients.length === 0 ? (
                        <p className="text-sm text-gray-600">No clients yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {clients.map((client) => (
                                <li key={client.id} className="border rounded p-3">
                                    {editId === client.id ? (
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                                            <input
                                                className="border rounded px-2 py-1"
                                            />
                                            <input
                                                className="border rounded px-2 py-1"
                                            />
                                            <input
                                                className="border rounded px-2 py-1"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    className="rounded-md border px-2 py-1 text-sm"
                                                >
                                                    {isPending ? "Saving…" : "Save"}
                                                </button>
                                                <button className="rounded-md border px-2 py-1 text-sm">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                                            <div>
                                                <p className="font-medium">Hello</p>
                                                <p className="text-sm text-gray-600">Here</p>
                                            </div>
                                            <p className="text-sm">"-"</p>
                                            <div className="flex gap-2">
                                                <button className="rounded-md border px-2 py-1 text-sm" >Edit</button>
                                                <button
                                                    className="rounded-md border px-2 py-1 text-sm"
                                                    disabled={isPending}
                                                >
                                                    {isPending ? "Deleting…" : "Delete"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
