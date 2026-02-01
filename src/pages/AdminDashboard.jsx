
import React, { useState, useEffect } from "react";
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
import PaymentManagement from "../components/admin/PaymentManagement"; // Import the new component

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

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [journals, setJournals] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userData, journalData, manuscriptData] = await Promise.all([
        User.list(),
        Journal.list(),
        Manuscript.list()
      ]);
      setUsers(userData);
      setJournals(journalData);
      setManuscripts(manuscriptData);
    } catch (error) {
      console.error("Error loading admin data:", error);
    }
    setIsLoading(false);
  };
  
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

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue & Analytics</TabsTrigger>
            <TabsTrigger value="journals">Journal Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
          </TabsList>
          
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

          <TabsContent value="revenue" className="mt-6">
            <RevenueAnalytics />
          </TabsContent>

          <TabsContent value="journals" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Manage Journals</CardTitle>
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
                    {journals.map(journal => (
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
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
                    {users.map(user => (
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
