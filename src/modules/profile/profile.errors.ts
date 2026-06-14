export class ProfileError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 500
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

export class ProfileUpdateError extends ProfileError {
  constructor(message = "Failed to update profile") {
    super(message, "PROFILE_UPDATE_FAILED", 500);
    this.name = "ProfileUpdateError";
  }
}

export class CoachProfileUpdateError extends ProfileError {
  constructor(message = "Failed to update coach profile") {
    super(message, "COACH_PROFILE_UPDATE_FAILED", 500);
    this.name = "CoachProfileUpdateError";
  }
}
