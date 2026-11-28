// @ts-nocheck
// Article processing charge (APC) invoices paid through Stripe Checkout.
import { secrets } from "base44:runtime";

const rows = (r) => (Array.isArray(r) ? r : r?.items ?? []);
export const ZERO_DECIMAL = ["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"];
export const minorUnits = (amount, currency) =>
  ZERO_DECIMAL.includes(String(currency).toLowerCase()) ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

export function money(amount, currency = "USD") {
  const n = Number(amount || 0);
  return `${String(currency).toUpperCase()} ${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function manuscriptRef(id) {
  return `AFS${String(id || "").slice(-8).toUpperCase()}`;
}

export function payUrl(site, token) {
  return `${String(site).replace(/\/$/, "")}/functions/payApc?t=${encodeURIComponent(token)}`;
}

export async function nextInvoiceNumber(db) {
  const year = new Date().getUTCFullYear();
  const last = rows(await db.ApcInvoice.filter({ invoice_number: { $regex: `^INV${year}` } }, "-invoice_number", 1))[0];
  const n = last ? parseInt(String(last.invoice_number).slice(7), 10) || 0 : 0;
  return `INV${year}${String(n + 1).padStart(4, "0")}`;
}

/** Fresh Stripe Checkout session for an invoice; amount and currency always come from the stored invoice. */
export async function createCheckout(inv, site) {
  const key = secrets.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe is not configured yet");
  const base = payUrl(site, inv.pay_token);
  const p = new URLSearchParams();
  p.append("mode", "payment");
  if (inv.recipient_email) p.append("customer_email", inv.recipient_email);
  p.append("line_items[0][quantity]", "1");
  p.append("line_items[0][price_data][currency]", String(inv.currency || "USD").toLowerCase());
  p.append("line_items[0][price_data][unit_amount]", String(minorUnits(inv.amount, inv.currency || "USD")));
  p.append("line_items[0][price_data][product_data][name]", `Article processing charge · ${inv.invoice_number}`);
  p.append("line_items[0][price_data][product_data][description]", `${inv.manuscript_ref || ""} ${inv.manuscript_title || ""}`.trim().slice(0, 300) || "AfriSci Nexus open access publication");
  p.append("success_url", `${base}&paid=1`);
  p.append("cancel_url", `${base}&cancelled=1`);
  p.append("client_reference_id", inv.id);
  p.append("payment_intent_data[description]", `AfriSci Nexus APC ${inv.invoice_number}`);
  p.append("expires_at", String(Math.floor(Date.now() / 1000) + 60 * 60 * 2)); // 2 hours; the email link creates a new one each time
  const md = { product_type: "apc_invoice", record_id: inv.id, invoice_number: inv.invoice_number, manuscript_id: inv.manuscript_id || "", base44_app_id: Deno.env.get("BASE44_APP_ID") || "" };
  for (const [k, v] of Object.entries(md)) {
    p.append(`metadata[${k}]`, String(v));
    p.append(`payment_intent_data[metadata][${k}]`, String(v));
  }
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2025-10-29.clover", "Idempotency-Key": crypto.randomUUID() },
    body: p.toString(),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || "Stripe error");
  return data;
}

/** Called from the verified Stripe webhook. Idempotent; checks the amount actually paid. */
export async function fulfillApcInvoice(base44, invoiceId, session) {
  const db = base44.asServiceRole.entities;
  const inv = await db.ApcInvoice.get(invoiceId).catch(() => null);
  if (!inv) return { skipped: "invoice not found" };
  if (inv.status === "paid") return { skipped: "already paid" };
  if (session?.payment_status !== "paid") return { skipped: "not paid" };
  const expected = minorUnits(inv.amount, inv.currency || "USD");
  const currencyOk = String(session.currency || "").toLowerCase() === String(inv.currency || "USD").toLowerCase();
  if (!currencyOk || Number(session.amount_total) < expected) {
    await db.ApcInvoice.update(inv.id, { notes: `${inv.notes || ""}\nStripe session ${session.id} paid ${session.amount_total} ${session.currency}, expected ${expected} ${inv.currency}. Check manually.`.trim() });
    return { skipped: "amount mismatch" };
  }
  const paidMajor = ZERO_DECIMAL.includes(String(session.currency).toLowerCase()) ? Number(session.amount_total) : Number(session.amount_total) / 100;
  const now = new Date().toISOString();
  let paymentId = "";
  try {
    const pay = await db.Payment.create({
      manuscript_id: inv.manuscript_id, journal_id: inv.journal_id || "", payment_type: "publication_fee",
      amount: paidMajor, currency: String(inv.currency || "USD").toUpperCase(), payment_method: "credit_card",
      transaction_id: String(session.payment_intent || session.id), status: "completed", payment_date: now.slice(0, 10),
      description: `APC ${inv.invoice_number} paid by card through Stripe`,
    });
    paymentId = pay?.id || "";
  } catch (e) { console.error("APC payment record failed", e?.message || e); }
  await db.ApcInvoice.update(inv.id, {
    status: "paid", paid_at: now, amount_paid: paidMajor, stripe_session_id: session.id,
    stripe_payment_intent: String(session.payment_intent || ""), payment_id: paymentId,
  });
  try {
    const m = await db.Manuscript.get(inv.manuscript_id);
    if (m) {
      await db.Manuscript.update(m.id, {
        timeline: [...(m.timeline || []), { status: m.status, date: now.slice(0, 10), actor: "system", comment: `Article processing charge paid online (${money(paidMajor, inv.currency)}, invoice ${inv.invoice_number}).` }],
      });
    }
  } catch (e) { console.error("APC timeline update failed", e?.message || e); }
  return { ok: true };
}
