"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
import type { AdminUser } from "@/modules/admin/admin.schemas";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  approveUserAction,
  setStatusAction,
} from "@/app/[locale]/admin/users/actions";

type RoleFilter = "all" | "admin" | "coach" | "client";
type StatusFilter = "all" | "pending" | "active" | "suspended";

const STATUS_VARIANT: Record<
  AdminUser["status"],
  "default" | "secondary" | "destructive"
> = {
  active: "default",
  pending: "secondary",
  suspended: "destructive",
};

export function UsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return initialUsers.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (status !== "all" && u.status !== status) return false;
      if (
        needle &&
        !(u.full_name ?? "").toLowerCase().includes(needle) &&
        !u.email.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [initialUsers, search, role, status]);

  function approve(id: string, r: "coach" | "client" | "admin") {
    startTransition(() => approveUserAction(id, r));
  }
  function setUserStatus(id: string, s: "active" | "suspended") {
    startTransition(() => setStatusAction(id, s));
  }

  const dateFmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={t("users.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleFilter)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t("users.allRoles")}</option>
          <option value="coach">{t("roles.coach")}</option>
          <option value="client">{t("roles.client")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">{t("users.allStatuses")}</option>
          <option value="pending">{t("statuses.pending")}</option>
          <option value="active">{t("statuses.active")}</option>
          <option value="suspended">{t("statuses.suspended")}</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr className="text-start">
              <th className="px-4 py-3 text-start font-medium">{t("table.name")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("table.email")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("table.role")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("table.status")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("table.clients")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("table.joined")}</th>
              <th className="px-4 py-3 text-end font-medium">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {t("users.empty")}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">{u.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">{t(`roles.${u.role}`)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[u.status]}>
                      {t(`statuses.${u.status}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "coach" ? u.client_count : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dateFmt(u.created_at)}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          aria-label={t("table.actions")}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {u.status !== "active" && (
                          <>
                            <DropdownMenuLabel>
                              {t("actions.approveAs")}
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => approve(u.id, "coach")}>
                              {t("roles.coach")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => approve(u.id, "client")}>
                              {t("roles.client")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {u.status === "active" ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setUserStatus(u.id, "suspended")}
                          >
                            {t("actions.suspend")}
                          </DropdownMenuItem>
                        ) : (
                          u.status === "suspended" && (
                            <DropdownMenuItem onClick={() => setUserStatus(u.id, "active")}>
                              {t("actions.reactivate")}
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
