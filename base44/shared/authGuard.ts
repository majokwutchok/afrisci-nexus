// @ts-nocheck
// Shared caller checks for backend functions.

/** The signed-in user, or null when the caller is not signed in. Other errors (outages) are rethrown. */
export async function currentUser(base44) {
  try {
    return await base44.auth.me();
  } catch (e) {
    const status = e?.status ?? e?.response?.status;
    if (status === 401 || status === 403) return null;
    throw e;
  }
}

export function isAdmin(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

export function normEmail(v) {
  return String(v || "").trim().toLowerCase();
}

/** True when the user is an admin or their account email matches `email`. */
export function ownsEmail(user, email) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const mine = normEmail(user.email);
  return !!mine && mine === normEmail(email);
}

/**
 * For admin-only functions (automations, workflows, maintenance).
 * Returns { user } when allowed, or { response } to return immediately.
 */
export async function requireAdmin(base44) {
  const user = await currentUser(base44);
  if (!user) return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!isAdmin(user)) return { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

/** Requires a signed-in user. Returns { user } or { response }. */
export async function requireUser(base44) {
  const user = await currentUser(base44);
  if (!user) return { response: Response.json({ error: "Please sign in to continue", sign_in_required: true }, { status: 401 }) };
  return { user };
}
