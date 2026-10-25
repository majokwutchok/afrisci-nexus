import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Composer from "./Composer";
import { Toast } from "./ui";
import { list, currentUser, loadSettingsRecord, ENTITY, MANUSCRIPT, correspondingAuthor, manuscriptVars } from "./api";
import { base44 } from "@/api/base44Client";

/** Suggested template for each Manuscript.status. */
export const TEMPLATE_FOR_STATUS = {
  submitted: "submission_received",
  editor_assigned: "submission_received",
  under_review: "under_review",
  revision_requested: "revision_minor",
  revised: "under_review",
  accepted: "accepted",
  rejected: "rejected",
  online_first: "published",
  published: "published",
};

/**
 * Quick "Email author" dialog for anywhere in the admin dashboard.
 *   <EmailComposeDialog open onClose manuscript={m} />            // fills author, title, journal, template
 *   <EmailComposeDialog open onClose to={["a@b.org"]} templateKey="general_message" variables={{…}} />
 */
export default function EmailComposeDialog({ open, onClose, manuscript = null, to = [], templateKey = "", variables = {}, relatedManuscriptId = "", onSent }) {
  const [templates, setTemplates] = useState(null);
  const [settings, setSettings] = useState({});
  const [user, setUser] = useState(null);
  const [initial, setInitial] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!open) { setInitial(null); return; }
    let cancelled = false;
    (async () => {
      const [tpls, rec, me] = await Promise.all([
        list(ENTITY.template, "name", 500).catch(() => []),
        loadSettingsRecord(),
        currentUser(),
      ]);
      let init = { to, templateKey, variables, relatedManuscriptId };
      if (manuscript) {
        let journal = "";
        if (manuscript.journal_id) {
          try { journal = (await base44.entities[MANUSCRIPT.journalEntity].get(manuscript.journal_id))?.title || ""; } catch { /* journal hidden */ }
        }
        const a = correspondingAuthor(manuscript);
        init = {
          to: a.email ? [a.name ? `"${a.name}" <${a.email}>` : a.email] : to,
          templateKey: templateKey || TEMPLATE_FOR_STATUS[manuscript.status] || "general_message",
          variables: { ...manuscriptVars(manuscript, journal, window.location.origin), ...variables },
          relatedManuscriptId: manuscript.id,
        };
      }
      if (cancelled) return;
      setTemplates(tpls);
      setSettings(Object.fromEntries(Object.entries(rec || {}).filter(([, v]) => v !== null && v !== "")));
      setUser(me);
      setInitial(init);
    })();
    return () => { cancelled = true; };
  }, [open, manuscript?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return <Toast toast={toast} onClose={() => setToast(null)} />;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Send email">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-900">Send email{manuscript?.title ? ` · ${manuscript.title.slice(0, 70)}` : ""}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">
          {initial && templates ? (
            templates.length === 0 ? (
              <p className="text-sm text-slate-600">Open the <strong>Email Center</strong> tab once to install the branded templates, then try again.</p>
            ) : (
              <Composer templates={templates} settings={settings} user={user} initial={initial}
                onToast={setToast} onCancel={onClose}
                onSent={(r) => { onSent?.(r); if (!r?.failed) onClose?.(); }} />
            )
          ) : <p className="text-sm text-slate-500">Loading…</p>}
        </div>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
