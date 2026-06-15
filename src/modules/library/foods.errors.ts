export class FoodsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "FoodsError";
  }
}
