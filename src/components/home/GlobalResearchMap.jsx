import React, { useMemo, useState } from "react";
import { useImpactData } from "@/lib/impact/useImpactData";
import { LAND, COUNTRIES } from "@/lib/impact/geoData";
import { project, countryName, timeAgo } from "@/lib/impact/impactCore";

const W = 1000;
const H = Math.round(W * ((LAND.top - LAND.bottom) / 360));
const C = {
  land: "#D3DBE6",
  ink: "#0F172A",
  muted: "#64748B",
  readers: "#1E40AF",
  origin: "#F59E0B",
  citations: "#0F766E",
  collaborations: "#7C3AED",
};

// Land dot matrix decoded once into a single SVG path (thousands of dots, one element).
const LAND_PATH = (() => {
  const bin = atob(LAND.bits);
  const cell = W / LAND.cols;
  let d = "";
  for (let r = 0; r < LAND.rows; r++) for (let c = 0; c < LAND.cols; c++) {
    const i = r * LAND.cols + c;
    if (bin.charCodeAt(i >> 3) & (1 << (i & 7))) d += `M${((c + 0.5) * cell).toFixed(1)} ${((r + 0.5) * cell).toFixed(1)}h0`;
  }
  return { d, cell };
})();

function xy(code) {
  const c = COUNTRIES[code];
  return c ? project(c[1], c[2], { width: W, top: LAND.top, bottom: LAND.bottom }) : null;
}
function arc([x1, y1], [x2, y2]) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const lift = Math.min(160, Math.hypot(x2 - x1, y2 - y1) * 0.32);
  return `M${x1} ${y1} Q${mx} ${my - lift} ${x2} ${y2}`;
}
const fmt = (n) => (Number(n) || 0).toLocaleString();

const MODES = [
  { key: "readers", label: "Readers", color: C.readers },
  { key: "citations", label: "Citations", color: C.citations },
  { key: "collaborations", label: "Collaborations", color: C.collaborations },
];

export default function GlobalResearchMap() {
  const { data, error, live, pulses } = useImpactData();
  const [mode, setMode] = useState("readers");
  const [hover, setHover] = useState(null);
  const t = data?.totals;

  const modeCount = { readers: t?.located_readers, citations: t?.citations, collaborations: t?.collaborations };
  const maxReaders = Math.max(1, ...(data?.readers || []).map((r) => r.count));
  const edges = mode === "citations" ? data?.citations || [] : mode === "collaborations" ? data?.collaborations || [] : [];
  const maxEdge = Math.max(1, ...edges.map((e) => e.count));
  const leaders = useMemo(() => {
    if (!data) return [];
    if (mode === "readers") return data.readers.slice(0, 6).map((r) => ({ code: r.code, count: r.count }));
    const m = new Map();
    for (const e of edges) for (const k of mode === "citations" ? [e.from] : [e.from, e.to]) m.set(k, (m.get(k) || 0) + e.count);
    return [...m].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [data, mode]);
  const leaderMax = Math.max(1, ...leaders.map((l) => l.count));
  const latest = data?.recent?.[0];
  const active = MODES.find((m) => m.key === mode);

  const empty = data && (
    mode === "readers" && !data.readers.length ? "Reader locations will appear here as soon as the next person opens an article." :
    mode === "citations" && !edges.length ? "No citations have been indexed yet. They appear here automatically as OpenAlex and Crossref record them." :
    mode === "collaborations" && !edges.length ? "Every article published so far has authors from a single country. Papers co-written across countries will draw links here." :
    null
  );

  return (
    <section className="grm rounded-2xl border border-slate-200 bg-white px-5 py-6 sm:px-8 sm:py-8" aria-labelledby="grm-title">
      <style>{`
        @keyframes grm-pulse { from { r: 4; opacity: .55 } to { r: 26; opacity: 0 } }
        .grm-pulse { animation: grm-pulse 2.4s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) { .grm-pulse { animation: none; opacity: 0 } }
        .grm-tab:focus-visible { outline: 2px solid ${C.readers}; outline-offset: 2px; }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="max-w-xl">
          <h2 id="grm-title" className="text-2xl font-bold tracking-tight text-slate-900">Global Research Impact</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-slate-600">
            Where AfriSci Nexus research is read, cited and co-written, updated as it happens.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`}>
            {live && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />}
          </span>
          {live ? "Live" : "Updating every minute"}
        </span>
      </div>

      <div role="tablist" aria-label="Map view" className="mt-5 flex flex-wrap gap-2">
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <button key={m.key} type="button" role="tab" aria-selected={on} onClick={() => setMode(m.key)}
              className="grm-tab inline-flex items-baseline gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
              style={on ? { background: m.color, borderColor: m.color, color: "#fff" } : { borderColor: "#E2E8F0", color: C.ink }}>
              <span className="font-medium">{m.label}</span>
              <span className={`tabular-nums font-semibold ${on ? "text-white/90" : "text-slate-500"}`}>{data ? fmt(modeCount[m.key]) : "–"}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
            aria-label={`World map of ${active.label.toLowerCase()}. ${leaders.map((l) => `${countryName(l.code)} ${l.count}`).join(", ")}`}>
            <path d={LAND_PATH.d} stroke={C.land} strokeWidth={LAND_PATH.cell * 0.52} strokeLinecap="round" fill="none" />

            {/* author home countries */}
            {data && Object.keys(data.origins).map((code) => {
              const p = xy(code);
              return p && <circle key={`o-${code}`} cx={p[0]} cy={p[1]} r={7} fill="none" stroke={C.origin} strokeWidth={2.2}
                onMouseEnter={() => setHover({ code, text: `${countryName(code)}: home of ${data.origins[code]} author${data.origins[code] > 1 ? "s'" : "'s"} research` })} onMouseLeave={() => setHover(null)} />;
            })}

            {edges.map((e, i) => {
              const a = xy(e.from), b = xy(e.to);
              if (!a || !b) return null;
              return <path key={`e-${i}`} d={arc(a, b)} fill="none" stroke={active.color} strokeOpacity={0.75}
                strokeWidth={1.2 + 3.5 * (e.count / maxEdge)} strokeLinecap="round" />;
            })}

            {mode === "readers" && data?.readers.map((r) => {
              const p = xy(r.code);
              if (!p) return null;
              const rad = 3.5 + 13 * Math.sqrt(r.count / maxReaders);
              return <circle key={`r-${r.code}`} cx={p[0]} cy={p[1]} r={rad} fill={C.readers} fillOpacity={0.78} stroke="#fff" strokeWidth={1.2}
                onMouseEnter={() => setHover({ code: r.code, text: `${countryName(r.code)}: ${fmt(r.count)} reader event${r.count === 1 ? "" : "s"}${data.readers_30d?.[r.code] ? `, ${fmt(data.readers_30d[r.code])} in the last 30 days` : ""}` })}
                onMouseLeave={() => setHover(null)} />;
            })}

            {mode !== "readers" && leaders.map((l) => {
              const p = xy(l.code);
              return p && <circle key={`n-${l.code}`} cx={p[0]} cy={p[1]} r={4.5} fill={active.color} stroke="#fff" strokeWidth={1.2}
                onMouseEnter={() => setHover({ code: l.code, text: `${countryName(l.code)}: ${fmt(l.count)}` })} onMouseLeave={() => setHover(null)} />;
            })}

            {pulses.map((p) => {
              const q = xy(p.code);
              return q && <circle key={p.id} className="grm-pulse" cx={q[0]} cy={q[1]} r={4} fill="none" stroke={C.readers} strokeWidth={2} />;
            })}
          </svg>

          {hover && (
            <div className="pointer-events-none absolute left-3 top-3 max-w-[18rem] rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg" role="status">{hover.text}</div>
          )}
          {!data && !error && <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">Loading impact data…</div>}
          {error && !data && <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">Impact data is temporarily unavailable.</div>}
          {empty && (
            <p className="absolute inset-x-0 bottom-2 mx-auto w-fit max-w-md rounded-lg bg-white/90 px-3 py-2 text-center text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">{empty}</p>
          )}
        </div>

        <aside aria-label={`Top countries by ${active.label.toLowerCase()}`}>
          <h3 className="text-sm font-semibold text-slate-900">
            {mode === "readers" ? "Most readers" : mode === "citations" ? "Citing countries" : "Collaborating countries"}
          </h3>
          {leaders.length ? (
            <ol className="mt-3 space-y-2.5">
              {leaders.map((l) => (
                <li key={l.code}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate text-slate-700">{countryName(l.code)}</span>
                    <span className="tabular-nums font-semibold text-slate-900">{fmt(l.count)}</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-slate-100">
                    <div className="h-1 rounded-full" style={{ width: `${Math.max(6, (l.count / leaderMax) * 100)}%`, background: active.color }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="mt-3 text-sm text-slate-500">{data ? "Nothing to rank yet." : ""}</p>}

          {t && (
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm">
              <div><dt className="text-slate-500">Countries reached</dt><dd className="font-semibold tabular-nums text-slate-900">{fmt(t.countries_reached)}</dd></div>
              <div><dt className="text-slate-500">Article views</dt><dd className="font-semibold tabular-nums text-slate-900">{fmt(t.views)}</dd></div>
              <div><dt className="text-slate-500">Full text reads</dt><dd className="font-semibold tabular-nums text-slate-900">{fmt(t.reads)}</dd></div>
              <div><dt className="text-slate-500">Downloads</dt><dd className="font-semibold tabular-nums text-slate-900">{fmt(t.downloads)}</dd></div>
            </dl>
          )}
        </aside>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-slate-600">
        <p className="min-w-0 truncate" aria-live="polite">
          {latest ? (
            <>
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: C.readers }} />
              Someone in {countryName(latest.country_code)} {latest.view_type === "pdf_download" ? "downloaded" : latest.view_type === "full_text" ? "read" : "opened"}{" "}
              <a href={`/ManuscriptDetail?id=${latest.manuscript_id}`} className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500">{latest.title}</a>{" "}
              <span className="text-slate-400">{timeAgo(latest.at)}</span>
            </>
          ) : data ? "Waiting for the next reader." : ""}
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: C.origin }} />Author home countries</span>
          <span>Citations from OpenAlex and Crossref</span>
        </p>
      </div>
    </section>
  );
}
