import React, { useState, useEffect } from "react";
import { Payment } from "@/entities/Payment";
import { Manuscript } from "@/entities/Manuscript";
import { Journal } from "@/entities/Journal";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter,
  ChevronsRight,
  ShieldQuestion,
  ThumbsUp,
  ThumbsDown,
  Undo2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  pending_waiver_approval: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [waiverReason, setWaiverReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [paymentsData, manuscriptsData, journalsData, usersData] = await Promise.all([
        Payment.list('-created_date'),
        Manuscript.list(),
        Journal.list(),
        User.list(),
      ]);
      setPayments(paymentsData);
      setManuscripts(manuscriptsData);
      setJournals(journalsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading payment data:", error);
    }
    setIsLoading(false);
  };

  const getRelatedData = (payment) => {
    const manuscript = manuscripts.find(m => m.id === payment.manuscript_id);
    const journal = journals.find(j => j.id === payment.journal_id);
    const author = users.find(u => u.email === manuscript?.created_by);
    return { manuscript, journal, author };
  };

  const filteredPayments = payments.filter(p => {
    const { manuscript, author } = getRelatedData(p);
    const searchMatch = searchQuery === "" ||
      manuscript?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusMatch = statusFilter === "all" || p.status === statusFilter;
    
    return searchMatch && statusMatch;
  });

  const openManageModal = (payment) => {
    setSelectedPayment(payment);
    setAdminNotes(payment.admin_notes || "");
    setWaiverReason(payment.waiver_reason || "");
    setIsManageModalOpen(true);
  };

  const handleApproveWaiver = async () => {
    if (!selectedPayment) return;
    await Payment.update(selectedPayment.id, {
      status: "completed",
      fee_waiver: true,
      waiver_reason: waiverReason,
      payment_method: "waiver",
      admin_notes: adminNotes,
    });
    setIsManageModalOpen(false);
    loadData();
  };

  const handleDenyWaiver = async () => {
    if (!selectedPayment) return;
    await Payment.update(selectedPayment.id, {
      status: "pending", // Author now needs to pay
      waiver_reason: "Denied: " + waiverReason,
      admin_notes: adminNotes,
    });
    setIsManageModalOpen(false);
    loadData();
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    await Payment.update(selectedPayment.id, {
      status: "refunded",
      admin_notes: adminNotes,
    });
    setIsManageModalOpen(false);
    loadData();
  };
  
  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Payment Management</CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by manuscript, author, transaction ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="pending_waiver_approval">Pending Waiver</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Manuscript</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map(p => {
              const { manuscript, journal, author } = getRelatedData(p);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium truncate max-w-xs">{manuscript?.title || 'N/A'}</div>
                    <div className="text-xs text-slate-500">{journal?.title || 'N/A'}</div>
                  </TableCell>
                  <TableCell>{author?.full_name || 'N/A'}</TableCell>
                  <TableCell>${p.amount.toFixed(2)}</TableCell>
                  <TableCell>{p.payment_method?.replace('_', ' ') || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(p.created_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[p.status] || "bg-gray-100"}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openManageModal(p)}>
                      Manage <ChevronsRight className="w-4 h-4 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Payment</DialogTitle>
            <DialogDescription>
              Review details, manage waivers, and process refunds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayment?.status === 'pending_waiver_approval' && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <ShieldQuestion className="w-5 h-5" /> Waiver Request
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800 italic mb-3">
                    "{selectedPayment.waiver_request_comment || 'No comment provided.'}"
                  </p>
                  <div>
                    <Label htmlFor="waiver-reason">Reason for Decision</Label>
                    <Input
                      id="waiver-reason"
                      value={waiverReason}
                      onChange={(e) => setWaiverReason(e.target.value)}
                      placeholder="e.g., Early-career researcher from LIC"
                      className="mt-2"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={handleApproveWaiver} className="bg-green-600 hover:bg-green-700">
                      <ThumbsUp className="w-4 h-4 mr-2" /> Approve Waiver
                    </Button>
                    <Button variant="destructive" onClick={handleDenyWaiver}>
                      <ThumbsDown className="w-4 h-4 mr-2" /> Deny Waiver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedPayment?.status === 'completed' && (
               <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <Undo2 className="w-5 h-5" /> Process Refund
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-800 mb-3">
                    Refunding this transaction is irreversible. The payment status will be marked as 'Refunded'.
                  </p>
                  <Button variant="destructive" onClick={handleRefund}>
                    Confirm Refund of ${selectedPayment.amount.toFixed(2)}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this transaction..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsManageModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}