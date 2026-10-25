import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Send, Star, Archive, AlertCircle, FileEdit, Search, RefreshCw, ArrowLeft, Paperclip, Reply, MailOpen, ArchiveRestore, ChevronDown, ChevronRight, Download, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Button, EmailFrame, StatusBadge } from "./ui";
import Composer from "./Composer";
import { filter, invoke, list, remove, ENTITY, timeAgo, fullDate, displayName, subscribe } from "./api";

// Conversations created before the has_inbound/has_outbound flags existed fall back to
// their last message direction and unread count.
export const hasInbound = (t) => t.has_inbound ?? (t.last_direction === "inbound" || (t.unread_count || 0) > 0);
export const hasOutbound = (t) => t.has_outbound ?? t.last_direction === "outbound";

const FOLDERS = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "unread", label: "Unread", icon: MailOpen },
  { key: "starred", label: "Starred", icon: Star },
  { key: "sent", label: "Sent", icon: Send },
  { key: "failed", label: "Failed", icon: AlertCircle },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "archived", label: "Archived", icon: Archive },
];

export default function InboxView({ templates, settings, user, suggestions, onToast, onOpenDraft, onUnreadChange, openThreadId, onTemplatesChanged }) {
  const [folder, setFolder] = useState("inbox");
  const [threads, setThreads] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(openThreadId || null);

  const load = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([
        list(ENTITY.thread, "-last_message_at", 500),
        filter(ENTITY.message, { status: "draft" }, "-updated_date", 100),
      ]);
      setThreads(t);
      setDrafts(d);
      onUnreadChange?.(t.filter((x) => x.status !== "archived").reduce((n, x) => n + (x.unread_count || 0), 0));
    } catch (e) {
      onToast?.({ kind: "error", text: `Couldn't load conversations: ${e.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 30000);
    const unsub = subscribe(ENTITY.thread, () => load());
    return () => { clearInterval(poll); unsub?.(); };
  }, [load]);

  useEffect(() => { if (openThreadId) setSelected(openThreadId); }, [openThreadId]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let rows = threads.filter((t) => {
      switch (folder) {
        case "inbox": return t.status !== "archived" && hasInbound(t);
        case "unread": return t.status !== "archived" && t.unread_count > 0;
        case "starred": return t.starred;
        case "sent": return hasOutbound(t);
        case "failed": return t.has_failed;
        case "archived": return t.status === "archived";
        default: return true;
      }
    });
    if (term) rows = rows.filter((t) => [t.subject, t.snippet, ...(t.participants || []), ...(t.participant_names || []), t.related_manuscript_title].join(" ").toLowerCase().includes(term));
    return rows;
  }, [threads, folder, q]);

  const current = threads.find((t) => t.id === selected);
  const count = (key) => key === "unread" ? threads.filter((t) => t.status !== "archived" && t.unread_count > 0).length
    : key === "failed" ? threads.filter((t) => t.has_failed).length
    : key === "drafts" ? drafts.length : 0;

  return (
    <div className="grid min-h-[70vh] grid-cols-1 grid-rows-[auto_1fr] overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[200px_minmax(280px,360px)_minmax(0,1fr)] lg:grid-rows-1">
      {/* folders */}
      <nav className={`border-b border-slate-200 p-2 lg:border-b-0 lg:border-r ${selected ? "hidden lg:block" : ""}`} aria-label="Mail folders">
        <div className="flex gap-1 overflow-x-auto lg:flex-col">
          {FOLDERS.map((f) => {
            const n = count(f.key);
            return (
              <button key={f.key} type="button" onClick={() => { setFolder(f.key); setSelected(null); }}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${folder === f.key ? "bg-blue-50 font-medium text-blue-900" : "text-slate-600 hover:bg-slate-50"}`}>
                <f.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{f.label}</span>
                {n > 0 && <span className={`rounded-full px-1.5 text-[11px] ${f.key === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"}`}>{n}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* list */}
      <section className={`min-w-0 min-h-0 flex-col lg:border-r border-slate-200 ${selected ? "hidden lg:flex" : "flex"}`}>
        <div className="flex items-center gap-2 border-b border-slate-200 p-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mail" aria-label="Search mail" className="h-9 w-full rounded-lg bg-slate-100 pl-8 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" />
          </div>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={load} aria-label="Refresh" title="Refresh" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {folder === "drafts" ? (
            drafts.length === 0 ? <Empty text="No drafts" /> : drafts.map((d) => (
              <div key={d.id} className="group flex items-start gap-2 border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
                <button type="button" onClick={() => onOpenDraft?.(d)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-red-700">Draft · {(d.to || []).map(displayName).join(", ") || "(no recipient)"}</span>
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(d.updated_date)}</span>
                  </div>
                  <div className="truncate text-sm text-slate-900">{d.subject || "(no subject)"}</div>
                  <div className="truncate text-xs text-slate-500">{d.snippet}</div>
                </button>
                <button type="button" aria-label="Delete draft" onClick={async () => { await remove(ENTITY.message, d.id); load(); }} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" /></button>
              </div>
            ))
          ) : loading ? <Empty text="Loading…" /> : shown.length === 0 ? <Empty text={q ? "No matches" : folder === "inbox" ? "No received emails yet" : folder === "sent" ? "No sent emails yet" : "Nothing here yet"} /> : shown.map((t) => {
            const unread = t.unread_count > 0;
            const who = (t.participant_names || []).filter(Boolean).join(", ") || (t.participants || []).join(", ");
            return (
              <button key={t.id} type="button" onClick={() => setSelected(t.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors ${selected === t.id ? "bg-blue-50/70" : "hover:bg-slate-50"}`}>
                <div className="flex items-center gap-2">
                  {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-700" aria-label="Unread" />}
                  <span className={`flex-1 truncate text-sm ${unread ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                    {(folder === "sent" || !hasInbound(t)) && <span className="text-slate-400">To: </span>}{who}
                  </span>
                  {t.has_failed && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" aria-label="Delivery problem" />}
                  {t.starred && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(t.last_message_at)}</span>
                </div>
                <div className={`mt-0.5 truncate text-sm ${unread ? "font-medium text-slate-900" : "text-slate-700"}`}>
                  {t.subject}{t.message_count > 1 && <span className="ml-1 text-xs text-slate-400">({t.message_count})</span>}
                </div>
                <div className="truncate text-xs text-slate-500">{t.snippet}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* conversation */}
      <section className={`min-w-0 ${selected ? "block row-span-2 lg:row-span-1" : "hidden lg:block"}`}>
        {current ? (
          <ThreadView key={current.id} thread={current} templates={templates} settings={settings} user={user} suggestions={suggestions}
            onBack={() => setSelected(null)} onChanged={load} onToast={onToast} onTemplatesChanged={onTemplatesChanged} />
        ) : (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
            <Inbox className="h-10 w-10" />
            <p className="text-sm">Select a conversation to read and reply</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Empty({ text }) {
  return <div className="p-8 text-center text-sm text-slate-400">{text}</div>;
}

function ThreadView({ thread, templates, settings, user, suggestions, onBack, onChanged, onToast, onTemplatesChanged }) {
  const [messages, setMessages] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [replying, setReplying] = useState(false);

  const load = useCallback(async () => {
    const m = await filter(ENTITY.message, { thread_id: thread.id }, "created_date", 200);
    const visible = m.filter((x) => x.status !== "draft");
    setMessages(visible);
    if (visible.length) setExpanded((e) => ({ ...e, [visible[visible.length - 1].id]: true }));
  }, [thread.id]);

  useEffect(() => {
    load();
    if (thread.unread_count > 0) invoke("emailAdmin", { action: "mark_thread", thread_id: thread.id, read: true }).then(onChanged).catch(() => {});
  }, [thread.id]);
  useEffect(() => { load(); }, [thread.message_count]);

  const act = async (patch, msg) => {
    try {
      await invoke("emailAdmin", { action: "mark_thread", thread_id: thread.id, ...patch });
      onToast?.({ kind: "ok", text: msg });
      onChanged?.();
      if (patch.archived || patch.read === false) onBack?.();
    } catch (e) {
      onToast?.({ kind: "error", text: e.message });
    }
  };

  const lastInbound = [...(messages || [])].reverse().find((m) => m.direction === "inbound");
  const replyTo = lastInbound ? [lastInbound.from_name ? `"${lastInbound.from_name}" <${lastInbound.from_email}>` : lastInbound.from_email] : (thread.participants || []);
  const reSubject = /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`;
  const replyVars = { recipient_name: lastInbound?.from_name || (thread.participant_names || [])[0] || "" };
  const lastWithVars = [...(messages || [])].reverse().find((m) => m.direction === "outbound" && m.variables);
  if (lastWithVars) for (const k of ["manuscript_title", "manuscript_id", "journal_name", "doi"]) if (lastWithVars.variables[k]) replyVars[k] = lastWithVars.variables[k];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start gap-2 border-b border-slate-200 px-4 py-3">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} className="lg:hidden" aria-label="Back" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-slate-900">{thread.subject}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {(thread.participants || []).join(", ")}
            {thread.related_manuscript_title && <Badge color="blue">{thread.related_manuscript_title.slice(0, 50)}</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" icon={Star} title={thread.starred ? "Unstar" : "Star"} aria-label="Star" onClick={() => act({ starred: !thread.starred }, thread.starred ? "Unstarred" : "Starred")} className={thread.starred ? "text-amber-500" : ""} />
          <Button variant="ghost" size="sm" icon={MailOpen} title="Mark as unread" aria-label="Mark as unread" onClick={() => act({ read: false }, "Marked as unread")} />
          {thread.status === "archived"
            ? <Button variant="ghost" size="sm" icon={ArchiveRestore} title="Move to inbox" aria-label="Move to inbox" onClick={() => act({ archived: false }, "Moved to inbox")} />
            : <Button variant="ghost" size="sm" icon={Archive} title="Archive" aria-label="Archive" onClick={() => act({ archived: true }, "Conversation archived")} />}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
        {messages === null && <div className="text-sm text-slate-400">Loading…</div>}
        {(messages || []).map((m) => (
          <MessageCard key={m.id} m={m} open={Boolean(expanded[m.id])} onToggle={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))} onToast={onToast} />
        ))}

        <div className="pt-2">
          {replying ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <Composer
                mode="reply"
                templates={templates}
                settings={settings}
                user={user}
                suggestions={suggestions}
                initial={{
                  to: replyTo, subject: reSubject, threadId: thread.id, replyToMessageId: lastInbound?.id,
                  relatedManuscriptId: thread.related_manuscript_id, variables: replyVars,
                  body: "<p>Dear {{recipient_name}},</p><p></p>",
                }}
                onToast={onToast}
                onTemplatesChanged={onTemplatesChanged}
                onCancel={() => setReplying(false)}
                onSent={() => { setReplying(false); load(); onChanged?.(); }}
              />
            </div>
          ) : (
            <Button variant="secondary" icon={Reply} disabled={messages === null} onClick={() => setReplying(true)}>Reply</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageCard({ m, open, onToggle, onToast }) {
  const inbound = m.direction === "inbound";
  const from = inbound ? (m.from_name || m.from_email) : `${m.from_name || "AfriSci Nexus"} (${m.sent_by || m.from_email})`;
  const when = m.received_at || m.sent_at || m.created_date;

  async function download(a) {
    try {
      const r = await invoke("emailAdmin", { action: "attachment_url", message_id: m.id, attachment_id: a.id });
      window.open(r.url, "_blank", "noopener");
    } catch (e) {
      onToast?.({ kind: "error", text: e.message });
    }
  }

  return (
    <article className={`rounded-xl border bg-white ${m.status === "failed" || m.status === "bounced" ? "border-red-200" : "border-slate-200"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${inbound ? "bg-slate-200 text-slate-700" : "bg-blue-800 text-white"}`}>
          {inbound ? (m.from_name || m.from_email || "?").slice(0, 1).toUpperCase() : "✦"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-900">{from}</span>
            {!inbound && <StatusBadge message={m} />}
            {m.template_key && <Badge>{m.template_key.replace(/_/g, " ")}</Badge>}
            {inbound && m.spam_verdict && /fail/i.test(m.spam_verdict) && <Badge color="amber">Check sender</Badge>}
            <span className="ml-auto shrink-0 text-xs text-slate-400" title={fullDate(when)}>{fullDate(when)}</span>
          </div>
          <div className="truncate text-xs text-slate-500">
            {inbound ? `to ${(m.to || []).join(", ")}` : `to ${(m.to || []).map(displayName).join(", ")}${m.cc?.length ? `, cc ${m.cc.map(displayName).join(", ")}` : ""}`}
          </div>
          {!open && <div className="mt-1 truncate text-sm text-slate-600">{m.snippet}</div>}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 px-2 pb-3 sm:px-4">
          {m.error && <div className="mx-2 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{m.error}</div>}
          {m.body_html ? <EmailFrame html={m.body_html} title={m.subject} /> : <pre className="whitespace-pre-wrap p-3 font-sans text-sm text-slate-800">{m.body_text}</pre>}
          {m.attachments?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 px-2">
              {m.attachments.map((a) => (
                <button key={a.id} type="button" disabled={!inbound} onClick={() => download(a)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 enabled:hover:bg-slate-50">
                  {inbound ? <Download className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}{a.filename}
                  {a.size ? <span className="text-slate-400">{Math.max(1, Math.round(a.size / 1024))} KB</span> : null}
                </button>
              ))}
            </div>
          )}
          {inbound && m.spam_verdict && (
            <div className="mt-2 flex items-center gap-1 px-2 text-[11px] text-slate-400"><ShieldCheck className="h-3 w-3" />{m.spam_verdict}</div>
          )}
        </div>
      )}
    </article>
  );
}
