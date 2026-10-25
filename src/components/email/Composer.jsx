import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, Eye, EyeOff, Paperclip, X, FileText, Save, BookmarkPlus, ChevronDown, ChevronUp, Link as LinkIcon, AlertTriangle, Search, Wand2 } from "lucide-react";
import { composeEmail, extractVariables, renderString, withAutoVariables, VARIABLE_CATALOG, isValidEmail, parseAddress } from "@/lib/email/emailCore";
import { TEMPLATE_CATEGORIES } from "@/lib/email/templates";
import RichTextEditor from "./RichTextEditor";
import { Button, EmailFrame, RecipientInput, inputClass } from "./ui";
import { invoke, create, update, list, ENTITY, MANUSCRIPT, correspondingAuthor, manuscriptVars, fileToAttachment } from "./api";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Compose / reply form used by the Email Center, thread replies and the quick-send dialog.
 * The chosen template only pre-fills subject + body; everything stays editable before sending.
 */
export default function Composer({
  templates = [],
  settings = {},
  user,
  suggestions = [],
  initial = {},
  mode = "new",
  onSent,
  onCancel,
  onToast,
  onTemplatesChanged,
}) {
  const [to, setTo] = useState(initial.to || []);
  const [cc, setCc] = useState(initial.cc || []);
  const [bcc, setBcc] = useState(initial.bcc || []);
  const [showCc, setShowCc] = useState(Boolean(initial.cc?.length || initial.bcc?.length));
  const [templateKey, setTemplateKey] = useState(initial.templateKey || "");
  const [subject, setSubject] = useState(initial.subject || "");
  const [body, setBody] = useState(initial.body || "");
  const [headerLabel, setHeaderLabel] = useState(initial.headerLabel || "");
  const [variables, setVariables] = useState(initial.variables || {});
  const [attachments, setAttachments] = useState([]);
  const [relatedManuscriptId, setRelatedManuscriptId] = useState(initial.relatedManuscriptId || "");
  const [draftId, setDraftId] = useState(initial.draftId || "");
  const [showPreview, setShowPreview] = useState(mode === "new");
  const [showVars, setShowVars] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [confirmMissing, setConfirmMissing] = useState(null);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef(null);

  // Apply a template passed in from outside (e.g. "Use template" from the Templates tab).
  useEffect(() => {
    if (initial.templateKey && !initial.body) applyTemplate(initial.templateKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.templateKey, templates.length]);

  const activeTemplates = templates.filter((t) => t.is_active !== false);
  const grouped = TEMPLATE_CATEGORIES.map((c) => ({ ...c, items: activeTemplates.filter((t) => (t.category || "general") === c.value) })).filter((g) => g.items.length);

  function applyTemplate(key, silent = false) {
    const t = templates.find((x) => x.key === key);
    setTemplateKey(key);
    if (!t) return;
    if (!silent && dirty && body && !window.confirm("Replace the current subject and message with this template?")) return;
    const prefix = mode === "reply" ? "Re: " : "";
    setSubject(mode === "reply" && initial.subject ? initial.subject : prefix + t.subject);
    setBody(t.body_html);
    setHeaderLabel(t.header_label || "");
    setDirty(false);
  }

  const usedVars = useMemo(() => {
    const names = extractVariables(subject, body, settings.signature_html);
    return names.filter((n) => n !== "portal_url");
  }, [subject, body, settings.signature_html]);

  const preview = useMemo(() => {
    const autoName = to.length === 1 ? parseAddress(to[0]).name : "";
    const vars = { ...variables };
    if (!vars.recipient_name && autoName) vars.recipient_name = autoName;
    if (!vars.editor_name && user?.full_name) vars.editor_name = user.full_name;
    return composeEmail({ subject, bodyHtml: body, variables: vars, settings, headerLabel });
  }, [subject, body, variables, settings, headerLabel, to, user]);

  const setVar = (k, v) => setVariables((cur) => ({ ...cur, [k]: v }));

  // Turn the template into a plain letter: fill every field that has a value and drop
  // unused optional sections, so the admin can edit the final wording directly.
  function mergeFields() {
    const autoName = to.length === 1 ? parseAddress(to[0]).name : "";
    const vars = withAutoVariables({ recipient_name: autoName, editor_name: user?.full_name, ...Object.fromEntries(Object.entries(variables).filter(([, v]) => v)) }, settings);
    setBody(renderString(body, vars, { html: true }).output);
    setSubject(renderString(subject, vars, { html: false }).output);
    setDirty(true);
    onToast?.({ kind: "ok", text: "Fields merged — edit the letter freely" });
  }

  async function addFiles(files) {
    const next = [...attachments];
    for (const f of files) next.push(await fileToAttachment(f));
    const total = next.reduce((n, a) => n + a.size, 0);
    if (total > MAX_BYTES) {
      setError("Attachments can be at most 8 MB in total.");
      return;
    }
    setError("");
    setAttachments(next);
  }

  function validate() {
    if (!to.length) return "Add at least one recipient.";
    const bad = [...to, ...cc, ...bcc].filter((a) => !isValidEmail(parseAddress(a).email));
    if (bad.length) return `Check these addresses: ${bad.join(", ")}`;
    if (!subject.trim()) return "Add a subject.";
    if (!body.replace(/<[^>]+>/g, "").trim()) return "Write a message.";
    return "";
  }

  async function send(allowMissing = false) {
    const v = validate();
    if (v) return setError(v);
    if (preview.missing.length && !allowMissing) return setConfirmMissing(preview.missing);
    setConfirmMissing(null);
    setError("");
    setSending(true);
    try {
      const result = await invoke("emailSend", {
        to, cc, bcc, subject, body_html: body, header_label: headerLabel,
        template_key: templateKey, variables,
        thread_id: initial.threadId || undefined,
        reply_to_message_id: initial.replyToMessageId || undefined,
        related_manuscript_id: relatedManuscriptId || undefined,
        attachments: attachments.map(({ filename, content, content_type }) => ({ filename, content, content_type })),
        draft_id: draftId || undefined,
        allow_missing_variables: allowMissing,
      });
      onToast?.({ kind: "ok", text: `Email sent to ${to.map((a) => parseAddress(a).email).join(", ")}` });
      onSent?.(result);
    } catch (e) {
      if (e.data?.missing) setConfirmMissing(e.data.missing);
      setError(e.message);
      if (e.data?.thread_id) onSent?.({ ...e.data, failed: true });
    } finally {
      setSending(false);
    }
  }

  async function saveDraft() {
    setSavingDraft(true);
    try {
      const data = {
        direction: "outbound", status: "draft", to, cc, bcc, subject, editor_html: body,
        template_key: templateKey, variables, thread_id: initial.threadId || "",
        snippet: preview.text.slice(0, 160), related_manuscript_id: relatedManuscriptId,
        from_email: settings.from_email, sent_by: user?.email,
      };
      if (draftId) await update(ENTITY.message, draftId, data);
      else setDraftId((await create(ENTITY.message, data)).id);
      onToast?.({ kind: "ok", text: "Draft saved" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingDraft(false);
    }
  }

  async function saveToTemplate() {
    const t = templates.find((x) => x.key === templateKey);
    try {
      if (t && window.confirm(`Save this subject and message as the new text of the "${t.name}" template?`)) {
        await update(ENTITY.template, t.id, { subject: subject.replace(/^Re:\s*/i, ""), body_html: body, header_label: headerLabel, variables: extractVariables(subject, body), last_edited_by: user?.email });
        onToast?.({ kind: "ok", text: `Template "${t.name}" updated` });
      } else if (!t || window.confirm("Save as a new template instead?")) {
        const name = window.prompt("Name for the new template", subject.slice(0, 60));
        if (!name) return;
        const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) + "_" + Date.now().toString(36).slice(-4);
        await create(ENTITY.template, { key, name, category: "general", subject, body_html: body, header_label: headerLabel, variables: extractVariables(subject, body), is_system: false, is_active: true, last_edited_by: user?.email });
        setTemplateKey(key);
        onToast?.({ kind: "ok", text: `Template "${name}" created` });
      }
      onTemplatesChanged?.();
    } catch (e) {
      setError(e.message);
    }
  }

  const compact = mode === "reply";
  return (
    <div className={`grid gap-5 ${showPreview ? "xl:grid-cols-2" : ""}`}>
      <div className="min-w-0 space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white px-3">
          <RecipientInput id="em-to" label="To" value={to} onChange={setTo} suggestions={suggestions} autoFocus={!compact && !to.length} />
          {showCc ? (
            <>
              <RecipientInput id="em-cc" label="Cc" value={cc} onChange={setCc} suggestions={suggestions} />
              <RecipientInput id="em-bcc" label="Bcc" value={bcc} onChange={setBcc} suggestions={suggestions} />
            </>
          ) : null}
          <div className="flex items-center gap-2 py-1.5">
            <label htmlFor="em-subject" className="w-10 shrink-0 text-sm text-slate-500">Subj.</label>
            <input id="em-subject" aria-label="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); setDirty(true); }} placeholder="Subject" className="flex-1 bg-transparent py-1 text-sm font-medium outline-none" />
            {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-xs text-slate-500 hover:text-blue-800">Cc / Bcc</button>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <select
              aria-label="Template"
              value={templateKey}
              onChange={(e) => applyTemplate(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-slate-300 bg-white pl-8 pr-8 text-sm text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="">Choose a template…</option>
              {grouped.map((g) => (
                <optgroup key={g.value} label={g.label}>
                  {g.items.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          <ManuscriptPicker value={relatedManuscriptId} onPick={async (m, fill) => {
            setRelatedManuscriptId(m.id);
            setVariables((cur) => ({ ...cur, ...fill.vars }));
            if (!to.length && fill.email) setTo([fill.name ? `"${fill.name}" <${fill.email}>` : fill.email]);
          }} />
          <Button variant="ghost" size="sm" icon={showPreview ? EyeOff : Eye} onClick={() => setShowPreview((s) => !s)}>
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
        </div>

        <RichTextEditor value={body} onChange={(v) => { setBody(v); setDirty(true); }} minHeight={compact ? 180 : 280} />

        {usedVars.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60">
            <button type="button" onClick={() => setShowVars((s) => !s)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-700">
              <span>
                Template fields
                {preview.missing.length > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">{preview.missing.length} to fill</span>}
              </span>
              {showVars ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showVars && (
              <div className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200 sm:col-span-2">
                  <span>Fill the fields below, or merge them into the text to edit the finished letter directly.</span>
                  <Button size="sm" variant="secondary" icon={Wand2} onClick={mergeFields}>Merge fields into text</Button>
                </div>
                {usedVars.map((k) => {
                  const meta = VARIABLE_CATALOG[k] || { label: k };
                  const missing = preview.missing.includes(k);
                  const auto = meta.auto && !variables[k];
                  const common = {
                    id: `var-${k}`,
                    value: variables[k] || "",
                    onChange: (e) => setVar(k, e.target.value),
                    placeholder: auto ? "Filled automatically" : meta.sample ? `e.g. ${meta.sample.split("\n")[0].slice(0, 40)}` : "",
                    className: `${inputClass} ${missing ? "border-amber-400 bg-amber-50/40" : ""}`,
                  };
                  return (
                    <label key={k} htmlFor={`var-${k}`} className={meta.multiline ? "sm:col-span-2 block" : "block"}>
                      <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        {meta.label}
                        <code className="text-[10px] text-slate-400">{`{{${k}}}`}</code>
                        {missing && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Required" />}
                      </span>
                      {meta.multiline ? <textarea rows={3} {...common} /> : <input {...common} />}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />{a.filename}<span className="text-slate-400">{(a.size / 1024).toFixed(0)} KB</span>
                <button type="button" aria-label={`Remove ${a.filename}`} onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-700" /></button>
              </span>
            ))}
          </div>
        )}

        {confirmMissing && (
          <div className="flex flex-wrap items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              Some template fields are still empty: <strong>{confirmMissing.map((m) => VARIABLE_CATALOG[m]?.label || m).join(", ")}</strong>. They would appear as {"{{…}}"} in the email.
            </div>
            <Button size="sm" variant="secondary" onClick={() => send(true)}>Send anyway</Button>
          </div>
        )}
        {error && !confirmMissing && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button icon={Send} loading={sending} onClick={() => send(false)}>Send</Button>
          <Button variant="secondary" icon={Paperclip} onClick={() => fileRef.current?.click()}>Attach</Button>
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }} />
          <Button variant="ghost" icon={Save} loading={savingDraft} onClick={saveDraft}>Save draft</Button>
          <Button variant="ghost" icon={BookmarkPlus} onClick={saveToTemplate} title="Save this wording to the template">Save to template</Button>
          {onCancel && <Button variant="ghost" className="ml-auto" onClick={onCancel}>Cancel</Button>}
        </div>
      </div>

      {showPreview && (
        <div className="min-w-0">
          <div className="sticky top-4 self-start rounded-xl border border-slate-200 bg-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Preview · as the recipient sees it</div>
                <div className="truncate text-sm font-medium text-slate-900">{preview.subject || "(no subject)"}</div>
              </div>
            </div>
            <div className="max-h-[75vh] overflow-auto">
              <EmailFrame html={preview.html} title="Email preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Optional: link a manuscript and auto-fill its fields. Hidden if no Manuscript entity exists. */
function ManuscriptPicker({ value, onPick }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  const [journals, setJournals] = useState({});
  useEffect(() => {
    if (!open || items) return;
    list(MANUSCRIPT.entity, "-created_date", 500).then(setItems).catch(() => { setUnavailable(true); setItems([]); });
    list(MANUSCRIPT.journalEntity, "title", 500)
      .then((js) => setJournals(Object.fromEntries(js.map((j) => [j.id, j.title]))))
      .catch(() => {});
  }, [open]);

  function choose(m) {
    const author = correspondingAuthor(m);
    const vars = manuscriptVars(m, journals[m.journal_id] || "", window.location.origin);
    onPick(m, { vars, email: author.email, name: author.name });
    setOpen(false);
  }

  const term = q.trim().toLowerCase();
  const shown = (items || []).filter((m) => {
    if (!term) return true;
    const hay = [m.title, journals[m.journal_id], m.status, ...(m.authors || []).flatMap((a) => [a?.name, a?.email])].join(" ").toLowerCase();
    return hay.includes(term);
  }).slice(0, 40);
  return (
    <div className="relative">
      <Button variant={value ? "secondary" : "ghost"} size="sm" icon={LinkIcon} onClick={() => setOpen((o) => !o)}>
        {value ? "Manuscript linked" : "Link manuscript"}
      </Button>
      {open && (
        <div className="absolute left-0 z-40 mt-1 w-[min(28rem,85vw)] rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, author or journal…" className="flex-1 text-sm outline-none" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="max-h-72 overflow-auto py-1">
            {items === null && <div className="px-3 py-4 text-sm text-slate-500">Loading manuscripts…</div>}
            {unavailable && <div className="px-3 py-4 text-sm text-slate-500">Manuscripts couldn't be loaded.</div>}
            {items && !unavailable && shown.length === 0 && <div className="px-3 py-4 text-sm text-slate-500">No matching manuscripts.</div>}
            {shown.map((m) => (
              <button key={m.id} type="button" onClick={() => choose(m)} className="block w-full px-3 py-2 text-left hover:bg-blue-50">
                <div className="line-clamp-2 text-sm text-slate-900">{m.title || "(untitled)"}</div>
                <div className="text-xs text-slate-500">{[correspondingAuthor(m).name, correspondingAuthor(m).email, (m.status || "").replace(/_/g, " "), journals[m.journal_id]].filter(Boolean).join(" · ")}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
