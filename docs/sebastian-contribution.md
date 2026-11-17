# Individual Contribution: Sebastian Boboc

> **Draft:** Sebastian must review this statement and correct anything that does not match the work he actually did and understood before submission.

**Role:** Backend and business logic: Firebase-backed application operations.

## Delivered

- **Firebase setup for local development.** Firebase emulator configuration (`firebase.json`), a demo project that needs no credentials, `.env.example` with documented variables, `.gitignore` rules for `.env.local` and service-account keys, a seed script (`npm run seed`), and a role-assignment admin tool (`npm run set-role`).
- **Firestore model.** `users`, `organizations`, `events` and `registrations` as documented in `docs/backend-api.md`. Deterministic registration ids for duplicate prevention, a transactional `registeredCount` for capacity, and a denormalized `organizationId` on registrations for the security rules.
- **Event operations** (`src/server/events-service.ts`, `src/app/api/events/**`): public listing with search and filters, details with draft visibility, create, update, enforced status transitions, terminal-state locking, capacity floor, and organizer-of-organization checks.
- **Registration operations** (`src/server/registrations-service.ts`): register, cancel and re-register with duplicate and capacity checks in a single Firestore transaction. Distinct errors for full, cancelled, unpublished, completed and started events. The student's own registration list and the organizer participant list.
- **Authorization.** ID-token verification and server-side role lookup (`src/server/auth.ts`), plus Firestore security rules (`firestore.rules`) that block direct client writes and role escalation.
- **Tests.** Unit tests for registration and permission rules. Emulator integration tests for the services, the HTTP route handlers with real Auth-emulator tokens (including a concurrency test for capacity), and the security rules.
- **Integration.** The typed client `src/lib/api-client.ts` and the `useAuth` hook as the contract for Ioana's student workflow. Mihnea's organizer dashboard connected to the persistent API, with sign-in.
- **Documentation.** `docs/backend-api.md` (setup, schema, operations, errors, tests) and this statement.

## Definition of done: evidence

- A student registration persists in Firestore: `tests/emulator/api.test.ts › student registration (persistent)`.
- An organizer event update persists, and the same request from a student is rejected: `tests/emulator/api.test.ts › organizer event update (persistent)`.
- Permission and capacity rules are tested in `events.test.ts`, `registrations.test.ts` (including concurrent registrations) and `rules.test.ts`.

## Changes to teammates' code

- `src/lib/event-lifecycle.ts`: the `organization` text field became `organizationId`, as the API contract proposed. Added field-level validation errors, a `requireFutureStart` option, and `isTerminalStatus`. Mihnea's existing tests still pass, with only the fixture field renamed.
- `src/app/events-dashboard.tsx`: sample data replaced with API calls. The layout and styles are unchanged.
