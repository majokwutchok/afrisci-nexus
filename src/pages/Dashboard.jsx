import React, { useState, useEffect } from "react";
import { Journal } from "@/entities/Journal";
import { Manuscript } from "@/entities/Manuscript";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BookOpen, 
  FileText, 
  TrendingUp, 
  Globe,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const StatsCard = ({ title, value, icon: Icon, gradient, description, trend }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
    <div className={`h-2 ${gradient}`} />
    <CardHeader className="p-6 pb-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            {trend && (
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${gradient.replace('bg-gradient-to-r', 'bg-gradient-to-br')} bg-opacity-10`}>
          <Icon className="w-6 h-6 text-slate-700" />
        </div>
      </div>
      {description && (
        <p className="text-sm text-slate-500 mt-2">{description}</p>
      )}
    </CardHeader>
  </Card>
);

const RecentActivity = ({ manuscripts, isLoading }) => (
  <Card className="border-0 bg-white/70 backdrop-blur-sm">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <Clock className="w-5 h-5 text-amber-500" />
        Recent Activity
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : manuscripts.length > 0 ? (
          manuscripts.slice(0, 5).map((manuscript) => (
            <div key={manuscript.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{manuscript.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={
                    manuscript.status === 'published' ? 'default' :
                    manuscript.status === 'accepted' ? 'secondary' :
                    manuscript.status === 'under_review' ? 'outline' : 'destructive'
                  } className="text-xs">
                    {manuscript.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {new Date(manuscript.created_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium">No manuscripts yet</p>
            <p className="text-sm">Start by submitting your first manuscript</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const PopularJournals = ({ journals, isLoading }) => (
  <Card className="border-0 bg-white/70 backdrop-blur-sm">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <Award className="w-5 h-5 text-amber-500" />
        Featured Journals
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : journals.length > 0 ? (
          journals.slice(0, 3).map((journal) => (
            <div key={journal.id} className="p-4 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-900 leading-tight">{journal.title}</h3>
                {journal.is_open_access && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    Open Access
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{journal.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs capitalize">
                  {journal.category.replace('_', ' ')}
                </Badge>
                {journal.impact_factor && (
                  <span className="text-sm font-medium text-slate-700">
                    IF: {journal.impact_factor}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm">No journals available</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [manuscriptData, journalData, userData] = await Promise.all([
        Manuscript.list('-created_date', 10),
        Journal.list('-created_date', 10),
        User.me().catch(() => null)
      ]);
      
      setManuscripts(manuscriptData);
      setJournals(journalData);
      setUser(userData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-1">African Scientific Excellence</h1>
              <p className="text-lg text-slate-600">Elevating research across the continent</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Link to={createPageUrl("Submit")}>
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Submit Manuscript
              </Button>
            </Link>
            <Link to={createPageUrl("Journals")}>
              <Button variant="outline" className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium px-6 py-3 rounded-xl transition-all duration-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Journals
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Active Journals"
            value={journals.length}
            icon={BookOpen}
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
            description="Multidisciplinary coverage"
            trend="+12%"
          />
          <StatsCard
            title="Total Manuscripts"
            value={manuscripts.length}
            icon={FileText}
            gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
            description="Research submissions"
            trend="+23%"
          />
          <StatsCard
            title="Published Articles"
            value={manuscripts.filter(m => m.status === 'published').length}
            icon={CheckCircle}
            gradient="bg-gradient-to-r from-green-500 to-green-600"
            description="Successfully published"
          />
          <StatsCard
            title="Under Review"
            value={manuscripts.filter(m => m.status === 'under_review').length}
            icon={AlertCircle}
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            description="Currently in peer review"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          <RecentActivity manuscripts={manuscripts} isLoading={isLoading} />
          <PopularJournals journals={journals} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}