// @ts-nocheck
// AfriSci Nexus Email Center — generated from the email-center package (functions-src/emailInbound.ts).
// Base44 backend function: emailInbound  (public webhook — point Resend here)
// Receives Resend webhooks, verified with the Svix signature:
//   • email.received      → fetch full email from Resend, store it, thread it, mark unread
//   • email.delivered/... → update delivery status of the matching outbound message
// Webhook URL: https://afriscinexus.com/functions/emailInbound  (or <app>.base44.app/functions/emailInbound)
import { createClientFromRequest } from "npm:@base44/sdk@0.8.57";

import {
  DEFAULT_SETTINGS,
  VARIABLE_CATALOG,
  escapeHtml,
  extractVariables,
  renderString,
  applyShortcodes,
  sanitizeHtml,
  htmlToText,
  brandedLayout,
  composeEmail,
  withAutoVariables,
  isValidEmail,
  parseAddress,
  parseAddressList,
  formatAddress,
  normalizeSubject,
  makeThreadToken,
  threadReplyAddress,
  findThreadIdInAddresses,
  verifySvixSignature,
  signSvix,
  makeMessageId,
  snippetFrom,
} from "../../shared/emailCore.ts";
import {
  getSecret,
  json,
  HttpError,
  listAll,
  filterAll,
  loadSettings,
  requireStaff,
  threadSecret,
  providerStatus,
  sendViaProvider,
  resendGet,
  errorResponse,
} from "../../shared/emailServer.ts";

const DELIVERY_RANK: Record<string, number> = {
  sent: 1, delivery_delayed: 2, delivered: 3, opened: 4, clicked: 5, bounced: 9, complained: 9, failed: 9,
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  try {
    const raw = await req.text();
    const secret = await getSecret("RESEND_WEBHOOK_SECRET");
    if (!secret) throw new HttpError(500, "RESEND_WEBHOOK_SECRET secret is not set");
    const valid = await verifySvixSignature(raw, req.headers, secret);
    if (!valid) throw new HttpError(401, "Invalid webhook signature");

    const event = JSON.parse(raw);
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const type = String(event?.type || "");

    if (type === "email.received") return json(await handleReceived(base44, db, event.data || {}));
    if (type.startsWith("email.")) return json(await handleDelivery(db, type.slice(6), event.data || {}, event.created_at));
    return json({ ok: true, ignored: type });
  } catch (err) {
    return errorResponse(err);
  }
});

async function handleDelivery(db: any, kind: string, data: any, createdAt?: string) {
  const status = kind === "delivery_delayed" ? "delivery_delayed" : kind;
  if (!(status in DELIVERY_RANK) || !data.email_id) return { ok: true, ignored: kind };
  const [msg] = await filterAll(db.EmailMessage, { provider_message_id: data.email_id }, "-created_date", 1);
  if (!msg) return { ok: true, unknown_message: data.email_id };
  const current = DELIVERY_RANK[msg.delivery_status] || 0;
  if (DELIVERY_RANK[status] < current && current < 9) return { ok: true, unchanged: true };
  const patch: Record<string, unknown> = { delivery_status: status, delivery_updated_at: createdAt || new Date().toISOString() };
  if (status === "bounced" || status === "failed") {
    patch.status = "bounced";
    patch.error = data?.bounce?.message || data?.failed?.reason || `Email ${status}`;
  }
  await db.EmailMessage.update(msg.id, patch);
  if (patch.status === "bounced" && msg.thread_id) {
    try { await db.EmailThread.update(msg.thread_id, { has_failed: true }); } catch (_) { /* thread removed */ }
  }
  return { ok: true, message_id: msg.id, delivery_status: status };
}

async function handleReceived(base44: any, db: any, data: any) {
  const emailId = data.email_id;
  if (!emailId) throw new HttpError(400, "Missing email_id");

  // Idempotency: Resend may retry a webhook.
  const [existing] = await filterAll(db.EmailMessage, { provider_message_id: emailId }, "-created_date", 1);
  if (existing) return { ok: true, duplicate: true, message_id: existing.id };

  const full = await resendGet(`/emails/receiving/${encodeURIComponent(emailId)}`);
  const { settings } = await loadSettings(base44);
  const headers = lowerKeys(full.headers || {});
  const fromRaw = headers.from || full.from || data.from || "";
  const from = parseAddress(fromRaw);
  const toList = toArray(full.to ?? data.to);
  const ccList = toArray(full.cc ?? data.cc);
  const receivedFor = toArray(full.received_for ?? data.received_for);
  const subject = String(full.subject ?? data.subject ?? "(no subject)");
  const messageIdHeader = String(full.message_id || data.message_id || headers["message-id"] || "");
  const inReplyTo = String(headers["in-reply-to"] || "").trim();
  const references = String(headers["references"] || "").trim();
  const html = full.html ? sanitizeHtml(full.html) : "";
  const text = full.text || htmlToText(html);
  const now = new Date().toISOString();

  // ---- find the conversation
  let thread: any = null;
  const tokenThreadId = await findThreadIdInAddresses([...toList, ...ccList, ...receivedFor], settings, await threadSecret());
  if (tokenThreadId) {
    try { thread = await db.EmailThread.get(tokenThreadId); } catch (_) { thread = null; }
  }
  if (!thread) {
    const ids = [inReplyTo, ...references.split(/\s+/)].map((s) => s.trim()).filter(Boolean);
    for (const id of ids) {
      const [parent] = await filterAll(db.EmailMessage, { message_id_header: id }, "-created_date", 1);
      if (parent?.thread_id) {
        try { thread = await db.EmailThread.get(parent.thread_id); } catch (_) { thread = null; }
        if (thread) break;
      }
    }
  }
  if (!thread) {
    const norm = normalizeSubject(subject);
    if (norm) {
      const candidates = await filterAll(db.EmailThread, { normalized_subject: norm }, "-last_message_at", 20);
      thread = candidates.find((t: any) => (t.participants || []).includes(from.email)) || null;
    }
  }
  if (!thread) {
    thread = await db.EmailThread.create({
      subject,
      normalized_subject: normalizeSubject(subject),
      participants: [from.email],
      participant_names: [from.name || ""],
      last_message_at: now,
      last_direction: "inbound",
    has_inbound: true,
      has_inbound: true,
      snippet: snippetFrom(text),
      message_count: 0,
      unread_count: 0,
      status: "open",
    });
  }

  const auth = full.authentication || {};
  const record = await db.EmailMessage.create({
    thread_id: thread.id,
    direction: "inbound",
    status: "received",
    from_email: from.email,
    from_name: from.name,
    to: toList,
    cc: ccList,
    reply_to: toArray(full.reply_to)[0] || "",
    subject,
    body_html: html,
    body_text: text,
    snippet: snippetFrom(text),
    attachments: (full.attachments || data.attachments || []).map((a: any) => ({
      id: a.id,
      filename: a.filename || "attachment",
      content_type: a.content_type || "application/octet-stream",
      size: a.size || 0,
    })),
    provider: "resend",
    provider_message_id: emailId,
    message_id_header: messageIdHeader,
    in_reply_to: inReplyTo,
    references,
    is_read: false,
    received_at: full.created_at || data.created_at || now,
    related_manuscript_id: thread.related_manuscript_id || "",
    spam_verdict: ["spf", "dkim", "dmarc"].filter((k) => auth[k]).map((k) => `${k.toUpperCase()}:${auth[k]}`).join(" "),
  });

  const participants = new Set([...(thread.participants || []), from.email]);
  await db.EmailThread.update(thread.id, {
    last_message_at: now,
    last_direction: "inbound",
    has_inbound: true,
    snippet: snippetFrom(text),
    message_count: (thread.message_count || 0) + 1,
    unread_count: (thread.unread_count || 0) + 1,
    participants: [...participants],
    status: "open",
  });

  return { ok: true, message_id: record.id, thread_id: thread.id, threaded_by: tokenThreadId ? "reply-address" : undefined };
}

function toArray(v: unknown): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).map((x) => String(x)).filter(Boolean);
}
function lowerKeys(obj: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) out[k.toLowerCase()] = Array.isArray(v) ? v.join(" ") : String(v);
  return out;
}
