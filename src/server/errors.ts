import type { ApiErrorBody, ApiErrorCode } from "@/lib/api-types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.message, ...(this.field ? { field: this.field } : {}) } };
  }
}

export const unauthenticated = (message = "Sign in to continue.") => new ApiError(401, "UNAUTHENTICATED", message);

export const forbidden = (message = "You do not have permission to perform this action.") =>
  new ApiError(403, "FORBIDDEN", message);

export const validationError = (message: string, field?: string) =>
  new ApiError(400, "VALIDATION_ERROR", message, field);

export const eventNotFound = () => new ApiError(404, "EVENT_NOT_FOUND", "Event not found.");
