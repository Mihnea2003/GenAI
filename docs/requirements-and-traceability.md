# Requirements, Use Cases, and Traceability

**Status:** Initial team proposal; validate with interview findings before treating assumptions as confirmed user needs.

## Problem and scope

Student organizations at Babeș-Bolyai University coordinate events through multiple people and information channels. UBB Events aims to provide one place for organization members to prepare and publish event details, while students discover events and register. The mid-term MVP is limited to authentication, organization membership, event lifecycle, discovery, registration with capacity rules, and attendance status. Payments, automated messaging, analytics, and university-wide integrations are out of scope.

## High-level requirements

| ID | Requirement | Mid-term acceptance evidence |
| --- | --- | --- |
| HR-01 | Authorized organization members can create and edit events. | Event form and permission rule; required field validation. |
| HR-02 | Organizers can keep an event in draft or publish it. | Draft is not listed to students; published event is discoverable. |
| HR-03 | Students can find and inspect published events. | Search/list and event details include schedule, venue, organization, and capacity. |
| HR-04 | Eligible students can register subject to capacity and duplicate rules. | Successful registration and tested full/duplicate rejection. |
| HR-05 | Organizers can review registrations and record attendance. | Organizer view and attendance status update. |
| HR-06 | The application persists its managed data. | Firebase integration and security rules; currently pending in prototype. |
| HR-07 | The application separates presentation, application logic, and persistence. | Architecture document and code boundaries. |
| HR-08 | Important business behavior is tested automatically. | Unit tests for event validation and lifecycle transitions. |

## Actors and permissions

| Actor | Responsibilities and access |
| --- | --- |
| Student | Browse published events, view event information, register/cancel their own registration, view their own registration status. |
| Organizer | Create and edit events for an organization they belong to; view registrations; record attendance. |
| Organization administrator | Manage organization membership and organizer permissions; supervise organization events. |
| Platform administrator | Maintain platform configuration and handle platform-level administration. Not required for the first MVP workflow. |

Authorization must be enforced by trusted server-side code or Firebase security rules. Hiding a button in the frontend is not an authorization control.

## Use cases

### UC-01: Create and publish an event
- **Primary actor:** Organizer
- **Preconditions:** Authenticated; organizer is authorized for the selected organization.
- **Main flow:** Enter event details; system validates dates, capacity, and required fields; save as draft or publish; published event becomes visible to students.
- **Alternatives:** Invalid fields are rejected with actionable feedback; unauthorized requests are rejected; an event may remain a draft.
- **Postcondition:** Event is stored with its organization, creator, timestamps, and status.

### UC-02: Edit an event
- **Primary actor:** Organizer
- **Preconditions:** Event exists; actor has permission for its organization.
- **Main flow:** Open event; update allowed fields; system validates; save changes.
- **Alternative:** A completed or cancelled event is not reopened through ordinary editing.

### UC-03: Discover events
- **Primary actor:** Student
- **Preconditions:** Event is published and not cancelled.
- **Main flow:** Search or browse; open details; review schedule, venue, organization, and capacity.

### UC-04: Register for an event
- **Primary actor:** Student
- **Preconditions:** Authenticated; event is published; registration is open.
- **Main flow:** Request registration; system checks existing registration and capacity; persist one registration; show its status.
- **Alternatives:** Reject duplicate registration, full capacity, or closed/cancelled event.

### UC-05: Record attendance
- **Primary actor:** Organizer
- **Preconditions:** Event has taken place; actor is authorized for its organization.
- **Main flow:** Open participant list; mark each registration present or absent; persist the change.

## Event lifecycle and initial rules

- Statuses: `draft`, `published`, `completed`, `cancelled`.
- Allowed transitions: `draft -> published`, `draft -> cancelled`, `published -> completed`, `published -> cancelled`.
- `completed` and `cancelled` are terminal in the MVP.
- Event title, description, start/end, location, organization, and positive whole-number capacity are required in this initial form.
- Start must be in the future when saving through the current prototype; end must be later than start.
- Only authenticated users can register; event visibility and registration eligibility are distinct from organizer access.
- Registration writes must enforce one registration per user/event and capacity atomically in the persistence layer.
- The frontend prototype demonstrates UI and validation only; it is not the security or persistence boundary.

## Traceability matrix

| Source requirement | Use case / workflow | Implementation or artifact | Verification status |
| --- | --- | --- | --- |
| R1, R4, R5 | UC-01, UC-02: event create/edit/publish | `src/app/events-dashboard.tsx`; `src/lib/event-lifecycle.ts` | Lifecycle tests and build; demo state only. |
| R2 | UC-01: organization-scoped authorization | Architecture and permission requirements | Firebase Auth and server-side enforcement pending. |
| R3 | UC-04: student registration | Requirements and API contract | Backend and registration flow pending. |
| R6 | UC-03: search/discovery | Search control in event dashboard | Prototype search; student discovery view pending. |
| R7 | UC-01 through UC-05 | Firebase/Firestore architecture | Persistence not yet connected. |
| R8, R9 | Workflow and API boundary | `docs/event-lifecycle-and-api.md` | Contract documented; server implementation pending. |
| R10 | UC-01, UC-03, UC-04 | Event dashboard prototype | Build check; user validation pending. |
| R11 | Event validation and transition rules | `src/lib/event-lifecycle.test.ts` | `npm test` must be run before submission. |
| R12 | Local development now; Render later | README and architecture | Local build; Render deployment is future work. |
| R13, R14 | GenAI/human review record | `docs/genai-usage-report.md` | This session recorded; team report incomplete. |
| R15 | This table | Requirements to tests mapping | Update as team integrates features. |
| R16 | Team ownership | `docs/team-roles.md` and contribution statements | Teammate statements still required. |