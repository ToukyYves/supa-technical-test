import { google } from "googleapis";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "";

export function createOAuthClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET env vars");
  }
  // Redirect URI is optional for refresh flow but good to have consistent
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || undefined
  );
  return oauth2Client;
}
