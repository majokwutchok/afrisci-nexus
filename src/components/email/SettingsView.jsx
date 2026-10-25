import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Copy, Save, Send, RefreshCw } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/lib/email/emailCore";
import { DEFAULT_TEMPLATES } from "@/lib/email/templates";
import RichTextEditor from "./RichTextEditor";
import { Button, Field, inputClass } from "./ui";
import { create, update, invoke, ENTITY } from "./api";

const FIELDS = ["from_name", "from_email", "inbound_domain", "reply_local_part", "fallback_reply_to", "bcc_archive", "brand_color", "accent_color", "logo_url", "website_url", "default_editor_name", "default_editor_title", "signature_html", "footer_address", "staff_roles"];

export default function SettingsView({ record, user, onSaved, onToast }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_SETTINGS, ...(record || {}) }));
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { setForm({ ...DEFAULT_SETTINGS, ...(record || {}) }); }, [record?.id, record?.updated_date]);
  const loadStatus = () => invoke("emailAdmin", { action: "status" }).then(setStatus).catch((e) => setStatus({ error: e.message }));
  useEffect(() => { loadStatus(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const webhookUrl = `${window.location.origin}/functions/emailInbound`;

  async function save() {
    setSaving(true);
    try {
      const data = Object.fromEntries(FIELDS.map((k) => [k, form[k] ?? ""]));
      if (record?.id) await update(ENTITY.settings, record.id, data);
      else await create(ENTITY.settings, data);
      onToast?.({ kind: "ok", text: "Email settings saved" });
      await onSaved?.();
      loadStatus();
    } catch (e) { onToast?.({ kind: "error", text: e.message }); }
    finally { setSaving(false); }
  }

  async function sendTest() {
    setTesting(true);
    const t = DEFAULT_TEMPLATES.find((x) => x.key === "general_message");
    try {
      await invoke("emailSend", {
        to: [user.email], subject: "AfriSci Nexus email test", body_html: t.body_html, template_key: "general_message",
        variables: { recipient_name: user.full_name || "colleague", custom_message: "This is a test of the AfriSci Nexus branded email system. If you can read this, sending works. Reply to this message to test receiving." },
      });
      onToast?.({ kind: "ok", text: `Test email sent to ${user.email}` });
    } catch (e) { onToast?.({ kind: "error", text: e.message }); }
    finally { setTesting(false); }
  }

  const Check = ({ ok, label, help }) => (
    <li className="flex items-start gap-2.5">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
      <div><div className="text-sm text-slate-800">{label}</div>{!ok && help && <div className="text-xs text-slate-500">{help}</div>}</div>
    </li>
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Sender identity</h2>
          <p className="text-sm text-slate-500">How your emails appear in authors' inboxes. The sending domain must be verified in your Resend account.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From name"><input className={inputClass} value={form.from_name} onChange={set("from_name")} /></Field>
          <Field label="From address"><input className={inputClass} type="email" value={form.from_email} onChange={set("from_email")} /></Field>
          <Field label="Receiving domain" hint="Its MX record points to Resend. Replies go to reply+…@ this domain."><input className={inputClass} value={form.inbound_domain} onChange={set("inbound_domain")} /></Field>
          <Field label="Archive copy (BCC)" hint="Optional: every sent email is copied here"><input className={inputClass} type="email" value={form.bcc_archive} onChange={set("bcc_archive")} /></Field>
          <Field label="Default signer name" hint="Used when the sender has no name on their account"><input className={inputClass} value={form.default_editor_name} onChange={set("default_editor_name")} /></Field>
          <Field label="Default signer title"><input className={inputClass} value={form.default_editor_title} onChange={set("default_editor_title")} /></Field>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-900">Branding</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Brand colour"><div className="flex gap-2"><input type="color" value={form.brand_color} onChange={set("brand_color")} className="h-10 w-12 rounded border border-slate-300" aria-label="Brand colour picker" /><input className={inputClass} value={form.brand_color} onChange={set("brand_color")} /></div></Field>
          <Field label="Accent colour"><div className="flex gap-2"><input type="color" value={form.accent_color} onChange={set("accent_color")} className="h-10 w-12 rounded border border-slate-300" aria-label="Accent colour picker" /><input className={inputClass} value={form.accent_color} onChange={set("accent_color")} /></div></Field>
          <Field label="Logo image URL" hint="Optional. PNG on white/transparent, ~40px tall. Leave empty for the text wordmark."><input className={inputClass} value={form.logo_url} onChange={set("logo_url")} placeholder="https://…" /></Field>
          <Field label="Website URL"><input className={inputClass} value={form.website_url} onChange={set("website_url")} /></Field>
          <Field label="Footer address"><input className={inputClass} value={form.footer_address} onChange={set("footer_address")} /></Field>
          <Field label="Roles allowed to send" hint="Comma-separated user roles, e.g. admin,editor"><input className={inputClass} value={form.staff_roles} onChange={set("staff_roles")} /></Field>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600">Signature (added to every email)</span>
          <RichTextEditor value={form.signature_html} onChange={set("signature_html")} minHeight={110} />
        </div>
        <div className="flex gap-2 border-t border-slate-100 pt-4">
          <Button icon={Save} loading={saving} onClick={save}>Save settings</Button>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Connection</h2>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadStatus} aria-label="Recheck" />
          </div>
          {!status ? <p className="text-sm text-slate-400">Checking…</p> : status.error ? <p className="text-sm text-red-700">{status.error}</p> : (
            <ul className="space-y-2.5">
              <Check ok={status.provider_configured} label={`Sending via ${status.provider === "brevo" ? "Brevo" : "Resend"} (your own account — no Base44 credits)`} help="Add the RESEND_API_KEY secret in Base44 → Settings → Secrets." />
              <Check ok={status.inbound_configured} label="Receiving replies (webhook secret set)" help="Add the RESEND_WEBHOOK_SECRET secret, then create the webhook below in Resend." />
              <Check ok={status.template_count > 0} label={`${status.template_count} templates installed`} />
              <Check ok={status.settings_saved} label="Settings saved" help="Save this form once to store your sender identity." />
            </ul>
          )}
          <Button variant="secondary" icon={Send} loading={testing} className="mt-4 w-full" onClick={sendTest} disabled={!status?.provider_configured}>Send test email to me</Button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <h2 className="mb-2 text-base font-semibold text-slate-900">Receiving webhook</h2>
          <p className="mb-2">In Resend → Webhooks, add this endpoint and select <strong>email.received</strong> plus the delivery events (sent, delivered, bounced, complained, opened):</p>
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2">
            <code className="flex-1 break-all text-xs text-slate-800">{webhookUrl}</code>
            <Button variant="ghost" size="sm" icon={Copy} aria-label="Copy webhook URL" onClick={() => { navigator.clipboard?.writeText(webhookUrl); onToast?.({ kind: "ok", text: "Copied" }); }} />
          </div>
          {status?.sample_reply_address && <p className="mt-3 text-xs text-slate-500">Replies are routed with addresses like <code className="break-all">{status.sample_reply_address}</code>, so every reply lands in the right conversation.</p>}
        </section>
      </aside>
    </div>
  );
}
