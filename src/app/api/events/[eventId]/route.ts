import { getOptionalUser, requireUser } from "@/server/auth";
import { getEvent, updateEvent } from "@/server/events-service";
import { readJsonBody, withErrorHandling, type EventRouteContext } from "@/server/http";

/** GET /api/events/{eventId} -> event details (drafts only for the organization's organizers). */
export const GET = withErrorHandling(async (request: Request, { params }: EventRouteContext) => {
  const { eventId } = await params;
  const user = await getOptionalUser(request);
  return Response.json({ event: await getEvent(eventId, user) });
});

/** PATCH /api/events/{eventId} -> update details and/or status. Organizers of the event's organization only. */
export const PATCH = withErrorHandling(async (request: Request, { params }: EventRouteContext) => {
  const { eventId } = await params;
  const user = await requireUser(request);
  return Response.json({ event: await updateEvent(user, eventId, await readJsonBody(request)) });
});
