import { z } from "zod";

export const mealItemInputSchema = z.object({
  food_id: z.string().uuid(),
  quantity_grams: z.number().min(1).default(100),
  notes: z.string().optional().nullable(),
});
export type MealItemInput = z.infer<typeof mealItemInputSchema>;

export const mealInputSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  time_label: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(mealItemInputSchema).default([]),
});
export type MealInput = z.infer<typeof mealInputSchema>;

export const mealDayInputSchema = z.object({
  name: z.string().min(1),
  meals: z.array(mealInputSchema).default([]),
});
export type MealDayInput = z.infer<typeof mealDayInputSchema>;

export const createMealPlanSchema = z.object({
  name: z.string().min(1),
  description_ar: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  client_id: z.string().uuid().optional().nullable(),
  daily_calorie_target: z.number().min(0).optional().nullable(),
  days: z.array(mealDayInputSchema).min(1),
});
export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;
