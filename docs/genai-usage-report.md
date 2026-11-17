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

## Limitations
- This is a draft for Mihnea's usage only. Confirm that the listed artifacts reflect the actual work he reviewed and adopted; add other tools and team members' actual use without inferring their AI usage.
- The artifacts are AI-assisted and require team review, integration, and verification before submission.