import { z } from "zod";

export const logSetSchema = z.object({
  log_id: z.string().uuid(),
  exercise_id: z.string().uuid().nullable(),
  exercise_name_snapshot: z.string().min(1),
  set_number: z.number().int().min(1),
  reps: z.number().int().min(0).nullable(),
  weight: z.number().min(0).nullable(),
  completed: z.boolean().default(true),
});
export type LogSetInput = z.infer<typeof logSetSchema>;
