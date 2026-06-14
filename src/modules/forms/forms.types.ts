export type FormTemplateRow = {
  id: string; coach_id: string; name: string;
  description_ar: string | null; description_en: string | null;
  type: "onboarding" | "check_in" | "custom";
  is_active: boolean; settings: Record<string, unknown>;
  version: number; parent_template_id: string | null;
  created_at: string; updated_at: string;
};
export type FormTemplateInsert = Record<string, unknown>;
export type FormTemplateUpdate = Record<string, unknown>;

export type FormQuestionRow = {
  id: string; template_id: string;
  label_ar: string; label_en: string; type: string;
  options: { value: string; label_ar: string; label_en: string }[] | null;
  validation: Record<string, unknown>;
  placeholder_ar: string | null; placeholder_en: string | null;
  help_text_ar: string | null; help_text_en: string | null;
  order_index: number;
  conditional_logic: Record<string, unknown> | null;
  created_at: string; updated_at: string;
};
export type FormQuestionInsert = Record<string, unknown>;
export type FormQuestionUpdate = Record<string, unknown>;

export type FormAssignmentRow = {
  id: string; template_id: string; template_version: number;
  client_id: string; assigned_by: string;
  status: "pending" | "in_progress" | "completed" | "overdue" | "skipped";
  due_at: string | null; started_at: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
};
export type FormAssignmentInsert = Record<string, unknown>;
export type FormAssignmentUpdate = Record<string, unknown>;

export type FormResponseRow = {
  id: string; assignment_id: string; question_id: string;
  value: unknown; is_draft: boolean;
  created_at: string; updated_at: string;
};
export type FormResponseInsert = Record<string, unknown>;
export type FormResponseUpdate = Record<string, unknown>;

export type FormFileRow = {
  id: string; response_id: string;
  storage_path: string; original_name: string;
  mime_type: string; size_bytes: number; created_at: string;
};
export type FormFileInsert = Record<string, unknown>;
export type FormFileUpdate = Record<string, unknown>;

import type { QuestionType } from "./forms.schemas";

export interface FormTemplateWithQuestions extends FormTemplateRow {
  questions: FormQuestionRow[];
}

export interface FormAssignmentWithTemplate extends FormAssignmentRow {
  template: Pick<FormTemplateRow, "id" | "name" | "description_ar" | "description_en" | "type" | "settings">;
  questions_count: number;
  responses_count: number;
}

export interface FormAssignmentForClient extends FormAssignmentRow {
  template: Pick<FormTemplateRow, "id" | "name" | "description_ar" | "description_en" | "type" | "settings">;
  questions: (FormQuestionRow & { response?: FormResponseRow })[];
}

export interface ResponseWithQuestion extends FormResponseRow {
  question: FormQuestionRow;
}

export interface TemplateAnalytics {
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  overdue_assignments: number;
  completion_rate: number;
  avg_completion_minutes: number | null;
  question_stats: QuestionStat[];
}

export interface QuestionStat {
  question_id: string;
  label_ar: string;
  label_en: string;
  type: QuestionType;
  response_count: number;
  avg_value?: number | null;
  option_distribution?: Record<string, number> | null;
}

export interface ClientFormDashboard {
  due_soon: FormAssignmentWithTemplate[];
  in_progress: FormAssignmentWithTemplate[];
  completed: FormAssignmentWithTemplate[];
  overdue: FormAssignmentWithTemplate[];
}

export interface FormBuilderState {
  template: Omit<FormTemplateInsert, "coach_id" | "id" | "created_at" | "updated_at">;
  questions: (FormQuestionInsert & { id: string; is_new: boolean })[];
  active_question_id: string | null;
}

export type FormBuilderAction =
  | { type: "SET_TEMPLATE_FIELD"; field: keyof FormBuilderState["template"]; value: unknown }
  | { type: "ADD_QUESTION"; questionType: QuestionType }
  | { type: "UPDATE_QUESTION"; id: string; updates: Partial<FormQuestionInsert> }
  | { type: "REMOVE_QUESTION"; id: string }
  | { type: "REORDER_QUESTIONS"; questions: FormBuilderState["questions"] }
  | { type: "SET_ACTIVE_QUESTION"; id: string | null }
  | { type: "RESET"; template?: FormBuilderState["template"] };