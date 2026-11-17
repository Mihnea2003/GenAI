import { requireUser } from "@/server/auth";
import { withErrorHandling, type EventRouteContext } from "@/server/http";
import { cancelRegistration, getMyRegistration, registerForEvent } from "@/server/registrations-service";

/** The signed-in user's own registration for one event. */

/** GET -> { registration } (null when the user never registered). */
export const GET = withErrorHandling(async (request: Request, { params }: EventRouteContext) => {
  const { eventId } = await params;
  const user = await requireUser(request);
  return Response.json({ registration: await getMyRegistration(user, eventId) });
});

/** POST -> register (201). Errors: ALREADY_REGISTERED, EVENT_FULL, EVENT_CANCELLED, EVENT_NOT_PUBLISHED, ... */
export const POST = withErrorHandling(async (request: Request, { params }: EventRouteContext) => {
  const { eventId } = await params;
  const user = await requireUser(request);
  return Response.json({ registration: await registerForEvent(user, eventId) }, { status: 201 });
});

/** DELETE -> cancel the registration and free the seat. */
export const DELETE = withErrorHandling(async (request: Request, { params }: EventRouteContext) => {
  const { eventId } = await params;
  const user = await requireUser(request);
  return Response.json({ registration: await cancelRegistration(user, eventId) });
});
