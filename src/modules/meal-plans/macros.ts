import type { FoodRow, MealWithItems, DayWithMeals } from "./meal-plans.types";

export interface Macros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const EMPTY_MACROS: Macros = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

// Scale a food's per-serving macros to an arbitrary gram quantity.
export function itemMacros(food: Pick<FoodRow, "serving_grams" | "calories" | "protein_g" | "carbs_g" | "fat_g">, quantityGrams: number): Macros {
  const factor = food.serving_grams > 0 ? quantityGrams / food.serving_grams : 0;
  return {
    calories: food.calories * factor,
    protein_g: food.protein_g * factor,
    carbs_g: food.carbs_g * factor,
    fat_g: food.fat_g * factor,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein_g: a.protein_g + b.protein_g,
    carbs_g: a.carbs_g + b.carbs_g,
    fat_g: a.fat_g + b.fat_g,
  };
}

export function mealMacros(meal: MealWithItems): Macros {
  return meal.items.reduce<Macros>((acc, it) => {
    if (!it.food) return acc;
    return addMacros(acc, itemMacros(it.food, it.quantity_grams));
  }, { ...EMPTY_MACROS });
}

export function dayMacros(day: DayWithMeals): Macros {
  return day.meals.reduce<Macros>((acc, m) => addMacros(acc, mealMacros(m)), { ...EMPTY_MACROS });
}

export function roundMacros(m: Macros): Macros {
  return {
    calories: Math.round(m.calories),
    protein_g: Math.round(m.protein_g),
    carbs_g: Math.round(m.carbs_g),
    fat_g: Math.round(m.fat_g),
  };
}
