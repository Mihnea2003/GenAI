# UBB Events - Project Foundation

## 1. Project name
UBB Events

## 2. Short description
UBB Events is a web platform for managing student organization events at Babeș-Bolyai University. The application supports event creation, publication, registration, attendance tracking, and organization member management.

## 3. Problem statement
Student organizations organize many activities throughout the academic year, including workshops, trainings, competitions, social events, and conferences. These activities involve multiple actors, scheduling constraints, registrations, capacity limits, responsibilities, and communication needs.

The current process is fragmented and difficult to manage without a centralized platform. The system must provide a clear digital workflow for organizers and participants while supporting role-based access, data persistence, and event lifecycle management.

## 4. Scope and MVP definition
The first version of the project focuses on a realistic minimum viable product:

- user authentication and role-based access
- organization management
- event creation and editing
- event publishing and visibility
- participant registration
- capacity limitation and duplicate protection
- attendance/status tracking
- event search and filtering

### In scope
- student organizations
- event lifecycle from draft to published to completed
- registration workflow
- access control for organizers and students

### Out of scope for the mid-term deliverable
- advanced reporting dashboards
- payment processing
- complex notifications engine
- multi-campus integrations
- extensive analytics modules

## 5. Actors and roles

### Student
The student can browse public events, register, see their own registrations, and track attendance.

### Organizer
The organizer can create and manage events for their organization, approve or review registrations, and update attendance information.

### Organization Administrator
The admin can manage organization members, assign organizer roles, and supervise the organization's event lifecycle.

### System Administrator
The administrator can manage general platform configuration and ensure application integrity.

## 6. Main use cases
- Create organization
- Add members to organization
- Create event
- Edit event details
- Publish event
- Search for events
- Register for an event
- Cancel registration
- Check remaining capacity
- View registered participants
- Mark attendance
- Close event

## 7. Key workflows

### Workflow 1: Event creation and publishing
1. A logged-in organizer opens the event form.
2. The organizer fills in title, description, date, venue, capacity, and organization.
3. System validates required fields and checks permissions.
4. Event is saved as draft or published.
5. Published events become visible to eligible participants.

### Workflow 2: Participant registration
1. A logged-in student searches or browses event listings.
2. Student opens an event details page.
3. System checks if the student is eligible and if the event accepts registrations.
4. If capacity is available and duplicate registration is not present, registration is created.
5. Student receives confirmation and sees their status in their dashboard.

### Workflow 3: Attendance tracking
1. Organizer opens event dashboard.
2. Organizer reviews participants and status.
3. Attendance is marked as present, absent, or pending.
4. The information is stored and visible to the organization.

## 8. Business rules selected by the team
These rules are intentionally simple and enforceable for the MVP:

- Only authenticated users can create or register for events.
- Only organization members with organizer/admin permissions can create or edit events.
- A user cannot register twice for the same event.
- Registration is rejected when the event is full.
- Events must have a valid title, date, venue, and organization.
- Only a published event is visible to regular participants.
- Organizers can update attendance after registration is confirmed.

## 9. Initial architecture decision

### Frontend
- Next.js
- TypeScript
- React components
- pages for listing events, viewing details, and creating events

### Backend / application layer
- Next.js server actions and route handlers for the initial project version
- a service layer to isolate business logic from presentation
- future option to split into a dedicated backend service if the project grows

### Persistence
- Firebase Firestore for event, organization, and registration data
- Firebase Authentication for user identity and access control

### Authentication and authorization
- Firebase Auth for sign-in
- role checks based on organization membership and user profile
- permissions enforced server-side by validation logic

### APIs
- REST-style API routes or server actions for events, organizations, and registrations
- clear separation between client-side views and persisted data operations

### Deployment
- local development environment for mid-term milestone
- future Render deployment strategy after mid-term

## 10. Project conventions
- feature-based folder organization
- clear separation of UI, business logic, and persistence concerns
- one shared project document acts as the source of truth for the team
- every implemented feature must be mapped to a requirement and test

## 11. Traceability principle
The team will track implementation against the requirements and tests so that every feature can be traced back to one or more requirements.

Examples:
- Event creation -> R1, R5
- Registration and capacity -> R3, R4
- Search and access -> R6
- Persistence -> R7
- Architecture -> R8, R9
- Testing -> R11
- Deployment -> R12
