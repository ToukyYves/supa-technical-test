import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { ClientsService } from "@/services/clients";
import { clientCreateSchema } from "@/lib/zod/client";

export async function GET() {
    try {
        const supabase = await getServerSupabase();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const service = new ClientsService(supabase);
        const clients = await service.list(user.id);
        return NextResponse.json({ data: clients });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log(body)
        const parse = clientCreateSchema.safeParse(body);
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

        const service = new ClientsService(supabase);
        const created = await service.create(user.id, parse.data);
        return NextResponse.json({ data: created }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
