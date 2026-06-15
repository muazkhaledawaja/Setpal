import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { InvalidInviteTokenError } from "@/modules/clients/clients.errors";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token) {
    return NextResponse.json({ error: { code: "missing_token" } }, { status: 400 });
  }

  try {
    const service = new ClientsService(supabase);
    await service.acceptInvite(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof InvalidInviteTokenError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: "internal" } }, { status: 500 });
  }
}
