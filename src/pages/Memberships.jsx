import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createSubscriptionOrder } from "@/functions/createSubscriptionOrder";
import { createPageUrl } from "@/utils";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Building2, Users, Sparkles, ArrowRight, Loader2, Star } from "lucide-react";

const fmtMoney = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n || 0);

export default function Memberships() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({ institution_name: "", country: "", contact_email: "", email_domains: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Plan.filter({ product_type: "membership", is_active: true }, "sort_order", 50);
        setPlans(data || []);
      } catch (e) {
        console.error(e);
      }
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u?.email) setForm(f => ({ ...f, contact_email: u.email }));
      } catch { setUser(null); }
      setLoading(false);
    })();
  }, []);

  const openSubscribe = (plan) => {
    setError(null);
    setSelectedPlan(plan);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createSubscriptionOrder({
        plan_id: selectedPlan.id,
        institution_name: form.institution_name,
        country: form.country,
        contact_email: form.contact_email,
        email_domains: form.email_domains,
        notes: ""
      });
      const data = res?.data || res;
      setResult({ subscription_id: data.subscription_id, plan: selectedPlan });
      setSelectedPlan(null);
    } catch (err) {
      setError(err?.message || "Failed to submit order. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100">
      <SEO title="Institutional Memberships — AfriSci Nexus" description="Annual institutional memberships giving your researchers waived publishing, expedited review, and global discoverability." />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-10">
          <Badge className="bg-teal-100 text-teal-800 mb-3">Institutional Memberships</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Publish more. Pay less per researcher.</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            An annual membership converts thousands of individual authors who can't pay into one institutional subscription that can. Your affiliated researchers get waived publishing and expedited review.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
          </div>
        ) : plans.length === 0 ? (
          <Card className="max-w-md mx-auto text-center p-8">
            <CardContent className="pt-6">
              <p className="text-slate-600">Membership plans are being configured. Please check back shortly.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => {
              const popular = idx === 1;
              return (
                <Card key={plan.id} className={`relative flex flex-col ${popular ? "border-teal-400 ring-2 ring-teal-400 shadow-xl" : "shadow-md"}`}>
                  {plan.tier && (
                    <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${popular ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                      {plan.tier}
                    </Badge>
                  )}
                  <CardHeader className="text-center pt-6">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-slate-900">{fmtMoney(plan.price, plan.currency)}</span>
                      <span className="text-slate-500 text-sm">/{plan.billing_interval === "annual" ? "year" : plan.billing_interval}</span>
                    </div>
                    {plan.seats > 0 && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" /> {plan.seats} author slots
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 mb-6 flex-1">
                      {(plan.features || []).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${popular ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}`}
                      variant={popular ? "default" : "outline"}
                      onClick={() => openSubscribe(plan)}
                    >
                      <Building2 className="w-4 h-4 mr-2" /> Subscribe
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Users, title: "Waived publishing", body: "Affiliated authors publish free — matched automatically by institutional email domain." },
            { icon: Sparkles, title: "Expedited review", body: "Higher tiers get 10–14 day decision targets and a dedicated editorial liaison." },
            { icon: Star, title: "Global discoverability", body: "Every article indexed by Google Scholar, BASE, OpenAIRE and CORE." }
          ].map((b, i) => (
            <Card key={i} className="p-5 shadow-sm">
              <b.icon className="w-6 h-6 text-teal-600 mb-2" />
              <h3 className="font-semibold text-slate-900">{b.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{b.body}</p>
            </Card>
          ))}
        </div>

        {result && (
          <Dialog open onOpenChange={() => setResult(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal-600" /> Order received</DialogTitle>
              </DialogHeader>
              <p className="text-slate-700">
                Your <strong>{result.plan.name}</strong> membership application for <strong>{form.institution_name}</strong> has been recorded. Our partnerships team will issue an invoice and activate your subscription once payment is received.
              </p>
              <p className="text-sm text-slate-500">Affiliated researchers using your institutional email domain will automatically receive waived publishing once the subscription is active.</p>
              <DialogFooter>
                <Link to={createPageUrl("InstitutionDashboard")}>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">View membership <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-teal-600" /> Subscribe — {selectedPlan?.name}</DialogTitle>
            </DialogHeader>
            {user ? (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <Label htmlFor="institution_name">Institution name *</Label>
                  <Input id="institution_name" required value={form.institution_name} onChange={e => setForm(f => ({ ...f, institution_name: e.target.value }))} placeholder="e.g. University of Lagos" />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. Nigeria" />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact email</Label>
                  <Input id="contact_email" type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="email_domains">Affiliated email domains (comma-separated)</Label>
                  <Input id="email_domains" value={form.email_domains} onChange={e => setForm(f => ({ ...f, email_domains: e.target.value }))} placeholder="univ.edu.ng, alumni.univ.edu.ng" />
                  <p className="text-xs text-slate-500 mt-1">Your own email domain is included automatically. Researchers at these domains get waived publishing.</p>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedPlan(null)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Submit order
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-600 mb-4">Please sign in to subscribe your institution.</p>
                <Button onClick={() => base44.auth.redirectToLogin(createPageUrl("Memberships"))}>Sign in</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}