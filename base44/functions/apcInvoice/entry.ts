// APC invoices for the Email Center (staff only).
// Actions: create, open_for_manuscript, void.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.63";
import { currentUser } from "../../shared/authGuard.ts";
import { loadSettings } from "../../shared/emailServer.ts";
import { nextInvoiceNumber, payUrl, money, manuscriptRef } from "../../shared/apcBilling.ts";

const STAFF = ["admin", "editor"];
const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "KES", "NGN", "ZAR", "GHS", "UGX", "TZS", "RWF", "XOF", "XAF", "EGP", "ETB", "MAD"];
const json = (d, s = 200) => Response.json(d, { status: s });
const rows = (r) => (Array.isArray(r) ? r : r?.items ?? []);

function vars(inv, site) {
  const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";
  return {
    invoice_number: inv.invoice_number,
    apc_amount: money(inv.amount, inv.currency),
    payment_due_date: due,
    payment_link: payUrl(site, inv.pay_token),
    ...(inv.status === "paid" ? { amount_paid: money(inv.amount_paid || inv.amount, inv.currency) } : {}),
  };
}
const publicInvoice = (inv) => ({
  id: inv.id, invoice_number: inv.invoice_number, amount: inv.amount, currency: inv.currency, due_date: inv.due_date,
  status: inv.status, recipient_email: inv.recipient_email, paid_at: inv.paid_at, created_date: inv.created_date,
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await currentUser(base44);
    if (!user) return json({ error: "Please sign in" }, 401);
    if (!STAFF.includes(String(user.role || "").toLowerCase())) return json({ error: "Only editorial staff can manage invoices" }, 403);
    const p = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;
    const { settings } = await loadSettings(base44);
    const site = String(settings.website_url || "https://afriscinexus.com").replace(/\/$/, "");

    if (p.action === "open_for_manuscript") {
      if (!p.manuscript_id) return json({ error: "manuscript_id is required" }, 400);
      const list = rows(await db.ApcInvoice.filter({ manuscript_id: p.manuscript_id }, "-created_date", 20));
      return json({
        ok: true,
        invoices: list.map((i) => ({ ...publicInvoice(i), vars: vars(i, site) })),
      });
    }

    if (p.action === "create") {
      const amount = Number(p.amount);
      const currency = String(p.currency || "USD").toUpperCase();
      if (!p.manuscript_id) return json({ error: "Link a manuscript first" }, 400);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return json({ error: "Enter an amount greater than zero" }, 400);
      if (!CURRENCIES.includes(currency)) return json({ error: "Unsupported currency" }, 400);
      const m = await db.Manuscript.get(p.manuscript_id).catch(() => null);
      if (!m) return json({ error: "Manuscript not found" }, 404);
      let journalTitle = "";
      if (m.journal_id) journalTitle = (await db.Journal.get(m.journal_id).catch(() => null))?.title || "";
      const author = (m.authors || []).find((a) => a?.is_corresponding && a?.email) || (m.authors || []).find((a) => a?.email) || {};
      const email = String(p.recipient_email || author.email || "").trim().toLowerCase();
      const due = /^\d{4}-\d{2}-\d{2}$/.test(String(p.due_date || "")) ? p.due_date : new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
      const inv = await db.ApcInvoice.create({
        invoice_number: await nextInvoiceNumber(db),
        manuscript_id: m.id, manuscript_ref: manuscriptRef(m.id), manuscript_title: String(m.title || "").slice(0, 500),
        journal_id: m.journal_id || "", journal_title: journalTitle,
        recipient_name: String(p.recipient_name || author.name || "").slice(0, 200), recipient_email: email,
        amount: Math.round(amount * 100) / 100, currency, due_date: due, status: "unpaid",
        pay_token: `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, ""),
        notes: `Created by ${user.email}`,
      });
      return json({ ok: true, invoice: publicInvoice(inv), vars: vars(inv, site) });
    }

    if (p.action === "void") {
      const inv = await db.ApcInvoice.get(p.invoice_id).catch(() => null);
      if (!inv) return json({ error: "Invoice not found" }, 404);
      if (inv.status === "paid") return json({ error: "A paid invoice cannot be voided" }, 409);
      await db.ApcInvoice.update(inv.id, { status: p.waived ? "waived" : "void" });
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("apcInvoice", e);
    return json({ error: e?.message || "Unexpected error" }, 500);
  }
}
