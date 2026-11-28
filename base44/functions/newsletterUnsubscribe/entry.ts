// AfriSci Newsletter: public unsubscribe page (signed links only).
// GET shows a confirmation page (link scanners never unsubscribe anyone by prefetching);
// POST performs the unsubscribe and also serves RFC 8058 one-click requests from mail apps.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.63";
import { verifyUnsubscribe } from "../../shared/newsletterSend.ts";
import { find } from "../../shared/newsletterContent.ts";
import { BRAND, esc, NEWSLETTER_NAME } from "../../shared/newsletterRender.ts";

function page(title, message, form = "") {
  const F = BRAND.font;
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)} · ${esc(NEWSLETTER_NAME)}</title></head>
<body style="margin:0;background:${BRAND.page};font-family:${F};">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);">
  <div style="background:${BRAND.brand};padding:24px 32px;"><div style="font-size:22px;font-weight:700;color:#fff;">✦&nbsp;AfriSci<span style="color:${BRAND.accent};">Nexus</span></div>
  <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.sky};margin-top:4px;">${esc(NEWSLETTER_NAME)}</div></div>
  <div style="height:4px;background:${BRAND.accent};"></div>
  <div style="padding:30px 32px;color:${BRAND.text};font-size:15px;line-height:1.65;">
    <h1 style="font-size:22px;color:${BRAND.ink};margin:0 0 12px;">${esc(title)}</h1>
    <p style="margin:0 0 18px;">${message}</p>${form}
    <p style="margin:24px 0 0;font-size:13px;color:${BRAND.muted};"><a href="${BRAND.site}" style="color:${BRAND.brand};text-decoration:none;">Return to AfriSci Nexus</a></p>
  </div></div></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export default async function (req) {
  try {
    const url = new URL(req.url);
    let e = url.searchParams.get("e") || "";
    let s = url.searchParams.get("s") || "";
    let n = url.searchParams.get("n") || "";
    if (req.method === "POST") {
      const form = await req.formData().catch(() => null);
      if (form) {
        e = String(form.get("e") || e);
        s = String(form.get("s") || s);
        n = String(form.get("n") || n);
      }
    }
    const email = String(e).trim().toLowerCase().slice(0, 254);
    if (!(await verifyUnsubscribe(email, s))) {
      return page("Link not valid", "This unsubscribe link is incomplete or has expired. Please use the link in your latest AfriSci Newsletter, or reply to the email and we will remove you.");
    }

    if (req.method !== "POST") {
      const form = `<form method="POST" style="margin:0;"><input type="hidden" name="e" value="${esc(email)}"><input type="hidden" name="s" value="${esc(s)}"><input type="hidden" name="n" value="${esc(n)}">
        <button type="submit" style="background:${BRAND.brand};color:#fff;border:0;border-radius:8px;padding:12px 26px;font-size:15px;font-weight:600;cursor:pointer;">Unsubscribe ${esc(email)}</button></form>`;
      return page(`Unsubscribe from ${NEWSLETTER_NAME}?`, `You will stop receiving ${esc(NEWSLETTER_NAME)} at <strong>${esc(email)}</strong>. Emails about your own submissions and reviews are not affected.`, form);
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const existing = await find(db.NewsletterSuppression, { email }, { limit: 1, fields: ["id"] });
    if (!existing.length) {
      await db.NewsletterSuppression.create({ email, reason: "unsubscribed", newsletter_id: n.slice(0, 40) });
    }
    await db.NewsletterSubscriber.updateMany({ email }, { $set: { is_active: false } }).catch(() => {});
    return page("You have been unsubscribed", `<strong>${esc(email)}</strong> will no longer receive ${esc(NEWSLETTER_NAME)}. If this was a mistake, simply subscribe again on our website.`);
  } catch (err) {
    console.error("newsletterUnsubscribe", err);
    return page("Something went wrong", "We could not process your request just now. Please reply to the newsletter email and we will remove you straight away.");
  }
}
