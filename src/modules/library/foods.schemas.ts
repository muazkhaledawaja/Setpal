import { z } from "zod";

export const FOOD_CATEGORIES = [
  "grains", "protein", "dairy", "vegetables", "fruits", "fats", "beverages", "composite",
] as const;

export const createFoodSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  category: z.enum(FOOD_CATEGORIES),
  serving_label_ar: z.string().optional().nullable(),
  serving_label_en: z.string().optional().nullable(),
  serving_grams: z.coerce.number().positive().default(100),
  calories: z.coerce.number().min(0).default(0),
  protein_g: z.coerce.number().min(0).default(0),
  carbs_g: z.coerce.number().min(0).default(0),
  fat_g: z.coerce.number().min(0).default(0),
});

export type CreateFoodInput = z.infer<typeof createFoodSchema>;

export const updateFoodSchema = createFoodSchema.partial().extend({
  id: z.string().uuid(),
});
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;

export interface FoodFilters {
  search?: string;
  category?: (typeof FOOD_CATEGORIES)[number];
}
