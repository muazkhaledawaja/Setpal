import { z } from "zod";

export const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "legs", "arms", "core", "full_body", "cardio",
] as const;

export const createExerciseSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  muscle_group: z.enum(MUSCLE_GROUPS),
  equipment: z.string().optional().nullable(),
  video_url: z.string().url().optional().or(z.literal("")).nullable(),
  thumbnail_url: z.string().url().optional().or(z.literal("")).nullable(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

export const updateExerciseSchema = createExerciseSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: (typeof MUSCLE_GROUPS)[number];
}
