export class WorkoutLogsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WorkoutLogsError";
  }
}
