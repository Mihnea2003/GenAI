import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { UserProfile, UserRole } from "@/lib/api-types";
import { adminAuth, adminDb } from "./firebase-admin";
import { unauthenticated } from "./errors";

const USER_ROLES: readonly UserRole[] = ["student", "organizer", "admin"];

/**
 * Loads the caller's profile from users/{uid}. A first-time caller gets a student profile.
 * Roles are never taken from the client: organizer/admin roles are assigned with
 * `npm run set-role` (Admin SDK) and Firestore rules forbid users from editing them.
 */
async function getOrCreateProfile(token: DecodedIdToken): Promise<UserProfile> {
  const ref = adminDb().collection("users").doc(token.uid);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    const email = token.email ?? "";
    const profile = {
      email,
      displayName: (token.name as string | undefined) ?? (email.split("@")[0] || "Student"),
      role: "student" as const,
      organizationId: null,
    };
    try {
      await ref.create({ ...profile, createdAt: FieldValue.serverTimestamp() });
      return { id: token.uid, ...profile };
    } catch (error) {
      // Another request created the profile concurrently (gRPC ALREADY_EXISTS); fall through and read it.
      if ((error as { code?: number }).code !== 6) throw error;
    }
  }
  const data = (await ref.get()).data() ?? {};
  const role = USER_ROLES.includes(data.role) ? (data.role as UserRole) : "student";
  return {
    id: token.uid,
    email: data.email ?? token.email ?? "",
    displayName: data.displayName ?? "",
    role,
    organizationId: role === "student" ? null : (data.organizationId ?? null),
  };
}

/** Returns the signed-in user, or null for anonymous requests. Invalid tokens are rejected. */
export async function getOptionalUser(request: Request): Promise<UserProfile | null> {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw unauthenticated("Authorization header must be 'Bearer <Firebase ID token>'.");

  let token: DecodedIdToken;
  try {
    token = await adminAuth().verifyIdToken(match[1]);
  } catch {
    throw unauthenticated("Your session is invalid or has expired. Please sign in again.");
  }
  return getOrCreateProfile(token);
}

export async function requireUser(request: Request): Promise<UserProfile> {
  const user = await getOptionalUser(request);
  if (!user) throw unauthenticated();
  return user;
}
