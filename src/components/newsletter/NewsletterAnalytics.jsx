import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDate } from "@/lib/newsletter/render";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Loader2, RefreshCw, ChevronLeft, MailOpen, MousePointerClick, Send, UserMinus, Download, ListPlus, Info, Search, Link2,
} from "lucide-react";

async function call(action, payload = {}) {
  const res = await base44.functions.invoke("newsletterAdmin", { action, ...payload });
  const data = res?.data ?? res;
  if (data?.error) throw new Error(data.error);
  return data;
}
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const when = (d) => (d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

function Kpi({ icon: Icon, label, value, sub, tone = "text-blue-800" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Icon className={`w-4 h-4 ${tone}`} />{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function RateBar({ value, color = "bg-blue-800" }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} /></div>
      <span className="text-xs text-slate-700 tabular-nums">{value}%</span>
    </div>
  );
}

const Caveat = () => (
  <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
    <Info className="w-4 h-4 shrink-0 text-slate-400" />
    <span>Opens are measured with an invisible image, so they are an estimate. Apple Mail privacy protection can count an email as opened without a person reading it, and readers who block images are only counted once they click a link. Clicks are exact.</span>
  </div>
);

function csv(rows) {
  const head = ["email", "opened", "first_open", "opens", "clicked", "clicks", "device", "unsubscribed"];
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.join(","), ...rows.map((r) => head.map((h) => q(r[h])).join(","))].join("\n");
}

/* ------------------------------------------------------------------ issue detail */
function IssueDetail({ id, onBack, flash }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    setData(null);
    try { setData(await call("analytics_issue", { newsletter_id: id })); } catch (e) { flash("error", e.message); onBack(); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const timeline = useMemo(() => {
    if (!data?.first_opens?.length) return [];
    const by = {};
    data.first_opens.forEach((d) => { const k = String(d).slice(0, 10); by[k] = (by[k] || 0) + 1; });
    const days = Object.keys(by).sort();
    const out = [];
    const end = new Date(days[days.length - 1]);
    for (let d = new Date(days[0]); d <= end && out.length < 31; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0, 10);
      out.push({ k, n: by[k] || 0 });
    }
    return out;
  }, [data]);

  if (!data) return <div className="p-10 text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading insight…</div>;
  const { issue, totals, devices, links, recipients } = data;
  const base = totals.sent || totals.recipients;
  const max = Math.max(1, ...timeline.map((t) => t.n));
  const shown = recipients
    .filter((r) => filter === "all" || (filter === "opened" && r.opened) || (filter === "not_opened" && !r.opened) || (filter === "clicked" && r.clicked) || (filter === "unsubscribed" && r.unsubscribed))
    .filter((r) => !q || r.email.includes(q.toLowerCase()));
  const devTotal = Object.values(devices).reduce((a, b) => a + b, 0);

  const saveSegment = async (source, label) => {
    setSaving(source);
    try {
      const r = await call("list_build", { source, newsletter_id: issue.id, name: `Issue ${issue.issue_number || ""} ${label}`.replace(/\s+/g, " ").trim() });
      flash("ok", `Saved ${r.added} addresses to a new mailing list.`);
    } catch (e) { flash("error", e.message); }
    setSaving("");
  };
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([csv(shown)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `afrisci-newsletter-issue-${issue.issue_number || issue.id}-${filter}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" />All issues</Button>
          <div>
            <div className="font-bold text-slate-900">Issue {issue.issue_number || "?"} · {issue.headline || issue.subject}</div>
            <div className="text-xs text-slate-500">Sent {formatDate(issue.sent_at)}{issue.journal_title ? ` · ${issue.journal_title} edition` : ""}</div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icon={Send} label="Delivered" value={base} sub={totals.failed ? `${totals.failed} failed` : "to inboxes"} />
        <Kpi icon={MailOpen} label="Opened" value={`${pct(totals.unique_opens, base)}%`} sub={`${totals.unique_opens} readers · ${totals.total_opens} opens`} tone="text-emerald-600" />
        <Kpi icon={MousePointerClick} label="Clicked" value={`${pct(totals.unique_clicks, base)}%`} sub={`${totals.unique_clicks} readers · ${totals.total_clicks} clicks`} tone="text-amber-500" />
        <Kpi icon={MousePointerClick} label="Click to open" value={`${pct(totals.unique_clicks, totals.unique_opens)}%`} sub="of readers who opened" tone="text-amber-500" />
        <Kpi icon={UserMinus} label="Unsubscribed" value={totals.unsubscribes} sub={`${pct(totals.unsubscribes, base)}% of delivered`} tone="text-red-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:col-span-2">
          <div className="font-semibold text-slate-900 text-sm mb-3">New readers by day</div>
          {timeline.length === 0 ? <p className="text-sm text-slate-400">No opens recorded yet.</p> : (
            <div className="flex items-end gap-1 h-32">
              {timeline.map((t) => (
                <div key={t.k} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${t.k}: ${t.n} readers`}>
                  <span className="text-[10px] text-slate-500">{t.n || ""}</span>
                  <div className="w-full bg-blue-800 rounded-t" style={{ height: `${(t.n / max) * 90}px`, minHeight: t.n ? 3 : 0 }} />
                  <span className="text-[10px] text-slate-400 truncate">{t.k.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="font-semibold text-slate-900 text-sm mb-3">Reading device</div>
          {devTotal === 0 ? <p className="text-sm text-slate-400">No data yet.</p> : Object.entries(devices).sort((a, b) => b[1] - a[1]).map(([d, n]) => (
            <div key={d} className="flex items-center justify-between py-1 text-sm"><span className="capitalize text-slate-700">{d}</span><RateBar value={pct(n, devTotal)} color="bg-amber-500" /></div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-900 flex items-center gap-2"><Link2 className="w-4 h-4 text-blue-800" />Most clicked links</div>
        {links.length === 0 ? <p className="p-4 text-sm text-slate-400">No clicks yet.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-2">Link</th><th className="text-right px-4 py-2">Clicks</th><th className="text-right px-4 py-2">Readers</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {links.slice(0, 15).map((l) => (
                <tr key={l.url}><td className="px-4 py-2 max-w-md truncate"><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline">{l.url.replace(/^https?:\/\//, "")}</a></td><td className="px-4 py-2 text-right tabular-nums">{l.clicks}</td><td className="px-4 py-2 text-right tabular-nums">{l.unique}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold text-sm text-slate-900">Who read it</div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative"><Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-slate-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find email" className="h-8 pl-7 w-44" /></div>
            {[["all", "All", recipients.length], ["opened", "Opened", totals.unique_opens], ["not_opened", "Not opened", recipients.length - totals.unique_opens], ["clicked", "Clicked", totals.unique_clicks], ["unsubscribed", "Unsubscribed", totals.unsubscribes]].map(([k, l, n]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} className={`text-xs px-2.5 py-1.5 rounded-full border ${filter === k ? "bg-blue-800 text-white border-blue-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{l} {n}</button>
            ))}
            <Button size="sm" variant="outline" onClick={exportCsv}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
          </div>
        </div>
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500 self-center">Save as mailing list:</span>
          {[["non_openers", "non openers"], ["openers", "openers"], ["clickers", "clickers"]].map(([k, l]) => (
            <Button key={k} size="sm" variant="outline" className="h-7 text-xs" disabled={!!saving} onClick={() => saveSegment(k, l)}>
              {saving === k ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ListPlus className="w-3 h-3 mr-1" />}{l}
            </Button>
          ))}
        </div>
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-white sticky top-0 text-xs text-slate-500 uppercase shadow-sm"><tr><th className="text-left px-4 py-2">Reader</th><th className="text-left px-4 py-2">Read?</th><th className="text-left px-4 py-2">First opened</th><th className="text-right px-4 py-2">Opens</th><th className="text-right px-4 py-2">Clicks</th><th className="text-left px-4 py-2">Device</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {shown.slice(0, 1000).map((r) => (
                <tr key={r.email}>
                  <td className="px-4 py-2 text-slate-800">{r.email}{r.unsubscribed && <Badge variant="outline" className="ml-2 text-red-600 border-red-200">unsubscribed</Badge>}</td>
                  <td className="px-4 py-2">{r.opened ? <span className="text-emerald-700 font-medium">Read</span> : <span className="text-slate-400">Not opened</span>}</td>
                  <td className="px-4 py-2 text-slate-600">{when(r.first_open)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.opens || ""}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.clicks || ""}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{r.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length > 1000 && <p className="p-3 text-xs text-slate-500">Showing the first 1000. Export CSV for the full list.</p>}
          {shown.length === 0 && <p className="p-6 text-sm text-slate-400 text-center">Nobody in this view.</p>}
        </div>
      </div>
      <Caveat />
    </div>
  );
}

/* ------------------------------------------------------------------ overview */
export default function NewsletterAnalytics() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [toast, setToast] = useState(null);
  const flash = (kind, text) => { setToast({ kind, text }); setTimeout(() => setToast(null), 5000); };
  const load = useCallback(async () => {
    setData(null);
    try { setData(await call("analytics_overview")); } catch (e) { flash("error", e.message); setData({ issues: [] }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const Toast = toast && (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.kind === "error" ? "bg-red-600" : "bg-emerald-600"}`}>{toast.text}</div>
  );

  if (open) return <>{<IssueDetail id={open} onBack={() => { setOpen(null); load(); }} flash={flash} />}{Toast}</>;

  const issues = data?.issues || [];
  const tracked = issues.filter((i) => (i.sent_count || 0) > 0);
  const sum = (k) => tracked.reduce((a, i) => a + (i[k] || 0), 0);
  const sent = sum("sent_count");
  const last = tracked[0];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-blue-800 px-6 py-5 flex items-center justify-between">
        <div>
          <div className="text-white text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-500" />Newsletter insight</div>
          <div className="text-xs text-blue-200 mt-1">Who received, read and clicked each issue of the AfriSci Newsletter</div>
        </div>
        <Button variant="secondary" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
      </div>
      {!data ? <div className="p-10 text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={Send} label="Emails delivered" value={sent} sub={`across ${tracked.length} issues`} />
            <Kpi icon={MailOpen} label="Average open rate" value={`${pct(sum("unique_opens"), sent)}%`} sub={`${sum("unique_opens")} reads`} tone="text-emerald-600" />
            <Kpi icon={MousePointerClick} label="Average click rate" value={`${pct(sum("unique_clicks"), sent)}%`} sub={`${sum("unique_clicks")} readers clicked`} tone="text-amber-500" />
            <Kpi icon={MailOpen} label="Latest issue" value={last ? `${pct(last.unique_opens, last.sent_count)}%` : "None"} sub={last ? `opened · Issue ${last.issue_number || ""}` : "Send an issue to see insight"} tone="text-emerald-600" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {issues.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No issues have been sent yet. Insight appears here once the first issue goes out.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase"><tr><th className="text-left px-4 py-2">Issue</th><th className="text-right px-4 py-2">Delivered</th><th className="text-left px-4 py-2">Opened</th><th className="text-left px-4 py-2">Clicked</th><th className="text-right px-4 py-2">Unsubscribed</th><th className="px-4 py-2" /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5"><div className="font-semibold text-slate-900">Issue {i.issue_number || "?"} <span className="font-normal text-slate-600">· {i.headline || i.subject}</span></div><div className="text-xs text-slate-500">{formatDate(i.sent_at || i.send_date)}{i.status === "sending" ? " · still sending" : ""}</div></td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{i.sent_count || 0}</td>
                      <td className="px-4 py-2.5"><RateBar value={pct(i.unique_opens, i.sent_count)} color="bg-emerald-600" /><div className="text-[11px] text-slate-500">{i.unique_opens} readers</div></td>
                      <td className="px-4 py-2.5"><RateBar value={pct(i.unique_clicks, i.sent_count)} color="bg-amber-500" /><div className="text-[11px] text-slate-500">{i.unique_clicks} readers</div></td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{i.unsubscribes}</td>
                      <td className="px-4 py-2.5 text-right"><Button size="sm" variant="outline" onClick={() => setOpen(i.id)}>View insight</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-xs text-slate-500">Tracking started with this update, so issues sent before it show deliveries but no reads.</p>
          <Caveat />
        </>
      )}
      {Toast}
    </div>
  );
}
