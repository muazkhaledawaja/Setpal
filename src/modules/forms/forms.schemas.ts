import { z } from "zod";

export const QUESTION_TYPES = [
  "text", "textarea", "number", "select", "multiselect",
  "radio", "checkbox", "date", "file", "scale", "yes_no"
] as const;

export type QuestionType = typeof QUESTION_TYPES[number];

const questionValidationSchema = z.object({
  required: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  min_length: z.number().int().optional(),
  max_length: z.number().int().optional(),
  pattern: z.string().optional(),
  accept: z.string().optional(),
  max_size_mb: z.number().int().optional(),
}).optional();

const questionOptionSchema = z.object({
  value: z.string(),
  label_ar: z.string(),
  label_en: z.string(),
});

const conditionalLogicSchema = z.object({
  show_if: z.object({
    question_id: z.string().uuid(),
    operator: z.enum(["equals", "not_equals", "contains", "gt", "lt"]),
    value: z.unknown(),
  }),
}).optional();

export const questionBaseSchema = z.object({
  label_ar: z.string().min(1, "Arabic label is required"),
  label_en: z.string().min(1, "English label is required"),
  type: z.enum(QUESTION_TYPES),
  options: z.array(questionOptionSchema).optional(),
  validation: questionValidationSchema,
  placeholder_ar: z.string().optional(),
  placeholder_en: z.string().optional(),
  help_text_ar: z.string().optional(),
  help_text_en: z.string().optional(),
  order_index: z.number().int().min(0),
  conditional_logic: conditionalLogicSchema,
});

export const createQuestionSchema = questionBaseSchema.extend({
  template_id: z.string().uuid(),
});

export const updateQuestionSchema = questionBaseSchema.partial().extend({
  id: z.string().uuid(),
});

export const templateSettingsSchema = z.object({
  frequency_days: z.number().int().min(1).optional(),
  reminder_enabled: z.boolean().default(true),
  reminder_before_hours: z.number().int().default(24),
  allow_draft_save: z.boolean().default(true),
}).optional();

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  type: z.enum(["onboarding", "check_in", "custom"]),
  settings: templateSettingsSchema,
  questions: z.array(createQuestionSchema.omit({ template_id: true })).min(1, "At least one question is required"),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
});

export const assignTemplateSchema = z.object({
  template_id: z.string().uuid(),
  client_ids: z.array(z.string().uuid()).min(1, "At least one client is required"),
  due_at: z.string().datetime().optional(),
  recurring: z.boolean().default(false),
});

export const submitResponseSchema = z.object({
  assignment_id: z.string().uuid(),
  responses: z.array(z.object({
    question_id: z.string().uuid(),
    value: z.unknown(),
  })).min(1),
  is_draft: z.boolean().default(false),
});

export const responseInputSchema = z.object({
  question_id: z.string().uuid(),
  value: z.unknown(),
});

export type QuestionValidation = z.infer<typeof questionValidationSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type ConditionalLogic = z.infer<typeof conditionalLogicSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type TemplateSettings = z.infer<typeof templateSettingsSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type AssignTemplateInput = z.infer<typeof assignTemplateSchema>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
export type ResponseInput = z.infer<typeof responseInputSchema>;