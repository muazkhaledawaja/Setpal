import type { Database } from "@/types/database";

type T = Database["public"]["Tables"];
export type MealPlanRow = T["meal_plans"]["Row"];
export type MealPlanDayRow = T["meal_plan_days"]["Row"];
export type MealPlanMealRow = T["meal_plan_meals"]["Row"];
export type MealPlanItemRow = T["meal_plan_items"]["Row"];
export type FoodRow = T["foods"]["Row"];

export type ItemWithFood = MealPlanItemRow & { food: FoodRow | null };
export type MealWithItems = MealPlanMealRow & { items: ItemWithFood[] };
export type DayWithMeals = MealPlanDayRow & { meals: MealWithItems[] };
export type MealPlanWithDays = MealPlanRow & { days: DayWithMeals[] };
