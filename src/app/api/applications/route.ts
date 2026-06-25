import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CoachApplicationSchema } from "@/modules/applications/applications.schemas";
import type { Database } from "@/types/database";

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

  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("coach_applications")
    .insert([parsed.data])
    .select("id")
    .single();

  if (error) {
    console.error("[applications/POST]", error);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
