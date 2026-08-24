import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Loader2, CheckCircle, XCircle, RefreshCw, Wrench } from "lucide-react";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  canceled: "bg-red-100 text-red-700"
};

const fmtMoney = (n, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);

export default function ServiceOrdersAdmin() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ords, txs] = await Promise.all([
        base44.entities.ServiceOrder.list("-created_date", 200),
        base44.entities.Transaction.list("-created_date", 200)
      ]);
      setOrders(ords || []);
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

  const txFor = (orderId) => transactions.find(t => t.provider_transaction_id === orderId);

  const handleAction = async (order, action) => {
    setActingId(order.id);
    try {
      const now = new Date().toISOString();
      if (action === "complete") {
        await base44.entities.ServiceOrder.update(order.id, { status: "completed", completed_at: now });
        const tx = txFor(order.id);
        if (tx) await base44.entities.Transaction.update(tx.id, { status: "completed" });
      } else {
        await base44.entities.ServiceOrder.update(order.id, { status: "canceled" });
        const tx = txFor(order.id);
        if (tx && tx.status === "pending") await base44.entities.Transaction.update(tx.id, { status: "failed" });
      }
      await load();
    } catch (e) { console.error(e); }
    setActingId(null);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10"><Skeleton className="h-10 w-64 mb-6" /><Skeleton className="h-96 rounded-2xl" /></div>;

  if (!user || user.role !== "admin") {
    return <div className="max-w-md mx-auto py-20 text-center px-4"><ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" /><p className="text-slate-600">Admin access required.</p></div>;
  }

  const pending = orders.filter(o => o.status === "pending").length;
  const completed = orders.filter(o => o.status === "completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SEO title="Service Orders — AfriSci Nexus" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Wrench className="w-6 h-6 text-indigo-500" /> Service Orders</h1>
            <p className="text-slate-600 text-sm">Manage author service requests.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Pending</p><p className="text-2xl font-bold text-amber-600">{pending}</p></Card>
          <Card className="p-4"><p className="text-xs text-slate-500 uppercase">Completed</p><p className="text-2xl font-bold text-emerald-600">{completed}</p></Card>
        </div>

        {orders.length === 0 ? (
          <Card className="p-8 text-center"><CardContent className="pt-6"><p className="text-slate-600">No service orders yet.</p></CardContent></Card>
        ) : (
          <Card className="shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead><TableHead>Manuscript</TableHead><TableHead>Author</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.service_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{o.manuscript_title || "—"}</TableCell>
                    <TableCell className="text-xs">{o.author_email}</TableCell>
                    <TableCell>{fmtMoney(o.amount, o.currency)}</TableCell>
                    <TableCell><Badge className={STATUS_STYLE[o.status] || "bg-slate-100"}>{o.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {o.status === "pending" && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={actingId === o.id} onClick={() => handleAction(o, "complete")}>
                          {actingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Complete
                        </Button>
                      )}
                      {(o.status === "pending" || o.status === "active") && (
                        <Button size="sm" variant="outline" className="ml-1" disabled={actingId === o.id} onClick={() => handleAction(o, "cancel")}>
                          {actingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />} Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}