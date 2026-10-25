// @ts-nocheck
// AfriSci Nexus Email Center — generated from the email-center package (shared/server.js).
import { secrets } from "base44:runtime";
import { DEFAULT_SETTINGS, formatAddress, threadReplyAddress } from "./emailCore.ts";
// AfriSci Nexus — server helpers shared by the Base44 backend functions.
// Lives in base44/shared/ and is imported by the email functions.
// Sending goes through YOUR provider account (Resend by default, Brevo optional),
// never through Base44's built-in SendEmail, so no Base44 integration credits are used.

/** Read a secret: Base44's `base44:runtime` secrets first (the app's convention), then env vars. */
export async function getSecret(name) {
  try {
    const v = secrets?.get?.(name);
    if (v) return v;
  } catch (_) { /* runtime secrets unavailable */ }
  try {
    const v = Deno.env.get(name);
    if (v) return v;
  } catch (_) { /* env permission not granted */ }
  return undefined;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/** Entity list helper that tolerates both legacy array and cursor-page SDK responses. */
export async function listAll(handler, sort = "-created_date", limit = 500) {
  const res = await handler.list(sort, limit);
  return Array.isArray(res) ? res : res?.items ?? [];
}
export async function filterAll(handler, query, sort = "-created_date", limit = 500) {
  const res = await handler.filter(query, sort, limit);
  return Array.isArray(res) ? res : res?.items ?? [];
}

export async function loadSettings(base44) {
  let record = null;
  try {
    const rows = await listAll(base44.asServiceRole.entities.EmailSettings, "-updated_date", 1);
    record = rows[0] || null;
  } catch (_) { /* entity may not exist yet */ }
  const clean = {};
  for (const [k, v] of Object.entries(record || {})) if (v !== null && v !== undefined && v !== "") clean[k] = v;
  const envFrom = await getSecret("EMAIL_FROM");
  const settings = { ...DEFAULT_SETTINGS, ...clean };
  if (envFrom && !clean.from_email) settings.from_email = envFrom;
  return { settings, record };
}

export async function requireStaff(base44, settings) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch (_) { /* not signed in */ }
  if (!user) throw new HttpError(401, "Sign in required");
  const roles = String(settings.staff_roles || "admin").split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (!roles.includes(String(user.role || "").toLowerCase())) throw new HttpError(403, "Only editorial staff can use the email center");
  return user;
}

export async function threadSecret() {
  return (await getSecret("EMAIL_THREAD_SECRET")) || (await getSecret("RESEND_WEBHOOK_SECRET")) || "afrisci-nexus";
}

// ------------------------------------------------------------ providers

async function providerConfig() {
  const provider = ((await getSecret("EMAIL_PROVIDER")) || "resend").toLowerCase();
  if (provider === "brevo") {
    return {
      provider,
      apiKey: await getSecret("BREVO_API_KEY"),
      base: (await getSecret("BREVO_API_BASE")) || "https://api.brevo.com",
    };
  }
  return {
    provider: "resend",
    apiKey: await getSecret("RESEND_API_KEY"),
    base: (await getSecret("RESEND_API_BASE")) || "https://api.resend.com",
  };
}

export async function providerStatus() {
  const c = await providerConfig();
  return { provider: c.provider, configured: Boolean(c.apiKey) };
}

/**
 * Send one email. msg: { from:{name,email}, to:[{name,email}], cc, bcc, replyTo,
 * subject, html, text, headers, attachments:[{filename, content(base64), content_type}], tags, idempotencyKey }
 * Returns { provider, id }. Throws HttpError(502) with provider message on failure.
 */
export async function sendViaProvider(msg) {
  const c = await providerConfig();
  if (!c.apiKey) {
    throw new HttpError(500, c.provider === "brevo" ? "BREVO_API_KEY secret is not set" : "RESEND_API_KEY secret is not set");
  }
  if (c.provider === "brevo") {
    const body = {
      sender: { name: msg.from.name, email: msg.from.email },
      to: msg.to.map((a) => (a.name ? { email: a.email, name: a.name } : { email: a.email })),
      subject: msg.subject,
      htmlContent: msg.html,
      textContent: msg.text,
      headers: msg.headers,
    };
    if (msg.cc?.length) body.cc = msg.cc.map((a) => ({ email: a.email }));
    if (msg.bcc?.length) body.bcc = msg.bcc.map((a) => ({ email: a.email }));
    if (msg.replyTo) body.replyTo = { email: msg.replyTo };
    if (msg.attachments?.length) body.attachment = msg.attachments.map((a) => ({ name: a.filename, content: a.content }));
    const res = await fetch(`${c.base}/v3/smtp/email`, {
      method: "POST",
      headers: { "api-key": c.apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new HttpError(502, `Brevo: ${data.message || res.statusText}`);
    return { provider: "brevo", id: data.messageId || "" };
  }

  const body = {
    from: formatAddress(msg.from),
    to: msg.to.map(formatAddress),
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    headers: msg.headers,
  };
  if (msg.cc?.length) body.cc = msg.cc.map(formatAddress);
  if (msg.bcc?.length) body.bcc = msg.bcc.map(formatAddress);
  if (msg.replyTo) body.reply_to = [msg.replyTo];
  if (msg.attachments?.length) {
    body.attachments = msg.attachments.map((a) => ({ filename: a.filename, content: a.content, content_type: a.content_type }));
  }
  if (msg.tags?.length) body.tags = msg.tags;
  const headers = { authorization: `Bearer ${c.apiKey}`, "content-type": "application/json" };
  if (msg.idempotencyKey) headers["idempotency-key"] = msg.idempotencyKey;
  const res = await fetch(`${c.base}/emails`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, `Resend: ${data.message || data.error || res.statusText}`);
  return { provider: "resend", id: data.id || "" };
}

export async function resendGet(path) {
  const c = await providerConfig();
  const apiKey = c.provider === "resend" ? c.apiKey : await getSecret("RESEND_API_KEY");
  const base = c.provider === "resend" ? c.base : (await getSecret("RESEND_API_BASE")) || "https://api.resend.com";
  if (!apiKey) throw new HttpError(500, "RESEND_API_KEY secret is not set (needed to receive email)");
  const res = await fetch(`${base}${path}`, { headers: { authorization: `Bearer ${apiKey}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, `Resend: ${data.message || res.statusText}`);
  return data;
}

export function errorResponse(err) {
  if (err instanceof HttpError) return json({ ok: false, error: err.message, ...err.extra }, err.status);
  console.error(err);
  return json({ ok: false, error: err?.message || "Unexpected error" }, 500);
}
