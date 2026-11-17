# Individual Contribution: Botezatu Ioana

**Role:** Frontend and UX, Data Modelling, Research and Discovery, and Frontend–Backend Integration.

## 1. Responsibilities and involvement in the student workflow

Ioana Botezatu's responsibilities in the project focused on the student-facing experience, UX research, data modelling, and connecting the frontend to the backend.

Her main areas of responsibility included:

- Defining and structuring the student journey through the application.
- Identifying the information students need when discovering events.
- Defining the event browsing, searching, filtering, and registration experience.
- Considering usability, navigation, and responsive design for mobile and desktop users.
- Identifying the different interface states, including loading, successful registration, duplicate registration, full events, and error messages.
- Defining the data model, including entities, attributes, relationships, and validation rules.
- Connecting the student-facing frontend to the backend API to retrieve and display persisted application data.
- Ensuring that student interactions, such as registering and cancelling registrations, communicate correctly with backend operations.

The student-facing implementation includes:

| Artifact | Description |
|---|---|
| `src/app/events-browser.tsx` | Student event browser with search, organization filtering, and seat availability indicators. |
| `src/app/events/[eventId]/` | Event details, including schedule, location, organization, capacity, and registration. |
| `src/app/my-registrations/` | Student registration overview and cancellation functionality. |
| `src/app/site-header.tsx` | Shared navigation for the student-facing interface. |
| `student.module.css` | Responsive styling for the student interface. |
| `src/lib/api-client.ts` | Frontend API client used to communicate with backend operations. |
| `src/lib/use-async-data.ts`, `use-profile.ts`, `format.ts` | Supporting data-loading hooks and formatting utilities. |
| `docs/student-flow.md` | Documentation of the student journey, routes, UI states, and responsive checklist. |

## 2. Individual contributions

Ioana's contributions covered several areas of the project:

**Frontend and UX**
- Defining the student workflow, from discovering a published event to completing a registration.
- Identifying the main information that should be available on an event details page.
- Defining the expected interactions for searching, filtering, viewing events, registering, and cancelling registrations.
- Considering usability requirements and the different states students might encounter.
- Identifying the need for responsive layouts suitable for both mobile and desktop screens.

**Data modelling**
- Defining the initial application data model and identifying its main entities: User, Organization, Event, Registration, and Attendance.
- Specifying the attributes and data fields required for each entity.
- Establishing relationships between users, organizations, events, registrations, and attendance records.
- Defining core validation rules, including event capacity restrictions, duplicate registration prevention, and event editing permissions.
- Documenting the initial data model and its role in supporting the application's functionality.

**Frontend–Backend Integration**
- Connecting the student-facing interface to the backend through `src/lib/api-client.ts`.
- Integrating the frontend with API operations for retrieving published events and event details.
- Connecting registration and cancellation actions to the corresponding backend operations.
- Ensuring that registration information and event availability are retrieved from persisted Firebase data rather than sample data.
- Handling backend responses and displaying appropriate UI states for successful operations, errors, full events, and existing registrations.
- Ensuring that registration information is refreshed after registration or cancellation so that the displayed status reflects persisted data.

## 3. Research and discovery

The research phase focused on understanding the needs of students who use an event-management platform.

The research objectives included:

- Understanding how students discover relevant university events.
- Identifying which event details influence their decision to participate.
- Understanding potential difficulties in the registration process.
- Identifying usability expectations for event browsing and registration.
- Determining what information students expect to see after registering.

**Research status:**

Informal conversations were held with students and former university colleagues to gather preliminary perspectives on student events, event discovery, registration processes, and participation.

These conversations provided initial qualitative insights into potential user needs and challenges. They were informal discussions rather than structured usability testing sessions.

The document `docs/ux-research.md` also contains a simulated assumption exercise, which remains separate from actual user feedback.

Formal usability testing and systematic validation with students and organizers remain pending.

## 4. Definition of done and verification

The expected outcome of the student workflow is that a student can find a real published event, inspect its details, register, and see the resulting registration status using persisted application data.

The student workflow supports:

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

AI tools were used to assist with the development and documentation of the project.

- **Tools:** GitHub Copilot in VS Code and Claude Code.
- **Purpose:** Assistance with the student-facing workflow, frontend implementation, data-related documentation, UX research documentation, and supporting utilities.
- **Documentation:** The team's GenAI usage is recorded in `docs/genai-usage-report.md` and `docs/student-flow.md`.

AI-generated material was reviewed and used as part of the project workflow. The final contribution statement distinguishes Ioana's responsibilities in UX, data modelling, and frontend–backend integration from AI-assisted code generation.

