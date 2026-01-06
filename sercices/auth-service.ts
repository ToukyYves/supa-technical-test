import { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/db/tables";
import { createOAuthClient } from "@/lib/google/oauth";

export type UserTokens = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null; // ISO string
};

export class AuthTokensService {
  constructor(private readonly db: SupabaseClient) {}

  async upsert(userId: string, tokens: UserTokens) {
    const payload = {
      user_id: userId,
      provider: "google" as const,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at ? new Date(tokens.expires_at) : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await this.db.from(TABLES.USER_TOKENS).upsert(payload).eq("user_id", userId);
    if (error) throw error;
  }

  async get(userId: string) {
    const { data, error } = await this.db
      .from(TABLES.USER_TOKENS)
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return data as { access_token: string | null; refresh_token: string | null; expires_at: string | null };
  }

  async getValidAccessToken(userId: string): Promise<string | null> {
    const rec = await this.get(userId);
    const now = Date.now();
    const exp = rec.expires_at ? new Date(rec.expires_at).getTime() : 0;

    if (rec.access_token && exp > now + 60_000) {
      return rec.access_token;
    }

    // try refresh if we have refresh_token
    if (!rec.refresh_token) return rec.access_token ?? null;

    const oauth = createOAuthClient();
    oauth.setCredentials({ refresh_token: rec.refresh_token });
    const { credentials } = await oauth.refreshAccessToken();

    const newAccess = credentials.access_token ?? null;
    const expiresInSec = credentials.expiry_date ? Math.floor((credentials.expiry_date - now) / 1000) : undefined;

    const newExpiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : expiresInSec
      ? new Date(now + expiresInSec * 1000).toISOString()
      : null;

    await this.upsert(userId, {
      access_token: newAccess,
      refresh_token: rec.refresh_token,
      expires_at: newExpiresAt,
    });

    return newAccess;
  }
}
