import React, { useState, useEffect } from "react";
import { Manuscript } from "@/entities/Manuscript";
import { Journal } from "@/entities/Journal";
import { Comment } from "@/entities/Comment";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText,
  BookOpen,
  Calendar,
  Users,
  Download,
  Share2,
  Twitter,
  Linkedin,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import ProgressTracker from "../components/submission/ProgressTracker";
import InlinePDFViewer from "../components/publication/InlinePDFViewer";
import ScholarMetaTags from "../components/publication/ScholarMetaTags";
import DOIPanel from "../components/publication/DOIPanel";
import CitationTracker from "../components/publication/CitationTracker";
import ArticleEngagementMetrics from "../components/publication/ArticleEngagementMetrics";

const statusColors = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  submitted: "bg-blue-100 text-blue-800 border-blue-200", 
  under_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  revised: "bg-purple-100 text-purple-800 border-purple-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  published: "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export default function ManuscriptDetail() {
  const [manuscript, setManuscript] = useState(null);
  const [journal, setJournal] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const manuscriptId = urlParams.get('id');
    if (manuscriptId) {
      loadData(manuscriptId);
    } else {
      setError("No manuscript ID provided");
      setIsLoading(false);
    }
  }, []);

  const loadData = async (manuscriptId) => {
    setIsLoading(true);
    setError(null);
    try {
      const msData = await Manuscript.get(manuscriptId);
      setManuscript(msData);

      // Increment view count asynchronously (fire and forget)
      Manuscript.update(manuscriptId, { view_count: (msData.view_count || 0) + 1 }).catch(() => {});

      // Load other data in parallel, with error handling for each
      const [commentsData, userData] = await Promise.all([
        Comment.filter({ manuscript_id: manuscriptId }).catch(() => []),
        User.me().catch(() => null)
      ]);

      setComments(commentsData);
      setCurrentUser(userData);

      // Load journal data only if journal_id exists and is valid
      if (msData.journal_id) {
        try {
          const journalData = await Journal.get(msData.journal_id);
          setJournal(journalData);
        } catch (journalError) {
          console.error("Error loading journal:", journalError);
          // Set journal to null but don't fail the entire load
          setJournal(null);
        }
      } else {
        console.warn("No journal_id found for manuscript");
        setJournal(null);
      }

    } catch (error) {
      console.error("Error loading manuscript details:", error);
      setError("Failed to load manuscript details. Please try again.");
    }
    setIsLoading(false);
  };
  
  const handleCitationAdded = (newCount) => {
    setManuscript(prev => prev ? { ...prev, citation_count: newCount } : prev);
  };

  const handleDOIAssigned = (doi) => {
    setManuscript(prev => prev ? { ...prev, doi } : prev);
  };

  const handleDownload = async () => {
    if (!manuscript?.manuscript_file_url) return;
    window.open(manuscript.manuscript_file_url, '_blank');
    Manuscript.update(manuscript.id, { download_count: (manuscript.download_count || 0) + 1 }).catch(() => {});
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser || !manuscript) return;
    
    try {
      await Comment.create({
        manuscript_id: manuscript.id,
        content: newComment,
        author_name: currentUser.full_name
      });
      setNewComment("");
      loadData(manuscript.id);
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const shareOnTwitter = () => {
    const text = `Check out this article: "${manuscript.title}"`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-4"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Manuscript</h3>
          <p className="text-slate-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!manuscript) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Manuscript Not Found</h3>
          <p className="text-slate-600">The requested manuscript could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <ScholarMetaTags manuscript={manuscript} journal={journal} />
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <Badge className={`${statusColors[manuscript.status]} w-fit mb-4`}>
                  Status: {manuscript.status.replace('_', ' ')}
                </Badge>
                <CardTitle className="text-3xl font-bold text-slate-900">{manuscript.title}</CardTitle>
                <div className="text-sm text-slate-500 flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{journal?.title || 'Journal not available'}</span>
                  </div>
                  {manuscript.submission_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted: {format(new Date(manuscript.submission_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {manuscript.review_type && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{manuscript.review_type.replace('_', ' ')} review</span>
                    </div>
                  )}
                </div>
                {manuscript.doi && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">DOI:</span>
                    <a
                      href={`https://doi.org/${manuscript.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-mono text-teal-700 hover:text-teal-900 hover:underline"
                    >
                      {manuscript.doi}
                    </a>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {manuscript.authors && manuscript.authors.length > 0 && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Users className="w-5 h-5"/>Authors</h3>
                    <p className="text-slate-700">
                      {manuscript.authors.map(a => `${a.name} (${a.affiliation || 'N/A'})`).join(', ')}
                    </p>
                  </div>
                )}
                <Separator />
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Abstract</h3>
                  <p className="text-slate-700 leading-relaxed">{manuscript.abstract}</p>
                </div>
                {manuscript.keywords && manuscript.keywords.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {manuscript.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                {/* Inline PDF Viewer */}
                {manuscript.manuscript_file_url && (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3">Read Article</h3>
                    <InlinePDFViewer fileUrl={manuscript.manuscript_file_url} />
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  {manuscript.manuscript_file_url && (
                    <Button onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2"/>Download PDF
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-slate-600"/>
                    <Button variant="ghost" size="icon" onClick={shareOnTwitter}><Twitter className="w-5 h-5 text-sky-500"/></Button>
                    <Button variant="ghost" size="icon" onClick={shareOnLinkedIn}><Linkedin className="w-5 h-5 text-blue-700"/></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            {manuscript.status === 'published' && (
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5"/> Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-bold text-sm text-slate-800">{comment.author_name}</p>
                        <p className="text-slate-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  {currentUser && (
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button onClick={handlePostComment}>Post Comment</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ProgressTracker
              manuscript={manuscript}
              showReviewDetails={true}
            />
            <DOIPanel
              manuscript={manuscript}
              journal={journal}
              onDOIAssigned={handleDOIAssigned}
            />
            <CitationTracker
              manuscript={manuscript}
              journal={journal}
              onCitationAdded={handleCitationAdded}
            />
            <ArticleEngagementMetrics manuscript={manuscript} />
          </div>
        </div>
      </div>
    </div>
  );
}