import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { InviteClientSchema } from "@/modules/clients/clients.schemas";
import {
  ClientLimitReachedError,
  InviteAlreadySentError,
} from "@/modules/clients/clients.errors";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = InviteClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "validation", issues: parsed.error.issues } }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;
  // Build locale-aware invite base: /ar/invite/[token]
  const locale = request.headers.get("x-locale") ?? "ar";
  const baseUrl = `${origin}/${locale}`;

  try {
    const service = new ClientsService(supabase);
    const { inviteUrl, invite } = await service.inviteClient(user.id, parsed.data, baseUrl);

    // Stub: log to console, return URL in response for dev visibility
    console.log(`[INVITE] ${parsed.data.email} → ${inviteUrl}`);

    return NextResponse.json({ inviteUrl, inviteId: invite.id });
  } catch (err) {
    if (err instanceof ClientLimitReachedError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: 403 });
    }
    if (err instanceof InviteAlreadySentError) {
      return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: 409 });
    }
    console.error("[invite] unexpected error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: { code: "internal", message } }, { status: 500 });
  }
}
