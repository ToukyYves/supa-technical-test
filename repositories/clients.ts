import { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/db/tables";
import { Client } from "@/lib/types/types";


export class ClientsRepository {
    private readonly db: SupabaseClient;

    constructor(db: SupabaseClient) {
        this.db = db;
    }

    async listByUser(userId: string) {
        const { data, error } = await this.db
            .from(TABLES.CLIENTS)
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data as Client[]) ?? [];
    }

    async createForUser(userId: string, input: Omit<Client, "id" | "created_at" | "updated_at" | "user_id">) {
        const payload = { ...input, user_id: userId };
        const { data, error } = await this.db
            .from(TABLES.CLIENTS)
            .insert(payload)
            .select("*")
            .single();
        if (error) throw error;
        return data as Client;
    }

    async updateForUser(userId: string, id: string, input: Partial<Omit<Client, "id" | "created_at" | "updated_at" | "user_id">>) {
        const { data, error } = await this.db
            .from(TABLES.CLIENTS)
            .update({ ...input, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", userId)
            .select("*")
            .single();
        if (error) throw error;
        return data as Client;
    }

    async removeForUser(userId: string, id: string) {
        const { error } = await this.db
            .from(TABLES.CLIENTS)
            .delete()
            .eq("id", id)
            .eq("user_id", userId);
        if (error) throw error;
    }
}
