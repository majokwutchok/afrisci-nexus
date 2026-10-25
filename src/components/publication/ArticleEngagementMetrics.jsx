import React, { useEffect, useState } from "react";
import { Eye, BookOpenText, Download, Quote } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { countryName } from "@/lib/impact/impactCore";

const fmt = (n) => (Number(n) || 0).toLocaleString();
const pick = (m) => ({
  views: m?.view_count || 0,
  reads: m?.read_count || 0,
  downloads: m?.download_count || 0,
  citations: m?.citation_count || 0,
});

/** Live readership for one article: views, full text reads, downloads, citations, top countries. */
export default function ArticleEngagementMetrics({ manuscript }) {
  const [counts, setCounts] = useState(pick(manuscript));
  const [countries, setCountries] = useState(null);
  const [synced, setSynced] = useState(manuscript?.citations_synced_at || null);
  const [live, setLive] = useState(false);

  useEffect(() => { setCounts(pick(manuscript)); setSynced(manuscript?.citations_synced_at || null); },
    [manuscript?.id, manuscript?.view_count, manuscript?.read_count, manuscript?.download_count, manuscript?.citation_count]);

  useEffect(() => {
    if (!manuscript?.id) return undefined;
    let cancelled = false;

    // Reader countries for this article (only events with a known country)
    const loadCountries = async () => {
      try {
        let rowsByCountry = null;
        try {
          const res = await base44.entities.ReadershipStats.aggregate({
            query: { manuscript_id: manuscript.id, country_code: { $ne: null } }, groupBy: "country_code", sort: "-count", limit: 50,
          });
          rowsByCountry = (res?.rows || []).map((r) => [r.country_code, r.count]);
        } catch {
          const res = await base44.entities.ReadershipStats.filter({ manuscript_id: manuscript.id }, "-created_date", 2000);
          const list = Array.isArray(res) ? res : res?.items || [];
          const m = new Map();
          for (const r of list) if (r.country_code) m.set(r.country_code, (m.get(r.country_code) || 0) + 1);
          rowsByCountry = [...m];
        }
        if (!cancelled) setCountries(rowsByCountry.sort((a, b) => b[1] - a[1]));
      } catch {
        if (!cancelled) setCountries([]);
      }
    };
    loadCountries();

    let unsubMs = () => {}, unsubStats = () => {};
    try {
      unsubMs = base44.entities.Manuscript.subscribe((event) => {
        if (event.id !== manuscript.id || event.type !== "update" || !event.data) return;
        setCounts(pick(event.data));
        if (event.data.citations_synced_at) setSynced(event.data.citations_synced_at);
      });
      unsubStats = base44.entities.ReadershipStats.subscribe((event) => {
        const d = event.data;
        if (event.type !== "create" || d?.manuscript_id !== manuscript.id || !d.country_code) return;
        setCountries((prev) => {
          const m = new Map(prev || []);
          m.set(d.country_code, (m.get(d.country_code) || 0) + 1);
          return [...m].sort((a, b) => b[1] - a[1]);
        });
      });
      setLive(true);
    } catch { setLive(false); }

    return () => { cancelled = true; unsubMs?.(); unsubStats?.(); };
  }, [manuscript?.id]);

  if (!manuscript) return null;
  const items = [
    { label: "Views", value: counts.views, icon: Eye, hint: "Times the article page was opened" },
    { label: "Reads", value: counts.reads, icon: BookOpenText, hint: "Times the full text was opened" },
    { label: "Downloads", value: counts.downloads, icon: Download, hint: "PDF downloads" },
    { label: "Citations", value: counts.citations, icon: Quote, hint: "Citations indexed by OpenAlex and Crossref" },
  ];
  const top = (countries || []).slice(0, 5);
  const topMax = Math.max(1, ...top.map(([, n]) => n));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="aem-title">
      <div className="flex items-center justify-between">
        <h3 id="aem-title" className="text-base font-semibold text-slate-900">Readership</h3>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`} />
          {live ? "Live" : "Updated on load"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {items.map(({ label, value, icon: Icon, hint }) => (
          <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5" title={hint}>
            <dt className="flex items-center gap-1.5 text-xs text-slate-500"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{label}</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">{fmt(value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <h4 className="text-sm font-medium text-slate-900">Read in</h4>
        {countries === null ? <p className="mt-2 text-sm text-slate-400">Loading…</p> :
          top.length === 0 ? <p className="mt-2 text-sm text-slate-500">Reader countries will appear here as people read this article.</p> : (
            <ol className="mt-2 space-y-2">
              {top.map(([code, n]) => (
                <li key={code}>
                  <div className="flex justify-between text-sm"><span className="text-slate-700">{countryName(code) || code}</span><span className="tabular-nums text-slate-900">{fmt(n)}</span></div>
                  <div className="mt-1 h-1 rounded-full bg-slate-100"><div className="h-1 rounded-full bg-blue-800" style={{ width: `${Math.max(6, (n / topMax) * 100)}%` }} /></div>
                </li>
              ))}
            </ol>
          )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Counts update as readers arrive. Repeat visits within 30 minutes count once.{" "}
        {synced ? `Citations last checked ${new Date(synced).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}.` : "Citations are checked twice a day."}
      </p>
    </section>
  );
}
