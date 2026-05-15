export class ClientsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ClientsError";
  }
}

export class ClientLimitReachedError extends ClientsError {
  constructor() {
    super("Client limit reached for this subscription tier", "client_limit_reached");
  }
}

export class InviteAlreadySentError extends ClientsError {
  constructor() {
    super("A pending invite already exists for this email", "invite_already_sent");
  }
}

export class InvalidInviteTokenError extends ClientsError {
  constructor() {
    super("Invite token is invalid or expired", "invalid_invite_token");
  }
}
