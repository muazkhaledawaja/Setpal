import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CoachApplicationSchema } from "@/modules/applications/applications.schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CoachApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = createAdminClient();
  const insertQuery = supabase
    .from("coach_applications")
    // @ts-expect-error — hand-written database.ts stub doesn't fully resolve Supabase
    // generics for this table; harmless at runtime, resolves when types are generated.
    .insert([parsed.data]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (insertQuery as any).select("id").single();

  if (error) {
    console.error("[applications/POST]", error);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
