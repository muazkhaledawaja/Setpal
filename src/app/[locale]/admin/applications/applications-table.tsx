"use client";

import { useState } from "react";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "@/modules/applications/applications.schemas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle } from "lucide-react";

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

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  new: "bg-warning/20 text-warning-foreground border-warning/30",
  contacted: "bg-muted text-muted-foreground",
  approved: "bg-success/20 text-success border-success/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

function ApplicationRow({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>(app.status);
  const [notes, setNotes] = useState(app.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_notes: notes }),
    });
    if (!res.ok) {
      setSaving(false);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
      return;
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const whatsappUrl = `https://wa.me/${app.phone.replace(/\D/g, "")}`;

  return (
    <>
      <tr
        className="border-b border-border cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="py-3 px-4 text-sm font-medium">{app.full_name}</td>
        <td className="py-3 px-4 text-sm text-muted-foreground">{app.email}</td>
        <td className="py-3 px-4 text-sm text-muted-foreground">{app.phone}</td>
        <td className="py-3 px-4 text-sm text-muted-foreground">{app.city}</td>
        <td className="py-3 px-4 text-sm capitalize">{app.specialty}</td>
        <td className="py-3 px-4 text-sm text-center">{app.client_count}</td>
        <td className="py-3 px-4">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs border ${STATUS_BADGE[status]}`}
          >
            {status}
          </span>
        </td>
        <td className="py-3 px-4 text-sm text-muted-foreground">
          {new Date(app.created_at).toLocaleDateString()}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/20">
          <td colSpan={8} className="px-4 py-4">
            <div className="flex flex-col gap-4 max-w-lg">
              <div className="flex items-center gap-3">
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ApplicationStatus)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-success hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
              <Textarea
                placeholder="Internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  void save();
                }}
                disabled={saving}
                className="self-start"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
              </Button>
              {saveError && <p className="text-xs text-destructive">Failed to save</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ApplicationsTable({
  applications,
}: {
  applications: Application[];
}) {
  if (applications.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No applications yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-start">
        <thead className="bg-muted/50">
          <tr>
            {[
              "Name",
              "Email",
              "Phone",
              "City",
              "Specialty",
              "Clients",
              "Status",
              "Date",
            ].map((h) => (
              <th
                key={h}
                className="py-2 px-4 text-xs font-medium text-muted-foreground text-start"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <ApplicationRow key={app.id} app={app} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
