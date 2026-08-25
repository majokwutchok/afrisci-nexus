import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createJobPostCheckout } from "@/functions/createJobPostCheckout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Calendar, ExternalLink, Loader2, Search, Building2, CheckCircle } from "lucide-react";

const JOB_TYPES = [
  { value: "phd", label: "PhD Position" },
  { value: "postdoc", label: "Postdoc" },
  { value: "faculty", label: "Faculty" },
  { value: "fellowship", label: "Fellowship" },
  { value: "grant", label: "Grant" },
  { value: "staff", label: "Staff / Other" }
];
const fmtMoney = (n, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({ title: "", organization_name: "", job_type: "postdoc", field: "", country: "", location: "", application_url: "", description: "", deadline: "", posted_by_email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [j, p] = await Promise.all([
          base44.entities.JobPost.filter({ status: "active" }, "-posted_date", 100),
          base44.entities.Plan.filter({ product_type: "job_pack", is_active: true }, "sort_order", 20)
        ]);
        setJobs(j || []);
        setPlans(p || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "success") setSuccess(true);
  }, []);

  const filtered = useMemo(() => jobs.filter(j => {
    if (typeFilter !== "all" && j.job_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!j.title?.toLowerCase().includes(q) && !j.organization_name?.toLowerCase().includes(q) && !j.field?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [jobs, typeFilter, search]);

  const openPost = (p) => { setError(null); setPlan(p); setOpen(true); };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!plan) return;
    if (window.self !== window.top) { setError("Checkout works only from the published app. Please open the app in a new tab."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await createJobPostCheckout({ plan_id: plan.id, ...form });
      const data = res?.data || res;
      if (data?.url) window.location.href = data.url;
      else throw new Error("Could not start checkout.");
    } catch (err) {
      setError(err?.message || "Payment failed.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Jobs & Opportunities — AfriSci Nexus" description="PhD, postdoc, faculty positions, fellowships and grants for African researchers." canonicalPath="/Jobs" />
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Jobs & Opportunities</h1>
          <p className="text-blue-100 max-w-2xl">PhD, postdoc, faculty roles, fellowships and grants — reach 10,000+ African researchers.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg p-4">
            <CheckCircle className="w-5 h-5" /> Payment received — your job post is now live.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Search roles, organisations, fields..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => { if (plans.length) openPost(plans[0]); else setError("Job posting plans are being configured."); }}>
            <Briefcase className="w-4 h-4 mr-2" /> Post a job
          </Button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Briefcase className="w-14 h-14 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-400 text-lg">No open positions right now</p>
            <p className="text-sm text-slate-400 mt-1">Check back soon, or post a role to reach our researchers.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(job => (
              <div key={job.id} className={`bg-white rounded-xl border ${job.is_featured ? "border-teal-300 ring-1 ring-teal-200" : "border-slate-200"} p-5 flex flex-col`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {job.organization_name}</p>
                  </div>
                  {job.is_featured && <Badge className="bg-teal-100 text-teal-800">Featured</Badge>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                  <Badge variant="outline" className="capitalize">{JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type}</Badge>
                  {job.field && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.field}</span>}
                  {(job.location || job.country) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || job.country}</span>}
                  {job.deadline && <span className="flex items-center gap-1 text-red-600"><Calendar className="w-3 h-3" />{new Date(job.deadline).toLocaleDateString()}</span>}
                </div>
                {job.description && <p className="text-sm text-slate-600 line-clamp-3 mb-3 flex-1">{job.description}</p>}
                <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">Apply / View details <ExternalLink className="w-3.5 h-3.5 ml-1" /></Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-teal-600" /> Post a job</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-3">
            <div>
              <Label>Posting plan</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {plans.map(p => (
                  <button type="button" key={p.id} onClick={() => setPlan(p)} className={`text-left p-3 rounded-lg border ${plan?.id === p.id ? "border-teal-500 ring-1 ring-teal-300 bg-teal-50" : "border-slate-200"}`}>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500">{fmtMoney(p.price, p.currency)}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role title *</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tenure-track Lecturer" /></div>
              <div><Label>Organisation *</Label><Input required value={form.organization_name} onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))} placeholder="University of Lagos" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type *</Label>
                <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}>
                  {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div><Label>Field</Label><Input value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} placeholder="Public Health" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Country</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Nigeria" /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Lagos or Remote" /></div>
            </div>
            <div><Label>Application URL *</Label><Input required type="url" value={form.application_url} onChange={e => setForm(f => ({ ...f, application_url: e.target.value }))} placeholder="https://your-org.org/apply" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
              <div><Label>Your email</Label><Input type="email" value={form.posted_by_email} onChange={e => setForm(f => ({ ...f, posted_by_email: e.target.value }))} placeholder="recruiter@org.org" /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short role summary..." /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !plan} className="bg-teal-600 hover:bg-teal-700 text-white">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Pay {plan ? fmtMoney(plan.price, plan.currency) : ""} & publish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}