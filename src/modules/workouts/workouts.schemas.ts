import { z } from "zod";

export const dayExerciseInputSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z.number().int().min(1).default(3),
  rep_range: z.string().min(1).default("8-12"),
  rest_seconds: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type DayExerciseInput = z.infer<typeof dayExerciseInputSchema>;

export const dayInputSchema = z.object({
  name: z.string().min(1),
  is_rest: z.boolean().default(false),
  exercises: z.array(dayExerciseInputSchema).default([]),
});
export type DayInput = z.infer<typeof dayInputSchema>;

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  days: z.array(dayInputSchema).min(1),
});
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
