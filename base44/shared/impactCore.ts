// @ts-nocheck
// AfriSci Nexus readership & impact — generated from shared/impactCore.js; edit the source package.
// AfriSci Nexus — readership & impact core (pure functions, no dependencies).
// Shared by the backend functions (Deno), the homepage map / article metrics (browser) and tests (Node).
import { COUNTRIES, TZ_TO_COUNTRY } from "./geoData.ts";

export const EVENT_TYPES = {
  view: "abstract",       // article page opened
  read: "full_text",      // full text opened
  download: "pdf_download",
};
export const DEDUPE_MINUTES = 30;

// ------------------------------------------------------------ countries

export function countryName(code) {
  return COUNTRIES[code]?.[0] || "";
}
export function continentOf(code) {
  return COUNTRIES[code]?.[3] || "";
}
export function isCountryCode(code) {
  return typeof code === "string" && /^[A-Z]{2}$/.test(code) && Boolean(COUNTRIES[code]);
}
export function countryFromTimezone(tz) {
  const c = TZ_TO_COUNTRY[String(tz || "").trim()];
  return isCountryCode(c) ? c : "";
}

// Extra names people write in affiliations, beyond each country's common name.
const ALIASES = {
  US: ["USA", "U.S.A.", "United States of America", "U.S."],
  GB: ["UK", "U.K.", "United Kingdom", "England", "Scotland", "Wales", "Northern Ireland", "Great Britain"],
  CI: ["Cote d'Ivoire", "Côte d’Ivoire", "Ivory Coast"],
  CD: ["DR Congo", "DRC", "Democratic Republic of the Congo", "Congo Kinshasa", "Congo-Kinshasa"],
  CG: ["Republic of the Congo", "Congo Brazzaville", "Congo-Brazzaville"],
  TZ: ["Tanzania", "United Republic of Tanzania"],
  KR: ["South Korea", "Republic of Korea", "Korea"],
  RU: ["Russia", "Russian Federation"],
  IR: ["Iran"],
  VN: ["Vietnam", "Viet Nam"],
  CZ: ["Czech Republic", "Czechia"],
  NL: ["The Netherlands", "Holland"],
  AE: ["UAE", "U.A.E."],
  SZ: ["Swaziland", "Eswatini"],
  CV: ["Cape Verde", "Cabo Verde"],
  GM: ["The Gambia", "Gambia"],
  SS: ["South Sudan", "Republic of South Sudan"],
};
// Compare names without accents and with one apostrophe style ("Côte d’Ivoire" == "Cote d'Ivoire").
const fold = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'");
let NAME_INDEX = null;
function nameIndex() {
  if (NAME_INDEX) return NAME_INDEX;
  const list = [];
  for (const [code, [name]] of Object.entries(COUNTRIES)) list.push([name, code]);
  for (const [code, names] of Object.entries(ALIASES)) for (const n of names) list.push([n, code]);
  // Longest names first so "South Sudan" wins over "Sudan", "Niger" vs "Nigeria" handled by word boundaries.
  list.sort((a, b) => b[0].length - a[0].length);
  NAME_INDEX = list.map(([n0, code]) => { const n = fold(n0); return [new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "iu"), code, n]; });
  return NAME_INDEX;
}
// Well known institutions whose affiliation lines often omit the country.
const INSTITUTIONS = [
  [/university of divinity/i, "AU"],
  [/central queensland university|cquniversity/i, "AU"],
  [/torrens university/i, "AU"],
  [/makerere/i, "UG"],
];

/** Country of one author: affiliation text first, then the email's country domain. */
export function countryOfAuthor(author = {}) {
  const aff = fold(author.affiliation || "");
  if (aff) {
    // Prefer the LAST country mentioned (affiliations usually end with the country).
    // Choose the country name that ends latest; on a tie the longer name wins ("South Sudan" over "Sudan").
    let best = null;
    for (const [re, code, name] of nameIndex()) {
      const m = aff.match(re);
      if (!m) continue;
      const end = m.index + m[0].length - (m[2] ? m[2].length : 0);
      if (!best || end > best.end || (end === best.end && name.length > best.len)) best = { end, len: name.length, code };
    }
    if (best) return best.code;
    for (const [re, code] of INSTITUTIONS) if (code && re.test(aff)) return code;
    const city = aff.match(/\b(juba)\b/i);
    if (city) return "SS";
  }
  const tld = String(author.email || "").toLowerCase().match(/\.([a-z]{2})$/);
  if (tld) {
    const code = tld[1] === "uk" ? "GB" : tld[1].toUpperCase();
    if (isCountryCode(code)) return code;
  }
  return "";
}

/** Distinct author countries of a manuscript, in author order. */
export function manuscriptCountries(m) {
  const out = [];
  for (const a of Array.isArray(m?.authors) ? m.authors : []) {
    const c = countryOfAuthor(a);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

// ------------------------------------------------------------ request classification

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|whatsapp|telegrambot|preview|headless|lighthouse|pagespeed|phantom|puppeteer|playwright|python-requests|curl\/|wget|axios|node-fetch|go-http-client|java\/|okhttp|deno\/|bun\/|undici|scrapy|httpclient|uptime|monitor/i;
export function isBot(userAgent) {
  const ua = String(userAgent || "");
  return !ua || BOT_RE.test(ua);
}
export function deviceFromUA(userAgent) {
  const ua = String(userAgent || "");
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}
export function referrerSource(referrer, ownHost = "afriscinexus.com") {
  const ref = String(referrer || "");
  if (!ref) return "direct";
  let host = "";
  try { host = new URL(ref).hostname.toLowerCase(); } catch { return "direct"; }
  if (host.endsWith(ownHost)) return "direct";
  if (/scholar\.google/.test(host)) return "scholar";
  if (/google\.|bing\.|duckduckgo|yahoo\.|baidu|yandex/.test(host)) return "google";
  if (/twitter|x\.com|t\.co|linkedin|facebook|instagram|whatsapp|telegram|reddit|researchgate|academia\.edu/.test(host)) return "social_media";
  return "institutional";
}

// Country headers set by common CDNs / edge platforms in front of serverless functions.
export const COUNTRY_HEADERS = [
  "cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-appengine-country",
  "x-country-code", "x-geo-country", "fastly-geo-country-code", "x-client-geo-country", "x-nf-country",
];
/** Returns { code, source } from request headers, else the browser's timezone. */
export function resolveCountry(headers, timezone) {
  const get = (k) => (typeof headers?.get === "function" ? headers.get(k) : headers?.[k]);
  for (const h of COUNTRY_HEADERS) {
    const v = String(get(h) || "").trim().toUpperCase();
    if (isCountryCode(v)) return { code: v, source: h };
  }
  const tz = countryFromTimezone(timezone);
  if (tz) return { code: tz, source: "timezone" };
  return { code: "", source: "none" };
}

// ------------------------------------------------------------ citations

export function normalizeDoi(doi) {
  return String(doi || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").toLowerCase();
}

// ------------------------------------------------------------ map building

/** Collaboration edges: every pair of distinct author countries on the same paper. */
export function collaborationEdges(manuscripts) {
  const map = new Map();
  for (const m of manuscripts) {
    const cs = manuscriptCountries(m);
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const [a, b] = [cs[i], cs[j]].sort();
      const k = `${a}>${b}`;
      map.set(k, { from: a, to: b, count: (map.get(k)?.count || 0) + 1 });
    }
  }
  return [...map.values()].sort((x, y) => y.count - x.count);
}

/** Citation edges: citing country -> each author country of the cited paper. */
export function citationEdges(manuscripts) {
  const map = new Map();
  for (const m of manuscripts) {
    const origins = manuscriptCountries(m);
    for (const [citing, n] of Object.entries(m.citing_countries || {})) {
      if (!isCountryCode(citing) || !n) continue;
      for (const origin of origins.length ? origins : [""]) {
        if (!origin || origin === citing) continue;
        const k = `${citing}>${origin}`;
        map.set(k, { from: citing, to: origin, count: (map.get(k)?.count || 0) + n });
      }
    }
  }
  return [...map.values()].sort((x, y) => y.count - x.count);
}

/** Equirectangular projection into the map's viewBox (matches LAND grid bounds). */
export function project(lon, lat, { width = 1000, top = 78, bottom = -56 } = {}) {
  const height = width * ((top - bottom) / 360);
  return [((lon + 180) / 360) * width, ((top - lat) / (top - bottom)) * height];
}

export function timeAgo(iso, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
