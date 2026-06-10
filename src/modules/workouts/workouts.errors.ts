export class WorkoutsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "WorkoutsError";
  }
}
