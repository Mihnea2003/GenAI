import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ApiError, validationError } from "./errors";

/** Converts thrown ApiErrors into the documented JSON error shape; hides unexpected errors. */
export function withErrorHandling<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Let Next.js control-flow errors (e.g. "bail out of prerendering") propagate untouched.
      unstable_rethrow(error);
      if (error instanceof ApiError) return Response.json(error.toBody(), { status: error.status });
      console.error("Unhandled API error", error);
      return Response.json(
        { error: { code: "INTERNAL", message: "Unexpected server error. Please try again." } },
        { status: 500 },
      );
    }
  };
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw validationError("The request body must be valid JSON.");
  }
}

export type EventRouteContext = { params: Promise<{ eventId: string }> };
