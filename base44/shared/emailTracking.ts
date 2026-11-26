// @ts-nocheck
// Signed email open/click tracking links. Only links signed with EMAIL_TRACKING_SECRET are counted,
// so nobody can fabricate opens/clicks or rewrite prospect lead scores.
import { secrets } from "base44:runtime";

function getTrackingSecret() {
  try { const v = secrets?.get?.("EMAIL_TRACKING_SECRET"); if (v) return v; } catch (_) {}
  try { const v = Deno.env.get("EMAIL_TRACKING_SECRET"); if (v) return v; } catch (_) {}
  return "";
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

const payload = ({ event, campaign_id, email, url }) =>
  [event || "", campaign_id || "", String(email || "").toLowerCase(), url || ""].join("|");

/** Signature to append as `sig` to a tracking link. */
export async function signTracking(params) {
  const secret = getTrackingSecret();
  if (!secret) throw new Error("EMAIL_TRACKING_SECRET is not configured");
  return hmacHex(secret, payload(params));
}

/**
 * Build a full tracking URL. base: the app origin from the X-Base44-App-Url header.
 * Example: await trackingUrl(base, { event: "open", campaign_id, email })
 */
export async function trackingUrl(base, { event, campaign_id, email, url }) {
  const sig = await signTracking({ event, campaign_id, email, url });
  const q = new URLSearchParams({ event, campaign_id, email });
  if (url) q.set("url", url);
  q.set("sig", sig);
  return `${base.replace(/\/$/, "")}/functions/trackEmailEvent?${q}`;
}

export async function verifyTracking(params, sig) {
  const secret = getTrackingSecret();
  if (!secret || !sig || !/^[a-f0-9]{32}$/.test(sig)) return false;
  const expected = await hmacHex(secret, payload(params));
  let r = 0;
  for (let i = 0; i < expected.length; i++) r |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return r === 0;
}
