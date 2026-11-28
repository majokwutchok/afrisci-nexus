// @ts-nocheck
// AfriSci Newsletter: signed unsubscribe links and batch delivery through Resend.
import { getSecret } from "./emailServer.ts";

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function unsubSecret() {
  const s = await getSecret("EMAIL_TRACKING_SECRET");
  if (!s) throw new Error("EMAIL_TRACKING_SECRET is not configured");
  return s;
}

export async function unsubscribeUrl(site, email, newsletterId = "") {
  const e = String(email).trim().toLowerCase();
  const sig = await hmacHex(await unsubSecret(), `unsub|${e}`);
  const q = new URLSearchParams({ e, s: sig });
  if (newsletterId) q.set("n", newsletterId);
  return `${String(site).replace(/\/$/, "")}/functions/newsletterUnsubscribe?${q}`;
}

export async function verifyUnsubscribe(email, sig) {
  if (!email || !sig || !/^[a-f0-9]{32}$/.test(sig)) return false;
  const expected = await hmacHex(await unsubSecret(), `unsub|${String(email).trim().toLowerCase()}`);
  let r = 0;
  for (let i = 0; i < expected.length; i++) r |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return r === 0;
}

/** Send up to 100 individual emails in one Resend batch call. msgs: [{to, subject, html, text, headers}] */
export async function sendBatch(msgs, { from, replyTo }) {
  const apiKey = await getSecret("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY secret is not set");
  const payload = msgs.map((m) => ({
    from,
    to: [m.to],
    subject: m.subject,
    html: m.html,
    text: m.text,
    headers: m.headers,
    ...(replyTo ? { reply_to: [replyTo] } : {}),
    tags: [{ name: "category", value: "newsletter" }],
  }));
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend: ${data.message || data.error || res.statusText}`);
  return Array.isArray(data?.data) ? data.data.length : msgs.length;
}
