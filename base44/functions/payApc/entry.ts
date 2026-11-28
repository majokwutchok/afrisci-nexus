// Public APC payment link: /functions/payApc?t=<token>
// Clicking the link in the email goes straight to a fresh Stripe Checkout for the invoiced amount.
// The long random token is the only credential; the amount always comes from the stored invoice.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.63";
import { createCheckout, money } from "../../shared/apcBilling.ts";
import { BRAND, esc } from "../../shared/newsletterRender.ts";

const SITE = "https://afriscinexus.com";

function page(title, html, status = 200) {
  const F = BRAND.font;
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)} · AfriSci Nexus</title></head>
<body style="margin:0;background:${BRAND.page};font-family:${F};">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.08);">
  <div style="background:${BRAND.brand};padding:24px 32px;"><div style="font-size:22px;font-weight:700;color:#fff;">✦&nbsp;AfriSci<span style="color:${BRAND.accent};">Nexus</span></div>
  <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${BRAND.sky};margin-top:4px;">Article processing charge</div></div>
  <div style="height:4px;background:${BRAND.accent};"></div>
  <div style="padding:30px 32px;color:${BRAND.text};font-size:15px;line-height:1.65;">
    <h1 style="font-size:22px;color:${BRAND.ink};margin:0 0 12px;">${esc(title)}</h1>${html}
    <p style="margin:24px 0 0;font-size:13px;color:${BRAND.muted};">Questions about this invoice? Reply to the email you received, or <a href="${SITE}/Contact" style="color:${BRAND.brand};">contact the editorial office</a>.</p>
  </div></div></body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

function details(inv) {
  return `<div style="margin:16px 0;padding:14px 16px;background:${BRAND.panel};border:1px solid ${BRAND.line};border-left:4px solid ${BRAND.accent};border-radius:8px;font-size:14px;">
    <div><strong>Invoice:</strong> ${esc(inv.invoice_number)}</div>
    <div><strong>Manuscript:</strong> ${esc(inv.manuscript_title || "")} (${esc(inv.manuscript_ref || "")})</div>
    <div><strong>Amount:</strong> ${esc(money(inv.amount, inv.currency))}</div></div>`;
}

const button = (href, label) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${BRAND.brand};color:#fff;text-decoration:none;border-radius:8px;padding:12px 26px;font-weight:600;">${esc(label)}</a>`;

export default async function (req) {
  try {
    const url = new URL(req.url);
    const token = String(url.searchParams.get("t") || "");
    if (!/^[a-f0-9]{48,80}$/.test(token)) return page("Payment link not valid", "<p>This payment link is incomplete. Please use the button in your invoice email, or reply to it and we will send a new link.</p>", 400);

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const found = await db.ApcInvoice.filter({ pay_token: token }, "-created_date", 1);
    const inv = (Array.isArray(found) ? found : found?.items ?? [])[0];
    if (!inv || inv.pay_token !== token) return page("Payment link not valid", "<p>We could not find this invoice. Please reply to your invoice email and we will help straight away.</p>", 404);

    const self = `${SITE}/functions/payApc?t=${token}`;
    if (inv.status === "paid") return page("This invoice is paid", `<p>Thank you. Payment for this invoice has been received${inv.paid_at ? ` on ${esc(new Date(inv.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }))}` : ""}.</p>${details(inv)}`);
    if (inv.status === "void" || inv.status === "waived") return page(inv.status === "waived" ? "This charge has been waived" : "This invoice has been cancelled", `<p>${inv.status === "waived" ? "No payment is needed for this invoice." : "This invoice is no longer payable. If you received a newer invoice, please use the link in that email."}</p>${details(inv)}`);
    if (url.searchParams.get("paid")) return page("Thank you for your payment", `<p>Your payment is being confirmed by Stripe. You will receive a receipt by email, and your manuscript will move on to production.</p>${details(inv)}`);
    if (url.searchParams.get("cancelled")) return page("Payment not completed", `<p>No payment was taken. You can return to the secure payment page whenever you are ready.</p>${details(inv)}${button(self, `Pay ${money(inv.amount, inv.currency)} securely`)}`);

    const session = await createCheckout(inv, SITE);
    return new Response(null, { status: 303, headers: { location: session.url, "cache-control": "no-store" } });
  } catch (e) {
    console.error("payApc", e);
    return page("Payment page unavailable", "<p>We could not open the secure payment page just now. Please try again in a few minutes, or reply to your invoice email for another way to pay.</p>", 502);
  }
}
