import { EmailLog } from "@/lib/types/types";
import { SupabaseClient } from "@supabase/supabase-js";



export type EmailLogCreateInput = Omit<EmailLog, "id" | "created_at" | "user_id">;

export class EmailLogsService {
  constructor(private readonly db: SupabaseClient) {}

  async create(userId: string, input: EmailLogCreateInput): Promise<EmailLog> {
    const payload = { ...input, user_id: userId };
    const { data, error } = await this.db
      .from("email_logs")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async countByUser(userId: string): Promise<number> {
    const { count, error } = await this.db
      .from("email_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("success", true);

    if (error) throw error;
    return count || 0;
  }

  async listByUser(userId: string, limit = 50): Promise<EmailLog[]> {
    const { data, error } = await this.db
      .from("email_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}
