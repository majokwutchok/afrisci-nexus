import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AuthorDashboard from "../components/dashboard/AuthorDashboard";
import EditorDashboardSummary from "../components/dashboard/EditorDashboardSummary";
import ReviewerDashboardSummary from "../components/dashboard/ReviewerDashboardSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Eye, Edit, Loader2, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";



export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState({
    isAuthor: false,
    isEditor: false,
    isReviewer: false,
    isAdmin: false
  });

  useEffect(() => {
    loadUser();
  }, []);

  const [applications, setApplications] = useState([]);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      const roles = {
        isAuthor: currentUser.author_registered || currentUser.author_application_status === 'approved',
        isEditor: currentUser.role === 'admin' || (currentUser.editor_roles && currentUser.editor_roles.length > 0),
        isReviewer: currentUser.reviewer_status === 'active',
        isAdmin: currentUser.role === 'admin'
      };
      setUserRoles(roles);
      // Load their role applications for status display
      const apps = await base44.entities.RoleApplication.filter({ applicant_email: currentUser.email }).catch(() => []);
      setApplications(apps);
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const statusBadge = (status) => {
    if (!status) return null;
    const map = { pending: { cls: 'bg-amber-100 text-amber-800', icon: Clock, label: 'Pending Review' }, under_review: { cls: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Under Review' }, approved: { cls: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Approved' }, rejected: { cls: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' } };
    const cfg = map[status];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return <Badge className={`${cfg.cls} gap-1`}><Icon className="w-3 h-3" />{cfg.label}</Badge>;
  };

  // Pending/rejected applications for roles not yet active
  const pendingApps = applications.filter(a =>
    (a.role === 'author' && !userRoles.isAuthor) ||
    (a.role === 'reviewer' && !userRoles.isReviewer) ||
    (a.role === 'editor' && !userRoles.isEditor)
  );

  // Count active roles
  const activeRoleCount = Object.values(userRoles).filter(Boolean).length;

  // If user has only one role and no pending apps, show that dashboard directly
  if (activeRoleCount === 1 && pendingApps.length === 0) {
    if (userRoles.isReviewer) return <ReviewerDashboardSummary />;
    if (userRoles.isEditor) return <EditorDashboardSummary />;
    return <AuthorDashboard />;
  }

  // If no active roles at all — show only pending applications or invite to apply
  if (activeRoleCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome, {user?.full_name}</p>
          </div>
          {pendingApps.length > 0 ? (
            <div className="space-y-4">
              <p className="text-slate-600 font-medium">Your Applications</p>
              {pendingApps.map(app => (
                <Card key={app.id} className="border-0 shadow-md">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold capitalize text-slate-900">{app.role} Application</p>
                      <p className="text-xs text-slate-500 mt-0.5">Applied {new Date(app.created_date).toLocaleDateString()}</p>
                    </div>
                    {statusBadge(app.status)}
                  </CardContent>
                </Card>
              ))}
              <p className="text-sm text-slate-500 text-center">You'll be able to access your dashboards once your application is approved.</p>
            </div>
          ) : (
            <Card className="border-0 shadow-md text-center">
              <CardContent className="p-10">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">No Role Yet</h2>
                <p className="text-slate-600 mb-6">Apply for a role to access your dashboard.</p>
                <Link to={createPageUrl("Apply")}>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">Apply for a Role <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // If user has multiple roles, show tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back, {user?.full_name}</p>
          {pendingApps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {pendingApps.map(app => (
                <div key={app.id} className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                  <span className="capitalize font-medium">{app.role}</span>
                  {statusBadge(app.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        <Tabs defaultValue="author" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="author" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Author
            </TabsTrigger>
            {userRoles.isEditor && (
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editor
              </TabsTrigger>
            )}
            {userRoles.isReviewer && (
              <TabsTrigger value="reviewer" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Reviewer
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="author">
            <AuthorDashboard />
          </TabsContent>

          {userRoles.isEditor && (
            <TabsContent value="editor">
              <EditorDashboardSummary />
            </TabsContent>
          )}

          {userRoles.isReviewer && (
            <TabsContent value="reviewer">
              <ReviewerDashboardSummary />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}