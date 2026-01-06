import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { AuthTokensService } from "@/services/auth-token";

export async function GET(request: NextRequest) {
    const supabase = await getServerSupabase();
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
    }

    // Exchange OAuth code for session
    if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, request.url));
        }
    }

    // Get user and session after OAuth redirect
    const [{ data: userRes, error: userError }, { data: sessionRes, error: sessError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
    ]);

    if (userError || sessError) {
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(userError?.message || sessError?.message || "auth_error")}`, request.url));
    }
    const user = userRes.user;
    const session = sessionRes.session;
    if (!user || !session) {
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("missing_session")}`, request.url));
    }

    // Extract provider tokens from Supabase session
    // Supabase Session typically exposes provider_token and provider_refresh_token for OAuth providers
    const providerAccess = (session as any).provider_token as string | undefined;
    const providerRefresh = (session as any).provider_refresh_token as string | undefined;

    // Compute expiry ISO (supabase session.expires_at is seconds since epoch)
    const expiresAtIso = session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : session.expires_in
            ? new Date(Date.now() + session.expires_in * 1000).toISOString()
            : null;

    try {
        const svc = new AuthTokensService(supabase);
        await svc.upsert(user.id, {
            access_token: providerAccess ?? null,
            refresh_token: providerRefresh ?? null,
            expires_at: expiresAtIso,
        });
    } catch (e) {
        // If persisting tokens failed, still redirect but keep an error for visibility
        const url = new URL("/dashboard", request.url);
        url.searchParams.set("token_sync_error", (e as Error).message);
        return NextResponse.redirect(url);
    }

    const redirectTo = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectTo);
}
