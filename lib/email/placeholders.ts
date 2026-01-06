export type PlaceholderVars = { client_name?: string; email?: string; date?: string };

export function applyPlaceholders(text: string, vars: PlaceholderVars): string {
  return text
    .replaceAll("{{client_name}}", vars.client_name ?? "")
    .replaceAll("{{email}}", vars.email ?? "")
    .replaceAll("{{date}}", vars.date ?? new Date().toISOString());
}
