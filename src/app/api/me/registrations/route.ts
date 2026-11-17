import { requireUser } from "@/server/auth";
import { withErrorHandling } from "@/server/http";
import { listMyRegistrations } from "@/server/registrations-service";

/** GET /api/me/registrations -> the caller's registrations with event details. */
export const GET = withErrorHandling(async (request: Request) => {
  const user = await requireUser(request);
  return Response.json({ registrations: await listMyRegistrations(user) });
});
