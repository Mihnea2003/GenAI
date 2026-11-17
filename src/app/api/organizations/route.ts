import { connection } from "next/server";
import { listOrganizations } from "@/server/events-service";
import { withErrorHandling } from "@/server/http";

/** GET /api/organizations -> all organizations (public; used by filters and the event form). */
export const GET = withErrorHandling(async () => {
  await connection(); // always read live data; never prerender at build time
  return Response.json({ organizations: await listOrganizations() });
});
