import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { grantWaiverFromPool } from "@/functions/grantWaiverFromPool";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Loader2, Gift, PlusCircle, RefreshCw } from "lucide-react";

const STATUS_STYLE = {
  active: "bg-emerald-100 text-emerald-700",
  exhausted: "bg-slate-200 text-slate-600",
  closed: "bg-red-100 text-red-700"
};

export default function WaiverPools() {
  const [user, setUser] = useState(null);
  const [pools, setPools] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ funder_name: "", name: "", total_slots: "", price_per_slot: "", currency: "USD", eligibility_countries: "", eligibility_keywords: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [grantPoolId, setGrantPoolId] = useState("");
  const [grantMsId, setGrantMsId] = useState("");
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [p, ms] = await Promise.all([
        base44.entities.WaiverPool.list("-created_date", 100),
        base44.entities.Manuscript.list("-created_date", 100)
      ]);
      setPools(p || []);
      setManuscripts(ms || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u?.role === "admin") await load();
        else setLoading(false);
      } catch { setLoading(false); }
    })();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setError(null);
    try {
      await base44.entities.WaiverPool.create({
        funder_name: form.funder_name,
        name: form.name || `${form.funder_name} pool`,
        total_slots: Number(form.total_slots) || 0,
        slots_used: 0,
        price_per_slot: Number(form.price_per_slot) || 0,
        currency: form.currency || "USD",
        eligibility_countries: form.eligibility_countries.split(",").map(s => s.trim()).filter(Boolean),
        eligibility_keywords: form.eligibility_keywords.split(",").map(s => s.trim()).filter(Boolean),
        description: form.description,
        status: "active"
      });
      setForm({ funder_name: "", name: "", total_slots: "", price_per_slot: "", currency: "USD", eligibility_countries: "", eligibility_keywords: "", description: "" });
      setShowForm(false);
      await load();
    } catch (err) { setError(err?.message || "Failed to create pool."); }
    setCreating(false);
  };

  const handleGrant = async () => {
    if (!grantPoolId || !grantMsId) return;
    setGranting(true); setError(null);
    try {
      await grantWaiverFromPool({ pool_id: grantPoolId, manuscript_id: grantMsId });
      setGrantPoolId(""); setGrantMsId("");
      await load();
    } catch (err) { setError(err?.message || "Failed to grant waiver."); }
    setGranting(false);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10"><Skeleton className="h-10 w-64 mb-6" /><Skeleton className="h-96 rounded-2xl" /></div>;

  if (!user || user.role !== "admin") {
    return <div className="max-w-md mx-auto py-20 text-center px-4"><ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" /><p className="text-slate-600">Admin access required.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SEO title="Waiver Pools — AfriSci Nexus" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Gift className="w-6 h-6 text-teal-600" /> Funder Waiver Pools</h1>
            <p className="text-slate-600 text-sm">Prepaid publishing slots funded by grant-makers.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setShowForm(s => !s)}><PlusCircle className="w-4 h-4 mr-1" /> New pool</Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 shadow-sm">
            <CardHeader><CardTitle className="text-base">Create waiver pool</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
                <div><Label>Funder name *</Label><Input required value={form.funder_name} onChange={e => setForm(f => ({ ...f, funder_name: e.target.value }))} /></div>
                <div><Label>Pool name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wellcome OA 2026" /></div>
                <div><Label>Total slots *</Label><Input required type="number" value={form.total_slots} onChange={e => setForm(f => ({ ...f, total_slots: e.target.value }))} /></div>
                <div><Label>Price per slot ({form.currency})</Label><Input type="number" value={form.price_per_slot} onChange={e => setForm(f => ({ ...f, price_per_slot: e.target.value }))} /></div>
                <div><Label>Eligible countries (comma-separated)</Label><Input value={form.eligibility_countries} onChange={e => setForm(f => ({ ...f, eligibility_countries: e.target.value }))} placeholder="Nigeria, Kenya" /></div>
                <div><Label>Eligible keywords (comma-separated)</Label><Input value={form.eligibility_keywords} onChange={e => setForm(f => ({ ...f, eligibility_keywords: e.target.value }))} /></div>
                <div className="sm:col-span-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
                <div className="sm:col-span-2"><Button type="submit" disabled={creating} className="bg-teal-600 hover:bg-teal-700 text-white">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create pool"}</Button></div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 shadow-sm p-4">
          <CardTitle className="text-base mb-3">Grant a waiver</CardTitle>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <Label>Pool</Label>
              <select value={grantPoolId} onChange={e => setGrantPoolId(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select pool…</option>
                {pools.filter(p => p.status === "active").map(p => <option key={p.id} value={p.id}>{p.name} ({(p.total_slots||0)-(p.slots_used||0)} left)</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label>Manuscript</Label>
              <select value={grantMsId} onChange={e => setGrantMsId(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select manuscript…</option>
                {manuscripts.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <Button onClick={handleGrant} disabled={granting || !grantPoolId || !grantMsId} className="bg-teal-600 hover:bg-teal-700 text-white">
              {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Grant waiver"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </Card>

        {pools.length === 0 ? (
          <Card className="p-8 text-center"><CardContent className="pt-6"><p className="text-slate-600">No waiver pools yet.</p></CardContent></Card>
        ) : (
          <Card className="shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pool</TableHead><TableHead>Funder</TableHead><TableHead>Slots used</TableHead><TableHead>Remaining</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map(p => {
                  const remaining = (p.total_slots || 0) - (p.slots_used || 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.funder_name}</TableCell>
                      <TableCell>{p.slots_used || 0} / {p.total_slots || 0}</TableCell>
                      <TableCell>{remaining}</TableCell>
                      <TableCell><Badge className={STATUS_STYLE[p.status] || "bg-slate-100"}>{p.status}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}