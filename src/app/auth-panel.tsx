"use client";

import { useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth } from "@/lib/firebase";
import styles from "./page.module.css";

function authErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Sign in instead.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/network-request-failed":
      return "Could not reach Firebase. Is the emulator running?";
    default:
      return "Sign-in failed. Please try again.";
  }
}

/** Email/password sign-in. New accounts start as students; organizer roles are assigned by an admin. */
export default function AuthPanel({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const auth = getFirebaseAuth();
      if (mode === "signIn") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="auth-heading" className={compact ? undefined : styles.formPanel}>
      <div className={styles.formHeader} style={compact ? { flexWrap: "wrap", gap: 4 } : undefined}>
        <h2 id="auth-heading">{mode === "signIn" ? "Sign in" : "Create an account"}</h2>
        <button className={styles.textButton} onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")} type="button">
          {mode === "signIn" ? "Create an account" : "I already have an account"}
        </button>
      </div>
      <form onSubmit={submit}>
        <div className={styles.formGrid} style={compact ? { gridTemplateColumns: "1fr" } : undefined}>
          <label className={styles.field}>
            Email
            <input autoComplete="email" className={styles.input} onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
          </label>
          <label className={styles.field}>
            Password
            <input
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
              className={styles.input}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.formFooter} style={compact ? { flexDirection: "column", alignItems: "stretch" } : undefined}>
          {!compact && <p className={styles.subtle}>Organizer access is granted by a platform administrator.</p>}
          <div className={styles.formActions}>
            <button className={styles.primaryButton} disabled={busy} type="submit">
              {busy ? "Please wait…" : mode === "signIn" ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
