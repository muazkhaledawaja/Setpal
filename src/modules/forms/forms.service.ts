/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { 
  CreateTemplateInput, AssignTemplateInput, SubmitResponseInput,
  CreateQuestionInput, UpdateQuestionInput, UpdateTemplateInput,
} from "./forms.schemas";
import type {
  FormTemplateRow, FormTemplateInsert, FormQuestionRow, FormQuestionInsert,
  FormAssignmentRow, FormAssignmentInsert, FormResponseRow, FormFileRow,
  FormTemplateWithQuestions, FormAssignmentWithTemplate, FormAssignmentForClient,
  ResponseWithQuestion, TemplateAnalytics, ClientFormDashboard,
} from "./forms.types";
import {
  TemplateNotFoundError, TemplateAccessDeniedError, QuestionNotFoundError,
  AssignmentNotFoundError, AssignmentAccessDeniedError, AssignmentAlreadyExistsError,
  FormsError, ValidationError, FileUploadError,
} from "./forms.errors";

type DB = Database["public"]["Tables"];
type SB = SupabaseClient<any>;

type InviteRow = DB["client_invites"]["Row"];

export class FormsService {
  private db: SB;

  constructor(supabase: SupabaseClient<Database>) {
    this.db = supabase as SB;
  }

  private async ensureCoach(coachId: string): Promise<void> {
    const { data } = await this.db
      .from("coaches")
      .select("id")
      .eq("id", coachId)
      .single();
    if (!data) throw new TemplateAccessDeniedError();
  }

  private async ensureOwnTemplate(templateId: string, coachId: string): Promise<FormTemplateRow> {
    await this.ensureCoach(coachId);
    const { data, error } = await this.db
      .from("form_templates")
      .select("*")
      .eq("id", templateId)
      .eq("coach_id", coachId)
      .single();
    if (error || !data) throw new TemplateNotFoundError(templateId);
    return data as FormTemplateRow;
  }

  // ── Template CRUD ──────────────────────────────────────────

  async createTemplate(coachId: string, input: CreateTemplateInput): Promise<FormTemplateRow> {
    await this.ensureCoach(coachId);

    const { data: template, error: tErr } = await this.db
      .from("form_templates")
      .insert({
        coach_id: coachId,
        name: input.name,
        description_ar: input.description_ar ?? null,
        description_en: input.description_en ?? null,
        type: input.type,
        settings: input.settings ?? {},
      } as FormTemplateInsert)
      .select()
      .single();

    if (tErr || !template) throw new FormsError(tErr?.message ?? "Failed to create template", "CREATE_TEMPLATE_FAILED", 500);

    const templateRow = template as FormTemplateRow;

    if (input.questions.length > 0) {
      const questionRows = input.questions.map((q, i) => ({
        template_id: templateRow.id,
        label_ar: q.label_ar,
        label_en: q.label_en,
        type: q.type,
        options: q.options ?? null,
        validation: q.validation ?? {},
        placeholder_ar: q.placeholder_ar ?? null,
        placeholder_en: q.placeholder_en ?? null,
        help_text_ar: q.help_text_ar ?? null,
        help_text_en: q.help_text_en ?? null,
        order_index: i,
        conditional_logic: q.conditional_logic ?? null,
      }) as FormQuestionInsert);

      const { error: qErr } = await this.db.from("form_questions").insert(questionRows);
      if (qErr) throw new FormsError(qErr.message, "CREATE_QUESTIONS_FAILED", 500);
    }

    return templateRow;
  }

  async updateTemplate(coachId: string, input: UpdateTemplateInput): Promise<FormTemplateRow> {
    const existing = await this.ensureOwnTemplate(input.id, coachId);

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description_ar !== undefined) updateData.description_ar = input.description_ar;
    if (input.description_en !== undefined) updateData.description_en = input.description_en;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.settings !== undefined) updateData.settings = input.settings;

    if (Object.keys(updateData).length > 0) {
      const { error: uErr } = await this.db
        .from("form_templates")
        .update(updateData)
        .eq("id", input.id);
      if (uErr) throw new FormsError(uErr.message, "UPDATE_TEMPLATE_FAILED", 500);
    }

    if (input.questions) {
      await this.db.from("form_questions").delete().eq("template_id", input.id);

      const questionRows = input.questions.map((q, i) => ({
        ...q,
        template_id: input.id,
        order_index: i,
      }));
      const { error: qErr } = await this.db.from("form_questions").insert(questionRows);
      if (qErr) throw new FormsError(qErr.message, "UPDATE_QUESTIONS_FAILED", 500);
    }

    const { data: updated } = await this.db
      .from("form_templates")
      .select("*")
      .eq("id", input.id)
      .single();
    return (updated ?? existing) as FormTemplateRow;
  }

  async deleteTemplate(templateId: string, coachId: string): Promise<void> {
    await this.ensureOwnTemplate(templateId, coachId);
    const { error } = await this.db
      .from("form_templates")
      .update({ is_active: false })
      .eq("id", templateId);
    if (error) throw new FormsError(error.message, "DELETE_TEMPLATE_FAILED", 500);
  }

  async listTemplates(
    coachId: string,
    filters?: { type?: string; is_active?: boolean; search?: string }
  ): Promise<FormTemplateRow[]> {
    await this.ensureCoach(coachId);

    let query = this.db
      .from("form_templates")
      .select("*")
      .eq("coach_id", coachId);

    if (filters?.type) query = query.eq("type", filters.type);
    if (filters?.is_active !== undefined) query = query.eq("is_active", filters.is_active);
    if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new FormsError(error.message, "LIST_TEMPLATES_FAILED", 500);
    return (data ?? []) as FormTemplateRow[];
  }

  async getTemplateWithQuestions(templateId: string, coachId?: string): Promise<FormTemplateWithQuestions> {
    let query = this.db
      .from("form_templates")
      .select("*, questions:form_questions(*)")
      .eq("id", templateId);

    if (coachId) query = query.eq("coach_id", coachId);

    const { data, error } = await query.single();
    if (error || !data) throw new TemplateNotFoundError(templateId);

    const result = data as FormTemplateWithQuestions;
    result.questions?.sort((a, b) => a.order_index - b.order_index);
    return result;
  }

  async getTemplateAnalytics(templateId: string, coachId: string): Promise<TemplateAnalytics> {
    await this.ensureOwnTemplate(templateId, coachId);

    const { data, error } = await this.db.rpc("get_template_analytics", {
      p_template_id: templateId,
      p_coach_id: coachId,
    });

    if (error) throw new FormsError(error.message, "ANALYTICS_FAILED", 500);
    return data as unknown as TemplateAnalytics;
  }

  // ── Question CRUD ──────────────────────────────────────────

  async addQuestion(coachId: string, input: CreateQuestionInput): Promise<FormQuestionRow> {
    await this.ensureOwnTemplate(input.template_id, coachId);

    const { data, error } = await this.db
      .from("form_questions")
      .insert(input as FormQuestionInsert)
      .select()
      .single();

    if (error || !data) throw new FormsError(error?.message ?? "Failed to add question", "ADD_QUESTION_FAILED", 500);
    return data as FormQuestionRow;
  }

  async updateQuestion(coachId: string, input: UpdateQuestionInput): Promise<FormQuestionRow> {
    const { data: q } = await this.db
      .from("form_questions")
      .select("*, template:form_templates!inner(coach_id)")
      .eq("id", input.id)
      .single();

    if (!q || (q as any).template.coach_id !== coachId) throw new QuestionNotFoundError(input.id);

    const updateData: Record<string, unknown> = { ...input };
    delete (updateData as any).id;

    const { data, error } = await this.db
      .from("form_questions")
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error || !data) throw new FormsError(error?.message ?? "Failed to update question", "UPDATE_QUESTION_FAILED", 500);
    return data as FormQuestionRow;
  }

  async deleteQuestion(questionId: string, coachId: string): Promise<void> {
    const { data: q } = await this.db
      .from("form_questions")
      .select("*, template:form_templates!inner(coach_id)")
      .eq("id", questionId)
      .single();

    if (!q || (q as any).template.coach_id !== coachId) throw new QuestionNotFoundError(questionId);

    const { error } = await this.db.from("form_questions").delete().eq("id", questionId);
    if (error) throw new FormsError(error.message, "DELETE_QUESTION_FAILED", 500);
  }

  async updateQuestionsOrder(templateId: string, coachId: string, questionIds: string[]): Promise<void> {
    await this.ensureOwnTemplate(templateId, coachId);

    const updates = questionIds.map((id, i) => ({
      id,
      order_index: i,
    }));

    const { error } = await this.db.from("form_questions").upsert(updates);
    if (error) throw new FormsError(error.message, "REORDER_QUESTIONS_FAILED", 500);
  }

  // ── Assignment CRUD ──────────────────────────────────────────

  async assignTemplate(coachId: string, input: AssignTemplateInput): Promise<FormAssignmentRow[]> {
    const template = await this.ensureOwnTemplate(input.template_id, coachId);

    const created: FormAssignmentRow[] = [];

    for (const clientId of input.client_ids) {
      const { data: existing } = await this.db
        .from("form_assignments")
        .select("id")
        .eq("template_id", input.template_id)
        .eq("client_id", clientId)
        .in("status", ["pending", "in_progress"])
        .maybeSingle();

      if (existing) continue;

      const { data: assignment, error: aErr } = await this.db
        .from("form_assignments")
        .insert({
          template_id: input.template_id,
          template_version: template.version ?? 1,
          client_id: clientId,
          assigned_by: coachId,
          due_at: input.due_at ?? null,
        } as FormAssignmentInsert)
        .select()
        .single();

      if (aErr) throw new FormsError(aErr.message, "ASSIGN_FAILED", 500);
      created.push(assignment as FormAssignmentRow);
    }

    return created;
  }

  async getClientAssignments(clientId: string, locale?: string): Promise<FormAssignmentWithTemplate[]> {
    const { data, error } = await this.db
      .from("v_client_assignments")
      .select("*")
      .eq("client_id", clientId)
      .order("due_at", { ascending: true, nullsFirst: false });

    if (error) throw new FormsError(error.message, "LIST_CLIENT_ASSIGNMENTS_FAILED", 500);
    return (data ?? []) as FormAssignmentWithTemplate[];
  }

  async getClientDashboard(clientId: string, locale?: string): Promise<ClientFormDashboard> {
    const assignments = await this.getClientAssignments(clientId, locale);
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      due_soon: assignments.filter(a => a.status === "pending" && a.due_at && new Date(a.due_at) <= next24h),
      in_progress: assignments.filter(a => a.status === "in_progress"),
      completed: assignments.filter(a => a.status === "completed"),
      overdue: assignments.filter(a => a.status === "overdue"),
    };
  }

  async getAssignmentForClient(assignmentId: string, clientId: string): Promise<FormAssignmentForClient | null> {
    const { data: assignment, error: aErr } = await this.db
      .from("form_assignments")
      .select("*, template:form_templates!inner(*)")
      .eq("id", assignmentId)
      .eq("client_id", clientId)
      .single();

    if (aErr || !assignment) return null;

    const tpl = (assignment as any).template;
    const templateId = tpl.id;

    const { data: questions, error: qErr } = await this.db
      .from("form_questions")
      .select("*, response:form_responses(assignment_id, value, is_draft)")
      .eq("template_id", templateId);

    if (qErr) return null;

    const mappedQuestions = (questions ?? []).map(q => {
      const r = (q as any).response;
      const filtered = Array.isArray(r) ? r : [];
      return {
        ...q,
        response: filtered.find((fr: any) => fr.assignment_id === assignmentId) ?? null,
      };
    });

    return {
      ...assignment as FormAssignmentRow,
      template: tpl,
      questions: mappedQuestions,
    } as FormAssignmentForClient;
  }

  async getAssignmentResponses(assignmentId: string, coachId: string): Promise<ResponseWithQuestion[]> {
    const { data: assignment, error: aErr } = await this.db
      .from("form_assignments")
      .select("*, client:clients!inner(coach_id)")
      .eq("id", assignmentId)
      .single();

    if (aErr || !assignment) throw new AssignmentNotFoundError(assignmentId);
    if ((assignment as any).client.coach_id !== coachId) throw new AssignmentAccessDeniedError();

    const { data, error } = await this.db
      .from("form_responses")
      .select("*, question:form_questions(*)")
      .eq("assignment_id", assignmentId)
      .eq("is_draft", false);

    if (error) throw new FormsError(error.message, "LIST_RESPONSES_FAILED", 500);
    const result = (data ?? []) as ResponseWithQuestion[];
    result.sort((a, b) => a.question.order_index - b.question.order_index);
    return result;
  }

  async getCoachAssignmentResponses(templateId: string, coachId: string): Promise<any[]> {
    await this.ensureOwnTemplate(templateId, coachId);

    const { data, error } = await this.db
      .from("form_assignments")
      .select("*, client:clients(*, profile:profiles(full_name, avatar_url)), response_count:form_responses(count)")
      .eq("template_id", templateId);

    if (error) throw new FormsError(error.message, "LIST_ASSIGNMENTS_FAILED", 500);
    return data ?? [];
  }

  async getAssignmentDetails(assignmentId: string, coachId: string): Promise<any> {
    const { data, error } = await this.db
      .from("form_assignments")
      .select("*, client:clients(*, profile:profiles(full_name, avatar_url)), responses:form_responses(*, question:form_questions(*))")
      .eq("id", assignmentId)
      .single();

    if (error) throw new AssignmentNotFoundError(assignmentId);
    const assignment = data as any;

    const { data: cData } = await this.db
      .from("clients")
      .select("coach_id")
      .eq("id", assignment.client_id)
      .single();

    if (!cData || cData.coach_id !== coachId) throw new AssignmentAccessDeniedError();

    return assignment;
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: FormAssignmentRow["status"],
    userId?: string,
    isCoach = false
  ): Promise<void> {
    if (isCoach && userId) {
      const { data: a } = await this.db
        .from("form_assignments")
        .select("client_id")
        .eq("id", assignmentId)
        .single();
      if (!a) throw new AssignmentNotFoundError(assignmentId);

      const { data: c } = await this.db
        .from("clients")
        .select("coach_id")
        .eq("id", (a as any).client_id)
        .single();
      if (!c || (c as any).coach_id !== userId) throw new AssignmentAccessDeniedError();
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "in_progress") updateData.started_at = new Date().toISOString();
    if (status === "completed") updateData.completed_at = new Date().toISOString();

    const { error } = await this.db
      .from("form_assignments")
      .update(updateData)
      .eq("id", assignmentId);

    if (error) throw new FormsError(error.message, "UPDATE_STATUS_FAILED", 500);
  }

  // ── Responses ──────────────────────────────────────────

  async submitResponse(clientId: string, input: SubmitResponseInput): Promise<void> {
    const { data: assignment, error: aErr } = await this.db
      .from("form_assignments")
      .select("*")
      .eq("id", input.assignment_id)
      .eq("client_id", clientId)
      .single();

    if (aErr || !assignment) throw new AssignmentNotFoundError(input.assignment_id);

    const status = input.is_draft ? "in_progress" : "completed";

    for (const resp of input.responses) {
      const { error: rErr } = await this.db
        .from("form_responses")
        .upsert({
          assignment_id: input.assignment_id,
          question_id: resp.question_id,
          value: resp.value,
          is_draft: input.is_draft,
        } as any)
        .select();

      if (rErr) throw new FormsError(rErr.message, "SAVE_RESPONSE_FAILED", 500);
    }

    const nowIso = new Date().toISOString();
    const statusUpdate: Record<string, unknown> = { status };
    if (!(assignment as any).started_at) statusUpdate.started_at = nowIso;
    if (status === "completed") statusUpdate.completed_at = nowIso;

    await this.db
      .from("form_assignments")
      .update(statusUpdate as any)
      .eq("id", input.assignment_id);
  }

  async saveDraft(clientId: string, assignmentId: string, responses: Array<{ question_id: string; value: unknown }>): Promise<void> {
    await this.submitResponse(clientId, {
      assignment_id: assignmentId,
      responses,
      is_draft: true,
    });
  }

  // ── Files ──────────────────────────────────────────

  async uploadFormFile(
    clientId: string,
    responseId: string,
    file: { original_name: string; mime_type: string; size_bytes: number; storage_path: string }
  ): Promise<FormFileRow> {
    const { data, error } = await this.db
      .from("form_files")
      .insert({
        response_id: responseId,
        storage_path: file.storage_path,
        original_name: file.original_name,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
      })
      .select()
      .single();

    if (error) throw new FileUploadError(error.message);
    return data as FormFileRow;
  }

  async getFormFiles(responseId: string): Promise<FormFileRow[]> {
    const { data, error } = await this.db
      .from("form_files")
      .select("*")
      .eq("response_id", responseId);

    if (error) throw new FormsError(error.message, "LIST_FILES_FAILED", 500);
    return (data ?? []) as FormFileRow[];
  }

  async deleteFormFile(fileId: string): Promise<void> {
    const { data: file, error: fErr } = await this.db
      .from("form_files")
      .select("storage_path")
      .eq("id", fileId)
      .single();

    if (fErr) throw new FormsError(fErr?.message ?? "File not found", "FILE_NOT_FOUND", 404);

    const { error: dErr } = await this.db.storage
      .from("form-files")
      .remove([(file as any).storage_path]);

    if (dErr) throw new FormsError(dErr.message, "DELETE_STORAGE_FILE_FAILED", 500);

    const { error } = await this.db.from("form_files").delete().eq("id", fileId);
    if (error) throw new FormsError(error.message, "DELETE_FILE_RECORD_FAILED", 500);
  }

  // ── Scheduler helpers ──────────────────────────────────────────

  async getTemplatesWithRecurringSchedule(): Promise<FormTemplateRow[]> {
    const { data, error } = await this.db
      .from("form_templates")
      .select("*")
      .eq("is_active", true)
      .filter("settings->>frequency_days", "neq", null);

    if (error) throw new FormsError(error.message, "SCHEDULER_QUERY_FAILED", 500);
    return (data ?? []) as FormTemplateRow[];
  }
}