// Assigns a role (and organization) to an existing user. Roles cannot be set from the browser.
//
// Usage (reads .env.local; works against emulators or a real project):
//   npm run set-role -- <email> organizer <organizationId> ["Organization name"]
//   npm run set-role -- <email> admin
//   npm run set-role -- <email> student
//
// If the organization does not exist and a name is given, it is created.

const [email, role, organizationId, organizationName] = process.argv.slice(2);
const ROLES = ["student", "organizer", "admin"];
if (!email || !ROLES.includes(role) || (role === "organizer" && !organizationId)) {
  console.error('Usage: npm run set-role -- <email> <student|organizer|admin> [organizationId] ["Organization name"]');
  process.exit(1);
}

const { initializeApp, cert, applicationDefault } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const app = initializeApp(
  usingEmulators
    ? { projectId }
    : { projectId, credential: clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault() },
);
const db = getFirestore(app);

const user = await getAuth(app).getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No Firebase Auth user with email ${email}. Ask them to sign up first.`);
  process.exit(1);
}

const orgId = role === "student" ? null : organizationId ?? null;
if (orgId) {
  const orgRef = db.collection("organizations").doc(orgId);
  if (!(await orgRef.get()).exists) {
    if (!organizationName) {
      console.error(`Organization "${orgId}" does not exist. Pass a name as the 4th argument to create it.`);
      process.exit(1);
    }
    await orgRef.set({ name: organizationName, description: "", createdAt: FieldValue.serverTimestamp() });
    console.log(`Created organization ${orgId} (${organizationName}).`);
  }
}

await db.collection("users").doc(user.uid).set(
  {
    email,
    displayName: user.displayName ?? email.split("@")[0],
    role,
    organizationId: orgId,
  },
  { merge: true },
);
console.log(`${email} is now ${role}${orgId ? ` of ${orgId}` : ""} (project ${projectId}${usingEmulators ? ", emulator" : ""}).`);
