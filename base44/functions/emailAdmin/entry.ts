// @ts-nocheck
// AfriSci Nexus Email Center — generated from the email-center package (functions-src/emailAdmin.ts).
// Base44 backend function: emailAdmin  (staff only)
// Actions:
//   status            → provider/secret configuration check for the Settings tab
//   seed_templates    → create any missing built-in templates ({ overwrite: true } restores all)
//   reset_template    → restore one built-in template to its default text ({ key })
//   mark_thread       → { thread_id, read?, archived?, starred? }
//   attachment_url    → { message_id, attachment_id } → fresh download link for an inbound attachment
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
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from "../../shared/emailTemplates.ts";
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

function templateRecord(t: any) {
  return {
    key: t.key,
    name: t.name,
    category: t.category,
    description: t.description,
    header_label: t.header_label,
    subject: t.subject,
    body_html: t.body_html,
    variables: extractVariables(t.subject, t.body_html),
    is_system: true,
    is_active: true,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  try {
    const base44 = createClientFromRequest(req);
    const { settings, record } = await loadSettings(base44);
    const user = await requireStaff(base44, settings);
    const p = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;

    switch (p.action) {
      case "status": {
        const prov = await providerStatus();
        const webhookSecret = Boolean(await getSecret("RESEND_WEBHOOK_SECRET"));
        const templates = await listAll(db.EmailTemplate, "name", 500);
        return json({
          ok: true,
          provider: prov.provider,
          provider_configured: prov.configured,
          inbound_configured: webhookSecret,
          settings_saved: Boolean(record),
          template_count: templates.length,
          from: formatAddress({ name: settings.from_name, email: settings.from_email }),
          sample_reply_address: await threadReplyAddress("THREADID", settings, await threadSecret()),
          user: { email: user.email, role: user.role },
        });
      }

      case "seed_templates": {
        const existing = await listAll(db.EmailTemplate, "name", 500);
        const byKey = new Map(existing.map((t: any) => [t.key, t]));
        let created = 0, restored = 0;
        for (const t of DEFAULT_TEMPLATES) {
          const cur: any = byKey.get(t.key);
          if (!cur) { await db.EmailTemplate.create(templateRecord(t)); created++; }
          else if (p.overwrite) { await db.EmailTemplate.update(cur.id, { ...templateRecord(t), last_edited_by: user.email }); restored++; }
        }
        return json({ ok: true, created, restored, total: DEFAULT_TEMPLATES.length });
      }

      case "reset_template": {
        const def = DEFAULT_TEMPLATES.find((t) => t.key === p.key);
        if (!def) throw new HttpError(404, "No built-in default for this template");
        const [cur] = await filterAll(db.EmailTemplate, { key: p.key }, "-updated_date", 1);
        const data = { ...templateRecord(def), last_edited_by: user.email };
        const saved = cur ? await db.EmailTemplate.update(cur.id, data) : await db.EmailTemplate.create(data);
        return json({ ok: true, template: saved });
      }

      case "mark_thread": {
        if (!p.thread_id) throw new HttpError(400, "thread_id is required");
        const patch: Record<string, unknown> = {};
        if (typeof p.archived === "boolean") patch.status = p.archived ? "archived" : "open";
        if (typeof p.starred === "boolean") patch.starred = p.starred;
        if (p.read === true) {
          patch.unread_count = 0;
          const unread = await filterAll(db.EmailMessage, { thread_id: p.thread_id, is_read: false }, "-created_date", 200);
          for (const m of unread) await db.EmailMessage.update(m.id, { is_read: true });
        } else if (p.read === false) {
          patch.unread_count = 1;
        }
        const t = await db.EmailThread.update(p.thread_id, patch);
        return json({ ok: true, thread: t });
      }

      case "attachment_url": {
        const msg = await db.EmailMessage.get(p.message_id);
        if (!msg || msg.direction !== "inbound") throw new HttpError(404, "Message not found");
        const att = (msg.attachments || []).find((a: any) => a.id === p.attachment_id);
        if (!att) throw new HttpError(404, "Attachment not found");
        const data = await resendGet(`/emails/receiving/${encodeURIComponent(msg.provider_message_id)}/attachments/${encodeURIComponent(att.id)}`);
        return json({ ok: true, url: data.download_url, expires_at: data.expires_at, filename: att.filename });
      }

      default:
        throw new HttpError(400, "Unknown action");
    }
  } catch (err) {
    return errorResponse(err);
  }
});
