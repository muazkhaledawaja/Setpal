/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { FormsService } from "./forms.service";
import { SchedulerError } from "./forms.errors";

type SB = SupabaseClient<any>;

interface SchedulerResult {
  assignments_created: number;
  reminders_sent: number;
  overdue_marked: number;
  errors: string[];
}

export class FormsScheduler {
  private db: SB;
  private formsService: FormsService;

  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
    this.formsService = new FormsService(supabase);
  }

  async processAll(): Promise<SchedulerResult> {
    const result: SchedulerResult = {
      assignments_created: 0,
      reminders_sent: 0,
      overdue_marked: 0,
      errors: [],
    };

    try {
      const created = await this.createRecurringAssignments();
      result.assignments_created = created;

      const overdue = await this.markOverdueAssignments();
      result.overdue_marked = overdue;

      const reminders = await this.sendReminders();
      result.reminders_sent = reminders;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scheduler failed";
      result.errors.push(message);
    }

    return result;
  }

  async createRecurringAssignments(): Promise<number> {
    let count = 0;

    const templates = await this.formsService.getTemplatesWithRecurringSchedule();

    for (const template of templates) {
      try {
        const settings = template.settings as Record<string, any> | null;
        const frequencyDays = settings?.frequency_days;
        if (!frequencyDays) continue;

        const { data: coachClients } = await this.db
          .from("clients")
          .select("id")
          .eq("coach_id", template.coach_id)
          .eq("status", "active");

        const activeClients = (coachClients ?? []) as Array<{ id: string }>;

        for (const client of activeClients) {
          const { data: pending } = await this.db
            .from("form_assignments")
            .select("id")
            .eq("template_id", template.id)
            .eq("client_id", client.id)
            .in("status", ["pending", "in_progress"])
            .maybeSingle();

          if (pending) continue;

          const { data: dueDate } = await this.db
            .rpc("get_next_recurring_due_date", {
              p_template_id: template.id,
              p_frequency_days: frequencyDays,
            } as any);

          await this.db
            .from("form_assignments")
            .insert({
              template_id: template.id,
              template_version: template.version ?? 1,
              client_id: client.id,
              assigned_by: template.coach_id,
              due_at: (dueDate as any) ?? null,
            } as any);

          count++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Scheduler] Failed for template ${template.id}: ${message}`);
      }
    }

    return count;
  }

  async markOverdueAssignments(): Promise<number> {
    const { data: overdue, error } = await this.db
      .from("form_assignments")
      .select("id")
      .in("status", ["pending", "in_progress"])
      .lt("due_at", new Date().toISOString());

    if (error) return 0;

    const ids = (overdue ?? []).map((a: any) => a.id);
    if (ids.length === 0) return 0;

    const { error: uErr } = await this.db
      .from("form_assignments")
      .update({ status: "overdue" } as any)
      .in("id", ids);

    if (uErr) return 0;
    return ids.length;
  }

  async sendReminders(): Promise<number> {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: dueSoon, error } = await this.db
      .from("form_assignments")
      .select("*, template:form_templates!inner(name, settings), client:clients!inner(*, profile:profiles!inner(full_name))")
      .in("status", ["pending"])
      .lte("due_at", next24h.toISOString())
      .gte("due_at", now.toISOString());

    if (error) return 0;

    const { data: overdue } = await this.db
      .from("form_assignments")
      .select("*, template:form_templates!inner(name, settings), client:clients!inner(*, profile:profiles!inner(full_name))")
      .eq("status", "overdue");

    const allRemindable = [...(dueSoon ?? []), ...(overdue ?? [])];
    let sent = 0;

    for (const assignment of allRemindable) {
      try {
        const a = assignment as any;
        const settings = a.template?.settings as Record<string, any> | null;

        if (settings?.reminder_enabled === false) continue;

        const profile = a.client?.profile;
        const templateName = a.template?.name ?? "Form";

        await this.sendEmailNotification({
          to: a.client?.id,
          subject: `Reminder: ${templateName}`,
          body: `Hello ${profile?.full_name ?? "there"}, your form "${templateName}" is due.`,
        });

        sent++;
      } catch {
        continue;
      }
    }

    return sent;
  }

  private async sendEmailNotification(notification: { to: string; subject: string; body: string }): Promise<void> {
    const { error } = await this.db.functions.invoke("send-form-reminder", {
      body: notification,
    });
    if (error) throw new SchedulerError(error.message);
  }
}