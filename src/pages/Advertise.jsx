import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createAdCheckout } from "@/functions/createAdCheckout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Loader2, CheckCircle } from "lucide-react";

const fmtMoney = (n, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);

export default function Advertise() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({ slot: "news_banner", sponsor_name: "", creative_url: "", link_url: "", start_date: "", end_date: "", booked_by_email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    base44.entities.Plan.filter({ product_type: "ad_placement", is_active: true }, "sort_order", 20)
      .then(setPlans).catch(() => setPlans([])).finally(() => setLoading(false));
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "success") setSuccess(true);
  }, []);

  const openBook = (p) => {
    setError(null); setPlan(p);
    setForm(f => ({ ...f, slot: (p.name || "").toLowerCase().includes("newsletter") ? "newsletter_banner" : "news_banner" }));
    setOpen(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!plan) return;
    if (window.self !== window.top) { setError("Checkout works only from the published app. Please open the app in a new tab."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await createAdCheckout({ plan_id: plan.id, ...form });
      const data = res?.data || res;
      if (data?.url) window.location.href = data.url;
      else throw new Error("Could not start checkout.");
    } catch (err) { setError(err?.message || "Payment failed."); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Advertise with AfriSci Nexus" description="Sponsored placements on Research News and the AfriSci Nexus newsletter to reach African researchers." canonicalPath="/Advertise" />
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Advertise with AfriSci Nexus</h1>
          <p className="text-blue-100 max-w-2xl">Reach African researchers through clearly-labelled sponsored placements on Research News and our newsletter.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg p-4">
            <CheckCircle className="w-5 h-5" /> Payment received — your placement will go live on its start date.
          </div>
        )}
        <p className="text-slate-600 mb-8 max-w-2xl">Lab-equipment vendors, reagent suppliers, publishers and conference organisers can sponsor placements alongside our Research News. All placements are clearly labelled <strong>"Sponsored"</strong> and kept off editorial and peer-review pages.</p>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">{[0, 1].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Megaphone className="w-14 h-14 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-400 text-lg">Advertising slots are being configured</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                <h3 className="font-bold text-slate-900">{p.name}</h3>
                <p className="text-3xl font-bold text-slate-900 my-2">{fmtMoney(p.price, p.currency)}</p>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {(p.features || []).map((f, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />{f}</li>)}
                </ul>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openBook(p)}>Book this slot</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-teal-600" /> Book — {plan?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-3">
            <div><Label>Sponsor / organisation name *</Label><Input required value={form.sponsor_name} onChange={e => setForm(f => ({ ...f, sponsor_name: e.target.value }))} placeholder="Acme Lab Supplies" /></div>
            <div><Label>Banner image URL</Label><Input type="url" value={form.creative_url} onChange={e => setForm(f => ({ ...f, creative_url: e.target.value }))} placeholder="https://yoursite.com/banner.jpg" /><p className="text-xs text-slate-500 mt-1">Direct image URL (1200×300 recommended). Leave blank for a text-only placement.</p></div>
            <div><Label>Click-through URL *</Label><Input required type="url" value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://yoursite.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>End date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div><Label>Your email</Label><Input type="email" value={form.booked_by_email} onChange={e => setForm(f => ({ ...f, booked_by_email: e.target.value }))} placeholder="marketing@yoursite.com" /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything we should know" /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Pay {plan ? fmtMoney(plan.price, plan.currency) : ""} & book
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}