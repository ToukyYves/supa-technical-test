import { google } from "googleapis";
import { SupabaseClient } from "@supabase/supabase-js";
import { createOAuthClient } from "@/lib/google/oauth";
import { AuthTokensService } from "./auth-token";
import { EmailLogsService } from "./email-logs";
import { SendResult } from "@/lib/types/types";



function toBase64Url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMimeMessage(from: string, to: string, subject: string, body: string): string {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ];
  return lines.join("\r\n");
}

export class GmailService {
  private readonly tokens: AuthTokensService;
  private readonly emailLogs: EmailLogsService;
  
  constructor(private readonly db: SupabaseClient) {
    this.tokens = new AuthTokensService(db);
    this.emailLogs = new EmailLogsService(db);
  }

  async sendBulk(userId: string, fromEmail: string, recipients: string[], subject: string, body: string): Promise<SendResult[]> {
    const accessToken = await this.tokens.getValidAccessToken(userId);

    const oauth2 = createOAuthClient();
    oauth2.setCredentials({ access_token: accessToken ?? undefined });
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const sendOne = async (to: string): Promise<SendResult> => {
      try {
        const raw = toBase64Url(buildMimeMessage(fromEmail, to, subject, body));
        const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
        const id = res.data.id ?? undefined;
        
        // Log successful email
        await this.emailLogs.create(userId, {
          to_email: to,
          subject,
          body,
          gmail_message_id: id,
          success: true,
        });
        
        return { email: to, success: true, id };
      } catch (err) {
        const e = err as { code?: number; response?: { status?: number; data?: unknown }; message?: string };
        const errorMessage = e.message ?? "send_failed";
        
        // Attempt refresh on 401 once - getValidAccessToken should handle this, but fallback for safety
        if (e.code === 401 || e.response?.status === 401) {
          const freshAccess = await this.tokens.getValidAccessToken(userId);
          if (freshAccess) {
            oauth2.setCredentials({ access_token: freshAccess });
            try {
              const raw = toBase64Url(buildMimeMessage(fromEmail, to, subject, body));
              const res2 = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
              const id = res2.data.id ?? undefined;
              
              // Log successful email after refresh
              await this.emailLogs.create(userId, {
                to_email: to,
                subject,
                body,
                gmail_message_id: id,
                success: true,
              });
              
              return { email: to, success: true, id };
            } catch (err2) {
              // Log failed email after refresh
              await this.emailLogs.create(userId, {
                to_email: to,
                subject,
                body,
                success: false,
                error_message: (err2 as Error).message,
              });
              
              return { email: to, success: false, error: (err2 as Error).message };
            }
          }
        }
        
        // Log failed email
        await this.emailLogs.create(userId, {
          to_email: to,
          subject,
          body,
          success: false,
          error_message: errorMessage,
        });
        
        return { email: to, success: false, error: errorMessage };
      }
    };

    const results: SendResult[] = [];
    for (const to of recipients) {
      // send sequentially to simplify rate-limit handling; could be batched if needed
      // eslint-disable-next-line no-await-in-loop
      const r = await sendOne(to);
      results.push(r);
    }
    return results;
  }

  async sendBulkPerRecipient(
    userId: string,
    fromEmail: string,
    items: { email: string; subject: string; body: string }[],
  ): Promise<SendResult[]> {
    const rec = await this.tokens.get(userId);

    const oauth2 = createOAuthClient();
    oauth2.setCredentials({ access_token: rec.access_token ?? undefined, refresh_token: rec.refresh_token ?? undefined });
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const sendOne = async (to: string, subject: string, body: string): Promise<SendResult> => {
      try {
        const raw = toBase64Url(buildMimeMessage(fromEmail, to, subject, body));
        const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
        const id = res.data.id ?? undefined;
        
        // Log successful email
        await this.emailLogs.create(userId, {
          to_email: to,
          subject,
          body,
          gmail_message_id: id,
          success: true,
        });
        
        return { email: to, success: true, id };
      } catch (err) {
        const e = err as { code?: number; response?: { status?: number; data?: unknown }; message?: string };
        const errorMessage = e.message ?? "send_failed";
        
        if (e.code === 401 || e.response?.status === 401) {
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
              try {
                const raw = toBase64Url(buildMimeMessage(fromEmail, to, subject, body));
                const res2 = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
                const id = res2.data.id ?? undefined;
                
                // Log successful email after refresh
                await this.emailLogs.create(userId, {
                  to_email: to,
                  subject,
                  body,
                  gmail_message_id: id,
                  success: true,
                });
                
                return { email: to, success: true, id };
              } catch (err2) {
                // Log failed email after refresh
                await this.emailLogs.create(userId, {
                  to_email: to,
                  subject,
                  body,
                  success: false,
                  error_message: (err2 as Error).message,
                });
                
                return { email: to, success: false, error: (err2 as Error).message };
              }
            }
          }
        }
        
        // Log failed email
        await this.emailLogs.create(userId, {
          to_email: to,
          subject,
          body,
          success: false,
          error_message: errorMessage,
        });
        
        return { email: to, success: false, error: errorMessage };
      }
    };

    const results: SendResult[] = [];
    for (const it of items) {
      // eslint-disable-next-line no-await-in-loop
      const r = await sendOne(it.email, it.subject, it.body);
      results.push(r);
    }
    return results;
  }
}
