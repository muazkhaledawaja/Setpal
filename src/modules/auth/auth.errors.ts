export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", "invalid_credentials");
  }
}

export class EmailAlreadyInUseError extends AuthError {
  constructor() {
    super("Email already registered", "email_in_use");
  }
}
