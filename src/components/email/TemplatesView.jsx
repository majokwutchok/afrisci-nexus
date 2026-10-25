import React, { useEffect, useMemo, useState } from "react";
import { Plus, Save, RotateCcw, Copy, Trash2, Send, Search, Lock } from "lucide-react";
import { composeEmail, extractVariables, VARIABLE_CATALOG } from "@/lib/email/emailCore";
import { TEMPLATE_CATEGORIES } from "@/lib/email/templates";
import RichTextEditor from "./RichTextEditor";
import { Badge, Button, EmailFrame, Field, inputClass } from "./ui";
import { create, update, remove, invoke, ENTITY } from "./api";

const SAMPLE = Object.fromEntries(Object.entries(VARIABLE_CATALOG).map(([k, v]) => [k, v.sample]));

export default function TemplatesView({ templates, settings, user, onChanged, onUseTemplate, onToast }) {
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");

  const selected = templates.find((t) => t.id === selectedId) || null;
  useEffect(() => {
    if (!selectedId && templates.length) setSelectedId(templates[0].id);
  }, [templates.length]);
  useEffect(() => { setDraft(selected ? { ...selected } : null); }, [selectedId, selected?.updated_date]);

  const dirty = draft && selected && ["name", "category", "description", "header_label", "subject", "body_html", "is_active"].some((k) => (draft[k] ?? "") !== (selected[k] ?? ""));
  const preview = useMemo(() => draft ? composeEmail({ subject: draft.subject, bodyHtml: draft.body_html, variables: SAMPLE, settings, headerLabel: draft.header_label }) : null, [draft, settings]);
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const shown = templates.filter((t) => !q || `${t.name} ${t.description} ${t.subject}`.toLowerCase().includes(q.toLowerCase()));
  const groups = TEMPLATE_CATEGORIES.map((c) => ({ ...c, items: shown.filter((t) => (t.category || "general") === c.value) })).filter((g) => g.items.length);

  const guard = (fn) => async () => {
    if (dirty && !window.confirm("Discard unsaved changes to this template?")) return;
    fn();
  };

  async function save() {
    setBusy("save");
    try {
      await update(ENTITY.template, draft.id, {
        name: draft.name, category: draft.category, description: draft.description || "", header_label: draft.header_label || "",
        subject: draft.subject, body_html: draft.body_html, is_active: draft.is_active !== false,
        variables: extractVariables(draft.subject, draft.body_html), last_edited_by: user?.email,
      });
      onToast?.({ kind: "ok", text: "Template saved" });
      await onChanged?.();
    } catch (e) { onToast?.({ kind: "error", text: e.message }); }
    finally { setBusy(""); }
  }

  async function reset() {
    if (!window.confirm(`Restore "${draft.name}" to the built-in AfriSci Nexus wording? Your edits to this template will be lost.`)) return;
    setBusy("reset");
    try {
      await invoke("emailAdmin", { action: "reset_template", key: draft.key });
      onToast?.({ kind: "ok", text: "Template restored to default" });
      await onChanged?.();
    } catch (e) { onToast?.({ kind: "error", text: e.message }); }
    finally { setBusy(""); }
  }

  async function duplicate(from) {
    const base = from || { name: "New template", category: "general", subject: "Message from AfriSci Nexus", body_html: "<p>Dear {{recipient_name}},</p><p></p>", header_label: "" };
    const name = from ? `${from.name} (copy)` : base.name;
    const rec = await create(ENTITY.template, {
      key: `${(from?.key || "custom")}_${Date.now().toString(36)}`, name, category: base.category, description: from?.description || "",
      header_label: base.header_label, subject: base.subject, body_html: base.body_html, variables: extractVariables(base.subject, base.body_html),
      is_system: false, is_active: true, last_edited_by: user?.email,
    });
    await onChanged?.();
    setSelectedId(rec.id);
  }

  async function del() {
    if (!window.confirm(`Delete the template "${draft.name}"?`)) return;
    await remove(ENTITY.template, draft.id);
    setSelectedId(null);
    await onChanged?.();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 p-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" aria-label="Search templates" className="h-9 w-full rounded-lg bg-slate-100 pl-8 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" />
          </div>
          <Button size="sm" icon={Plus} onClick={guard(() => duplicate(null))} aria-label="New template" title="New template" />
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-2">
          {groups.map((g) => (
            <div key={g.value} className="mb-2">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.label}</div>
              {g.items.map((t) => (
                <button key={t.id} type="button" onClick={guard(() => setSelectedId(t.id))}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${t.id === selectedId ? "bg-blue-50 font-medium text-blue-900" : "text-slate-700 hover:bg-slate-50"}`}>
                  <span className="flex-1 truncate">{t.name}</span>
                  {t.is_active === false && <Badge>Off</Badge>}
                  {t.is_system && <Lock className="h-3 w-3 text-slate-300" aria-label="Built-in" />}
                </button>
              ))}
            </div>
          ))}
          {templates.length === 0 && <div className="p-4 text-sm text-slate-500">No templates yet.</div>}
        </div>
      </aside>

      {draft ? (
        <div className="grid gap-4 2xl:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-base font-semibold text-slate-900">{draft.name}{dirty && <span className="ml-2 text-xs font-normal text-amber-700">Unsaved changes</span>}</h2>
              <Button icon={Save} loading={busy === "save"} disabled={!dirty} onClick={save}>Save</Button>
              <Button variant="secondary" icon={Send} onClick={guard(() => onUseTemplate?.(draft.key))}>Compose</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Template name"><input className={inputClass} value={draft.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Category">
                <select className={inputClass} value={draft.category || "general"} onChange={(e) => set("category", e.target.value)}>
                  {TEMPLATE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Header label" hint="Small caps line above the message, e.g. Editorial decision"><input className={inputClass} value={draft.header_label || ""} onChange={(e) => set("header_label", e.target.value)} /></Field>
              <Field label="Description"><input className={inputClass} value={draft.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
            </div>
            <Field label="Subject" hint="Variables like {{manuscript_id}} work here too">
              <input className={`${inputClass} font-medium`} value={draft.subject || ""} onChange={(e) => set("subject", e.target.value)} />
            </Field>
            <div>
              <span className="mb-1 block text-xs font-medium text-slate-600">Message</span>
              <RichTextEditor value={draft.body_html || ""} onChange={(v) => set("body_html", v)} minHeight={320} />
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                Use <code>{"{{variable}}"}</code> for fields, <code>{"{{#if variable}}…{{/if}}"}</code> for optional sections, <code>[button: Label | link]</code> for a branded button and <code>[box]…[/box]</code> for a highlighted panel. The signature and branded header/footer are added automatically.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <label className="mr-auto inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={draft.is_active !== false} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                Available in compose
              </label>
              <Button variant="ghost" size="sm" icon={Copy} onClick={guard(() => duplicate(draft))}>Duplicate</Button>
              {draft.is_system
                ? <Button variant="ghost" size="sm" icon={RotateCcw} loading={busy === "reset"} onClick={reset}>Reset to default</Button>
                : <Button variant="danger" size="sm" icon={Trash2} onClick={del}>Delete</Button>}
            </div>
            {draft.last_edited_by && <p className="text-[11px] text-slate-400">Last edited by {draft.last_edited_by}</p>}
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-100">
            <div className="border-b border-slate-200 px-4 py-2.5">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Preview with sample data</div>
              <div className="truncate text-sm font-medium text-slate-900">{preview?.subject}</div>
            </div>
            <div className="max-h-[80vh] overflow-auto"><EmailFrame html={preview?.html} title="Template preview" /></div>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Select a template to edit</div>
      )}
    </div>
  );
}
