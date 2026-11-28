import React, { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Link as LinkIcon, Copy, RefreshCw, Ban } from "lucide-react";
import { Button, inputClass } from "./ui";
import { invoke } from "./api";

export const APC_TEMPLATES = ["apc_invoice", "apc_reminder", "payment_received"];
const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "KES", "NGN", "ZAR", "GHS", "UGX", "TZS", "RWF", "XOF", "XAF", "EGP", "ETB", "MAD"];
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const fmt = (i) => `${i.currency} ${Number(i.amount).toLocaleString("en-US")}`;
const STATUS = { unpaid: "bg-amber-100 text-amber-800", paid: "bg-emerald-100 text-emerald-800", void: "bg-slate-200 text-slate-600", waived: "bg-sky-100 text-sky-800" };

/**
 * Stripe payment link for the APC templates. Creates (or reuses) an APC invoice for the linked
 * manuscript and fills invoice_number, apc_amount, payment_due_date and payment_link, so the
 * template's "Pay securely" button takes the author straight to Stripe Checkout.
 */
export default function ApcPaymentPanel({ templateKey, manuscriptId, recipient, onFill }) {
  const [invoices, setInvoices] = useState(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [due, setDue] = useState(inDays(14));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [usedId, setUsedId] = useState("");
  const isReceipt = templateKey === "payment_received";

  const load = async () => {
    if (!manuscriptId) return setInvoices(null);
    setError("");
    try { const r = await invoke("apcInvoice", { action: "open_for_manuscript", manuscript_id: manuscriptId }); setInvoices(r.invoices || []); }
    catch (e) { setError(e.message || "Could not load invoices"); setInvoices([]); }
  };
  useEffect(() => { setUsedId(""); load(); }, [manuscriptId]);

  // Reminders and receipts: automatically use the latest relevant invoice.
  useEffect(() => {
    if (!invoices || usedId) return;
    const pick = isReceipt ? invoices.find((i) => i.status === "paid") : invoices.find((i) => i.status === "unpaid");
    if (pick && (templateKey !== "apc_invoice")) use(pick);
  }, [invoices, templateKey]);

  function use(inv) {
    setUsedId(inv.id);
    onFill(inv.vars);
  }

  async function createLink() {
    setBusy(true); setError("");
    try {
      const r = await invoke("apcInvoice", { action: "create", manuscript_id: manuscriptId, amount: Number(amount), currency, due_date: due, recipient_email: recipient?.email || "", recipient_name: recipient?.name || "" });
      setInvoices((cur) => [{ ...r.invoice, vars: r.vars }, ...(cur || [])]);
      use({ ...r.invoice, vars: r.vars });
    } catch (e) { setError(e.message || "Could not create the payment link"); }
    setBusy(false);
  }

  async function voidInvoice(inv) {
    if (!window.confirm(`Cancel invoice ${inv.invoice_number}? Its payment link will stop working.`)) return;
    try { await invoke("apcInvoice", { action: "void", invoice_id: inv.id }); if (usedId === inv.id) setUsedId(""); load(); }
    catch (e) { setError(e.message); }
  }

  const unpaid = (invoices || []).filter((i) => i.status === "unpaid");
  const used = (invoices || []).find((i) => i.id === usedId);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-blue-900"><CreditCard className="h-4 w-4" />{isReceipt ? "Stripe payment" : "Stripe payment link"}</div>
        {manuscriptId && <button type="button" onClick={load} className="text-slate-500 hover:text-blue-800" title="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button>}
      </div>

      {!manuscriptId ? (
        <p className="text-slate-600">Link the manuscript above first. A secure Stripe payment link is then created for this invoice and the <strong>Pay securely</strong> button in the email takes the author straight to card payment.</p>
      ) : invoices === null ? (
        <p className="text-slate-500">Loading invoices…</p>
      ) : (
        <div className="space-y-3">
          {used && (
            <div className="flex items-start gap-2 rounded-md bg-white px-3 py-2 ring-1 ring-emerald-200">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <div className="text-slate-800">Using <strong>{used.invoice_number}</strong> · {fmt(used)} · <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${STATUS[used.status]}`}>{used.status}</span></div>
                <div className="truncate text-xs text-slate-500">{used.vars?.payment_link}</div>
              </div>
              <button type="button" title="Copy payment link" onClick={() => navigator.clipboard?.writeText(used.vars?.payment_link || "")} className="text-slate-500 hover:text-blue-800"><Copy className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {(invoices || []).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500">Invoices for this manuscript</div>
              {invoices.map((i) => (
                <div key={i.id} className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 ring-1 ring-slate-200">
                  <span className="font-medium text-slate-800">{i.invoice_number}</span>
                  <span className="text-slate-500">{fmt(i)}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${STATUS[i.status]}`}>{i.status}</span>
                  <span className="flex-1" />
                  {i.id !== usedId && i.status !== "void" && <Button size="sm" variant="ghost" icon={LinkIcon} onClick={() => use(i)}>Use</Button>}
                  {i.status === "unpaid" && <button type="button" title="Cancel invoice" onClick={() => voidInvoice(i)} className="p-1 text-slate-400 hover:text-red-600"><Ban className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
            </div>
          )}

          {!isReceipt && (templateKey === "apc_invoice" || unpaid.length === 0) && (
            <div className="rounded-md bg-white p-2.5 ring-1 ring-slate-200">
              <div className="mb-2 text-xs font-semibold text-slate-600">{unpaid.length ? "Create another invoice" : "Create invoice and payment link"}</div>
              <div className="grid gap-2 sm:grid-cols-[1fr_100px_150px_auto]">
                <input className={inputClass} type="number" min="1" step="0.01" placeholder="Amount, e.g. 250" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
                <input className={inputClass} type="date" value={due} onChange={(e) => setDue(e.target.value)} title="Due date" />
                <Button icon={CreditCard} loading={busy} disabled={!amount || Number(amount) <= 0} onClick={createLink}>Create link</Button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">Fills the invoice number, amount, due date and payment link. The author pays by card through Stripe and the invoice is marked paid automatically.</p>
            </div>
          )}
          {isReceipt && !(invoices || []).some((i) => i.status === "paid") && <p className="text-slate-500">No paid invoice yet for this manuscript.</p>}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
