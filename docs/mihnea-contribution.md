# Individual Contribution: Mihnea Bucur

**Status:** Draft contribution record for work completed in this repository; update it as implementation and team integration continue.

## Owned artifacts and workflow
- Project scope, initial requirements, actors, use cases, and event-lifecycle workflow.
- Event creation and publication workflow specification and proposed API contract.
- Traceability mapping from assignment requirements to use cases, implementation, and validation.
- Event-management dashboard prototype for creating, editing, searching, and changing event status.
- Pure event validation and lifecycle-transition rules with unit tests.
- UX research status note and interview guide. No real interviews have been conducted by this contribution.
- Mihnea's portion of the GenAI usage record.

## Decisions and human review
- Kept the assignment's proposed MVP narrow and documented deferred work.
- Chose draft/published/completed/cancelled states and explicit allowed transitions for the prototype.
- Made sample data and in-memory state visibly non-persistent instead of implying Firebase integration.
- Marked simulated research assumptions as unverified, and did not claim interviews or user findings.
- Documented that frontend checks do not replace server-side authorization or atomic Firestore capacity enforcement.

## Verification
- Event rule tests are defined in `src/lib/event-lifecycle.test.ts`.
- Build and lint/test results must be recorded after running the current repository checks.
- Real-user validation, Firebase integration, and Render deployment remain pending team work.
