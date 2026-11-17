# Individual Contribution: Botezatu Ioana

**Role:** Frontend and UX – Research, Discovery, and Participant (Student) Workflow.

## 1. Responsibilities and involvement in the student workflow

Ioana Botezatu's assigned responsibilities in the project focused on the student-facing experience, UX research, and the participant registration workflow.

Her main areas of responsibility included:

- Defining and structuring the student journey through the application.
- Identifying the information students need when discovering events.
- Defining the event browsing, searching, filtering, and registration experience.
- Considering usability, navigation, and responsive design for mobile and desktop users.
- Identifying the different interface states, including loading, successful registration, duplicate registration, full events, and error messages.
- Coordinating the student workflow requirements with the backend operations implemented by Sebastian Boboc.

The generated implementation includes:

| Artifact | Description |
|---|---|
| `src/app/events-browser.tsx` | Student event browser with search, organization filtering, and seat availability indicators. |
| `src/app/events/[eventId]/` | Event details, including schedule, location, organization, capacity, and registration. |
| `src/app/my-registrations/` | Student registration overview and cancellation functionality. |
| `src/app/site-header.tsx` | Shared navigation for the student-facing interface. |
| `student.module.css` | Responsive styling for the student interface. |
| `src/lib/use-async-data.ts`, `use-profile.ts`, `format.ts` | Supporting data-loading hooks and formatting utilities. |
| `docs/student-flow.md` | Documentation of the student journey, routes, UI states, and responsive checklist. |

The use of AI in generating the implementation is also documented in `docs/genai-usage-report.md` and `docs/student-flow.md`.

## 2. Individual contributions

Ioana's contribution area focused on research, discovery, and the participant experience.

Her assigned responsibilities included:

- Defining the student workflow, from discovering a published event to completing a registration.
- Identifying the main information that should be available on an event details page.
- Defining the expected interactions for searching, filtering, viewing events, registering, and cancelling registrations.
- Considering usability requirements and the different states students might encounter.
- Identifying the need for responsive layouts suitable for both mobile and desktop screens.
- Considering how the student interface should communicate with the backend and display information retrieved from persistent Firebase data.
- Contributing to the documentation of the student journey and UX requirements.

## 3. Research and discovery

The research phase focused on understanding the needs of students who use an event-management platform.

The intended research objectives included:

- Understanding how students discover relevant university events.
- Identifying which event details influence their decision to participate.
- Understanding potential difficulties in the registration process.
- Identifying usability expectations for event browsing and registration.
- Determining what information students expect to see after registering.

**Current research status:**

Real-user interviews have not yet been conducted. The document `docs/ux-research.md` contains a simulated assumption exercise rather than validated research findings.

Consequently, the current UX decisions should be treated as initial assumptions that require validation with actual students and, if possible, event organizers.

## 4. Definition of done and verification

The expected outcome of the student workflow is that a student can find a real published event, inspect its details, register, and see the resulting registration status using persisted application data.

The student workflow is expected to support:

1. Browsing published events.
2. Searching and filtering available events.
3. Viewing event information, including schedule, location, organization, and capacity.
4. Registering for an event.
5. Cancelling an existing registration.
6. Seeing the updated registration status after reloading the application.

The student-facing interface communicates with the backend through `src/lib/api-client.ts`.

Backend persistence and registration behavior are covered by:

- `tests/emulator/api.test.ts`
- `tests/emulator/registrations.test.ts`


## 5. GenAI usage

AI tools were used during the development of the student-facing workflow.

- **Tool:** Claude Code.
- **Purpose:** Generation of the student-facing implementation, including event browsing, event details, registration pages, navigation, styling, and supporting utilities.
- **Documentation:** The use of GenAI is recorded in `docs/genai-usage-report.md` and `docs/student-flow.md`.
