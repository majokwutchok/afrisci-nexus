import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, PenSquare, LayoutTemplate, Settings, Mail } from "lucide-react";
import InboxView from "./InboxView";
import Composer from "./Composer";
import TemplatesView from "./TemplatesView";
import SettingsView from "./SettingsView";
import { Toast } from "./ui";
import { list, invoke, currentUser, loadSettingsRecord, ENTITY } from "./api";

/**
 * AfriSci Nexus Email Center — drop this into the admin dashboard (as a tab or its own page).
 * Inbox (sent + received, threaded), Compose with branded templates, Templates editor, Settings.
 */
export default function EmailCenter({ defaultTab = "inbox" }) {
  const [tab, setTab] = useState(defaultTab);
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [settingsRecord, setSettingsRecord] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const [composeInit, setComposeInit] = useState({});
  const [composeKey, setComposeKey] = useState(0);
  const [openThreadId, setOpenThreadId] = useState(null);

  const loadTemplates = useCallback(async (opts = {}) => {
    if (opts.sync) {
      // Install new built-in templates and refresh untouched ones; never overwrites admin edits.
      try {
        await invoke("emailAdmin", { action: "seed_templates", sync: true });
      } catch (e) {
        setToast({ kind: "error", text: `Couldn't install templates: ${e.message}` });
      }
    }
    setTemplates(await list(ENTITY.template, "name", 500).catch(() => []));
  }, []);
  const loadSettings = useCallback(async () => setSettingsRecord(await loadSettingsRecord()), []);

  useEffect(() => {
    currentUser().then(setUser);
    loadTemplates({ sync: true });
    loadSettings();
    (async () => {
      const set = new Set();
      try {
        const threads = await list(ENTITY.thread, "-last_message_at", 300);
        threads.forEach((t) => (t.participants || []).forEach((p, i) => {
          const n = (t.participant_names || [])[i];
          set.add(n ? `"${n}" <${p}>` : p);
        }));
      } catch { /* ignore */ }
      try {
        const users = await list("User", "-created_date", 1000);
        users.forEach((u) => u.email && set.add(u.full_name ? `"${u.full_name}" <${u.email}>` : u.email));
      } catch { /* users not listable */ }
      setSuggestions([...set]);
    })();
  }, []);

  const settings = useMemo(() => {
    const s = {};
    for (const [k, v] of Object.entries(settingsRecord || {})) if (v !== null && v !== undefined && v !== "") s[k] = v;
    return s;
  }, [settingsRecord]);

  const startCompose = (init = {}) => {
    setComposeInit(init);
    setComposeKey((k) => k + 1);
    setTab("compose");
  };

  const TABS = [
    { key: "inbox", label: "Inbox", icon: Inbox, badge: unread },
    { key: "compose", label: "Compose", icon: PenSquare },
    { key: "templates", label: "Templates", icon: LayoutTemplate },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="email-center space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white"><Mail className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Email Center</h1>
            <p className="text-sm text-slate-500">Branded correspondence with authors, reviewers and partners</p>
          </div>
        </div>
        <div role="tablist" aria-label="Email Center" className="flex rounded-xl bg-slate-100 p-1">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} type="button"
              onClick={() => (t.key === "compose" && tab !== "compose" ? startCompose({}) : setTab(t.key))}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {t.badge > 0 && <span className="rounded-full bg-blue-800 px-1.5 text-[11px] text-white">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === "inbox" && (
        <InboxView templates={templates} settings={settings} user={user} suggestions={suggestions} onToast={setToast} onUnreadChange={setUnread}
          openThreadId={openThreadId} onTemplatesChanged={loadTemplates}
          onOpenDraft={(d) => startCompose({ to: d.to, cc: d.cc, bcc: d.bcc, subject: d.subject, body: d.editor_html, templateKey: d.template_key, variables: d.variables || {}, draftId: d.id, threadId: d.thread_id || undefined, relatedManuscriptId: d.related_manuscript_id })} />
      )}
      {tab === "compose" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <Composer key={composeKey} templates={templates} settings={settings} user={user} suggestions={suggestions} initial={composeInit}
            onToast={setToast} onTemplatesChanged={loadTemplates}
            onSent={(r) => { if (r?.thread_id) setOpenThreadId(r.thread_id); setTab("inbox"); }} />
        </div>
      )}
      {tab === "templates" && (
        <TemplatesView templates={templates} settings={settings} user={user} onChanged={loadTemplates} onToast={setToast}
          onUseTemplate={(key) => startCompose({ templateKey: key })} />
      )}
      {tab === "settings" && user && (
        <SettingsView record={settingsRecord} user={user} onSaved={loadSettings} onToast={setToast} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
