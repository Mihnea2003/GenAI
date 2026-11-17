import { requireUser } from "@/server/auth";
import { withErrorHandling, type EventRouteContext } from "@/server/http";
import { listEventRegistrations } from "@/server/registrations-service";

/** GET /api/events/{eventId}/registrations -> participant list for the event's organizers. */
export const GET = withErrorHandling(async (request: Request, { params }: EventRouteContext) => {
  const { eventId } = await params;
  const user = await requireUser(request);
  return Response.json({ registrations: await listEventRegistrations(user, eventId) });
});
