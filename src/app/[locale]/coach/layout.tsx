import { CoachSidebar } from "@/components/coach/sidebar";
import { CoachTopbar } from "@/components/coach/topbar";
import { requireRole } from "@/lib/auth/require-role";

export default async function CoachLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { profile } = await requireRole(locale, "coach");

  return (
    <div className="flex min-h-screen bg-background">
      <CoachSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <CoachTopbar
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          locale={locale}
        />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
