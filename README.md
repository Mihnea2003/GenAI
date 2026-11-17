# UBB Events

UBB Events is the mid-term project for managing student organization events at Babeș-Bolyai University. The platform is designed to support event planning, visibility, participant registration, and attendance tracking.

## Project foundation
This repository contains the initial application foundation and core project documentation for the team.

Relevant project documents:
- docs/project-foundation.md
- docs/team-roles.md
- docs/data-model.md
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

```bash
npm install
npm run dev
```

Open http://localhost:3000 in the browser.

## Environment configuration
Copy the example file and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

## Team setup notes
The project is currently set up locally in the workspace and can be pushed to GitHub by the team lead once Git is available on the machine.

For collaborator setup:
1. Create a GitHub repository
2. Push the project
3. Add each teammate as a collaborator in the repository settings
4. Share the GitHub URL and branch workflow

## Future deployment target
The project is prepared for local development now, and the final system can be deployed later to Render.
