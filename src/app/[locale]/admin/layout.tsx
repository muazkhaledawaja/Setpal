import { AdminSidebar } from "@/components/admin/sidebar";
import { LogoutButton } from "@/components/logout-button";
import { requireRole } from "@/lib/auth/require-role";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

function initials(name: string | null): string {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { profile } = await requireRole(locale, "admin");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-end gap-3 h-16 px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">{profile.full_name}</span>
          </div>
          <ThemeToggle />
          <div className="w-px h-5 bg-border" />
          <LogoutButton />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
