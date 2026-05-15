import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { UpdateClientStatusSchema } from "@/modules/clients/clients.schemas";
import { ClientsError } from "@/modules/clients/clients.errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateClientStatusSchema.safeParse({ clientId: id, ...body });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "validation", issues: parsed.error.issues } }, { status: 400 });
  }

  try {
    const service = new ClientsService(supabase);
    await service.updateStatus(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ClientsError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: 500 });
    }
    return NextResponse.json({ error: { code: "internal" } }, { status: 500 });
  }
}
