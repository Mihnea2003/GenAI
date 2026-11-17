"use client";

/**
 * Typed browser client for the UBB Events API (contract: docs/backend-api.md).
 * Attaches the signed-in user's Firebase ID token automatically.
 *
 * Every function throws ApiClientError on failure; switch on `error.code`
 * (e.g. "EVENT_FULL", "ALREADY_REGISTERED") to show the right UI state.
 */
import type {
  ApiErrorBody,
  ApiErrorCode,
  CreateEventInput,
  EventDto,
  EventRegistrationDto,
  ListEventsFilters,
  MyRegistrationDto,
  Organization,
  RegistrationDto,
  UpdateEventInput,
  UserProfile,
} from "./api-types";
import { getFirebaseAuth } from "./firebase";

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type RequestOptions = { method?: string; body?: unknown; requireAuth?: boolean };

async function request<T>(path: string, { method = "GET", body, requireAuth = false }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const user = getFirebaseAuth().currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  else if (requireAuth) throw new ApiClientError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(0, "INTERNAL", "Could not reach the server. Check your connection and try again.");
  }

  const data = (await response.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null;
  if (!response.ok) {
    const error = data?.error;
    throw new ApiClientError(
      response.status,
      error?.code ?? "INTERNAL",
      error?.message ?? "The request failed. Please try again.",
      error?.field,
    );
  }
  return data as T;
}

const eventPath = (eventId: string) => `/api/events/${encodeURIComponent(eventId)}`;

// --- Profile & organizations ------------------------------------------------

export async function getMe(): Promise<UserProfile> {
  return (await request<{ user: UserProfile }>("/api/me", { requireAuth: true })).user;
}

export async function listOrganizations(): Promise<Organization[]> {
  return (await request<{ organizations: Organization[] }>("/api/organizations")).organizations;
}

// --- Events (students) ------------------------------------------------------

export async function listPublishedEvents(filters: ListEventsFilters = {}): Promise<EventDto[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.organizationId) params.set("organizationId", filters.organizationId);
  if (filters.includePast) params.set("includePast", "true");
  const query = params.toString();
  return (await request<{ events: EventDto[] }>(`/api/events${query ? `?${query}` : ""}`)).events;
}

export async function getEvent(eventId: string): Promise<EventDto> {
  return (await request<{ event: EventDto }>(eventPath(eventId))).event;
}

// --- Registrations (students) -----------------------------------------------

/** Null when the user has never registered for this event. */
export async function getMyRegistration(eventId: string): Promise<RegistrationDto | null> {
  return (await request<{ registration: RegistrationDto | null }>(`${eventPath(eventId)}/registration`, { requireAuth: true }))
    .registration;
}

export async function registerForEvent(eventId: string): Promise<RegistrationDto> {
  return (await request<{ registration: RegistrationDto }>(`${eventPath(eventId)}/registration`, {
    method: "POST",
    requireAuth: true,
  })).registration;
}

export async function cancelRegistration(eventId: string): Promise<RegistrationDto> {
  return (await request<{ registration: RegistrationDto }>(`${eventPath(eventId)}/registration`, {
    method: "DELETE",
    requireAuth: true,
  })).registration;
}

export async function listMyRegistrations(): Promise<MyRegistrationDto[]> {
  return (await request<{ registrations: MyRegistrationDto[] }>("/api/me/registrations", { requireAuth: true }))
    .registrations;
}

// --- Events (organizers) ----------------------------------------------------

export async function listManagedEvents(organizationId?: string): Promise<EventDto[]> {
  const query = new URLSearchParams({ scope: "manage" });
  if (organizationId) query.set("organizationId", organizationId);
  return (await request<{ events: EventDto[] }>(`/api/events?${query}`, { requireAuth: true })).events;
}

export async function createEvent(input: CreateEventInput): Promise<EventDto> {
  return (await request<{ event: EventDto }>("/api/events", { method: "POST", body: input, requireAuth: true })).event;
}

export async function updateEvent(eventId: string, patch: UpdateEventInput): Promise<EventDto> {
  return (await request<{ event: EventDto }>(eventPath(eventId), { method: "PATCH", body: patch, requireAuth: true }))
    .event;
}

export async function listEventRegistrations(eventId: string): Promise<EventRegistrationDto[]> {
  return (await request<{ registrations: EventRegistrationDto[] }>(`${eventPath(eventId)}/registrations`, {
    requireAuth: true,
  })).registrations;
}
