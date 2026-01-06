import { google, calendar_v3 } from "googleapis";
import { SupabaseClient } from "@supabase/supabase-js";
import { createOAuthClient } from "@/lib/google/oauth";
import { AuthTokensService } from "./auth-token";
import { CalendarEvent } from "@/lib/types/types";


export class CalendarService {
  private readonly tokens: AuthTokensService;

  constructor(private readonly db: SupabaseClient) {
    this.tokens = new AuthTokensService(db);
  }

  async getEvents(userId: string, params: { timeMin?: string; timeMax?: string }): Promise<CalendarEvent[]> {
    const rec = await this.tokens.get(userId);
    const accessToken = await this.tokens.getValidAccessToken(userId);
    if (!accessToken && !rec.refresh_token) return [];

    // Use OAuth2 client with current access token so the googleapis client signs requests correctly
    const oauth2 = new google.auth.OAuth2();

    oauth2.setCredentials({ access_token: accessToken ?? undefined, refresh_token: rec.refresh_token ?? undefined });
    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    const timeMin = new Date(params.timeMin as string).toISOString();
    const timeMax = new Date(params.timeMax as string).toISOString();

    const listCall = async (): Promise<calendar_v3.Schema$Events> => {
      const res = await calendar.events.list({
        calendarId: "primary",
        singleEvents: true,
        orderBy: "startTime",
        timeMin,
        timeMax,
        maxResults: 50,
      });
      return res.data;
    };

    try {
      const data = await listCall();

      return (data.items ?? []).map((e) => ({
        id: e.id!,
        summary: e.summary ?? null,
        description: e.description ?? null,
        start: e.start?.dateTime ?? e.start?.date ?? null,
        end: e.end?.dateTime ?? e.end?.date ?? null,
      }));
    } catch (err) {
      const e = err as { code?: number; response?: { status?: number } };
      if (e.code === 401 || e.response?.status === 401) {
        // Try a manual refresh and retry once
        if (rec.refresh_token) {
          const fresh = createOAuthClient();
          fresh.setCredentials({ refresh_token: rec.refresh_token });
          const { credentials } = await fresh.refreshAccessToken();
          const newAccess = credentials.access_token ?? null;
          const expiry = credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null;
          await this.tokens.upsert(userId, {
            access_token: newAccess,
            refresh_token: rec.refresh_token,
            expires_at: expiry,
          });
          if (newAccess) {
            oauth2.setCredentials({ access_token: newAccess, refresh_token: rec.refresh_token ?? undefined });
            const data2 = await listCall();
            return (data2.items ?? []).map((e) => ({
              id: e.id!,
              summary: e.summary ?? null,
              description: e.description ?? null,
              start: e.start?.dateTime ?? e.start?.date ?? null,
              end: e.end?.dateTime ?? e.end?.date ?? null,
            }));
          }
        }
      }
      throw err;
    }
  }
}
