import { base44 } from "@/api/base44Client";

/** HTTP status of a failed base44.functions.invoke call. */
export const errStatus = (e) => e?.response?.status ?? e?.status;

/** Readable message from a failed function call. */
export const errMessage = (e, fallback = "Something went wrong.") =>
  e?.response?.data?.error || e?.message || fallback;

/** The signed-in user, or null. */
export async function getSignedInUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

/** Send the visitor to sign in, then bring them back to this page (or `path`). */
export function signIn(path) {
  const target = path || `${window.location.pathname}${window.location.search}`;
  base44.auth.redirectToLogin(target);
}
