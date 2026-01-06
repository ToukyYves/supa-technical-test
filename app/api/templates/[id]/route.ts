import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { TemplatesService } from "@/services/templates";
import { templateUpdateSchema } from "@/lib/zod/templates";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json();
    const parse = templateUpdateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const supabase = await getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = new TemplatesService(supabase);
    const updated = await svc.update(user.id, id, parse.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const svc = new TemplatesService(supabase);
    await svc.remove(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
