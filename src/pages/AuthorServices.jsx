import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createServiceOrder } from "@/functions/createServiceOrder";
import { createPageUrl } from "@/utils";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Sparkles, ShieldCheck, Loader2, Wrench } from "lucide-react";

const fmtMoney = (n, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  canceled: "bg-red-100 text-red-700"
};

export default function AuthorServices() {
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [manuscriptId, setManuscriptId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const load = async (u) => {
    try {
      const data = await base44.entities.Plan.filter({ product_type: "service", is_active: true }, "sort_order", 50);
      setPlans(data || []);
    } catch (e) { console.error(e); }
    if (u) {
      try {
        const [ms, ords] = await Promise.all([
          base44.entities.Manuscript.filter({}, "-created_date", 50),
          base44.entities.ServiceOrder.filter({}, "-created_date", 50)
        ]);
        setManuscripts(ms || []);
        setOrders(ords || []);
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      let u = null;
      try { u = await base44.auth.me(); setUser(u); } catch { setUser(null); }
      await load(u);
    })();
  }, []);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true); setError(null);
    try {
      const res = await createServiceOrder({ plan_id: selected.id, manuscript_id: manuscriptId });
      const data = res?.data || res;
      setResult({ service: selected.name });
      setSelected(null);
      load(user);
    } catch (err) {
      setError(err?.message || "Failed to place order.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
      <SEO title="Author Services — AfriSci Nexus" description="Optional editorial-neutral add-ons: language editing, translation, statistical review, formatting, and plagiarism checks." />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8">
          <Badge className="bg-indigo-100 text-indigo-800 mb-3">Author Services</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Optional add-ons for your manuscript</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Editorial-neutral services to improve your submission. <strong>Buying a service never influences acceptance</strong> — services and peer review are kept strictly separate.
          </p>
        </div>

        <Card className="mb-8 bg-amber-50 border-amber-200">
          <CardContent className="pt-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">These services are optional and entirely separate from editorial decisions. Editors and reviewers never see whether a service was purchased.</p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : plans.length === 0 ? (
          <Card className="max-w-md mx-auto text-center p-8"><CardContent className="pt-6"><p className="text-slate-600">Services are being configured. Please check back shortly.</p></CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <Card key={plan.id} className="flex flex-col shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-500" /> {plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-2xl font-bold text-slate-900 mb-2">{fmtMoney(plan.price, plan.currency)}</p>
                  <p className="text-sm text-slate-600 flex-1">{plan.description || (plan.features?.[0])}</p>
                  <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setError(null); setSelected(plan); }}>
                    Order service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Your service orders</h2>
            <div className="space-y-2">
              {orders.map(o => (
                <Card key={o.id} className="p-4 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-900">{o.service_name}</p>
                    <p className="text-xs text-slate-500">{o.manuscript_title || "No manuscript linked"}</p>
                  </div>
                  <Badge className={STATUS_STYLE[o.status] || "bg-slate-100"}>{o.status}</Badge>
                </Card>
              ))}
            </div>
          </div>
        )}

        {result && (
          <Dialog open onOpenChange={() => setResult(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Order placed</DialogTitle></DialogHeader>
              <p className="text-slate-700">Your <strong>{result.service}</strong> order has been received. Our team will confirm next steps by email.</p>
              <DialogFooter><Button onClick={() => setResult(null)}>Close</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Order — {selected?.name}</DialogTitle></DialogHeader>
            {user ? (
              <form onSubmit={handleOrder} className="space-y-4">
                <div>
                  <Label htmlFor="ms">Link to manuscript (optional)</Label>
                  <select id="ms" value={manuscriptId} onChange={e => setManuscriptId(e.target.value)}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">— No manuscript —</option>
                    {manuscripts.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Place order
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-600 mb-4">Please sign in to order a service.</p>
                <Button onClick={() => base44.auth.redirectToLogin(createPageUrl("AuthorServices"))}>Sign in</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}