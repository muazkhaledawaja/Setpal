/**
 * Lightweight dependency injection container.
 * Register factories, resolve instances, singleton-cached per process.
 *
 * Usage:
 *   container.register("AuthService", () => new AuthService(createClient()));
 *   const auth = container.get<AuthService>("AuthService");
 */

type Factory<T> = () => T | Promise<T>;

class Container {
  private registry = new Map<string, Factory<unknown>>();
  private singletons = new Map<string, unknown>();

  register<T>(key: string, factory: Factory<T>): void {
    this.registry.set(key, factory);
  }

  async get<T>(key: string): Promise<T> {
    if (this.singletons.has(key)) {
      return this.singletons.get(key) as T;
    }
    const factory = this.registry.get(key);
    if (!factory) {
      throw new Error(`DI: service "${key}" not registered`);
    }
    const instance = await factory();
    this.singletons.set(key, instance);
    return instance as T;
  }

  reset(): void {
    this.singletons.clear();
  }
}

export const container = new Container();
