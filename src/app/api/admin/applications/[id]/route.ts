import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminApplicationUpdateSchema } from "@/modules/applications/applications.schemas";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify caller is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: Pick<ProfileRow, "role"> | null };
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AdminApplicationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();
  const updateQuery = admin
    .from("coach_applications")
    // @ts-expect-error — hand-written database.ts stub doesn't fully resolve Supabase
    // generics for this table; harmless at runtime, resolves when types are generated.
    .update(parsed.data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (updateQuery
    .eq("id", id)
    .select()
    .single() as any);

  if (error) {
    console.error("[admin/applications/PATCH]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json(data);
}
