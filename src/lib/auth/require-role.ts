import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import type { Database } from "@/types/database";

type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"];

export async function requireRole(
  locale: string,
  requiredRole: Role
): Promise<{
  userId: string;
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  coachData: Database["public"]["Tables"]["coaches"]["Row"] | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }

  const { data: profileData } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as { data: Database["public"]["Tables"]["profiles"]["Row"] | null; error: unknown };

  if (!profileData) {
    redirect({ href: "/login", locale });
    throw new Error("unreachable");
  }

  if (profileData.role !== requiredRole) {
    redirect({ href: "/", locale });
    throw new Error("unreachable");
  }

  const profile = profileData;

  let coachData: Database["public"]["Tables"]["coaches"]["Row"] | null = null;
  if (requiredRole === "coach") {
    const { data } = (await supabase
      .from("coaches")
      .select("*")
      .eq("id", user.id)
      .single()) as { data: Database["public"]["Tables"]["coaches"]["Row"] | null; error: unknown };
    coachData = data;
  }

  return { userId: user.id, profile, coachData };
}
