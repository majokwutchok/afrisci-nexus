
import React, { useState, useEffect } from "react";
import { Manuscript } from "@/entities/Manuscript";
import { Journal } from "@/entities/Journal";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Eye,
  Calendar,
  User as UserIcon,
  ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom"; // Import Link
import { createPageUrl } from "@/utils"; // Import createPageUrl

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  submitted: "bg-blue-100 text-blue-800 border-blue-200", 
  editor_assigned: "bg-sky-100 text-sky-800 border-sky-200", // New status
  under_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  revised: "bg-purple-100 text-purple-800 border-purple-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200"
};

const statusIcons = {
  draft: <FileText className="w-4 h-4" />,
  submitted: <Clock className="w-4 h-4" />,
  editor_assigned: <UserIcon className="w-4 h-4" />, // New status icon
  under_review: <Clock className="w-4 h-4" />,
  revision_requested: <AlertCircle className="w-4 h-4" />,
  revised: <Clock className="w-4 h-4" />,
  accepted: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  published: <CheckCircle className="w-4 h-4" />
};

const ManuscriptCard = ({ manuscript, journal }) => (
  <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)}>
            <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
              {manuscript.title}
            </CardTitle>
          </Link>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            {journal?.title || 'Journal not found'}
          </p>
        </div>
        <Badge className={`${statusColors[manuscript.status]} border flex items-center gap-1 flex-shrink-0`}>
          {statusIcons[manuscript.status]}
          {manuscript.status.replace('_', ' ')}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Progress indicator for each manuscript */}
      {manuscript.status !== 'published' && manuscript.status !== 'rejected' && (
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progress</span>
            <span className="font-medium text-slate-900">
              {manuscript.review_history?.length || 0} reviewer{(manuscript.review_history?.length || 0) !== 1 ? 's' : ''} assigned
            </span>
          </div>
          <div className="mt-2 bg-slate-200 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${manuscript.status === 'submitted' ? 20 : 
                        manuscript.status === 'editor_assigned' ? 40 :
                        manuscript.status === 'under_review' ? 60 :
                        manuscript.status === 'revision_requested' ? 70 :
                        manuscript.status === 'revised' ? 80 :
                        manuscript.status === 'accepted' ? 100 : 20}%`
              }}
            />
          </div>
        </div>
      )}

      <p className="text-slate-600 text-sm line-clamp-3">{manuscript.abstract}</p>
      
      <div className="flex flex-wrap gap-2">
        {manuscript.keywords?.slice(0, 3).map((keyword) => (
          <Badge key={keyword} variant="outline" className="text-xs">
            {keyword}
          </Badge>
        ))}
        {manuscript.keywords?.length > 3 && (
          <Badge variant="outline" className="text-xs text-slate-500">
            +{manuscript.keywords.length - 3} more
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <UserIcon className="w-3 h-3" />
          <span>{manuscript.authors?.length || 0} author{(manuscript.authors?.length || 0) !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{manuscript.submission_date ? format(new Date(manuscript.submission_date), 'MMM d, yyyy') : 'Draft'}</span>
        </div>
        {manuscript.review_type && (
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{manuscript.review_type.replace('_', ' ')}</span>
          </div>
        )}
        {manuscript.doi && (
          <div className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <span>DOI: {manuscript.doi}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3">
        <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)}>
          <Button size="sm" variant="outline" className="flex items-center gap-1 text-xs">
            <Eye className="w-3 h-3" />
            View Progress
          </Button>
        </Link>
        {manuscript.manuscript_file_url && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
            onClick={() => window.open(manuscript.manuscript_file_url, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
            Download
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function MyManuscripts() {
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [manuscriptData, journalData, userData] = await Promise.all([
        Manuscript.list('-created_date'),
        Journal.list().catch(() => []), // Don't fail if journals can't load
        User.me().catch(() => null)
      ]);
      
      // Filter manuscripts by current user if available
      const userManuscripts = userData 
        ? manuscriptData.filter(m => m.created_by === userData.email)
        : manuscriptData;
      
      setManuscripts(userManuscripts);
      setJournals(journalData);
      setUser(userData);
    } catch (error) {
      console.error("Error loading manuscripts:", error);
    }
    setIsLoading(false);
  };

  const filteredManuscripts = manuscripts.filter(manuscript => {
    const matchesSearch = manuscript.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         manuscript.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         manuscript.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = activeTab === "all" || manuscript.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const manuscriptCounts = manuscripts.reduce((acc, manuscript) => {
    acc[manuscript.status] = (acc[manuscript.status] || 0) + 1;
    return acc;
  }, {});

  const getJournalById = (id) => {
    if (!id || !journals.length) return null;
    return journals.find(j => j.id === id) || null;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">My Manuscripts</h1>
          </div>
          <p className="text-lg text-slate-600">
            Track the progress of your research submissions
          </p>
        </div>

        {/* Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search manuscripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 border-slate-200 focus:border-emerald-300 focus:ring-emerald-200 rounded-xl"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 shadow-sm mb-8">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 rounded-lg py-2 text-xs font-medium"
              >
                All ({manuscripts.length})
              </TabsTrigger>
              {Object.entries({
                draft: "Drafts",
                submitted: "Submitted", 
                editor_assigned: "Editor Assigned", // New status tab
                under_review: "Under Review",
                revision_requested: "Revisions",
                revised: "Revised",
                accepted: "Accepted",
                rejected: "Rejected",
                published: "Published"
              }).map(([status, label]) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 rounded-lg py-2 text-xs font-medium"
                >
                  {label} ({manuscriptCounts[status] || 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {/* Results */}
            <div className="mb-6">
              <p className="text-slate-600 font-medium">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    Loading manuscripts...
                  </span>
                ) : (
                  `Showing ${filteredManuscripts.length} manuscript${filteredManuscripts.length !== 1 ? 's' : ''}`
                )}
              </p>
            </div>

            {/* Manuscripts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="border-0 bg-white/80">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredManuscripts.length > 0 ? (
                filteredManuscripts.map((manuscript) => (
                  <ManuscriptCard 
                    key={manuscript.id} 
                    manuscript={manuscript} 
                    journal={getJournalById(manuscript.journal_id)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No manuscripts found</h3>
                  <p className="text-slate-600 max-w-md mx-auto mb-6">
                    {activeTab === "all" 
                      ? "You haven't submitted any manuscripts yet. Start sharing your research with the world!"
                      : `No manuscripts with status "${activeTab.replace('_', ' ')}" found.`}
                  </p>
                  {activeTab === "all" && (
                    <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
                      Submit Your First Manuscript
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
