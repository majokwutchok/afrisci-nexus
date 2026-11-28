// @ts-nocheck
// AfriSci Newsletter: signed open pixel and click tracking links.
import { getSecret } from "./emailServer.ts";

const b64u = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => decodeURIComponent(escape(atob(String(s).replace(/-/g, "+").replace(/_/g, "/"))));

async function key() {
  const s = await getSecret("EMAIL_TRACKING_SECRET");
  if (!s) throw new Error("EMAIL_TRACKING_SECRET is not configured");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(`nl|${s}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
async function sign(k, msg) {
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const recipientId = (email) => b64u(String(email).trim().toLowerCase());
export function emailFromId(r) {
  try { return unb64u(r); } catch { return ""; }
}

export async function verify(kind, n, r, u, s) {
  if (!s || !/^[a-f0-9]{24}$/.test(s)) return false;
  const expected = await sign(await key(), `${kind}|${n}|${r}|${u || ""}`);
  let x = 0;
  for (let i = 0; i < expected.length; i++) x |= expected.charCodeAt(i) ^ s.charCodeAt(i);
  return x === 0;
}

const unescapeAttr = (v) => v.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const escapeAttr = (v) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** Adds an open pixel and wraps every http(s) link (except unsubscribe) in a signed click redirect. */
export async function instrument(html, { site, newsletterId, email }) {
  const k = await key();
  const base = `${String(site).replace(/\/$/, "")}/functions/nlTrack`;
  const n = String(newsletterId);
  const r = recipientId(email);
  const cache = new Map();
  const hrefs = [...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))];
  for (const h of hrefs) {
    const url = unescapeAttr(h);
    if (url.includes("/functions/newsletterUnsubscribe") || url.length > 1500) continue;
    const s = await sign(k, `c|${n}|${r}|${url}`);
    cache.set(h, `${base}?k=c&n=${encodeURIComponent(n)}&r=${r}&u=${encodeURIComponent(url)}&s=${s}`);
  }
  let out = html.replace(/href="(https?:\/\/[^"]+)"/g, (m, h) => (cache.has(h) ? `href="${escapeAttr(cache.get(h))}"` : m));
  const os = await sign(k, `o|${n}|${r}|`);
  const pixel = `<img src="${escapeAttr(`${base}?k=o&n=${encodeURIComponent(n)}&r=${r}&s=${os}`)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0;">`;
  out = out.includes("</body>") ? out.replace("</body>", `${pixel}</body>`) : out + pixel;
  return out;
}

export function deviceFrom(ua = "") {
  const u = ua.toLowerCase();
  if (!u) return "unknown";
  if (/ipad|tablet/.test(u)) return "tablet";
  if (/iphone|android|mobile/.test(u)) return "mobile";
  if (/windows|macintosh|linux|cros/.test(u)) return "desktop";
  return "unknown";
}
