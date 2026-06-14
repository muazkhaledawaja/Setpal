export class FormsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "FormsError";
  }
}

export class TemplateNotFoundError extends FormsError {
  constructor(templateId?: string) {
    super(
      templateId ? `Template ${templateId} not found` : "Template not found",
      "TEMPLATE_NOT_FOUND",
      404
    );
    this.name = "TemplateNotFoundError";
  }
}

export class TemplateAccessDeniedError extends FormsError {
  constructor() {
    super("You don't have permission to access this template", "TEMPLATE_ACCESS_DENIED", 403);
    this.name = "TemplateAccessDeniedError";
  }
}

export class QuestionNotFoundError extends FormsError {
  constructor(questionId?: string) {
    super(
      questionId ? `Question ${questionId} not found` : "Question not found",
      "QUESTION_NOT_FOUND",
      404
    );
    this.name = "QuestionNotFoundError";
  }
}

export class AssignmentNotFoundError extends FormsError {
  constructor(assignmentId?: string) {
    super(
      assignmentId ? `Assignment ${assignmentId} not found` : "Assignment not found",
      "ASSIGNMENT_NOT_FOUND",
      404
    );
    this.name = "AssignmentNotFoundError";
  }
}

export class AssignmentAccessDeniedError extends FormsError {
  constructor() {
    super("You don't have permission to access this assignment", "ASSIGNMENT_ACCESS_DENIED", 403);
    this.name = "AssignmentAccessDeniedError";
  }
}

export class AssignmentAlreadyExistsError extends FormsError {
  constructor() {
    super("An active assignment already exists for this client and template", "ASSIGNMENT_ALREADY_EXISTS", 409);
    this.name = "AssignmentAlreadyExistsError";
  }
}

export class ResponseNotFoundError extends FormsError {
  constructor() {
    super("Response not found", "RESPONSE_NOT_FOUND", 404);
    this.name = "ResponseNotFoundError";
  }
}

export class InvalidQuestionTypeError extends FormsError {
  constructor(type?: string) {
    super(
      type ? `Invalid question type: ${type}` : "Invalid question type",
      "INVALID_QUESTION_TYPE",
      400
    );
    this.name = "InvalidQuestionTypeError";
  }
}

export class ValidationError extends FormsError {
  constructor(
    public readonly fieldErrors: Record<string, string[]>,
    message = "Validation failed"
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class FileUploadError extends FormsError {
  constructor(message: string) {
    super(message, "FILE_UPLOAD_ERROR", 400);
    this.name = "FileUploadError";
  }
}

export class FileSizeExceededError extends FormsError {
  constructor(maxSizeMb: number) {
    super(`File size exceeds maximum allowed (${maxSizeMb}MB)`, "FILE_SIZE_EXCEEDED", 413);
    this.name = "FileSizeExceededError";
  }
}

export class FileTypeNotAllowedError extends FormsError {
  constructor(allowedTypes: string[]) {
    super(`File type not allowed. Allowed: ${allowedTypes.join(", ")}`, "FILE_TYPE_NOT_ALLOWED", 400);
    this.name = "FileTypeNotAllowedError";
  }
}

export class ConditionalLogicError extends FormsError {
  constructor(message: string) {
    super(message, "CONDITIONAL_LOGIC_ERROR", 400);
    this.name = "ConditionalLogicError";
  }
}

export class SchedulerError extends FormsError {
  constructor(message: string) {
    super(message, "SCHEDULER_ERROR", 500);
    this.name = "SchedulerError";
  }
}

export function isFormsError(error: unknown): error is FormsError {
  return error instanceof FormsError;
}

export function getFormsErrorMessage(error: unknown): string {
  if (isFormsError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}