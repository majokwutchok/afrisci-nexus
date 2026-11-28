// AfriSci Newsletter: public open pixel (k=o) and click redirect (k=c). Only signed links are counted
// and only signed destinations are redirected to, so it can be neither faked nor used as an open redirect.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.63";
import { waitUntil } from "base44:runtime";
import { verify, emailFromId, deviceFrom } from "../../shared/newsletterTrack.ts";

const PIXEL = Uint8Array.from(atob("R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="), (c) => c.charCodeAt(0));
const MAX_EVENTS_PER_READER = 25; // per issue and type, keeps the table bounded
const pixel = () => new Response(PIXEL, { headers: { "content-type": "image/gif", "cache-control": "no-store, no-cache, must-revalidate, private", pragma: "no-cache" } });

export default async function (req) {
  const url = new URL(req.url);
  const k = url.searchParams.get("k");
  const n = String(url.searchParams.get("n") || "").slice(0, 40);
  const r = String(url.searchParams.get("r") || "").slice(0, 400);
  const u = url.searchParams.get("u") || "";
  const s = url.searchParams.get("s") || "";
  const isClick = k === "c";
  let ok = false;
  try { ok = (k === "o" || isClick) && /^[A-Za-z0-9]{6,40}$/.test(n) && (await verify(isClick ? "c" : "o", n, r, isClick ? u : "", s)); } catch { ok = false; }

  if (ok) {
    const email = emailFromId(r).toLowerCase();
    const ua = req.headers.get("user-agent") || "";
    const record = async () => {
      try {
        const db = createClientFromRequest(req).asServiceRole.entities;
        const type = isClick ? "click" : "open";
        const prev = await db.NewsletterEvent.filter({ newsletter_id: n, email, type }, "-created_date", MAX_EVENTS_PER_READER);
        if ((Array.isArray(prev) ? prev : prev?.items ?? []).length >= MAX_EVENTS_PER_READER) return;
        await db.NewsletterEvent.create({ newsletter_id: n, email, type, url: isClick ? u.slice(0, 1000) : "", device: deviceFrom(ua) });
        // A click proves the email was opened even when images were blocked.
        if (isClick) {
          const opened = await db.NewsletterEvent.filter({ newsletter_id: n, email, type: "open" }, "-created_date", 1);
          if (!(Array.isArray(opened) ? opened : opened?.items ?? []).length) await db.NewsletterEvent.create({ newsletter_id: n, email, type: "open", url: "", device: deviceFrom(ua) });
        }
      } catch (e) { console.error("nlTrack", e?.message || e); }
    };
    waitUntil(record());
  }

  if (isClick) {
    let dest = "https://afriscinexus.com";
    if (ok) {
      try { const d = new URL(u); if (d.protocol === "https:" || d.protocol === "http:") dest = d.toString(); } catch { /* fall back to home */ }
    }
    return new Response(null, { status: 302, headers: { location: dest, "cache-control": "no-store" } });
  }
  return pixel();
}
