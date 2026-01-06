import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { calendarQuerySchema } from "@/lib/zod/calendar";
import { CalendarService } from "@/services/calendar";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parse = calendarQuerySchema.safeParse({
            timeMin: searchParams.get("timeMin") ?? undefined,
            timeMax: searchParams.get("timeMax") ?? undefined,
        });
        if (!parse.success) {
            return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
        }

        const supabase = await getServerSupabase();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const service = new CalendarService(supabase);
        const events = await service.getEvents(user.id, parse.data);

        return NextResponse.json({ data: events });

    } catch (error: unknown) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
