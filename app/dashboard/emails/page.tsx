"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { applyPlaceholders } from "@/lib/email/placeholders";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Client, EmailTemplate } from "@/lib/types/types";
import { SendEmailInput } from "@/lib/zod/email";

async function apiGetClients(): Promise<Client[]> {
    const res = await fetch("/api/clients", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load clients");
    return json.data as Client[];
}

async function apiSendEmails(input: SendEmailInput) {
    const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Send failed");
    return json.data as { sent: number; total: number; results: { email: string; success: boolean; error?: string }[] };
}

async function apiGetTemplates(): Promise<EmailTemplate[]> {
    const res = await fetch("/api/templates", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load templates");
    return json.data as EmailTemplate[];
}

export default function EmailsPage() {
    const clientsQuery = useQuery<{ data: Client[] }, Error>({
        queryKey: ["clients"],
        queryFn: async () => ({ data: await apiGetClients() }),
        staleTime: 30_000,
    });

    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const clients = clientsQuery.data?.data ?? [];
    const allSelected = clients.length > 0 && clients.every((client) => selected[client.id]);
    const selectedEmails = useMemo(() => clients.filter((client: Client) => selected[client.id]).map((client) => ({ email: client.email, name: client.name })), [clients, selected]);

    const templatesQuery = useQuery<{ data: EmailTemplate[] }, Error>({
        queryKey: ["templates"],
        queryFn: async () => ({ data: await apiGetTemplates() }),
        staleTime: 60_000,
    });

    const templates = useMemo(() => templatesQuery.data?.data ?? [], [templatesQuery.data]);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const selectedTemplate = useMemo(
        () => templates.find((t) => t.id === selectedTemplateId),
        [templates, selectedTemplateId]
    );

    const sendMutation = useMutation({
        mutationFn: async () => {
            // If a template is selected, or if we want placeholders, build per-recipient items
            if (selectedTemplate || true) {
                const items = selectedEmails.map((client) => {
                    const vars = { client_name: client.name, email: client.email, date: new Date().toISOString() };
                    const subj = applyPlaceholders(selectedTemplate ? selectedTemplate.subject : subject, vars);
                    const bod = applyPlaceholders(selectedTemplate ? selectedTemplate.body : body, vars);
                    return { email: client.email, subject: subj, body: bod };
                });
                const res = await fetch("/api/emails/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? "Send failed");
                return json.data as { sent: number; total: number; results: { email: string; success: boolean; error?: string }[] };
            }
            return apiSendEmails({ recipients: selectedEmails, subject, body });
        },
    });

    const toggleAll = () => {
        if (allSelected) {
            setSelected({});
        } else {
            const next: Record<string, boolean> = {};
            for (const c of clients) next[c.id] = true;
            setSelected(next);
        }
    };

    const canSend = selectedEmails.length > 0 && subject.trim().length > 0 && body.trim().length > 0;

    return (
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
                            disabled={!canSend || sendMutation.isPending}
                            onClick={() => {
                                setErrorMsg(null);
                                sendMutation.mutate(undefined, {
                                    onError: (e) => setErrorMsg((e as Error).message),
                                });
                            }}
                        >
                            {sendMutation.isPending ? "Sending…" : "Send"}
                        </button>
                    </div>
                </header>

                <section className="space-y-3">
                    <h2 className="font-medium">Recipients</h2>
                    <div className="flex items-center gap-2">
                        <button className="rounded-md border px-2 py-1 text-sm" onClick={toggleAll} disabled={clientsQuery.isLoading}>
                            {allSelected ? "Unselect all" : "Select all"}
                        </button>
                        <span className="text-sm text-gray-600">{selectedEmails.length} selected</span>
                    </div>
                    {clientsQuery.isLoading ? (
                        <p className="text-sm text-gray-600">Loading clients…</p>
                    ) : clients.length === 0 ? (
                        <p className="text-sm text-gray-600">No clients.</p>
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {clients.map((client) => (
                                <li key={client.id} className="border rounded p-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!!selected[client.id]}
                                        onChange={(e) => setSelected((select) => ({ ...select, [client.id]: e.target.checked }))}
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
                    <div className="flex items-center gap-2">
                        <label className="text-sm">Template:</label>
                        <select
                            className="border rounded px-2 py-1"
                            value={selectedTemplateId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setSelectedTemplateId(id);
                                const tpl = templates.find((t) => t.id === id);
                                if (tpl) {
                                    setSubject(tpl.subject);
                                    setBody(tpl.body);
                                }
                            }}
                        >
                            <option value="">(none)</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <input
                        className="border rounded px-2 py-1 w-full"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />
                    <textarea
                        className="border rounded px-2 py-1 w-full h-40"
                        placeholder="Message body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                    />
                </section>

                {previewOpen && (
                    <section className="space-y-3">
                        <h2 className="font-medium">Preview</h2>
                        <div className="border rounded p-3 space-y-3">
                            <p className="text-sm text-gray-600">To: {selectedEmails.map((r) => r.email).join(", ") || "(none)"}</p>
                            {(selectedEmails.slice(0, 3)).map((r) => {
                                const vars = { client_name: r.name, email: r.email, date: new Date().toISOString() };
                                const subj = applyPlaceholders(subject || "", vars);
                                const bod = applyPlaceholders(body || "", vars);
                                return (
                                    <div key={r.email} className="border rounded p-2">
                                        <p className="text-xs text-gray-600">Preview for {r.email}</p>
                                        <p className="font-medium">{subj || "(no subject)"}</p>
                                        <pre className="whitespace-pre-wrap text-sm mt-1">{bod || "(empty body)"}</pre>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {sendMutation.data && (
                    <section className="space-y-2">
                        <h2 className="font-medium">Result</h2>
                        <p className="text-sm text-gray-700">
                            Sent {sendMutation.data.sent}/{sendMutation.data.total}
                        </p>
                        {sendMutation.data.results.some((r) => !r.success) && (
                            <ul className="text-sm text-red-600 list-disc pl-5">
                                {sendMutation.data.results
                                    .filter((r) => !r.success)
                                    .map((r) => (
                                        <li key={r.email}>
                                            {r.email}: {r.error}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </section>
                )}
            </div>
    );
}
