"use client";

import { getMe } from "./api-client";
import { useAsyncData } from "./use-async-data";
import { useAuth } from "./use-auth";

/** The Firebase user plus their UBB Events profile (role, organization). */
export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const result = useAsyncData(user ? `me:${user.uid}` : null, getMe);
  return {
    user,
    profile: user ? (result.data ?? null) : null,
    profileError: result.error,
    /** True until we know whether someone is signed in and, if so, who they are. */
    loading: authLoading || (user !== null && !result.data && !result.error),
  };
}
