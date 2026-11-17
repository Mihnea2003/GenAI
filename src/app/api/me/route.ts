import { requireUser } from "@/server/auth";
import { withErrorHandling } from "@/server/http";

/** GET /api/me -> the caller's profile and role (a student profile is created on first call). */
export const GET = withErrorHandling(async (request: Request) => {
  return Response.json({ user: await requireUser(request) });
});
