# Student Workflow: Product Flow and UI States

**Status:** Implemented and connected to the Firebase-backed API (no sample data).

## Routes

| Route | Who | Purpose |
| --- | --- | --- |
| `/` | everyone | Browse upcoming published events; search and filter by organization |
| `/events/{id}` | everyone | Event details (schedule, location, organization, capacity) and registration panel |
| `/my-registrations` | signed-in users | Own registrations, upcoming first, with cancellation; sign-in or sign-up when signed out |
| `/organizer` | organizers / admins | Mihnea's event-management dashboard (moved from `/`) |

The header (`src/app/site-header.tsx`) shows *Events*, *My registrations* (when signed in) and *Organizer* (only for organizer and admin roles), plus sign-in or sign-out.

## Flow

```text
/ (browse) ──search/filter──▶ results ──click card──▶ /events/{id}
                                                       │
                     not signed in ──▶ "Sign in to register" ──▶ inline sign-in/sign-up
                                                       │
                     signed in ──▶ Register ──▶ ✓ registered ──▶ Cancel (confirm) ──▶ seat released
                                                       │
                                     /my-registrations lists it (persisted in Firestore)
```

## UI states (requirement → implementation)

| State | Where | Trigger |
| --- | --- | --- |
| Loading | skeleton cards / details; "Checking your registration…" | data not yet returned; `useAuth().loading` |
| Error | message plus **Try again** | network or server error from any API call |
| Empty | "No upcoming events yet" / "No events match your search" with **Clear filters** | empty result list |
| Not found | "Event not found" | `EVENT_NOT_FOUND` (missing or draft event) |
| Success | green "You're registered!" | `POST /registration` → 201 |
| Already registered | "You were already registered…" (also shown on load as "✓ You're registered") | `ALREADY_REGISTERED`, or existing confirmed registration |
| Full | "This event is full." badge and panel; "the last seat was just taken" if it filled while the page was open | `remainingCapacity === 0` / `EVENT_FULL` |
| Cancelled / closed | "This event has been cancelled." / "Registration closed when the event started." | `EVENT_CANCELLED`, `REGISTRATION_CLOSED`, `EVENT_CLOSED` |
| Session expired | inline sign-in reappears | `UNAUTHENTICATED` |
| Re-register | "You cancelled your earlier registration. You can register again…" | registration `status: "cancelled"` |

After every register or cancel attempt, successful or not, the page re-reads the event and the registration from the server, so seat counts and status always reflect persisted data.

## How to try it

```bash
npm run emulators   # terminal 1
npm run seed        # terminal 2
npm run dev         # http://localhost:3000
```

Sign in as `student@ubbevents.test` / `Passw0rd!` and check each state against the seed data:

| Seed event | What it demonstrates |
| --- | --- |
| Git & GitHub Workshop | open event: register, then cancel, then register again |
| Career Talk: First Internship | **full** (1 seat, taken by `student2`) |
| Board Games Night | **cancelled** (open it via `/events/seed-cancelled-meetup`; it is not listed) |
| Spring Hackathon (draft) | **not visible** to students: `/events/seed-hackathon-draft` shows "Event not found" |
| Open Debate: AI in Education | different organization: test the organization filter |

## Responsive check (developer self-check, not user testing)

The layout was designed for both widths. The table below is the checklist to verify manually in the browser's device toolbar (e.g. 375 px phone and 1280 px desktop). 

| Check | 375 px | 1280 px |
| --- | --- | --- |
| Header wraps: nav below brand, account on the right | ☐ | ☐ |
| Search and organization filter stack vertically on mobile | ☐ | ☐ |
| Event cards: 1 column on mobile, grid on desktop | ☐ | ☐ |
| Details: registration panel below details on mobile, sticky sidebar on desktop | ☐ | ☐ |
| Buttons are full-width and at least 44 px tall on mobile | ☐ | ☐ |
| Long titles and locations wrap without horizontal scrolling | ☐ | ☐ |
| Keyboard: tab order reaches cards and buttons; focus ring visible | ☐ | ☐ |


## Design decisions (provisional, not yet validated with users)

- `/` is the student browse page, because students are the largest user group. The organizer dashboard moved to `/organizer`.
- Seat availability appears on every card with color-coded urgency (open, few seats left, full), based on the simulated hypothesis that capacity affects the decision to attend (`docs/ux-research.md`).
- Cancelling requires a confirmation step, and the copy explains that the seat is released to someone else.
- Cancelled and draft events are excluded from the browse list. Cancelled events remain reachable by link, so already-registered students learn about the cancellation.
