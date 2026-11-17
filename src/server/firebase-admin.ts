import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Initializes the Firebase Admin SDK for trusted server code.
 *
 * - Emulators: set FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST; no credentials needed.
 * - Real project: set FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (service account), or rely on
 *   Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS).
 *
 * These variables are server-only and must never use the NEXT_PUBLIC_ prefix.
 */
function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT;
  const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);

  if (usingEmulators) return initializeApp({ projectId });

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  }
  return initializeApp({ credential: applicationDefault(), projectId });
}

export function adminDb() {
  return getFirestore(initAdminApp());
}

export function adminAuth() {
  return getAuth(initAdminApp());
}
