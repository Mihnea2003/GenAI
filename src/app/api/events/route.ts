import type { NextRequest } from "next/server";
import { getOptionalUser, requireUser } from "@/server/auth";
import { createEvent, listManagedEvents, listPublishedEvents } from "@/server/events-service";
import { validationError } from "@/server/errors";
import { readJsonBody, withErrorHandling } from "@/server/http";

/**
 * GET /api/events                     -> published events (public)
 *     ?q=&organizationId=&includePast=true
 * GET /api/events?scope=manage        -> all events of the organizer's organization (auth)
 *     &organizationId=                   (admins may pick any organization)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const scope = params.get("scope") ?? "public";
  const organizationId = params.get("organizationId") ?? undefined;

  if (scope === "manage") {
    const user = await requireUser(request);
    return Response.json({ events: await listManagedEvents(user, organizationId) });
  }
  if (scope !== "public") throw validationError("scope must be 'public' or 'manage'.", "scope");

  const includePast = params.get("includePast");
  if (includePast !== null && includePast !== "true" && includePast !== "false") {
    throw validationError("includePast must be 'true' or 'false'.", "includePast");
  }
  await getOptionalUser(request); // rejects malformed/expired tokens consistently
  const events = await listPublishedEvents({
    q: params.get("q") ?? undefined,
    organizationId,
    includePast: includePast === "true",
  });
  return Response.json({ events });
});

/** POST /api/events -> create an event as draft (default) or published. Organizers only. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser(request);
  const event = await createEvent(user, await readJsonBody(request));
  return Response.json({ event }, { status: 201 });
});
