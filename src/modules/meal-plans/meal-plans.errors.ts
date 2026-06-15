export class MealPlansError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "MealPlansError";
  }
}
