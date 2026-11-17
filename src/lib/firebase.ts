import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

// Public web-app config. These values identify the project; they are not secrets.
// Server credentials live in non-public env vars used only by src/server/firebase-admin.ts.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let clients: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

/**
 * Lazily initializes the browser Firebase SDK. Initialization is deferred until first use
 * (in effects and event handlers) so server prerendering never needs Firebase config.
 */
function firebaseClients() {
  if (clients) return clients;
  const isNewApp = getApps().length === 0;
  const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (isNewApp && useEmulators) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8085);
  }
  clients = { app, auth, db };
  return clients;
}

export const getFirebaseAuth = () => firebaseClients().auth;
export const getFirebaseDb = () => firebaseClients().db;
