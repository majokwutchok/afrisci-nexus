// @ts-nocheck
// AfriSci Nexus Email Center — generated from the email-center package (functions-src/emailSend.ts).
// Base44 backend function: emailSend
// Sends a branded email to authors/clients from the admin Email Center and logs it.
// Called from the frontend with base44.functions.invoke("emailSend", {...}).
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

const MAX_RECIPIENTS = 50;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  try {
    const base44 = createClientFromRequest(req);
    const { settings } = await loadSettings(base44);
    const user = await requireStaff(base44, settings);
    const p = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;

    // ---- recipients
    const to = parseAddressList(p.to);
    const cc = parseAddressList(p.cc);
    const bcc = parseAddressList(p.bcc);
    if (settings.bcc_archive && isValidEmail(settings.bcc_archive)) bcc.push({ name: "", email: settings.bcc_archive.toLowerCase() });
    if (!to.length) throw new HttpError(400, "Add at least one recipient");
    const bad = [...to, ...cc, ...bcc].filter((a) => !isValidEmail(a.email)).map((a) => a.email);
    if (bad.length) throw new HttpError(400, `Invalid email address: ${bad.join(", ")}`, { invalid: bad });
    if (to.length + cc.length + bcc.length > MAX_RECIPIENTS) throw new HttpError(400, `Maximum ${MAX_RECIPIENTS} recipients per email`);

    // ---- content
    if (!String(p.subject || "").trim()) throw new HttpError(400, "Subject is required");
    if (!String(p.body_html || "").replace(/<[^>]+>/g, "").trim()) throw new HttpError(400, "Message body is empty");
    const variables = { ...(p.variables || {}) };
    if (!variables.editor_name) variables.editor_name = settings.default_editor_name || user.full_name || "";
    if (!variables.recipient_name && to.length === 1 && to[0].name) variables.recipient_name = to[0].name;
    const composed = composeEmail({
      subject: p.subject,
      bodyHtml: p.body_html,
      variables,
      settings,
      headerLabel: p.header_label || "",
      includeSignature: p.include_signature !== false,
    });
    if (composed.missing.length && !p.allow_missing_variables) {
      throw new HttpError(422, `Fill in: ${composed.missing.join(", ")}`, { missing: composed.missing });
    }

    // ---- attachments (base64 from the browser; nothing is uploaded to Base44 storage)
    const attachments = (Array.isArray(p.attachments) ? p.attachments : []).filter((a) => a && a.filename && a.content);
    const totalBytes = attachments.reduce((n, a) => n + Math.floor(String(a.content).length * 0.75), 0);
    if (totalBytes > MAX_ATTACHMENT_BYTES) throw new HttpError(400, "Attachments are larger than 8 MB in total");

    // ---- thread
    const now = new Date().toISOString();
    let thread = null;
    if (p.thread_id) {
      try { thread = await db.EmailThread.get(p.thread_id); } catch (_) { thread = null; }
      if (!thread) throw new HttpError(404, "Conversation not found");
    } else {
      thread = await db.EmailThread.create({
        subject: composed.subject,
        normalized_subject: normalizeSubject(composed.subject),
        participants: [...to, ...cc].map((a) => a.email),
        participant_names: [...to, ...cc].map((a) => a.name || ""),
        last_message_at: now,
        last_direction: "outbound",
      has_outbound: true,
        has_outbound: true,
        snippet: snippetFrom(composed.text),
        message_count: 0,
        unread_count: 0,
        status: "open",
        related_manuscript_id: p.related_manuscript_id || "",
        related_manuscript_title: variables.manuscript_title || "",
      });
    }

    // ---- threading headers
    const headers: Record<string, string> = {};
    const domain = String(settings.from_email).split("@")[1] || "afriscinexus.com";
    const messageIdHeader = makeMessageId(domain);
    headers["Message-ID"] = messageIdHeader;
    headers["X-AfriSci-Thread"] = thread.id;
    let inReplyTo = "";
    let references = "";
    if (p.reply_to_message_id) {
      try {
        const parent = await db.EmailMessage.get(p.reply_to_message_id);
        if (parent?.message_id_header) {
          inReplyTo = parent.message_id_header;
          references = [parent.references, parent.message_id_header].filter(Boolean).join(" ").trim();
          headers["In-Reply-To"] = inReplyTo;
          headers["References"] = references;
        }
      } catch (_) { /* parent missing: send without threading headers */ }
    }
    const replyTo = await threadReplyAddress(thread.id, settings, await threadSecret());

    // ---- log first, so a failure is still visible in the inbox
    const record = await db.EmailMessage.create({
      thread_id: thread.id,
      direction: "outbound",
      status: "sending",
      from_email: settings.from_email,
      from_name: settings.from_name,
      to: to.map(formatAddress),
      cc: cc.map(formatAddress),
      bcc: bcc.map(formatAddress),
      reply_to: replyTo,
      subject: composed.subject,
      body_html: composed.html,
      body_text: composed.text,
      editor_html: p.body_html,
      template_key: p.template_key || "",
      variables,
      snippet: snippetFrom(composed.text),
      attachments: attachments.map((a, i) => ({
        id: String(i),
        filename: a.filename,
        content_type: a.content_type || "application/octet-stream",
        size: Math.floor(String(a.content).length * 0.75),
      })),
      message_id_header: messageIdHeader,
      in_reply_to: inReplyTo,
      references,
      is_read: true,
      sent_by: user.email,
      related_manuscript_id: p.related_manuscript_id || thread.related_manuscript_id || "",
    });

    let result = null;
    let sendError = null;
    try {
      result = await sendViaProvider({
        from: { name: settings.from_name, email: settings.from_email },
        to, cc, bcc,
        replyTo,
        subject: composed.subject,
        html: composed.html,
        text: composed.text,
        headers,
        attachments,
        tags: p.template_key ? [{ name: "template", value: String(p.template_key).replace(/[^a-zA-Z0-9_-]/g, "_") }] : [],
        idempotencyKey: p.idempotency_key || record.id,
      });
    } catch (e) {
      sendError = e;
    }

    const sentAt = new Date().toISOString();
    await db.EmailMessage.update(record.id, sendError
      ? { status: "failed", error: sendError.message, delivery_status: "failed", delivery_updated_at: sentAt }
      : { status: "sent", provider: result.provider, provider_message_id: result.id, sent_at: sentAt, delivery_status: "sent", delivery_updated_at: sentAt });

    const participants = new Set([...(thread.participants || []), ...to.map((a) => a.email), ...cc.map((a) => a.email)]);
    await db.EmailThread.update(thread.id, {
      last_message_at: sentAt,
      last_direction: "outbound",
      has_outbound: true,
      snippet: snippetFrom(composed.text),
      message_count: (thread.message_count || 0) + 1,
      participants: [...participants],
      status: "open",
      has_failed: Boolean(sendError), // reflects the latest send attempt
      related_manuscript_id: thread.related_manuscript_id || p.related_manuscript_id || "",
    });

    if (p.draft_id) {
      try { await db.EmailMessage.delete(p.draft_id); } catch (_) { /* already gone */ }
    }

    if (sendError) {
      return json({ ok: false, error: sendError.message, message_id: record.id, thread_id: thread.id }, sendError.status || 502);
    }
    return json({ ok: true, message_id: record.id, thread_id: thread.id, provider: result.provider, provider_id: result.id });
  } catch (err) {
    return errorResponse(err);
  }
});
