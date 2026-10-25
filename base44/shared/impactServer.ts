// @ts-nocheck
// AfriSci Nexus readership & impact — generated from shared/impactServer.js; edit the source package.
// AfriSci Nexus — readership & citation services for Base44 backend functions.
// No Base44 integrations are used (no credits): entity reads/writes + free public APIs
// (OpenAlex, Crossref REST).
import { secrets } from "base44:runtime";
import {
  EVENT_TYPES, DEDUPE_MINUTES, countryName, continentOf, isCountryCode, isBot, deviceFromUA,
  referrerSource, resolveCountry, normalizeDoi, manuscriptCountries, collaborationEdges, citationEdges,
} from "./impactCore.ts";

export async function getSecret(name) {
  try { const v = secrets?.get?.(name); if (v) return v; } catch (_) { /* no runtime secrets */ }
  try { const v = Deno.env.get(name); if (v) return v; } catch (_) { /* no env access */ }
  return undefined;
}
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders },
  });
}
const rows = (r) => (Array.isArray(r) ? r : r?.items ?? []);
const PUBLIC_STATUSES = ["published", "online_first"];
const MS_FIELDS_COUNTERS = ["view_count", "read_count", "download_count", "citation_count"];

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function withTimeout(ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
}

// ------------------------------------------------------------ tracking

/**
 * Records one reader event. Returns { ok, counted, counts?, reason? }.
 * payload: { manuscript_id, type: view|read|download, visitor, tz, referrer }
 */
export async function recordEvent(db, req, payload) {
  const type = String(payload?.type || "");
  const viewType = EVENT_TYPES[type];
  const manuscriptId = String(payload?.manuscript_id || "");
  if (!viewType || !/^[A-Za-z0-9_-]{6,64}$/.test(manuscriptId)) return { ok: false, status: 400, reason: "invalid event" };

  const ua = req.headers.get("user-agent") || "";
  if (isBot(ua)) return { ok: true, counted: false, reason: "bot" };

  let ms = null;
  try { ms = await db.Manuscript.get(manuscriptId); } catch (_) { ms = null; }
  if (!ms || !PUBLIC_STATUSES.includes(ms.status)) return { ok: true, counted: false, reason: "not public" };

  const salt = (await getSecret("ANALYTICS_SALT")) || "afrisci-nexus-readership";
  const visitor = String(payload?.visitor || "").slice(0, 80);
  const visitorHash = visitor ? (await sha256Hex(`${salt}:${visitor}`)).slice(0, 24) : "";

  // De-duplicate: the same reader repeating the same action on the same article within 30 minutes counts once.
  if (visitorHash) {
    const last = rows(await db.ReadershipStats.filter({ manuscript_id: manuscriptId, visitor_hash: visitorHash, view_type: viewType }, "-created_date", 1))[0];
    if (last && Date.now() - new Date(last.created_date).getTime() < DEDUPE_MINUTES * 60_000) {
      return { ok: true, counted: false, reason: "duplicate", counts: pickCounts(ms) };
    }
  }

  const { code, source } = resolveCountry(req.headers, payload?.tz);
  const today = new Date().toISOString().slice(0, 10);
  await db.ReadershipStats.create({
    manuscript_id: manuscriptId,
    page_title: ms.title || "Untitled article",
    journal_id: ms.journal_id || null,
    country: code ? countryName(code) : "Unknown",
    country_code: code || null,
    continent: code ? continentOf(code) || null : null,
    country_source: source,
    view_date: today,
    view_type: viewType,
    device_type: deviceFromUA(ua),
    referrer_source: referrerSource(payload?.referrer),
    visitor_hash: visitorHash || null,
  });

  // Atomic server side increments (no lost updates when many readers arrive together).
  const inc = { view_count: 1 };
  if (type === "read") inc.read_count = 1;
  if (type === "download") { delete inc.view_count; inc.download_count = 1; }
  await db.Manuscript.updateMany({ id: manuscriptId }, { $inc: inc });

  const counts = pickCounts(ms);
  for (const [k, v] of Object.entries(inc)) counts[k] += v;
  return { ok: true, counted: true, counts, country: code || null };
}

function pickCounts(ms) {
  return Object.fromEntries(MS_FIELDS_COUNTERS.map((k) => [k, Number(ms?.[k]) || 0]));
}

// ------------------------------------------------------------ citations

const CITATION_TTL_HOURS = 12;

/** Fetches citation counts (OpenAlex + Crossref) and the countries of citing authors. */
export async function syncCitations(db, manuscripts, { budgetMs = 9000 } = {}) {
  const started = Date.now();
  const withDoi = manuscripts.filter((m) => normalizeDoi(m.doi));
  if (!withDoi.length) return { synced: 0 };
  const openalexBase = (await getSecret("OPENALEX_API_BASE")) || "https://api.openalex.org";
  const crossrefBase = (await getSecret("CROSSREF_API_BASE")) || "https://api.crossref.org";
  const key = await getSecret("OPENALEX_API_KEY");
  const mailto = "editorial@afriscinexus.com";
  const results = new Map(withDoi.map((m) => [m.id, { openalex: null, crossref: null, openalex_id: m.openalex_id || "", citing: null }]));
  const byDoi = new Map(withDoi.map((m) => [normalizeDoi(m.doi), m]));

  // OpenAlex: one request for up to 100 DOIs
  for (let i = 0; i < withDoi.length; i += 100) {
    const chunk = withDoi.slice(i, i + 100).map((m) => normalizeDoi(m.doi));
    const url = `${openalexBase}/works?filter=doi:${chunk.map(encodeURIComponent).join("|")}&select=id,doi,cited_by_count&per_page=100&mailto=${mailto}${key ? `&api_key=${key}` : ""}`;
    const t = withTimeout(5000);
    try {
      const r = await fetch(url, { signal: t.signal });
      if (r.ok) {
        for (const w of (await r.json()).results || []) {
          const m = byDoi.get(normalizeDoi(w.doi));
          if (m) Object.assign(results.get(m.id), { openalex: Number(w.cited_by_count) || 0, openalex_id: String(w.id || "").split("/").pop() });
        }
      }
    } catch (_) { /* source unavailable: keep previous values */ } finally { t.done(); }
  }

  // Crossref: is-referenced-by-count per DOI (parallel)
  await Promise.all(withDoi.map(async (m) => {
    const t = withTimeout(5000);
    try {
      const r = await fetch(`${crossrefBase}/works/${encodeURIComponent(normalizeDoi(m.doi))}?mailto=${mailto}`, { signal: t.signal });
      if (r.ok) results.get(m.id).crossref = Number((await r.json())?.message?.["is-referenced-by-count"]) || 0;
    } catch (_) { /* ignore */ } finally { t.done(); }
  }));

  // Countries of citing authors, for cited works (OpenAlex)
  for (const m of withDoi) {
    const r = results.get(m.id);
    if (!r.openalex || !r.openalex_id || Date.now() - started > budgetMs) continue;
    const t = withTimeout(5000);
    try {
      const res = await fetch(`${openalexBase}/works?filter=cites:${r.openalex_id}&select=id,authorships&per_page=200&mailto=${mailto}${key ? `&api_key=${key}` : ""}`, { signal: t.signal });
      if (res.ok) {
        const counts = {};
        for (const w of (await res.json()).results || []) {
          const cs = new Set();
          for (const a of w.authorships || []) {
            for (const c of a.countries || []) cs.add(String(c).toUpperCase());
            for (const inst of a.institutions || []) if (inst.country_code) cs.add(String(inst.country_code).toUpperCase());
          }
          for (const c of cs) if (isCountryCode(c)) counts[c] = (counts[c] || 0) + 1;
        }
        r.citing = counts;
      }
    } catch (_) { /* ignore */ } finally { t.done(); }
  }

  let synced = 0;
  for (const m of withDoi) {
    const r = results.get(m.id);
    if (r.openalex === null && r.crossref === null) continue; // both sources unreachable
    const count = Math.max(r.openalex ?? 0, r.crossref ?? 0);
    const patch = {
      citation_count: count,
      citation_sources: { openalex: r.openalex, crossref: r.crossref },
      citations_synced_at: new Date().toISOString(),
    };
    if (r.openalex_id) patch.openalex_id = r.openalex_id;
    if (r.citing) patch.citing_countries = r.citing;
    else if (count === 0) patch.citing_countries = {};
    await db.Manuscript.update(m.id, patch);
    Object.assign(m, patch);
    synced++;
  }
  return { synced };
}

// ------------------------------------------------------------ map snapshot

const SNAPSHOT_TTL_MS = 15_000; // live events are pushed to browsers in between

async function getMeta(db, key) {
  return rows(await db.ImpactSnapshot.filter({ key }, "-updated_date", 1))[0] || null;
}
async function setMeta(db, key, current, data) {
  const rec = { key, data, computed_at: new Date().toISOString() };
  return current ? db.ImpactSnapshot.update(current.id, rec) : db.ImpactSnapshot.create(rec);
}

async function groupCount(db, query, field) {
  try {
    const res = await db.ReadershipStats.aggregate({ query, groupBy: field, limit: 1000 });
    return (res?.rows || []).map((r) => ({ key: r[field], count: r.count }));
  } catch (_) {
    // Fallback for runtimes without aggregate: count in memory.
    const all = rows(await db.ReadershipStats.filter(query, "-created_date", 20000));
    const m = new Map();
    for (const r of all) m.set(r[field], (m.get(r[field]) || 0) + 1);
    return [...m].map(([key, count]) => ({ key, count }));
  }
}

export async function buildImpact(db, { force = false } = {}) {
  const cached = await getMeta(db, "impact_map");
  if (!force && cached?.data && Date.now() - new Date(cached.computed_at).getTime() < SNAPSHOT_TTL_MS) {
    return { ...cached.data, cached: true };
  }

  const manuscripts = rows(await db.Manuscript.filter({ status: { $in: PUBLIC_STATUSES } }, "-publication_date", 2000));

  // Refresh citations at most every 12 hours.
  const syncMeta = await getMeta(db, "citations_sync");
  if (force || !syncMeta || Date.now() - new Date(syncMeta.computed_at).getTime() > CITATION_TTL_HOURS * 3600_000) {
    try {
      const r = await syncCitations(db, manuscripts);
      await setMeta(db, "citations_sync", syncMeta, r);
    } catch (_) { /* keep stale citations */ }
  }

  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [byCountry, byCountry30] = await Promise.all([
    groupCount(db, { country_code: { $ne: null } }, "country_code"),
    groupCount(db, { country_code: { $ne: null }, view_date: { $gte: since30 } }, "country_code"),
  ]);
  const recent = rows(await db.ReadershipStats.filter({ country_code: { $ne: null } }, "-created_date", 12)).map((r) => ({
    country_code: r.country_code, view_type: r.view_type, manuscript_id: r.manuscript_id,
    title: r.page_title, at: r.created_date,
  }));

  const readers = byCountry.filter((r) => isCountryCode(r.key)).map((r) => ({ code: r.key, count: r.count })).sort((a, b) => b.count - a.count);
  const readers30 = Object.fromEntries(byCountry30.filter((r) => isCountryCode(r.key)).map((r) => [r.key, r.count]));
  const origins = {};
  for (const m of manuscripts) for (const c of manuscriptCountries(m)) origins[c] = (origins[c] || 0) + 1;
  const citations = citationEdges(manuscripts);
  const collaborations = collaborationEdges(manuscripts);
  const sum = (k) => manuscripts.reduce((s, m) => s + (Number(m[k]) || 0), 0);
  const reached = new Set([...readers.map((r) => r.code), ...citations.map((e) => e.from)]);

  const data = {
    generated_at: new Date().toISOString(),
    totals: {
      articles: manuscripts.length,
      views: sum("view_count"),
      reads: sum("read_count"),
      downloads: sum("download_count"),
      citations: sum("citation_count"),
      collaborations: collaborations.reduce((s, e) => s + e.count, 0),
      countries_reached: reached.size,
      located_readers: readers.reduce((s, r) => s + r.count, 0),
    },
    readers, readers_30d: readers30, origins, citations, collaborations, recent,
    articles: manuscripts.slice(0, 50).map((m) => ({ id: m.id, title: m.title, countries: manuscriptCountries(m) })),
  };
  await setMeta(db, "impact_map", cached, data);
  return { ...data, cached: false };
}
