import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { manageSubscription } from "@/functions/manageSubscription";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const STATUS_STYLE = {
  active: "bg-emerald-100 text-emerald-700",
  pending_payment: "bg-amber-100 text-amber-700",
  trial: "bg-blue-100 text-blue-700",
  canceled: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-600"
};

const fmtMoney = (n, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);

export default function SubscriptionAdmin() {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [subs, txs] = await Promise.all([
        base44.entities.Subscription.list("-created_date", 200),
        base44.entities.Transaction.list("-created_date", 200)
      ]);
      setSubscriptions(subs || []);
      setTransactions(txs || []);
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

  const txFor = (subId) => transactions.find(t => t.subscription_id === subId);

  const handleAction = async (sub, action) => {
    setActingId(sub.id);
    try {
      await manageSubscription({ subscription_id: sub.id, action });
      await load();
    } catch (e) {
      console.error(e);
    }
    setActingId(null);
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-10"><Skeleton className="h-10 w-64 mb-6" /><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto py-20 text-center px-4">
        <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600">Admin access required.</p>
      </div>
    );
  }

  const pending = subscriptions.filter(s => s.status === "pending_payment");
  const active = subscriptions.filter(s => s.status === "active");
  const revenue = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SEO title="Subscription Admin — AfriSci Nexus" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subscription Admin</h1>
            <p className="text-slate-600 text-sm">Review and activate institutional memberships.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Pending</p><p className="text-2xl font-bold text-amber-600">{pending.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Active</p><p className="text-2xl font-bold text-emerald-600">{active.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Recognized revenue</p><p className="text-2xl font-bold text-slate-900">{fmtMoney(revenue)}</p></Card>
        </div>

        {subscriptions.length === 0 ? (
          <Card className="p-8 text-center"><CardContent className="pt-6"><p className="text-slate-600">No subscriptions yet.</p></CardContent></Card>
        ) : (
          <Card className="shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map(sub => {
                  const tx = txFor(sub.id);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.organization_name || "—"}</TableCell>
                      <TableCell>{sub.plan_name || "—"}</TableCell>
                      <TableCell>{tx ? fmtMoney(tx.amount, tx.currency) : "—"}</TableCell>
                      <TableCell><Badge className={STATUS_STYLE[sub.status] || "bg-slate-100 text-slate-700"}>{sub.status.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="text-right">
                        {sub.status === "pending_payment" && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={actingId === sub.id} onClick={() => handleAction(sub, "activate")}>
                            {actingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Activate
                          </Button>
                        )}
                        {sub.status === "active" && (
                          <Button size="sm" variant="outline" disabled={actingId === sub.id} onClick={() => handleAction(sub, "cancel")}>
                            {actingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />} Cancel
                          </Button>
                        )}
                      </TableCell>
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