# UBB Events

UBB Events is the mid-term project for managing student organization events at Babeș-Bolyai University. The platform is designed to support event planning, visibility, participant registration, and attendance tracking.

## Project foundation
This repository contains the initial application foundation and core project documentation for the team.

Relevant project documents:
- docs/project-foundation.md
- docs/team-roles.md
- docs/data-model.md
- docs/backend-api.md
- .env.example

## Tech stack
- Next.js
- React + TypeScript
- Firebase Authentication and Firestore
- Environment variables for local configuration

## MVP scope
- organization management
- event creation and publication
- event search and filtering
- participant registration
- capacity validation
- attendance tracking
- role-based access control

## Local development

Requires Node 20+ and Java 11+ (for the Firebase emulators). No real Firebase account is needed locally.

```bash
npm install
cp .env.example .env.local   # defaults target the local emulators; never commit .env.local
npm run emulators            # terminal 1: Firebase Auth + Firestore emulators (UI at http://localhost:4000)
npm run seed                 # terminal 2: demo organizations, accounts (password Passw0rd!) and events
npm run dev                  # http://localhost:3000
```

| Page | Try it as |
| --- | --- |
| `/`: browse, search and filter events; `/events/{id}`: details and registration | `student@ubbevents.test` |
| `/my-registrations`: own registrations, cancel | `student@ubbevents.test` |
| `/organizer`: create, edit and publish events | `organizer@ubbevents.test` |

The student workflow is documented in [docs/student-flow.md](docs/student-flow.md).

## Tests

```bash
npm test               # unit tests (no Firebase needed)
npm run test:emulator  # backend integration + security rules tests against the emulators
```

## Backend
The API, Firestore schema, security rules, real-project setup and error codes are documented in [docs/backend-api.md](docs/backend-api.md).

## Team setup notes
The project is currently set up locally in the workspace and can be pushed to GitHub by the team lead once Git is available on the machine.

For collaborator setup:
1. Create a GitHub repository
2. Push the project
3. Add each teammate as a collaborator in the repository settings
4. Share the GitHub URL and branch workflow

## Future deployment target
The project is prepared for local development now, and the final system can be deployed later to Render.
