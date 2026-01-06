"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function EmailsPage() {
    const [isPending, setIsPending] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const clients: any[] = [{
        id: 3,
        email: "bobo"
    }]

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Send Emails</h1>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="rounded-md border px-3 py-1.5 text-sm"
                            onClick={() => setPreviewOpen((v) => !v)}
                        >
                            {previewOpen ? "Hide preview" : "Show preview"}
                        </button>
                        <button
                            type="button"
                            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                        >
                            {isPending ? "Sending…" : "Send"}
                        </button>
                    </div>
                </header>

                <section className="space-y-3">
                    <h2 className="font-medium">Recipients</h2>
                    <div className="flex items-center gap-2">
                        <button className="rounded-md border px-2 py-1 text-sm" disabled={isPending}>
                            Unselect all
                        </button>
                        <span className="text-sm text-gray-600">3 selected</span>
                    </div>
                    {isPending ? (
                        <p className="text-sm text-gray-600">Loading clients…</p>
                    ) : clients.length === 0 ? (
                        <p className="text-sm text-gray-600">No clients.</p>
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {clients.map((client) => (
                                <li key={client.id} className="border rounded p-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                    />
                                    <div>
                                        <p className="font-medium">{client.name}</p>
                                        <p className="text-sm text-gray-600">{client.email}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="font-medium">Compose</h2>
                    {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
                    <input
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Subject"
                    />
                    <textarea
                        className="border rounded px-2 py-1 w-full h-40"
                        placeholder="Message body"
                    />
                </section>

                {previewOpen && (
                    <section className="space-y-3">
                        <h2 className="font-medium">Preview</h2>
                        <div className="border rounded p-3 space-y-3">
                            <p className="text-sm text-gray-600"> here</p>
                            <div className="border rounded p-2">
                                <p className="text-xs text-gray-600">Preview for john</p>
                                <p className="font-medium">hehe</p>
                                <pre className="whitespace-pre-wrap text-sm mt-1">Hello john</pre>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </DashboardLayout>
    );
}
