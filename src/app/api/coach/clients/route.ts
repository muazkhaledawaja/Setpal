import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ClientsService } from "@/modules/clients/clients.service";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "unauthorized" } }, { status: 401 });

  const service = new ClientsService(supabase);
  const clients = await service.listForCoach(user.id);
  return NextResponse.json({ clients });
}
