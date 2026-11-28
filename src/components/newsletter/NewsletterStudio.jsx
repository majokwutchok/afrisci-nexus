import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { renderNewsletter, NEWSLETTER_NAME, formatDate } from "@/lib/newsletter/render";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import NewsletterAnalytics from "./NewsletterAnalytics";
import MailingLists from "./MailingLists";
import {
  Newspaper, Plus, Sparkles, Send, Save, Eye, ArrowUp, ArrowDown, X, Loader2, Users, Lightbulb,
  ChevronLeft, BarChart3, ListChecks, Monitor, Smartphone, FlaskConical, CheckCircle2, AlertTriangle, Copy, RefreshCw, BookOpen, Wand2,
} from "lucide-react";

const ENTITY = "Newsletter";
const EDITABLE = ["title", "subject", "headline", "editorial_message", "issue_number", "issue_date", "journal_id", "journal_title", "sections", "articles", "audience", "featured_articles"];
const STATUS_STYLE = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-sky-100 text-sky-800",
  sending: "bg-amber-100 text-amber-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
};

const rows = (r) => (Array.isArray(r) ? r : r?.items ?? []);
const errMsg = (e, fb = "Something went wrong") => e?.response?.data?.error || e?.message || fb;
async function call(action, payload = {}) {
  const res = await base44.functions.invoke("newsletterAdmin", { action, ...payload });
  const data = res?.data ?? res;
  if (data?.error) throw new Error(data.error);
  return data;
}
function nextMonday() {
  const d = new Date();
  const add = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + add);
  return d.toISOString().slice(0, 10);
}
const snap = (a) => {
  const { id, views, citations, keywords, status, journal_id, ...rest } = a;
  return rest;
};

/* ------------------------------------------------------------------ small UI bits */

function Section({ icon: Icon, title, hint, children, right }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">{Icon && <Icon className="w-4 h-4 text-blue-800" />}{title}</div>
          {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

function ArticlePicker({ candidates, selected, onChange, empty, showViews, forthcoming, known }) {
  const sel = selected || [];
  const byId = { ...(known || {}), ...Object.fromEntries((candidates || []).map((a) => [a.id, a])) };
  const toggle = (a) => onChange(sel.includes(a.id) ? sel.filter((x) => x !== a.id) : [...sel, a.id], a);
  const move = (i, d) => {
    const n = [...sel];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {sel.length > 0 && (
        <ol className="space-y-1.5">
          {sel.map((id, i) => {
            const a = byId[id];
            return (
              <li key={id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-sm">
                <span className="text-blue-800 font-bold w-5">{i + 1}.</span>
                <span className="flex-1 min-w-0 truncate text-slate-800">{a?.title || "Article no longer available"}</span>
                <button type="button" onClick={() => move(i, -1)} className="p-1 text-slate-500 hover:text-blue-800" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} className="p-1 text-slate-500 hover:text-blue-800" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => onChange(sel.filter((x) => x !== id))} className="p-1 text-slate-500 hover:text-red-600" title="Remove"><X className="w-3.5 h-3.5" /></button>
              </li>
            );
          })}
        </ol>
      )}
      <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
        {(candidates || []).length === 0 && <p className="text-sm text-slate-400 p-3">{empty}</p>}
        {(candidates || []).map((a) => (
          <label key={a.id} className="flex items-start gap-2.5 p-2.5 text-sm cursor-pointer hover:bg-slate-50">
            <input type="checkbox" className="mt-1 accent-blue-800" checked={sel.includes(a.id)} onChange={() => toggle(a)} />
            <span className="min-w-0">
              <span className="block font-medium text-slate-800 leading-snug">{a.title}</span>
              <span className="block text-xs text-slate-500">
                {a.journal}{a.journal && " · "}{forthcoming ? "Accepted, forthcoming" : formatDate(a.date)}
                {showViews ? ` · ${a.views || 0} reads` : ""}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ main */

const HUB_TABS = [
  ["issues", Newspaper, "Issues"],
  ["analytics", BarChart3, "Analytics"],
  ["lists", ListChecks, "Mailing lists"],
];

export default function NewsletterStudio() {
  const [tab, setTab] = useState("issues");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
        {HUB_TABS.map(([k, Icon, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === k ? "bg-blue-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {tab === "issues" && <IssuesStudio />}
      {tab === "analytics" && <NewsletterAnalytics />}
      {tab === "lists" && <MailingLists />}
    </div>
  );
}

function IssuesStudio() {
  const [mlists, setMlists] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [ctxLoading, setCtxLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newJournal, setNewJournal] = useState("");
  const [journals, setJournals] = useState({});
  const [creating, setCreating] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [counts, setCounts] = useState(null);
  const [counting, setCounting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [aiFocus, setAiFocus] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIdeas, setAiIdeas] = useState([]);
  const [confirmSend, setConfirmSend] = useState(false); // false | "preview" | "send"
  const [pvDevice, setPvDevice] = useState("desktop");
  const [testedOk, setTestedOk] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [progress, setProgress] = useState(null);
  const [me, setMe] = useState(null);
  const cancelRef = useRef(false);

  const flash = (kind, text) => { setToast({ kind, text }); setTimeout(() => setToast(null), 5000); };

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try { setIssues(rows(await base44.entities[ENTITY].list("-created_date", 100))); }
    catch (e) { flash("error", errMsg(e, "Could not load issues")); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadIssues();
    base44.auth.me().then((u) => { setMe(u); setTestTo(u?.email || ""); }).catch(() => {});
    call("lists").then((r) => setMlists(r.lists || [])).catch(() => {});
    base44.entities.Journal.list("title", 100).then((r) => setJournals(Object.fromEntries(rows(r).map((j) => [j.id, j.title])))).catch(() => {});
  }, [loadIssues]);

  const patch = (fields) => { setEditing((e) => ({ ...e, ...fields })); setDirty(true); setReviewed(false); };
  const patchSections = (fields) => { setEditing((e) => ({ ...e, sections: { ...(e.sections || {}), ...fields } })); setDirty(true); setReviewed(false); };
  const addArticles = (list) => setEditing((e) => {
    const articles = { ...(e.articles || {}) };
    list.forEach((a) => { if (a) articles[a.id] = snap(a); });
    return { ...e, articles };
  });

  /* ---------------- create / open */
  const createWeekly = async () => {
    setCreating(true);
    try {
      const c = await call("bootstrap", { journal_id: newJournal });
      const fresh = c.content.fresh.slice(0, 6);
      const picks = c.content.archive.slice(0, 3);
      const upcoming = c.content.upcoming.slice(0, 4);
      const articles = {};
      [...fresh, ...picks, ...upcoming].forEach((a) => (articles[a.id] = snap(a)));
      const lead = c.ideas.find((i) => i.type === "theme") || c.ideas[0];
      const second = c.ideas.find((i) => i !== lead && ["call_for_papers", "observance", "course"].includes(i.type));
      const issue = {
        title: `${NEWSLETTER_NAME} · Issue ${c.issue_number}`,
        subject: c.suggested.subject,
        headline: c.suggested.headline,
        editorial_message: c.suggested.intro,
        issue_number: c.issue_number,
        issue_date: nextMonday(),
        journal_id: newJournal || "",
        journal_title: newJournal ? c.journals[newJournal] || "" : "",
        status: "draft",
        sections: {
          new_articles: fresh.map((a) => a.id),
          highlight_articles: picks.map((a) => a.id),
          upcoming_articles: upcoming.map((a) => a.id),
          solution: c.suggested.solution,
          ideas: [lead, second].filter(Boolean).map(({ title, body, cta_label, cta_url }) => ({ title, body, cta_label, cta_url })),
          cta: { label: "Submit your manuscript", url: `${c.site}/Submit` },
        },
        articles,
        audience: { subscribers: true, authors: true, manual: "" },
        featured_articles: fresh.map((a) => ({ manuscript_id: a.id, title: a.title, authors: a.authors, abstract_preview: (a.abstract || "").slice(0, 150) })),
        created_by: me?.email || "",
      };
      const rec = await base44.entities[ENTITY].create(issue);
      setCtx(c);
      setEditing({ ...issue, ...rec });
      setDirty(false);
      setCounts(null);
      setAiIdeas([]);
      flash("ok", `Issue ${c.issue_number} drafted from this week's content. Review it, then send.`);
      loadIssues();
    } catch (e) { flash("error", errMsg(e, "Could not create the issue")); }
    setCreating(false);
  };

  const openIssue = async (nl) => {
    setEditing({ sections: {}, articles: {}, audience: { subscribers: true, authors: true, manual: "" }, ...nl });
    setDirty(false); setCounts(null); setAiIdeas([]); setProgress(null);
    setCtxLoading(true);
    try { setCtx(await call("bootstrap", { journal_id: nl.journal_id || "", issue_number: nl.issue_number || undefined })); }
    catch (e) { flash("error", errMsg(e, "Could not load this week's content")); }
    setCtxLoading(false);
  };

  const duplicate = async (nl) => {
    try {
      const c = await call("bootstrap", { journal_id: nl.journal_id || "" });
      const copy = {};
      EDITABLE.forEach((k) => nl[k] !== undefined && (copy[k] = nl[k]));
      Object.assign(copy, { issue_number: c.issue_number, title: `${NEWSLETTER_NAME} · Issue ${c.issue_number}`, status: "draft", issue_date: nextMonday(), created_by: me?.email || "" });
      const rec = await base44.entities[ENTITY].create(copy);
      flash("ok", `Copied as Issue ${c.issue_number}`);
      loadIssues();
      openIssue(rec);
    } catch (e) { flash("error", errMsg(e, "Could not duplicate")); }
  };

  const save = async (silent = false) => {
    if (!editing?.id) return;
    setSaving(true);
    try {
      const data = {};
      EDITABLE.forEach((k) => editing[k] !== undefined && (data[k] = editing[k]));
      const S = editing.sections || {};
      data.featured_articles = (S.new_articles || []).map((id) => {
        const a = (editing.articles || {})[id] || {};
        return { manuscript_id: id, title: a.title || "", authors: a.authors || "", abstract_preview: (a.abstract || "").slice(0, 150) };
      });
      data.title = `${NEWSLETTER_NAME} · Issue ${editing.issue_number || ""}`.trim();
      await base44.entities[ENTITY].update(editing.id, data);
      setDirty(false);
      if (!silent) flash("ok", "Draft saved");
      loadIssues();
      return true;
    } catch (e) { flash("error", errMsg(e, "Could not save")); return false; }
    finally { setSaving(false); }
  };

  /* ---------------- preview */
  const preview = useMemo(() => {
    if (!editing) return null;
    const site = ctx?.site || "https://afriscinexus.com";
    return renderNewsletter(editing, { site, unsubscribeUrl: `${site}/functions/newsletterUnsubscribe?preview=1` });
  }, [editing, ctx]);

  /* ---------------- ideas */
  const addIdea = (i) => {
    const ideas = [...((editing.sections || {}).ideas || []), { title: i.title, body: i.body, cta_label: i.cta_label || "", cta_url: i.cta_url || "" }];
    patchSections({ ideas });
  };
  const updateIdea = (idx, f) => {
    const ideas = [...((editing.sections || {}).ideas || [])];
    ideas[idx] = { ...ideas[idx], ...f };
    patchSections({ ideas });
  };
  const removeIdea = (idx) => patchSections({ ideas: ((editing.sections || {}).ideas || []).filter((_, i) => i !== idx) });
  const askAi = async () => {
    setAiLoading(true);
    try { const r = await call("ai_ideas", { journal_id: editing.journal_id || "", focus: aiFocus }); setAiIdeas(r.ideas || []); if (!r.ideas?.length) flash("error", "No ideas came back, try again"); }
    catch (e) { flash("error", errMsg(e, "AI ideas are unavailable right now")); }
    setAiLoading(false);
  };

  /* ---------------- audience + sending */
  const audience = editing?.audience || {};
  const setAudience = (f) => { patch({ audience: { ...audience, ...f } }); setCounts(null); };
  const countNow = async () => {
    setCounting(true);
    try { const r = await call("count_recipients", { audience, journal_id: editing.journal_id || "" }); setCounts(r.counts); }
    catch (e) { flash("error", errMsg(e, "Could not count recipients")); }
    setCounting(false);
  };
  const sendTest = async () => {
    setTesting(true);
    try { const r = await call("test_send", { issue: editing, to: testTo }); flash("ok", `Test sent to ${r.to}`); setTestedOk(true); }
    catch (e) { flash("error", errMsg(e, "Test send failed")); }
    setTesting(false);
  };
  const runSend = async (resume = false) => {
    setConfirmSend(false);
    if (dirty && !(await save(true))) return;
    cancelRef.current = false;
    try {
      const start = await call("start_send", { newsletter_id: editing.id });
      setProgress({ total: start.total, sent: 0, failed: 0, index: start.sent_index || 0, running: true });
      let done = false;
      while (!done && !cancelRef.current) {
        const r = await call("send_batch", { newsletter_id: editing.id });
        setProgress({ total: r.total, sent: r.sent, failed: r.failed, index: r.sent_index, running: !r.done, error: r.last_error });
        done = r.done;
      }
      if (done) {
        flash("ok", "AfriSci Newsletter sent");
        setEditing((e) => ({ ...e, status: "sent" }));
      } else flash("ok", "Sending paused. Open the issue again to resume.");
    } catch (e) {
      flash("error", errMsg(e, "Sending stopped"));
      setProgress((p) => (p ? { ...p, running: false, error: errMsg(e) } : p));
    }
    loadIssues();
  };

  /* ================================================================== render */

  const Toast = toast && (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg shadow-lg px-4 py-3 text-sm flex items-start gap-2 ${toast.kind === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}>
      {toast.kind === "error" ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{toast.text}</span>
    </div>
  );

  const Header = (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-900/20">
      <div className="bg-blue-800 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-white text-2xl font-bold tracking-tight">✦ AfriSci<span className="text-amber-500">Nexus</span></div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-blue-200 mt-1">{NEWSLETTER_NAME} · Weekly Discovery Newsletter</div>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <select value={newJournal} onChange={(e) => setNewJournal(e.target.value)} className="h-9 rounded-md border border-blue-300/40 bg-blue-900/40 text-white text-sm px-2">
              <option value="">All journals edition</option>
              {Object.entries(journals).map(([id, t]) => <option key={id} value={id}>{t}</option>)}
            </select>
            <Button onClick={createWeekly} disabled={creating} className="bg-amber-500 hover:bg-amber-600 text-blue-950 font-semibold">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Create this week's issue
            </Button>
          </div>
        )}
      </div>
      <div className="h-1 bg-amber-500" />
    </div>
  );

  /* ---------------- issue list */
  if (!editing) {
    return (
      <div className="space-y-4">
        {Header}
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {[
            [Sparkles, "Auto drafted every week", "One click pulls in newly published, archive and forthcoming articles, plus a solutions spotlight and fresh ideas."],
            [Users, "Every audience you have", "Send to subscribers, registered platform users, authors, your saved mailing lists and any addresses you paste in. Duplicates and unsubscribes are removed."],
            [CheckCircle2, "Safe to send", "Every email carries a one click unsubscribe link, and unsubscribes are honoured automatically on every future issue."],
          ].map(([Icon, t, d]) => (
            <div key={t} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-900"><Icon className="w-4 h-4 text-amber-500" />{t}</div>
              <p className="text-slate-500 mt-1 text-xs leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="font-semibold text-slate-900 flex items-center gap-2"><Newspaper className="w-4 h-4 text-blue-800" />Issues</div>
            <Button variant="ghost" size="sm" onClick={loadIssues}><RefreshCw className="w-4 h-4" /></Button>
          </div>
          {loading ? <div className="p-6 text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : issues.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">No issues yet. Choose an edition above and press <strong>Create this week's issue</strong>.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr><th className="text-left px-4 py-2">Issue</th><th className="text-left px-4 py-2">Headline</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">Recipients</th><th className="px-4 py-2" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((nl) => (
                  <tr key={nl.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{nl.issue_number ? `Issue ${nl.issue_number}` : "Legacy"}<div className="text-xs font-normal text-slate-500">{formatDate(nl.issue_date || nl.send_date || nl.created_date)}</div></td>
                    <td className="px-4 py-2.5 text-slate-700">{nl.headline || nl.subject || nl.title}{nl.journal_title && <div className="text-xs text-blue-800">{nl.journal_title} edition</div>}</td>
                    <td className="px-4 py-2.5"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[nl.status] || STATUS_STYLE.draft}`}>{nl.status || "draft"}</span></td>
                    <td className="px-4 py-2.5 text-slate-600">{nl.status === "sent" || nl.status === "sending" ? `${nl.sent_count || 0} of ${nl.recipient_count || 0}${nl.failed_count ? ` (${nl.failed_count} failed)` : ""}` : "Not sent"}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => openIssue(nl)} className="mr-1">{nl.status === "sent" ? <><Eye className="w-3.5 h-3.5 mr-1" />View</> : "Open"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicate(nl)} title="Copy as a new issue"><Copy className="w-3.5 h-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {Toast}
      </div>
    );
  }

  /* ---------------- editor */
  const S = editing.sections || {};
  const locked = editing.status === "sent";
  const sendingNow = progress?.running;
  const content = ctx?.content || { fresh: [], archive: [], upcoming: [] };
  const sol = S.solution || {};
  const suggestions = [...aiIdeas, ...(ctx?.ideas || [])];
  const usedTitles = new Set((S.ideas || []).map((i) => i.title));

  return (
    <div className="space-y-4">
      {Header}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={async () => { if (dirty && !locked) await save(true); setEditing(null); setProgress(null); loadIssues(); }}><ChevronLeft className="w-4 h-4 mr-1" />All issues</Button>
          <div>
            <div className="font-bold text-slate-900">Issue {editing.issue_number || "?"} {editing.journal_title && <span className="text-blue-800 font-medium">· {editing.journal_title} edition</span>}</div>
            <div className="text-xs text-slate-500">{locked ? "Sent. This issue is read only; copy it to reuse." : dirty ? "Unsaved changes" : "All changes saved"}</div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[editing.status] || STATUS_STYLE.draft}`}>{editing.status || "draft"}</span>
        </div>
        {locked && <Button variant="outline" onClick={() => setConfirmSend("preview")}><Eye className="w-4 h-4 mr-2" />Full preview</Button>}
        {!locked && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => save()} disabled={saving || !dirty}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save draft</Button>
            <Button variant="outline" onClick={() => { setConfirmSend("preview"); if (!counts) countNow(); }}><Eye className="w-4 h-4 mr-2" />Preview</Button>
            <Button className="bg-blue-800 hover:bg-blue-900" disabled={sendingNow} onClick={() => { setReviewed(false); setConfirmSend("send"); if (!counts) countNow(); }}><Send className="w-4 h-4 mr-2" />{editing.status === "sending" ? "Resume sending" : "Preview and send"}</Button>
          </div>
        )}
      </div>

      {progress && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-slate-800 flex items-center gap-2">{progress.running ? <Loader2 className="w-4 h-4 animate-spin text-blue-800" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}{progress.running ? "Sending…" : "Finished"}</span>
            <span className="text-slate-600">{progress.sent} sent{progress.failed ? `, ${progress.failed} failed` : ""} of {progress.total}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-800 transition-all" style={{ width: `${progress.total ? Math.round((progress.index / progress.total) * 100) : 0}%` }} /></div>
          {progress.error && <p className="text-xs text-red-600 mt-2">Last error: {progress.error}</p>}
          {progress.running && <Button size="sm" variant="ghost" className="mt-2" onClick={() => (cancelRef.current = true)}>Pause</Button>}
        </div>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_680px] gap-4 items-start">
        {/* ---------------- left: editor */}
        <fieldset disabled={locked || sendingNow} className="space-y-4 min-w-0">
          <Section icon={Newspaper} title="Issue basics" hint="Subject line, masthead headline and the editor's note that opens the issue.">
            <div className="grid sm:grid-cols-[1fr_120px_160px] gap-3">
              <Field label="Email subject"><Input value={editing.subject || ""} onChange={(e) => patch({ subject: e.target.value })} /></Field>
              <Field label="Issue number"><Input type="number" min={1} value={editing.issue_number || ""} onChange={(e) => patch({ issue_number: Number(e.target.value) || "" })} /></Field>
              <Field label="Issue date"><Input type="date" value={(editing.issue_date || "").slice(0, 10)} onChange={(e) => patch({ issue_date: e.target.value })} /></Field>
            </div>
            <Field label="Headline"><Input value={editing.headline || ""} onChange={(e) => patch({ headline: e.target.value })} /></Field>
            <Field label="Editor's note" hint="Leave a blank line between paragraphs.">
              <Textarea rows={5} value={editing.editorial_message || ""} onChange={(e) => patch({ editorial_message: e.target.value })} />
            </Field>
          </Section>

          <Section icon={BookOpen} title="Newly published" hint="Articles published in the last two weeks. The first one becomes the lead story."
            right={ctxLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}>
            <ArticlePicker known={editing.articles} candidates={content.fresh} selected={S.new_articles} empty="No articles published in the last two weeks."
              onChange={(ids, a) => { if (a) addArticles([a]); patchSections({ new_articles: ids }); }} />
          </Section>

          <Section icon={BookOpen} title="From the archive" hint="Already published articles worth another look, sorted by readership.">
            <ArticlePicker known={editing.articles} candidates={content.archive} selected={S.highlight_articles} showViews empty="No archive articles yet."
              onChange={(ids, a) => { if (a) addArticles([a]); patchSections({ highlight_articles: ids }); }} />
          </Section>

          <Section icon={BookOpen} title="Future publications" hint="Accepted manuscripts that are coming soon. Shown without links until they are published.">
            <ArticlePicker known={editing.articles} candidates={content.upcoming} selected={S.upcoming_articles} forthcoming empty="No accepted manuscripts waiting for publication."
              onChange={(ids, a) => { if (a) addArticles([a]); patchSections({ upcoming_articles: ids }); }} />
          </Section>

          <Section icon={Sparkles} title="Publishing Solutions Series" hint="A rotating spotlight on how AfriSci Nexus helps researchers publish. It moves to the next part automatically each issue."
            right={
              <select className="h-8 rounded-md border border-slate-300 text-sm px-2 max-w-[220px]" value={sol.key || ""} onChange={(e) => {
                const s = (ctx?.solutions || []).find((x) => x.key === e.target.value);
                patchSections({ solution: s ? { ...s, series_label: `Publishing Solutions Series · Part ${s.part} of ${s.total}` } : null });
              }}>
                <option value="">No spotlight</option>
                {(ctx?.solutions || []).map((s) => <option key={s.key} value={s.key}>Part {s.part}: {s.title}</option>)}
              </select>
            }>
            {sol.title ? (
              <>
                <Field label="Spotlight title"><Input value={sol.title} onChange={(e) => patchSections({ solution: { ...sol, title: e.target.value } })} /></Field>
                <Field label="Text"><Textarea rows={3} value={sol.body || ""} onChange={(e) => patchSections({ solution: { ...sol, body: e.target.value } })} /></Field>
                <Field label="Key points" hint="One per line."><Textarea rows={4} value={(sol.points || []).join("\n")} onChange={(e) => patchSections({ solution: { ...sol, points: e.target.value.split("\n") } })} /></Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Button label"><Input value={sol.cta_label || ""} onChange={(e) => patchSections({ solution: { ...sol, cta_label: e.target.value } })} /></Field>
                  <Field label="Button link"><Input value={sol.cta_url || ""} onChange={(e) => patchSections({ solution: { ...sol, cta_url: e.target.value } })} /></Field>
                </div>
              </>
            ) : <p className="text-sm text-slate-400">Choose a part of the series to feature.</p>}
          </Section>

          <Section icon={Lightbulb} title="Ideas for this week" hint="Suggestions generated from your latest content, upcoming observances and journals that need submissions. Add any to the issue and edit freely.">
            {(S.ideas || []).length > 0 && (
              <div className="space-y-3 mb-4">
                {(S.ideas || []).map((i, idx) => (
                  <div key={idx} className="border border-amber-200 bg-amber-50/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Input value={i.title} onChange={(e) => updateIdea(idx, { title: e.target.value })} className="font-semibold" />
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeIdea(idx)}><X className="w-4 h-4" /></Button>
                    </div>
                    <Textarea rows={3} value={i.body} onChange={(e) => updateIdea(idx, { body: e.target.value })} />
                    <div className="grid sm:grid-cols-2 gap-2 mt-2">
                      <Input placeholder="Link label (optional)" value={i.cta_label || ""} onChange={(e) => updateIdea(idx, { cta_label: e.target.value })} />
                      <Input placeholder="https://… (optional)" value={i.cta_url || ""} onChange={(e) => updateIdea(idx, { cta_url: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              <Input placeholder="Optional focus for AI, e.g. climate and health" value={aiFocus} onChange={(e) => setAiFocus(e.target.value)} className="flex-1 min-w-[200px]" />
              <Button type="button" variant="outline" onClick={askAi} disabled={aiLoading}>{aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-amber-500" />}Ask AI for more ideas</Button>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">AI suggestions use Base44 AI credits. The built in suggestions below are free.</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {suggestions.filter((i) => !usedTitles.has(i.title)).map((i, k) => (
                <div key={`${i.title}-${k}`} className="flex items-start gap-3 border border-slate-200 rounded-lg p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">{i.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{i.body}</div>
                    {i.why && <div className="text-[11px] text-amber-700 mt-0.5">{i.type === "ai" ? "✦ " : ""}{i.why}</div>}
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => addIdea(i)}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
                </div>
              ))}
              {!suggestions.length && <p className="text-sm text-slate-400">{ctxLoading ? "Loading ideas…" : "No suggestions right now."}</p>}
            </div>
          </Section>

          <Section icon={Send} title="Closing call to action">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Button label"><Input value={(S.cta || {}).label || ""} onChange={(e) => patchSections({ cta: { ...(S.cta || {}), label: e.target.value } })} /></Field>
              <Field label="Button link"><Input value={(S.cta || {}).url || ""} onChange={(e) => patchSections({ cta: { ...(S.cta || {}), url: e.target.value } })} /></Field>
            </div>
          </Section>

          <Section icon={Users} title="Audience" hint="Duplicates are merged and anyone who has unsubscribed is skipped automatically."
            right={<Button type="button" size="sm" variant="outline" onClick={countNow} disabled={counting}>{counting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Count recipients"}</Button>}>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-blue-800" checked={!!audience.subscribers} onChange={(e) => setAudience({ subscribers: e.target.checked })} />Newsletter subscribers{counts && <Badge variant="secondary">{counts.subscribers}</Badge>}</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-blue-800" checked={!!audience.users} onChange={(e) => setAudience({ users: e.target.checked })} />Registered platform users{counts && <Badge variant="secondary">{counts.users || 0}</Badge>}</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="accent-blue-800" checked={!!audience.authors} onChange={(e) => setAudience({ authors: e.target.checked })} />Authors who have submitted{editing.journal_title ? ` to ${editing.journal_title}` : ""}{counts && <Badge variant="secondary">{counts.authors}</Badge>}</label>
              <div className="pt-1">
                <div className="text-xs font-semibold text-slate-600 mb-1">Mailing lists</div>
                {mlists.length === 0 ? <p className="text-xs text-slate-400">No mailing lists yet. Build one in the Mailing lists tab.</p> : (
                  <div className="grid sm:grid-cols-2 gap-1">
                    {mlists.map((l) => {
                      const ids = audience.list_ids || [];
                      const on = ids.includes(l.id);
                      return (
                        <label key={l.id} className="flex items-center gap-2"><input type="checkbox" className="accent-blue-800" checked={on}
                          onChange={(e) => setAudience({ list_ids: e.target.checked ? [...ids, l.id] : ids.filter((x) => x !== l.id) })} />
                          <span className="truncate">{l.name}</span><Badge variant="outline">{l.member_count || 0}</Badge></label>
                      );
                    })}
                  </div>
                )}
                {counts && counts.lists ? <p className="text-xs text-slate-500 mt-1">{counts.lists} unique addresses from selected lists</p> : null}
              </div>
              <Field label="Add email addresses manually" hint="Paste addresses separated by commas, spaces or new lines.">
                <Textarea rows={3} value={audience.manual || ""} onChange={(e) => setAudience({ manual: e.target.value })} placeholder="dean@university.ac.ke, research.office@uni.edu.ng" />
              </Field>
              {counts && (
                <div className="bg-slate-50 rounded-lg px-3 py-2 text-slate-700">
                  <strong>{counts.total}</strong> unique recipients{counts.manual ? ` (including ${counts.manual} manual)` : ""}{counts.suppressed ? `, ${counts.suppressed} unsubscribed skipped` : ""}.
                </div>
              )}
            </div>
          </Section>

          <Section icon={FlaskConical} title="Send a test">
            <div className="flex gap-2">
              <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@afriscinexus.com" />
              <Button type="button" variant="outline" onClick={sendTest} disabled={testing}>{testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send test"}</Button>
            </div>
          </Section>
        </fieldset>

        {/* ---------------- right: live preview */}
        <div className="xl:sticky xl:top-4 bg-slate-200/60 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs text-slate-600 min-w-0 truncate"><span className="font-semibold">Subject:</span> {preview?.subject}</div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant={device === "desktop" ? "default" : "ghost"} onClick={() => setDevice("desktop")}><Monitor className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant={device === "mobile" ? "default" : "ghost"} onClick={() => setDevice("mobile")}><Smartphone className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
          <div className="mx-auto transition-all" style={{ width: device === "mobile" ? 390 : "100%" }}>
            <iframe title="Newsletter preview" srcDoc={preview?.html || ""} sandbox="" className="w-full bg-white rounded-lg border border-slate-300" style={{ height: "calc(100vh - 140px)", minHeight: 640 }} />
          </div>
        </div>
      </div>

      {confirmSend && (() => {
        const S2 = editing.sections || {};
        const A2 = editing.articles || {};
        const nArticles = ["new_articles", "highlight_articles", "upcoming_articles"].reduce((n, k) => n + (S2[k] || []).filter((id) => A2[id]).length, 0);
        const missingLinks = [...(S2.new_articles || []), ...(S2.highlight_articles || [])].filter((id) => A2[id] && !A2[id].url).length;
        const sendMode = confirmSend === "send" && !locked;
        const checks = [
          { ok: !!(editing.subject || "").trim(), label: "Subject line is set", fix: "Add a subject line" },
          { ok: !!(editing.headline || "").trim(), label: "Headline is set", fix: "Add a headline" },
          { ok: nArticles > 0, label: `${nArticles} article${nArticles === 1 ? "" : "s"} featured`, fix: "Add at least one article" },
          { ok: missingLinks === 0, warn: true, label: "Every published article links to its page", fix: `${missingLinks} article${missingLinks === 1 ? " has" : "s have"} no link` },
          { ok: !!(S2.solution && S2.solution.title), warn: true, label: "Publishing Solutions spotlight included", fix: "No solutions spotlight this week" },
          { ok: !!counts && counts.total > 0, label: counts ? `${counts.total} recipients ready` : "Counting recipients…", fix: counts ? "No recipients selected" : "Counting recipients…", pending: !counts },
          { ok: testedOk, warn: true, label: "Test email sent and checked", fix: "No test sent yet this session" },
        ];
        const blocking = checks.some((c) => !c.ok && !c.warn && !c.pending);
        const openTab = () => {
          const url = URL.createObjectURL(new Blob([preview?.html || ""], { type: "text/html" }));
          window.open(url, "_blank", "noopener");
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        };
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-stretch justify-center p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col overflow-hidden">
              <div className="bg-blue-800 px-5 py-3 flex items-center justify-between gap-3">
                <div className="text-white">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-blue-200">{sendMode ? "Final preview before sending" : "Preview"}</div>
                  <div className="font-semibold">{NEWSLETTER_NAME} · Issue {editing.issue_number}{editing.journal_title ? ` · ${editing.journal_title} edition` : ""}</div>
                </div>
                <button onClick={() => setConfirmSend(false)} className="text-blue-100 hover:text-white p-1" title="Close"><X className="w-5 h-5" /></button>
              </div>
              <div className="h-1 bg-amber-500" />
              <div className="flex-1 min-h-0 grid lg:grid-cols-[360px_minmax(0,1fr)]">
                {/* left: inbox view, checks, actions */}
                <div className="border-r border-slate-200 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">How it appears in the inbox</div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-800 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">✦</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2"><span className="font-semibold text-sm text-slate-900 truncate">{NEWSLETTER_NAME}</span><span className="text-[11px] text-slate-400 shrink-0">{formatDate(editing.issue_date) || "Today"}</span></div>
                          <div className="text-[11px] text-slate-500 truncate">{ctx?.from || "editorial@afriscinexus.com"}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-900 leading-snug">{preview?.subject || <span className="text-red-600">No subject</span>}</div>
                      <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{preview?.preheader}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Pre send checks</div>
                    <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 text-sm">
                      {checks.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 px-3 py-2">
                          {c.pending ? <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-slate-400 shrink-0" /> : c.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> : <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${c.warn ? "text-amber-500" : "text-red-600"}`} />}
                          <span className={c.ok || c.pending ? "text-slate-700" : c.warn ? "text-amber-800" : "text-red-700 font-medium"}>{c.ok || c.pending ? c.label : c.fix}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Audience</div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                      {counting || !counts ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Counting…</span> : (
                        <>
                          <div className="text-2xl font-bold text-slate-900">{counts.total}<span className="text-sm font-normal text-slate-500"> unique recipients</span></div>
                          <div className="text-xs text-slate-500 mt-1">{counts.subscribers} subscribers · {counts.users || 0} registered users · {counts.authors} authors · {counts.lists || 0} from lists · {counts.manual} manual{counts.suppressed ? ` · ${counts.suppressed} unsubscribed skipped` : ""}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {!locked && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Send a test</div>
                      <div className="flex gap-2">
                        <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} className="bg-white" />
                        <Button variant="outline" onClick={sendTest} disabled={testing}>{testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}</Button>
                      </div>
                    </div>
                  )}

                  {sendMode && (
                    <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-3">
                      <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                        <input type="checkbox" className="mt-1 accent-blue-800" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
                        <span>I have reviewed this issue on desktop and mobile and it is ready to go to {counts ? counts.total : "all"} recipients.</span>
                      </label>
                      <Button className="w-full bg-blue-800 hover:bg-blue-900" disabled={!reviewed || blocking || !counts || !counts.total} onClick={() => runSend()}>
                        <Send className="w-4 h-4 mr-2" />Send now to {counts ? counts.total : "…"} recipients
                      </Button>
                      <p className="text-[11px] text-slate-500">{dirty ? "Your latest edits will be saved before sending. " : ""}Sending cannot be undone.</p>
                    </div>
                  )}
                  {!sendMode && !locked && (
                    <Button className="w-full bg-blue-800 hover:bg-blue-900" onClick={() => { setReviewed(false); setConfirmSend("send"); }}><Send className="w-4 h-4 mr-2" />Continue to send</Button>
                  )}
                </div>

                {/* right: rendered email */}
                <div className="flex flex-col min-h-0 bg-slate-200/70">
                  <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 bg-white">
                    <div className="flex gap-1">
                      <Button size="sm" variant={pvDevice === "desktop" ? "default" : "ghost"} onClick={() => setPvDevice("desktop")}><Monitor className="w-3.5 h-3.5 mr-1.5" />Desktop</Button>
                      <Button size="sm" variant={pvDevice === "mobile" ? "default" : "ghost"} onClick={() => setPvDevice("mobile")}><Smartphone className="w-3.5 h-3.5 mr-1.5" />Mobile</Button>
                    </div>
                    <Button size="sm" variant="ghost" onClick={openTab}><Eye className="w-3.5 h-3.5 mr-1.5" />Open in new tab</Button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-auto p-4 flex justify-center">
                    <div className={pvDevice === "mobile" ? "w-[390px] rounded-[2rem] border-[10px] border-slate-800 bg-white shadow-xl overflow-hidden" : "w-full max-w-[760px]"} style={{ height: pvDevice === "mobile" ? 780 : "100%", minHeight: 560 }}>
                      <iframe title="Final newsletter preview" srcDoc={preview?.html || ""} sandbox="allow-popups allow-popups-to-escape-sandbox" className="w-full h-full bg-white rounded-lg" style={{ minHeight: pvDevice === "mobile" ? 760 : 560 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {Toast}
    </div>
  );
}
