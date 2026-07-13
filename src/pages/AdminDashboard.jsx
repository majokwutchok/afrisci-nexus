import React, { useState, useEffect, useMemo } from "react";
import PaginationBar from "../components/ui/PaginationBar";
import BrandAssets from "../components/admin/BrandAssets";
import { User } from "@/entities/User";
import { Journal } from "@/entities/Journal";
import { Manuscript } from "@/entities/Manuscript";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RevenueAnalytics from "../components/admin/RevenueAnalytics";
import ComplianceTracker from "../components/admin/ComplianceTracker";
import MarketingDocuments from "../components/admin/MarketingDocuments";
import PaymentManagement from "../components/admin/PaymentManagement";
import AllApplications from "../components/admin/AllApplications";
import AddEditorProfile from "../components/admin/AddEditorProfile";
import NewsManager from "../components/admin/NewsManager";
import AdminProfileSetup from "../components/admin/AdminProfileSetup";
import AdminManuscriptAccelerator from "../components/admin/AdminManuscriptAccelerator";
import OAIPMHMonitor from "../components/admin/OAIPMHMonitor";
import EmailProspector from "../components/admin/EmailProspector";
import EmailCampaignManager from "../components/admin/EmailCampaignManager";
import LinkedInProfileAgent from "../components/admin/LinkedInProfileAgent";
import PersonalizedOutreachEngine from "../components/admin/PersonalizedOutreachEngine";
import InboundReplyMonitor from "../components/admin/InboundReplyMonitor";
import ExecutiveBusinessCard from "../components/admin/ExecutiveBusinessCard";
import BulkManuscriptActions from "../components/editor/BulkManuscriptActions";
import PlatformAnalyticsDashboard from "../components/admin/PlatformAnalyticsDashboard";

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <Card className={`border-l-4 ${color} bg-white shadow-sm`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <Icon className="h-5 w-5 text-slate-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </CardContent>
  </Card>
);

const PAGE_SIZE = 25;

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [journals, setJournals] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [journalPage, setJournalPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [journalSearch, setJournalSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userData, journalData, manuscriptData] = await Promise.all([
        User.list('-created_date', 500),
        Journal.list('-created_date', 500),
        Manuscript.list('-created_date', 500)
      ]);
      setUsers(userData);
      setJournals(journalData);
      setManuscripts(manuscriptData);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
    setIsLoading(false);
  };

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      !userSearch ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.country?.toLowerCase().includes(userSearch.toLowerCase())
    ), [users, userSearch]);

  const filteredJournals = useMemo(() =>
    journals.filter(j =>
      !journalSearch ||
      j.title?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      j.category?.toLowerCase().includes(journalSearch.toLowerCase())
    ), [journals, journalSearch]);

  const pagedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const pagedJournals = filteredJournals.slice((journalPage - 1) * PAGE_SIZE, journalPage * PAGE_SIZE);
  
  const manuscriptStatusData = manuscripts.reduce((acc, ms) => {
    const status = ms.status.replace('_', ' ');
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: status, count: 1 });
    }
    return acc;
  }, []);

  const handleJournalStatusToggle = async (journal) => {
    const newStatus = journal.status === 'active' ? 'inactive' : 'active';
    await Journal.update(journal.id, { status: newStatus });
    loadData();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" /><Skeleton className="h-28" />
          <Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-700" />
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Users" value={users.length} icon={Users} color="border-blue-500" />
          <StatsCard title="Total Journals" value={journals.length} icon={BookOpen} color="border-emerald-500" />
          <StatsCard title="Total Manuscripts" value={manuscripts.length} icon={FileText} color="border-amber-500" />
          <StatsCard title="Published Articles" value={manuscripts.filter(m => m.status === 'published').length} icon={BarChart3} color="border-purple-500" />
        </div>

        <Tabs defaultValue="applications">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="admin_profile" className="text-emerald-700 font-semibold">👤 My Admin Profiles</TabsTrigger>
            <TabsTrigger value="bulk_actions" className="text-blue-700 font-semibold">☑️ Bulk Actions</TabsTrigger>
            <TabsTrigger value="accelerator" className="text-amber-700 font-semibold">⚡ Manuscript Accelerator</TabsTrigger>
            <TabsTrigger value="oai_pmh" className="text-purple-700 font-semibold">📡 OAI-PMH Monitor</TabsTrigger>
            <TabsTrigger value="applications" className="text-blue-700 font-semibold">📋 Applications</TabsTrigger>
            <TabsTrigger value="add_editor" className="text-amber-700 font-semibold">➕ Add Editor</TabsTrigger>
            <TabsTrigger value="news" className="text-teal-700 font-semibold">📰 News Manager</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platform_analytics" className="text-emerald-700 font-semibold">📊 Platform Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue & Analytics</TabsTrigger>
            <TabsTrigger value="journals">Journal Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
            <TabsTrigger value="compliance" className="text-purple-700 font-semibold">📋 Publisher Compliance</TabsTrigger>
            <TabsTrigger value="marketing_docs" className="text-indigo-700 font-semibold">📄 Marketing Docs</TabsTrigger>
            <TabsTrigger value="brand" className="text-amber-700 font-semibold">🎨 Brand Assets</TabsTrigger>
            <TabsTrigger value="business_card" className="text-blue-700 font-semibold">📇 Business Card</TabsTrigger>
            <TabsTrigger value="email_prospector" className="text-teal-700 font-semibold">📧 Email Prospector</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-indigo-700 font-semibold">🚀 Campaigns</TabsTrigger>
            <TabsTrigger value="linkedin_agent" className="text-blue-700 font-semibold">🔗 LinkedIn Agent</TabsTrigger>
            <TabsTrigger value="outreach_engine" className="text-violet-700 font-semibold">✨ Outreach Engine</TabsTrigger>
            <TabsTrigger value="inbound_replies" className="text-indigo-700 font-semibold">📬 Inbound Replies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="admin_profile" className="mt-6">
            <AdminProfileSetup />
          </TabsContent>

          <TabsContent value="bulk_actions" className="mt-6">
            <BulkManuscriptActions manuscripts={manuscripts} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="accelerator" className="mt-6">
            <AdminManuscriptAccelerator />
          </TabsContent>

          <TabsContent value="oai_pmh" className="mt-6">
            <OAIPMHMonitor />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Manuscript Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={manuscriptStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platform_analytics" className="mt-6">
            <PlatformAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <AllApplications />
          </TabsContent>

          <TabsContent value="add_editor" className="mt-6">
            <AddEditorProfile />
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            <NewsManager />
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <RevenueAnalytics />
          </TabsContent>

          <TabsContent value="journals" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle>Manage Journals</CardTitle>
                  <input
                    type="text"
                    placeholder="Search journals..."
                    value={journalSearch}
                    onChange={e => { setJournalSearch(e.target.value); setJournalPage(1); }}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Editor in Chief</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedJournals.map(journal => (
                      <TableRow key={journal.id}>
                        <TableCell className="font-medium">{journal.title}</TableCell>
                        <TableCell>{journal.category?.replace('_', ' ')}</TableCell>
                        <TableCell>{journal.editor_in_chief}</TableCell>
                        <TableCell>
                          <Badge variant={journal.status === 'active' ? 'default' : 'destructive'}>
                            {journal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleJournalStatusToggle(journal)}>
                            {journal.status === 'active'
                               ? <ToggleRight className="w-5 h-5 text-green-600" />
                               : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar currentPage={journalPage} totalPages={Math.ceil(filteredJournals.length / PAGE_SIZE)} onPageChange={setJournalPage} itemsPerPage={PAGE_SIZE} totalItems={filteredJournals.length} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle>Manage Users</CardTitle>
                  <input
                    type="text"
                    placeholder="Search by name, email or country..."
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Editor For</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Badge>{user.role}</Badge></TableCell>
                        <TableCell>{user.country}</TableCell>
                        <TableCell>
                          {user.editor_roles?.length > 0
                            ? user.editor_roles.map(jId => journals.find(j => j.id === jId)?.title).join(', ')
                            : 'N/A'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar currentPage={userPage} totalPages={Math.ceil(filteredUsers.length / PAGE_SIZE)} onPageChange={setUserPage} itemsPerPage={PAGE_SIZE} totalItems={filteredUsers.length} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <ComplianceTracker />
          </TabsContent>

          <TabsContent value="marketing_docs" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">Marketing & Official Documents</h2>
              <p className="text-sm text-slate-500 mt-1">Generate, preview and download branded AfriSci Nexus documents. Signed by Majok Wutchok.</p>
            </div>
            <MarketingDocuments />
          </TabsContent>

          <TabsContent value="brand" className="mt-6">
            <BrandAssets />
          </TabsContent>

          <TabsContent value="business_card" className="mt-6">
            <ExecutiveBusinessCard />
          </TabsContent>

          <TabsContent value="email_prospector" className="mt-6">
            <EmailProspector />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <EmailCampaignManager />
          </TabsContent>

          <TabsContent value="linkedin_agent" className="mt-6">
            <LinkedInProfileAgent />
          </TabsContent>

          <TabsContent value="outreach_engine" className="mt-6">
            <PersonalizedOutreachEngine />
          </TabsContent>

          <TabsContent value="inbound_replies" className="mt-6">
            <InboundReplyMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}