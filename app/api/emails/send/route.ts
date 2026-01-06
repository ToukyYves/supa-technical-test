import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { sendEmailSchema } from "@/lib/zod/email";
import { GmailService, SendResult } from "@/services/gmail";

export async function POST(request: NextRequest) {
    try {
        const body: { items: { email: string; subject: string; body: string }[] } = await request.json();

        const hasItems = Array.isArray(body?.items);
        const parse = hasItems ? undefined : sendEmailSchema.safeParse(body);

        if (!hasItems && parse && !parse.success) {
            return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
        }

        const supabase = await getServerSupabase();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const fromEmail = user.email ?? "me";
        const gmailService = new GmailService(supabase);
        let results;
        if (hasItems) {
            const items = (body.items);
            results = await gmailService.sendBulkPerRecipient(user.id, fromEmail, items);
        } else if (parse && parse.success) {
            const recipients = parse.data.recipients.map((r) => r.email);
            const subject = parse.data.subject;
            const bodyText = parse.data.body;
            results = await gmailService.sendBulk(user.id, fromEmail, recipients, subject, bodyText);
        }

        const successCount = (results as SendResult[]).filter((r) => r.success).length;
        const failure = (results as SendResult[]).filter((r) => !r.success).map((r) => ({ email: r.email, error: r.error }));

        return NextResponse.json({ data: { sent: successCount, total: (results as SendResult[]).length, results, failure } });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
