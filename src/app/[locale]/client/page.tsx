import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import { LogoutButton } from "@/components/logout-button";

export default async function ClientHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/login", locale: "ar" });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl">Client Dashboard</h1>
          <LogoutButton />
        </header>
        <div className="bg-card border border-border rounded-lg p-6">
          <p>Welcome, {profile?.full_name || "Client"}</p>
          <p className="text-sm text-muted-foreground mt-2">Role: {profile?.role}</p>
        </div>
      </div>
    </main>
  );
}
