"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientCreateSchema, clientUpdateSchema, type ClientCreateInput, type ClientUpdateInput } from "@/lib/zod/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Client } from "@/lib/types/types";



async function apiGetClients(): Promise<Client[]> {
    const res = await fetch("/api/clients", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load clients");
    return json.data as Client[];
}

async function apiCreateClient(input: ClientCreateInput): Promise<Client> {
    const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Create failed");
    return json.data as Client;
}

async function apiUpdateClient(id: string, input: ClientUpdateInput): Promise<Client> {
    const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Update failed");
    return json.data as Client;
}

async function apiDeleteClient(id: string): Promise<void> {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Delete failed");
    }
}

export default function ClientsPage() {
    const qc = useQueryClient();
    const [createForm, setCreateForm] = useState<ClientCreateInput>({ name: "", email: "", phone: undefined, notes: undefined });
    const [editId, setEditId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<ClientUpdateInput>({});
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const clientsQuery = useQuery<{ data: Client[] }, Error>({
        queryKey: ["clients"],
        queryFn: async () => ({ data: await apiGetClients() }),
        staleTime: 30_000,
    });

    const createMut = useMutation({
        mutationFn: (input: ClientCreateInput) => apiCreateClient(input),
        onMutate: async (input) => {
            setErrorMsg(null);
            await qc.cancelQueries({ queryKey: ["clients"] });
            const prev = qc.getQueryData<{ data: Client[] }>(["clients"]);
            const optimistic: Client = {
                id: `optimistic-${Date.now()}`,
                user_id: "me",
                name: input.name,
                email: input.email,
                phone: input.phone ?? null,
                notes: input.notes ?? null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            qc.setQueryData(["clients"], { data: [optimistic, ...(prev?.data ?? [])] });
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            setErrorMsg((err as Error).message);
            if (ctx?.prev) qc.setQueryData(["clients"], ctx.prev);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
        onSettled: () => {
            setCreateForm({ name: "", email: "", phone: undefined, notes: undefined });
        },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, input }: { id: string; input: ClientUpdateInput }) => apiUpdateClient(id, input),
        onMutate: async ({ id, input }) => {
            setErrorMsg(null);
            await qc.cancelQueries({ queryKey: ["clients"] });
            const prev = qc.getQueryData<{ data: Client[] }>(["clients"]);
            if (prev) {
                const next = prev.data.map((c) => (c.id === id ? { ...c, ...input, updated_at: new Date().toISOString() } : c));
                qc.setQueryData(["clients"], { data: next });
            }
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            setErrorMsg((err as Error).message);
            if (ctx?.prev) qc.setQueryData(["clients"], ctx.prev);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
        onSettled: () => {
            setEditId(null);
            setEditForm({});
        },
    });

    const deleteMut = useMutation({
        mutationFn: (id: string) => apiDeleteClient(id),
        onMutate: async (id) => {
            setErrorMsg(null);
            await qc.cancelQueries({ queryKey: ["clients"] });
            const prev = qc.getQueryData<{ data: Client[] }>(["clients"]);
            if (prev) {
                qc.setQueryData(["clients"], { data: prev.data.filter((c) => c.id !== id) });
            }
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            setErrorMsg((err as Error).message);
            if (ctx?.prev) qc.setQueryData(["clients"], ctx.prev);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
    });

    const onCreate = () => {
        const parsed = clientCreateSchema.safeParse(createForm);
        if (!parsed.success) {
            setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid input");
            return;
        }
        createMut.mutate(parsed.data);
    };

    const onStartEdit = (c: Client) => {
        setEditId(c.id);
        setEditForm({ name: c.name, email: c.email, phone: c.phone ?? undefined, notes: c.notes ?? undefined });
    };

    const onSaveEdit = (id: string) => {
        const parsed = clientUpdateSchema.safeParse(editForm);
        if (!parsed.success) {
            setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid input");
            return;
        }
        updateMut.mutate({ id, input: parsed.data });
    };

    const clients = clientsQuery.data?.data ?? [];

    return (
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
                        value={createForm.name}
                        onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
                        data-testid="client-name-input"
                    />
                    <input
                        className="border rounded px-2 py-1"
                        placeholder="Email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                        data-testid="client-email-input"
                    />
                    <input
                        className="border rounded px-2 py-1"
                        placeholder="Phone (optional)"
                        value={createForm.phone ?? ""}
                        onChange={(e) => setCreateForm((s) => ({ ...s, phone: e.target.value || undefined }))}
                    />
                    <input
                        className="border rounded px-2 py-1"
                        placeholder="Notes (optional)"
                        value={createForm.notes ?? ""}
                        onChange={(e) => setCreateForm((s) => ({ ...s, notes: e.target.value || undefined }))}
                    />
                </div>
                <button
                    type="button"
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                    onClick={onCreate}
                    disabled={createMut.isPending}
                    data-testid="create-client-button"
                >
                    {createMut.isPending ? "Creating…" : "Create"}
                </button>
            </section>

            <section className="space-y-3">
                <h2 className="font-medium" data-testid="clients-list-title">Your clients</h2>
                {clientsQuery.isLoading ? (
                    <p className="text-sm text-gray-600">Loading…</p>
                ) : clients.length === 0 ? (
                    <p className="text-sm text-gray-600">No clients yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {clients.map((c) => (
                            <li key={c.id} className="border rounded p-3">
                                {editId === c.id ? (
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                                        <input
                                            className="border rounded px-2 py-1"
                                            value={editForm.name ?? ""}
                                            onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                                        />
                                        <input
                                            className="border rounded px-2 py-1"
                                            value={editForm.email ?? ""}
                                            onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                                        />
                                        <input
                                            className="border rounded px-2 py-1"
                                            value={editForm.phone ?? ""}
                                            onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value || undefined }))}
                                        />
                                        <input
                                            className="border rounded px-2 py-1"
                                            value={editForm.notes ?? ""}
                                            onChange={(e) => setEditForm((s) => ({ ...s, notes: e.target.value || undefined }))}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                className="rounded-md border px-2 py-1 text-sm"
                                                onClick={() => onSaveEdit(c.id)}
                                                disabled={updateMut.isPending}
                                            >
                                                {updateMut.isPending ? "Saving…" : "Save"}
                                            </button>
                                            <button className="rounded-md border px-2 py-1 text-sm" onClick={() => setEditId(null)}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                                        <div>
                                            <p className="font-medium">{c.name}</p>
                                            <p className="text-sm text-gray-600">{c.email}</p>
                                        </div>
                                        <p className="text-sm">{c.phone ?? "-"}</p>
                                        <p className="text-sm">{c.notes ?? "-"}</p>
                                        <div className="flex gap-2">
                                            <button className="rounded-md border px-2 py-1 text-sm" onClick={() => onStartEdit(c)}>Edit</button>
                                            <button
                                                className="rounded-md border px-2 py-1 text-sm"
                                                onClick={() => deleteMut.mutate(c.id)}
                                                disabled={deleteMut.isPending && deleteMut.variables === c.id}
                                            >
                                                {deleteMut.isPending && deleteMut.variables === c.id ? "Deleting…" : "Delete"}
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
    );
}
