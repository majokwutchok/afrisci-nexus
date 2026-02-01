import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AuthorDashboard from "../components/dashboard/AuthorDashboard";
import EditorDashboardSummary from "../components/dashboard/EditorDashboardSummary";
import ReviewerDashboardSummary from "../components/dashboard/ReviewerDashboardSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  Eye,
  Edit,
  Loader2
} from "lucide-react";



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

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const roles = {
        isAuthor: true, // All logged-in users can be authors
        isEditor: currentUser.role === 'admin' || (currentUser.editor_roles && currentUser.editor_roles.length > 0),
        isReviewer: currentUser.reviewer_status === 'active',
        isAdmin: currentUser.role === 'admin'
      };
      
      setUserRoles(roles);
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

  // Count active roles
  const activeRoleCount = Object.values(userRoles).filter(Boolean).length;

  // If user has only one role, show that dashboard directly
  if (activeRoleCount === 1) {
    if (userRoles.isReviewer) return <ReviewerDashboardSummary />;
    if (userRoles.isEditor) return <EditorDashboardSummary />;
    return <AuthorDashboard />;
  }

  // If user has multiple roles, show tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back, {user?.full_name}</p>
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