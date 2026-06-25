import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApplicationsTable } from "./applications-table";
import type { ApplicationStatus } from "@/modules/applications/applications.schemas";

interface Application {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  specialty: string;
  client_count: number;
  status: ApplicationStatus;
  admin_notes: string | null;
}

export default async function AdminApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Role gate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null; error: unknown };
  if (profile?.role !== "admin") redirect(`/${locale}`);

  // Fetch all applications using admin client (bypasses RLS)
  const admin = createAdminClient();
  const anyAdmin = admin as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown[] | null }>;
      };
    };
  };
  const { data } = await anyAdmin
    .from("coach_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const applications = (data ?? []) as Application[];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Coach Applications</h1>
      <ApplicationsTable applications={applications} />
    </div>
  );
}
