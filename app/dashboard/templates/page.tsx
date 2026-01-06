"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TemplateCreateInput, templateCreateSchema, TemplateUpdateInput, templateUpdateSchema } from "@/lib/zod/templates";
import { EmailTemplate } from "@/lib/types/types";


async function apiGetTemplates(): Promise<EmailTemplate[]> {
  const res = await fetch("/api/templates", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to load templates");
  return json.data as EmailTemplate[];
}

async function apiCreateTemplate(input: TemplateCreateInput): Promise<EmailTemplate> {
  const res = await fetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Create failed");
  return json.data as EmailTemplate;
}

async function apiUpdateTemplate(id: string, input: TemplateUpdateInput): Promise<EmailTemplate> {
  const res = await fetch(`/api/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Update failed");
  return json.data as EmailTemplate;
}

async function apiDeleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? "Delete failed");
  }
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [createForm, setCreateForm] = useState({ name: "", subject: "", body: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", subject: "", body: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const templatesQuery = useQuery<{ data: EmailTemplate[] }, Error>({
    queryKey: ["templates"],
    queryFn: async () => ({ data: await apiGetTemplates() }),
    staleTime: 30_000,
  });

  const templates = useMemo(() => templatesQuery.data?.data ?? [], [templatesQuery.data]);

  const createMut = useMutation({
    mutationFn: apiCreateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setCreateForm({ name: "", subject: "", body: "" });
      setErrorMsg(null);
    },
    onError: (e) => setErrorMsg((e as Error).message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TemplateUpdateInput }) =>
      apiUpdateTemplate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setEditId(null);
      setEditForm({ name: "", subject: "", body: "" });
      setErrorMsg(null);
    },
    onError: (e) => setErrorMsg((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: apiDeleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (e) => setErrorMsg((e as Error).message),
  });

  const onCreate = () => {
    const parsed = templateCreateSchema.safeParse(createForm);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    createMut.mutate(parsed.data);
  };

  const onStartEdit = (template: EmailTemplate) => {
    setEditId(template.id);
    setEditForm({ name: template.name, subject: template.subject, body: template.body });
  };

  const onSaveEdit = (id: string) => {
    const parsed = templateUpdateSchema.safeParse(editForm);
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    updateMut.mutate({ id, input: parsed.data });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Email Templates</h1>
      </header>

      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-medium">Create Template</h2>
        {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Template Name"
            value={createForm.name}
            onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
          />
          <input
            className="border rounded px-2 py-1"
            placeholder="Subject"
            value={createForm.subject}
            onChange={(e) => setCreateForm((s) => ({ ...s, subject: e.target.value }))}
          />
          <textarea
            className="border rounded px-2 py-1 md:col-span-4"
            placeholder="Body (use {{client_name}}, {{email}}, {{date}})"
            value={createForm.body}
            onChange={(e) => setCreateForm((s) => ({ ...s, body: e.target.value }))}
          />
        </div>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          onClick={onCreate}
          disabled={createMut.isPending}
        >
          {createMut.isPending ? "Creating…" : "Create"}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Your Templates</h2>
        {templatesQuery.isLoading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-600">No templates yet.</p>
        ) : (
          <ul className="space-y-2">
            {templates.map((template) => (
              <li key={template.id} className="border rounded p-3">
                {editId === template.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        className="border rounded px-2 py-1"
                        value={editForm.name}
                        onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                      />
                      <input
                        className="border rounded px-2 py-1"
                        value={editForm.subject}
                        onChange={(e) => setEditForm((s) => ({ ...s, subject: e.target.value }))}
                      />
                      <input
                        className="border rounded px-2 py-1"
                        value={editForm.body}
                        onChange={(e) => setEditForm((s) => ({ ...s, body: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                        onClick={() => onSaveEdit(template.id)}
                        disabled={updateMut.isPending}
                      >
                        {updateMut.isPending ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                        onClick={() => setEditId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-gray-600">Subject: {template.subject}</p>
                      <p className="text-sm text-gray-700">{template.body}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                        onClick={() => onStartEdit(template)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-red-50 text-red-600"
                        onClick={() => deleteMut.mutate(template.id)}
                        disabled={deleteMut.isPending}
                      >
                        {deleteMut.isPending ? "Deleting…" : "Delete"}
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
