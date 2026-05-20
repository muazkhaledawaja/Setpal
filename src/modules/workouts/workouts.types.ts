import type { Database } from "@/types/database";

type T = Database["public"]["Tables"];
export type PlanRow = T["workout_plans"]["Row"];
export type DayRow = T["workout_days"]["Row"];
export type DayExerciseRow = T["workout_day_exercises"]["Row"];
export type ExerciseRow = T["exercises"]["Row"];

export type DayExerciseWithExercise = DayExerciseRow & { exercise: ExerciseRow | null };
export type DayWithExercises = DayRow & { exercises: DayExerciseWithExercise[] };
export type PlanWithDays = PlanRow & { days: DayWithExercises[] };
