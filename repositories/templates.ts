import { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/db/tables";
import { EmailTemplate } from "@/lib/types/types";



export class TemplatesRepository {
    constructor(private readonly db: SupabaseClient) { }

    async listByUser(userId: string): Promise<EmailTemplate[]> {
        const { data, error } = await this.db
            .from(TABLES.EMAIL_TEMPLATES)
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data as EmailTemplate[]) ?? [];
    }

    async createForUser(userId: string, input: Omit<EmailTemplate, "id" | "created_at" | "updated_at" | "user_id">) {
        const payload = { ...input, user_id: userId };
        const { data, error } = await this.db
            .from(TABLES.EMAIL_TEMPLATES)
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data as EmailTemplate;
    }

    async updateForUser(userId: string, id: string, input: Partial<Omit<EmailTemplate, "id" | "created_at" | "updated_at" | "user_id">>) {
        const { data, error } = await this.db
            .from(TABLES.EMAIL_TEMPLATES)
            .update({ ...input, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", userId)
            .select("*")
            .single();
        if (error) throw error;
        return data as EmailTemplate;
    }

    async removeForUser(userId: string, id: string): Promise<void> {
        const { error } = await this.db
            .from(TABLES.EMAIL_TEMPLATES)
            .delete()
            .eq("id", id)
            .eq("user_id", userId);
        if (error) throw error;
    }
}
