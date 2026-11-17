# Backend: Firebase Setup, Schema, and API Contract

**Owner:** Sebastian Boboc (Firebase-backed application operations)
**Status:** Implemented and tested against the Firebase emulators. Implements the operations proposed in `docs/event-lifecycle-and-api.md`.

## 1. Architecture

```text
Browser (React)                     Next.js server (trusted)                 Firebase
---------------                     ------------------------                 --------
Firebase Auth sign-in  ── ID token ─▶ src/app/api/**/route.ts  (HTTP layer)
src/lib/api-client.ts  ── fetch ───▶ src/server/auth.ts         (verify token, load role)
                                    src/server/*-service.ts    (business rules) ── Admin SDK ─▶ Firestore
Firebase client SDK  ───── direct reads only, guarded by firestore.rules ─────────────────────▶ Firestore
```

- **All writes to events and registrations go through the API.** The server verifies the Firebase ID token, loads the caller's role from `users/{uid}`, and enforces permissions, status transitions, duplicate prevention and capacity.
- **Firestore security rules** (`firestore.rules`) are a second line of defense. A user who calls Firestore directly with the client SDK can read only what they may see, and cannot write events, registrations, or their own role.
- Shared, framework-free rules live in `src/lib/` (`event-lifecycle.ts`, `registration-rules.ts`). The UI uses them for instant feedback and the server uses them as the authority.

## 2. Local setup

Requirements: Node 20+, Java 11+ (for the Firestore emulator). `firebase-tools` is installed as a dev dependency, so no global install is needed.

```bash
npm install
cp .env.example .env.local     # defaults already target the emulators
npm run emulators              # terminal 1: Auth :9099, Firestore :8085, UI http://localhost:4000
npm run seed                   # terminal 2: demo organizations, accounts and events
npm run dev                    # terminal 2: http://localhost:3000
```

Seeded accounts (password `Passw0rd!`):

| Email | Role |
| --- | --- |
| `organizer@ubbevents.test` | organizer of `cs-student-club` |
| `debate.organizer@ubbevents.test` | organizer of `debate-society` |
| `admin@ubbevents.test` | platform admin |
| `student@ubbevents.test`, `student2@ubbevents.test` | students |

The emulator data is in-memory and is lost when the emulator stops. Run `npm run seed` again after restarting it.

> The Firestore emulator uses port **8085** rather than the default 8080, which is often taken by XAMPP/Apache or Tomcat.

### Using a real Firebase project

1. In the Firebase console, create a project, enable **Authentication → Email/Password**, and create a **Firestore** database.
2. In `.env.local`, fill the `NEXT_PUBLIC_FIREBASE_*` values from *Project settings → Your apps*, set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`, set `FIREBASE_PROJECT_ID`, and delete the two `*_EMULATOR_HOST` lines.
3. Add server credentials: *Project settings → Service accounts → Generate new private key*. Copy `client_email` to `FIREBASE_CLIENT_EMAIL` and `private_key` to `FIREBASE_PRIVATE_KEY` (in quotes, keeping the `\n` escapes). **Never commit this key or `.env.local`.** Both are git-ignored.
4. Deploy the rules: `npx firebase deploy --only firestore:rules --project <project-id>`.
5. Grant organizer access after the person signs up: `npm run set-role -- someone@example.com organizer cs-student-club "Computer Science Student Club"`.

### Environment variables

| Variable | Where used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | browser | Public web-app config, not secret |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | browser | `true` connects the client SDK to local emulators |
| `FIREBASE_PROJECT_ID` | server | Must match the client project id |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST` | server, scripts | Emulator mode only |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | server, scripts | Real project only; **secret**; never prefix with `NEXT_PUBLIC_` |

## 3. Firestore schema

| Collection | Document id | Fields |
| --- | --- | --- |
| `users` | Firebase Auth uid | `email`, `displayName`, `role` (`student` \| `organizer` \| `admin`), `organizationId` (string \| null), `createdAt` |
| `organizations` | slug, e.g. `cs-student-club` | `name`, `description`, `createdAt` |
| `events` | auto id | `organizationId`, `organizationName` (denormalized), `title`, `description`, `startDate`, `endDate` (Timestamp), `location`, `capacity`, `registeredCount`, `status` (`draft` \| `published` \| `completed` \| `cancelled`), `createdBy`, `createdAt`, `updatedAt` |
| `registrations` | `{eventId}_{userId}` | `eventId`, `userId`, `organizationId` (copied from event, for rules), `status` (`confirmed` \| `cancelled`), `registeredAt`, `cancelledAt`, `userEmail`, `userDisplayName` |

Design decisions:

- **Duplicate prevention by construction.** The registration id is deterministic, so one user can have at most one registration document per event. Cancelling sets `status: "cancelled"`, and registering again reuses the same document.
- **Atomic capacity.** `events.registeredCount` holds the number of confirmed registrations. Register and cancel run as one Firestore transaction: read the event and the registration, check the rules, write the registration, and update the counter. Firestore retries the transaction if another request changes either document in the meantime, so the last seat cannot be given twice. A test fires 10 concurrent registrations at a 3-seat event to verify this.
- **Roles come from Firestore, not from the client.** A first-time user gets a `student` profile. Organizer and admin roles are assigned only with `npm run set-role` (Admin SDK). The rules prevent users from changing `role` or `organizationId`.
- Registration `status: "pending"` (from the initial data model) is not used. Registrations are confirmed immediately in the MVP. Attendance is not implemented yet. Its collection is denied by default in the rules.

## 4. Business rules enforced by the server

| Rule | Where |
| --- | --- |
| Only organizers of the event's organization, or admins, can create, update or change the status of events | `canManageOrganization`, `events-service.ts` |
| Status transitions: `draft→published`, `draft→cancelled`, `published→completed`, `published→cancelled`. `completed` and `cancelled` are terminal and locked against edits | `canTransitionEventStatus`, `updateEvent` |
| Required fields, positive whole-number capacity, end after start, start in the future when creating, publishing or moving the start date | `validateEventDraftFields` |
| Dates must be ISO 8601 with a timezone (`Date#toISOString()`) | `events-service.ts` |
| Capacity cannot be lowered below the current confirmed registrations; an event cannot move to another organization | `updateEvent` |
| Drafts are invisible (404) to anyone who cannot manage them | `canViewEvent` |
| Registration requires a signed-in user, a published event that has not started, free capacity, and no existing confirmed registration | `registrationBlockReason`, `registerForEvent` |
| Cancellation requires a confirmed registration; not allowed after the event is completed | `cancelRegistration` |

## 5. HTTP API

Authenticated requests send `Authorization: Bearer <Firebase ID token>`. `src/lib/api-client.ts` does this automatically. All bodies are JSON.

| Method & path | Auth | Body / query | Success |
| --- | --- | --- | --- |
| `GET /api/events` | optional | `?q=&organizationId=&includePast=true` | `200 { events: EventDto[] }`: published, upcoming, sorted by start |
| `GET /api/events?scope=manage` | organizer/admin | `&organizationId=` (admins) | `200 { events }`: every status for the caller's organization |
| `POST /api/events` | organizer/admin | `CreateEventInput` (`status`: `draft` default or `published`) | `201 { event }` |
| `GET /api/events/{id}` | optional | | `200 { event }` |
| `PATCH /api/events/{id}` | organizer/admin | any of `title, description, startDate, endDate, location, capacity, status` | `200 { event }` |
| `GET /api/events/{id}/registration` | signed in | | `200 { registration: RegistrationDto \| null }` |
| `POST /api/events/{id}/registration` | signed in | | `201 { registration }` |
| `DELETE /api/events/{id}/registration` | signed in | | `200 { registration }` (status `cancelled`) |
| `GET /api/events/{id}/registrations` | organizer/admin | | `200 { registrations: EventRegistrationDto[] }` |
| `GET /api/me` | signed in | | `200 { user: UserProfile }` |
| `GET /api/me/registrations` | signed in | | `200 { registrations: MyRegistrationDto[] }` |
| `GET /api/organizations` | public | | `200 { organizations }` |

The type definitions are in `src/lib/api-types.ts`. `EventDto` includes `organizationName`, `registeredCount` and `remainingCapacity`, so the student pages need no extra lookups.

### Errors

```json
{ "error": { "code": "EVENT_FULL", "message": "This event is full.", "field": "capacity?" } }
```

| Status | `code` | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid input. `field` names the first offending field |
| 400 | `INVALID_STATUS_TRANSITION` | Transition not allowed by the lifecycle |
| 400 | `ORGANIZATION_NOT_FOUND` | Unknown `organizationId` |
| 401 | `UNAUTHENTICATED` | Missing, invalid or expired token |
| 403 | `FORBIDDEN` | Signed in but not allowed (e.g. a student editing an event) |
| 404 | `EVENT_NOT_FOUND` | Missing event, or a draft the caller may not see |
| 404 | `NOT_REGISTERED` | Cancelling without an active registration |
| 409 | `EVENT_LOCKED` | Editing a completed or cancelled event |
| 409 | `ALREADY_REGISTERED` | Duplicate registration |
| 409 | `EVENT_FULL` | No seats left |
| 409 | `EVENT_CANCELLED` / `EVENT_NOT_PUBLISHED` / `EVENT_CLOSED` / `REGISTRATION_CLOSED` | Event is cancelled / still a draft / completed / already started |
| 500 | `INTERNAL` | Unexpected error (details only in server logs) |

## 6. Contract for the student workflow (Ioana)

```tsx
import * as api from "@/lib/api-client";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";

const events = await api.listPublishedEvents({ q: "git" });   // browse + search
const event = await api.getEvent(id);                          // details: schedule, location, organizationName, remainingCapacity
const mine = await api.getMyRegistration(id);                  // null | { status: "confirmed" | "cancelled" }

try {
  await api.registerForEvent(id);                              // success state
} catch (e) {
  if (e instanceof ApiClientError) {
    switch (e.code) {
      case "ALREADY_REGISTERED": /* already-registered state */ break;
      case "EVENT_FULL":         /* full state */ break;
      case "UNAUTHENTICATED":    /* ask to sign in */ break;
      default:                   /* show e.message */
    }
  }
}
await api.cancelRegistration(id);
const myList = await api.listMyRegistrations();
```

- Wait for `useAuth().loading === false` before calling signed-in endpoints, because the Firebase session is restored asynchronously.
- `registrationBlockReason(event)` from `src/lib/registration-rules.ts` can pre-select the button state (e.g. show "Full" without a request). The server remains the authority.
- `src/app/auth-panel.tsx` is a ready email/password sign-in and sign-up component.

## 7. Organizer workflow integration (Mihnea)

`src/app/events-dashboard.tsx` now uses persistent data:

- sign-in through Firebase Auth; students see an "organizer access required" message
- the organization is chosen from Firestore, replacing the free-text field; organizers see only their own organization
- create (draft or published), edit, publish, discard, mark complete and cancel all call the API and show server errors
- the list shows `registeredCount/capacity`

## 8. Tests

| Command | What runs | Needs |
| --- | --- | --- |
| `npm test` | Unit tests for lifecycle, validation, registration and permission rules (`src/**/*.test.ts`) | nothing |
| `npm run test:emulator` | Integration tests in `tests/emulator/`, run against the Auth and Firestore emulators started automatically | Java |
| `npm run test:all` | Both | Java |

The emulator suite covers:

- `events.test.ts`: create and update persistence, permission checks (other organization, student, admin), every status transition, terminal-state lock, capacity floor, draft visibility, search and filters.
- `registrations.test.ts`: register, duplicate, full, cancelled, draft, completed and started events, cancel and re-register, the concurrency test (10 parallel requests, 3 seats), and organizer-only participant lists.
- `api.test.ts`: route handlers called with **real ID tokens** from the Auth emulator. Missing or forged tokens give 401, a student `PATCH` gives 403, an organizer `PATCH` is persisted, and the student register, duplicate and full sequence works.
- `rules.test.ts`: security rules. Draft visibility, no client writes to events or registrations, registration read access, no self-assigned roles, and organization write access.

Windows note: if `npm test` fails with *"Cannot find native binding"* (npm optional-dependency bug), run `npm install --no-save @rolldown/binding-win32-x64-msvc@<version of node_modules/rolldown>`.

## 9. Known limitations

- Text search filters published events in memory. This is fine at student-organization scale but would need a search index for large volumes.
- Attendance tracking (UC-05) and organization membership management are not implemented. `set-role` is the admin tool for now.
- One organization per organizer, matching the initial data model.
