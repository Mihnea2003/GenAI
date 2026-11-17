// Seeds the local Firebase emulators with demo organizations, accounts and events.
// Usage: `npm run emulators` in one terminal, then `npm run seed` in another.
// Refuses to run against a real project.

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8085";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
const projectId = process.env.FIREBASE_PROJECT_ID ?? "demo-ubbevents";
if (!projectId.startsWith("demo-")) {
  console.error(`Refusing to seed project "${projectId}": the seed script only targets demo-* emulator projects.`);
  process.exit(1);
}

const { initializeApp } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore, Timestamp } = await import("firebase-admin/firestore");

const app = initializeApp({ projectId });
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = "Passw0rd!";
const DAY = 24 * 60 * 60 * 1000;
const at = (days, hour) => {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, 0, 0, 0);
  return Timestamp.fromDate(date);
};

const organizations = [
  { id: "cs-student-club", name: "Computer Science Student Club", description: "Workshops and talks for CS students." },
  { id: "debate-society", name: "UBB Debate Society", description: "Weekly debates and public speaking training." },
];

const accounts = [
  { email: "organizer@ubbevents.test", displayName: "Ana Organizer", role: "organizer", organizationId: "cs-student-club" },
  { email: "debate.organizer@ubbevents.test", displayName: "Dan Debate", role: "organizer", organizationId: "debate-society" },
  { email: "admin@ubbevents.test", displayName: "Platform Admin", role: "admin", organizationId: null },
  { email: "student@ubbevents.test", displayName: "Sara Student", role: "student", organizationId: null },
  { email: "student2@ubbevents.test", displayName: "Paul Student", role: "student", organizationId: null },
];

async function ensureAccount({ email, displayName, role, organizationId }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password: PASSWORD, displayName });
  }
  await db.collection("users").doc(user.uid).set({ email, displayName, role, organizationId, createdAt: Timestamp.now() });
  return user.uid;
}

for (const { id, ...data } of organizations) {
  await db.collection("organizations").doc(id).set({ ...data, createdAt: Timestamp.now() });
}
const uids = {};
for (const account of accounts) uids[account.email] = await ensureAccount(account);

const organizer = uids["organizer@ubbevents.test"];
const student2 = uids["student2@ubbevents.test"];
const base = { organizationId: "cs-student-club", organizationName: organizations[0].name, createdBy: organizer };
const events = {
  "seed-git-workshop": {
    ...base, title: "Git & GitHub Workshop", description: "Hands-on introduction to version control for team projects.",
    location: "FMI Building, Room 2/I", startDate: at(7, 16), endDate: at(7, 18), capacity: 40, registeredCount: 0, status: "published",
  },
  "seed-career-talk": {
    ...base, title: "Career Talk: First Internship", description: "Alumni share how they landed their first internship.",
    location: "Central Building, Aula Magna", startDate: at(10, 18), endDate: at(10, 20), capacity: 1, registeredCount: 1, status: "published",
  },
  "seed-hackathon-draft": {
    ...base, title: "Spring Hackathon (draft)", description: "24-hour hackathon. Details still being planned.",
    location: "FMI Building", startDate: at(30, 9), endDate: at(31, 9), capacity: 100, registeredCount: 0, status: "draft",
  },
  "seed-cancelled-meetup": {
    ...base, title: "Board Games Night", description: "Cancelled because the venue is unavailable.",
    location: "Student Hostel Common Room", startDate: at(5, 19), endDate: at(5, 22), capacity: 25, registeredCount: 0, status: "cancelled",
  },
  "seed-debate-open": {
    organizationId: "debate-society", organizationName: organizations[1].name, createdBy: uids["debate.organizer@ubbevents.test"],
    title: "Open Debate: AI in Education", description: "British Parliamentary format, beginners welcome.",
    location: "Faculty of Letters, Room 1", startDate: at(4, 17), endDate: at(4, 19), capacity: 30, registeredCount: 0, status: "published",
  },
};
for (const [id, data] of Object.entries(events)) {
  await db.collection("events").doc(id).set({ ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
}

// The single seat of the career talk is taken, so it demonstrates the "full" state.
await db.collection("registrations").doc(`seed-career-talk_${student2}`).set({
  eventId: "seed-career-talk", userId: student2, organizationId: "cs-student-club", status: "confirmed",
  registeredAt: Timestamp.now(), cancelledAt: null, userEmail: "student2@ubbevents.test", userDisplayName: "Paul Student",
});

console.log(`Seeded project ${projectId}. Accounts (password "${PASSWORD}"):`);
for (const account of accounts) console.log(`  ${account.role.padEnd(9)} ${account.email}`);
