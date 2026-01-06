import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { TemplatesService } from "@/services/templates";
import { templateCreateSchema } from "@/lib/zod/templates";

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = new TemplatesService(supabase);
    const templates = await svc.list(user.id);
    return NextResponse.json({ data: templates });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = templateCreateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const supabase = await getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = new TemplatesService(supabase);
    const created = await svc.create(user.id, parse.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
