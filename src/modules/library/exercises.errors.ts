export class ExercisesError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ExercisesError";
  }
}
