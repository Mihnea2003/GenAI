"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

/**
 * Tracks the Firebase Auth user. `loading` is true until Firebase has restored the
 * session, so pages should wait before calling APIs that need a signed-in user.
 */
export function useAuth(): { user: User | null; loading: boolean } {
  const [state, setState] = useState<{ user: User | null; loading: boolean }>({ user: null, loading: true });
  useEffect(() => onAuthStateChanged(getFirebaseAuth(), (user) => setState({ user, loading: false })), []);
  return state;
}
