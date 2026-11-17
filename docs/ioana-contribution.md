# Individual Contribution: Botezatu Ioana

> **Draft prepared for Ioana. She must complete and approve it herself.**
> Anything in *[brackets]* is a placeholder that only Ioana can fill in truthfully. Delete any section that does not apply. Do not submit this file until Ioana has read it, corrected it and agreed with every statement.

**Role:** Frontend and UX: research, discovery, and the participant (student) flow.

## 1. How the student workflow was produced (factual record)

The student-facing implementation was **generated with an AI assistant (Claude Code) in Sebastian Boboc's session, at Sebastian's request**, after the backend was finished:

| Artifact | Description |
| --- | --- |
| `src/app/events-browser.tsx` (`/`) | Browse upcoming published events; search; organization filter; seat availability badges |
| `src/app/events/[eventId]/` | Event details (schedule, location, organization, capacity) and registration panel |
| `src/app/my-registrations/` | The student's registrations, with cancellation |
| `src/app/site-header.tsx`, `student.module.css` | Shared navigation and responsive styles |
| `src/lib/use-async-data.ts`, `use-profile.ts`, `format.ts` | Data-loading hooks and formatting helpers |
| `docs/student-flow.md` | Routes, flow, UI states, and the responsive checklist |

This is also recorded in `docs/genai-usage-report.md` and `docs/student-flow.md`.

## 2. Ioana's own contributions

*[Fill in only what you actually did. Examples of what might belong here, delete the ones that are not true:]*

- *[Reviewed the generated student pages against the assignment requirements. List what you checked.]*
- *[Changed the UI or copy: list the files and what you changed, and why.]*
- *[Ran the student flow at mobile (≈375 px) and desktop widths and completed the checklist in `docs/student-flow.md`.]*
- *[Usability issues found, and what was changed because of them.]*
- *[Earlier design or UX work: wireframes, flows, UI decisions made before the implementation.]*

## 3. Research and discovery

**Current status: real-user interviews have not been conducted.** `docs/ux-research.md` contains a simulated assumption exercise only, and real-user validation is pending.

*[If interviews take place, record them here and in `docs/ux-research.md`:]*

- *[Number and roles of participants (anonymized, e.g. S1 = 2nd-year student, O1 = organizer)]*
- *[Key findings]*
- *[Assumptions that changed]*
- *[Product changes made because of the findings]*

*[If interviews still cannot happen, keep this section as "pending" and do not present invented answers as findings.]*

## 4. Definition of done: evidence

The requirement: *a student can find a real published event, inspect its details, register, and see the resulting status from persisted data.*

- The pages read and write persisted Firebase data through the API (`src/lib/api-client.ts`). No sample data is used.
- Backend persistence of registrations is covered by `tests/emulator/api.test.ts` and `tests/emulator/registrations.test.ts`.
- *[Manual verification by Ioana: date, browser, widths tested, and the result of registering for "Git & GitHub Workshop", reloading, and seeing "You're registered".]*

## 5. GenAI usage

- The student workflow implementation and this draft were generated with Claude Code in Sebastian's session (see `docs/genai-usage-report.md`).
- *[Ioana's own GenAI use, if any: tool, purpose, what was accepted, changed or rejected. Write "None" if she did not use any.]*
