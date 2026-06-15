"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, ChevronRight, ChevronDown } from "lucide-react";
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
  deleteUserAction,
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

const dateFmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

type T = ReturnType<typeof useTranslations>;

function UserRow({
  u,
  t,
  isPending,
  indent,
  leading,
  onApprove,
  onSetStatus,
}: {
  u: AdminUser;
  t: T;
  isPending: boolean;
  indent?: boolean;
  leading?: React.ReactNode;
  onApprove: (id: string, r: "coach" | "client" | "admin") => void;
  onSetStatus: (id: string, s: "active" | "suspended") => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <span className={indent ? "flex items-center gap-2 ps-6" : "flex items-center gap-2"}>
          {leading}
          {u.full_name ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
      <td className="px-4 py-3">{t(`roles.${u.role}`)}</td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_VARIANT[u.status]}>{t(`statuses.${u.status}`)}</Badge>
      </td>
      <td className="px-4 py-3">{u.role === "coach" ? u.client_count : "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{dateFmt(u.created_at)}</td>
      <td className="px-4 py-3 text-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending} aria-label={t("table.actions")}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {u.status !== "active" && (
              <>
                <DropdownMenuLabel>{t("actions.approveAs")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onApprove(u.id, "coach")}>
                  {t("roles.coach")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onApprove(u.id, "client")}>
                  {t("roles.client")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {u.status === "active" ? (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onSetStatus(u.id, "suspended")}
              >
                {t("actions.suspend")}
              </DropdownMenuItem>
            ) : (
              u.status === "suspended" && (
                <DropdownMenuItem onClick={() => onSetStatus(u.id, "active")}>
                  {t("actions.reactivate")}
                </DropdownMenuItem>
              )
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(u.id)}
            >
              {t("actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

export function UsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const t = useTranslations("admin");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // A user passes the active search + status filters (role grouping handled separately).
  const passesFilters = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (u: AdminUser) => {
      if (status !== "all" && u.status !== status) return false;
      if (
        needle &&
        !(u.full_name ?? "").toLowerCase().includes(needle) &&
        !u.email.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    };
  }, [search, status]);

  // Flat view (used when a specific role is selected): role + search + status.
  const flat = useMemo(
    () => initialUsers.filter((u) => (role === "all" || u.role === role) && passesFilters(u)),
    [initialUsers, role, passesFilters]
  );

  // Grouped view (role === "all"): coaches -> their clients, plus an "Other" group.
  const grouped = useMemo(() => {
    const coaches = initialUsers.filter((u) => u.role === "coach");
    const clientsByCoach = new Map<string, AdminUser[]>();
    const otherClients: AdminUser[] = [];
    for (const u of initialUsers) {
      if (u.role !== "client") continue;
      if (u.coach_id && coaches.some((c) => c.id === u.coach_id)) {
        const list = clientsByCoach.get(u.coach_id) ?? [];
        list.push(u);
        clientsByCoach.set(u.coach_id, list);
      } else {
        otherClients.push(u);
      }
    }
    const others = [
      ...initialUsers.filter((u) => u.role === "admin"),
      ...otherClients,
    ];
    return { coaches, clientsByCoach, others };
  }, [initialUsers]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function approve(id: string, r: "coach" | "client" | "admin") {
    startTransition(() => approveUserAction(id, r));
  }
  function setUserStatus(id: string, s: "active" | "suspended") {
    startTransition(() => setStatusAction(id, s));
  }
  function deleteUser(id: string) {
    if (!window.confirm(t("actions.deleteConfirm"))) return;
    startTransition(() => deleteUserAction(id));
  }

  const isGrouped = role === "all";

  // Build the grouped rows respecting filters.
  const groupedRows: React.ReactNode[] = [];
  if (isGrouped) {
    for (const coach of grouped.coaches) {
      const clients = (grouped.clientsByCoach.get(coach.id) ?? []).filter(passesFilters);
      const coachVisible = passesFilters(coach);
      if (!coachVisible && clients.length === 0) continue;
      const isOpen = expanded.has(coach.id);
      groupedRows.push(
        <UserRow
          key={coach.id}
          u={coach}
          t={t}
          isPending={isPending}
          onApprove={approve}
          onSetStatus={setUserStatus}
          onDelete={deleteUser}
          leading={
            <button
              type="button"
              onClick={() => toggle(coach.id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={isOpen ? t("users.collapse") : t("users.expand")}
            >
              {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4 rtl:rotate-180" />}
            </button>
          }
        />
      );
      if (isOpen) {
        if (clients.length === 0) {
          groupedRows.push(
            <tr key={`${coach.id}-empty`} className="border-t border-border">
              <td colSpan={7} className="px-4 py-2 ps-12 text-xs text-muted-foreground">
                {t("users.noClients")}
              </td>
            </tr>
          );
        } else {
          for (const c of clients) {
            groupedRows.push(
              <UserRow
                key={c.id}
                u={c}
                t={t}
                isPending={isPending}
                indent
                onApprove={approve}
                onSetStatus={setUserStatus}
                onDelete={deleteUser}
              />
            );
          }
        }
      }
    }

    const others = grouped.others.filter(passesFilters);
    if (others.length > 0) {
      groupedRows.push(
        <tr key="other-header" className="border-t border-border bg-muted/40">
          <td colSpan={7} className="px-4 py-2 text-xs font-medium text-muted-foreground">
            {t("users.otherGroup")}
          </td>
        </tr>
      );
      for (const u of others) {
        groupedRows.push(
          <UserRow
            key={u.id}
            u={u}
            t={t}
            isPending={isPending}
            onApprove={approve}
            onSetStatus={setUserStatus}
            onDelete={deleteUser}
          />
        );
      }
    }
  }

  const hasRows = isGrouped ? groupedRows.length > 0 : flat.length > 0;

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
            {!hasRows ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {t("users.empty")}
                </td>
              </tr>
            ) : isGrouped ? (
              groupedRows
            ) : (
              flat.map((u) => (
                <UserRow
                  key={u.id}
                  u={u}
                  t={t}
                  isPending={isPending}
                  onApprove={approve}
                  onSetStatus={setUserStatus}
                  onDelete={deleteUser}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
