"use server";

import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";
import { InvalidInviteTokenError } from "@/modules/clients/clients.errors";

export async function acceptInviteAction(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  try {
    const service = new ClientsService(supabase);
    await service.acceptInvite(token, user.id);
    return { ok: true };
  } catch (err) {
    if (err instanceof InvalidInviteTokenError) return { ok: false, error: "invalid_token" };
    return { ok: false, error: "internal" };
  }
}
