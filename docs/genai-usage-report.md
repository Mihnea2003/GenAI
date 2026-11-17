# GenAI Usage Report (Mihnea Bucur contribution)

**Scope:** This draft records the AI-assisted project foundation and event-lifecycle work visible in Mihnea's Copilot sessions. It is not the complete team report; each teammate should add their own actual usage and Mihnea should review the record before submission.

## Tools used
- GitHub Copilot in VS Code; the model identifier was not available in the session context.

## Purpose and artifacts
- Scaffolded the Next.js + TypeScript project and drafted the README, project foundation, team-role outline, initial data model, Firebase client setup, and environment example.
- Refined the assignment into event-lifecycle requirements, actors, use cases, proposed business rules, architecture notes, and traceability.
- Drafted a proposed API contract and an interview guide, with simulated assumptions explicitly separated from real user research.
- Generated an event-management prototype, event validation/transition logic, focused unit tests, and Mihnea's contribution/report drafts.

## Human review and verification
- The student specified React/TypeScript, Firebase, Render as a future target, the team roles, and the required MVP.
- The student selected a local deployment target for the mid-term and Render as a future target; the initial foundation was adjusted to those constraints.
- The student explicitly said real interviews are not currently possible. Accordingly, the research document labels assumptions as simulated and states that no interviews occurred.
- The prototype labels its sample records as local and unsaved. Its UI is not represented as a deployed, authenticated, or persistent system.
- The event rule tests passed (7 tests), the Next.js production build passed, and ESLint completed without reported issues in this session.
- The student must review the generated artifacts, update decisions with the team, and ensure the contribution statement is accurate.

## Material human decisions
- Rejected presenting a fictional interview as real user research.
- Kept Firebase persistence, authentication, and server-side authorization explicitly pending rather than implying they were implemented.
- Scoped Mihnea's implemented workflow to event authoring and lifecycle, with persistence/API integration left for team review.
- Kept deployment local for this milestone and recorded Render as a later target.

## Limitations (Mihnea's section)
- This is a draft for Mihnea's usage only. Confirm that the listed artifacts reflect the actual work he reviewed and adopted; add other tools and team members' actual use without inferring their AI usage.
- The artifacts are AI-assisted and require team review, integration, and verification before submission.

---

# GenAI Usage: Sebastian Boboc (backend)

> **Draft written by the AI assistant during the session.** Sebastian must edit it to reflect what he actually reviewed, changed and understood. Do not submit it unverified.

## Tool used
- Claude Code (Anthropic) in VS Code, model Claude Opus 5.5, in one agentic session on branch `backend/firebase-operations`.

## What the assistant produced
- The Firebase Admin initialization, ID-token authentication, and the event and registration service layer with Firestore transactions.
- The Next.js route handlers implementing the API contract proposed in `docs/event-lifecycle-and-api.md`.
- Firestore security rules, the emulator configuration, `.env.example`, and the seed and `set-role` scripts.
- Unit tests and emulator integration tests (services, route handlers with real Auth-emulator tokens, security rules, concurrent registrations).
- The typed browser API client, the `useAuth` hook, the sign-in panel, and the connection of the organizer dashboard to the API.
- `docs/backend-api.md` and draft text for `docs/sebastian-contribution.md` and this section.
- 
## Inputs given by the student
- The assignment text for the backend role and the student workflow it must support.
- The decision to use Node.js / Next.js with Firebase, as already chosen by the team.

## Verification performed in the session
- `npm test`: unit tests passed.
- `npm run test:emulator`: integration tests passed against the local Firestore and Auth emulators, including the concurrency test (10 parallel registrations for 3 seats gave exactly 3 confirmed).
- ESLint reported no problems. The production build was run (see the session record for its result).
- Environment issues found and handled during the session: a missing Windows native binding for the test runner (installed without changing the lockfile), and port 8080 already in use locally (the Firestore emulator was moved to 8085).

## Decisions the student should confirm or revise
- All event and registration writes go through the server API. Security rules deny direct client writes to them.
- Roles are stored in `users/{uid}` and assigned only by the admin script. Self sign-up always creates a student.
- Registrations are confirmed immediately; the `pending` status is not used. Registration closes when the event starts.
- The `organization` free-text field was replaced by `organizationId` in the shared validation and the dashboard.

## Limitations
- The code is AI-generated. The student is responsible for reviewing it and must be able to explain the transaction logic and the security rules.
- Not yet tested against a real (non-emulator) Firebase project.


---

# GenAI Usage: Ioana Botezatu (Frontend and UX)

## Tools used
- Claude Code (Anthropic) in VS Code, model Claude Opus 5.5
- ChatGPT for assistance with UX documentation and research documentation.

## Purpose and artifacts
- Worked on the **student workflow**, covering event browsing, searching and filtering through `events-browser.tsx`, `/events/[eventId]` (event details and registration), and `/my-registrations`.
- Contributed to the student-facing navigation through the shared site header and supporting data hooks.
- Defined and documented the student journey, from discovering published events to registering, cancelling registrations, and checking registration status.
- Worked on identifying the main interface states, including loading, errors, empty results, successful registration, already-registered states, full events, and cancelled events.
- Prepared and refined the UX research documentation, including research objectives, initial hypotheses, interview questions, and the interview plan.
- Documented the student routes, product flow, UI states, and responsive design requirements in `docs/student-flow.md`.
- Prepared and refined the individual contribution statement in `docs/individual-contribution-ioana.md`.

## Human review and verification
- The project requirements and assigned responsibilities defined Ioana's focus on frontend UX, research, discovery, and the participant experience.
- Informal conversations with students and former university colleagues provided preliminary perspectives on student events, event discovery, and registration experiences.
- Formal usability testing and systematic user validation remain pending.
- The student workflow documentation distinguishes implemented functionality from responsive checks and usability evaluations that still require verification.
- The student-facing workflow is connected to the Firebase-backed API and uses persisted application data rather than sample-only data.
- The documentation and contribution statement require human review to ensure they accurately represent Ioana's work.

## Material human decisions
- Focused the student experience on discovering published events and completing registrations.
- Identified the importance of displaying event information, including date, location, organization, and available capacity before registration.
- Included clear interface states for registration outcomes, errors, unavailable events, and cancellations.
- Distinguished preliminary UX assumptions from actual user feedback.
- Kept formal usability validation pending rather than presenting informal conversations as structured usability testing.
- Considered responsive design requirements for both mobile and desktop layouts.
