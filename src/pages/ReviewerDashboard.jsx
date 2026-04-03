import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, Download, Eye, Award, Clock, AlertCircle, BookOpen, FileText, ArrowLeft, User as UserIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReviewForm from "../components/reviewer/ReviewForm";

const ReviewCard = ({ manuscript, review, onStatusChange, onOpenForm }) => {
  const [expanded, setExpanded] = useState(false);

  const daysUntilDue = review?.review_due_date
    ? Math.ceil((new Date(review.review_due_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base font-bold line-clamp-2 mb-2">{manuscript.title}</CardTitle>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span>Invited: {new Date(review.date).toLocaleDateString()}</span>
              {daysUntilDue !== null && review.status === 'accepted' && (
                <Badge variant={daysUntilDue < 3 ? "destructive" : "secondary"} className="text-xs">
                  {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                </Badge>
              )}
            </div>
          </div>
          <Badge className={
            review.status === 'invited' ? 'bg-amber-100 text-amber-800' :
            review.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
            review.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-slate-100 text-slate-800'
          }>
            {review.status === 'invited' ? 'Pending' :
             review.status === 'accepted' ? 'In Progress' :
             review.status === 'completed' ? 'Completed' : 'Declined'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {review.status === 'invited' && (
          <>
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>Please respond to this invitation within 3 days.</AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => setExpanded(!expanded)}>
              <Eye className="w-4 h-4 mr-2" />{expanded ? 'Hide' : 'View'} Abstract
            </Button>
            {expanded && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                {manuscript.abstract?.substring(0, 300)}...
              </div>
            )}
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(manuscript.id, 'accepted')}>
                <Check className="w-4 h-4 mr-2" /> Accept
              </Button>
              <Button className="flex-1" variant="destructive" onClick={() => onStatusChange(manuscript.id, 'declined')}>
                <X className="w-4 h-4 mr-2" /> Decline
              </Button>
            </div>
          </>
        )}

        {review.status === 'accepted' && (
          <div className="space-y-3">
            {manuscript.manuscript_file_url && (
              <a href={manuscript.manuscript_file_url} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" /> Download Manuscript
                </Button>
              </a>
            )}
            <Button
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800"
              onClick={() => onOpenForm({ manuscript, review })}
            >
              <FileText className="w-4 h-4 mr-2" /> Open Review Form
            </Button>
          </div>
        )}

        {review.status === 'completed' && (
          <div className="space-y-3">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Review submitted. Thank you!</AlertDescription>
            </Alert>
            <div className="text-sm space-y-1">
              <p><strong>Recommendation:</strong> <Badge>{review.recommendation?.replace('_', ' ')}</Badge></p>
              {review.ratings && (
                <p className="text-slate-500 text-xs">
                  Avg score: {(Object.values(review.ratings).reduce((a,b)=>a+b,0)/Object.values(review.ratings).length).toFixed(1)}/5
                </p>
              )}
            </div>
          </div>
        )}

        {review.status === 'declined' && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>You declined this review invitation.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default function ReviewerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allManuscripts, setAllManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invitations');
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeReviewForm, setActiveReviewForm] = useState(null); // { manuscript, review }
  const [profileData, setProfileData] = useState({
    research_interests: [],
    expertise_keywords: [],
    academic_title: '',
    affiliation: ''
  });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      setProfileData({
        research_interests: user.research_interests || [],
        expertise_keywords: user.expertise_keywords || [],
        academic_title: user.academic_title || '',
        affiliation: user.affiliation || ''
      });
      const manuscripts = await base44.entities.Manuscript.list();
      setAllManuscripts(manuscripts);
    } catch (error) {
      console.error("Error loading reviewer data:", error);
    }
    setIsLoading(false);
  };

  const saveProfile = async () => {
    try {
      await base44.auth.updateMe(profileData);
      setEditingProfile(false);
      loadData();
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !profileData.research_interests.includes(newInterest.trim())) {
      setProfileData({
        ...profileData,
        research_interests: [...profileData.research_interests, newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interest) => {
    setProfileData({
      ...profileData,
      research_interests: profileData.research_interests.filter(i => i !== interest)
    });
  };

  const myReviews = allManuscripts.map(ms => ({
    manuscript: ms,
    review: ms.review_history?.find(r => r.reviewer_id === currentUser?.id)
  })).filter(item => item.review);

  const getReviewsByStatus = (status) => myReviews.filter(r => r.review.status === status);

  const handleReviewStatusChange = async (manuscriptId, newStatus) => {
    const manuscript = allManuscripts.find(ms => ms.id === manuscriptId);
    const updatedHistory = manuscript.review_history.map(r => 
      r.reviewer_id === currentUser.id ? { 
        ...r, 
        status: newStatus,
        review_due_date: newStatus === 'accepted' ? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : r.review_due_date
      } : r
    );
    await base44.entities.Manuscript.update(manuscriptId, { review_history: updatedHistory });
    loadData();
  };

  const handleReviewSubmit = async ({ comments, confidential_comments, recommendation, ratings, annotated_file }) => {
    const manuscriptId = activeReviewForm.manuscript.id;
    const manuscript = allManuscripts.find(ms => ms.id === manuscriptId);
    const updatedHistory = manuscript.review_history.map(r =>
      r.reviewer_id === currentUser.id ? {
        ...r,
        status: 'completed',
        comments,
        confidential_comments,
        recommendation,
        ratings,
        annotated_file,
        date: new Date().toISOString().split('T')[0]
      } : r
    );
    const newTimeline = [
      ...(manuscript.timeline || []),
      {
        status: 'review_completed',
        date: new Date().toISOString().split('T')[0],
        actor: currentUser.full_name,
        comment: `Review completed with recommendation: ${recommendation}`
      }
    ];
    await base44.entities.Manuscript.update(manuscriptId, {
      review_history: updatedHistory,
      timeline: newTimeline
    });
    setActiveReviewForm(null);
    loadData();
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Loading reviewer dashboard...</p>
      </div>
    </div>
  );
  
  if (!currentUser) return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h2>
          <p className="text-slate-600">Please log in to access the reviewer dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );

  const stats = {
    pending: getReviewsByStatus('invited').length,
    active: getReviewsByStatus('accepted').length,
    completed: getReviewsByStatus('completed').length,
    total: myReviews.length
  };

  // If a review form is open, show it full-page
  if (activeReviewForm) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setActiveReviewForm(null)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Submit Review</h2>
          <ReviewForm
            manuscript={activeReviewForm.manuscript}
            review={activeReviewForm.review}
            onSubmit={handleReviewSubmit}
            onCancel={() => setActiveReviewForm(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reviewer Dashboard</h1>
            <p className="text-slate-600">Welcome back, {currentUser.full_name}</p>
          </div>
          <Link to={createPageUrl("ReviewGuidelines")}>
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Review Guidelines
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-sm">Pending Invitations</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-sky-600 text-white">
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.active}</p>
              <p className="text-sm">Active Reviews</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6 text-center">
              <Check className="w-8 h-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-sm">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm">Total Reviews</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Invitations ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Active ({stats.active})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="mt-6">
            {getReviewsByStatus('invited').length === 0 ? (
              <Card className="border-0 bg-white/80">
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Pending Invitations</h3>
                  <p className="text-slate-600">You're all caught up! New review invitations will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getReviewsByStatus('invited').map(({ manuscript, review }) => (
                  <ReviewCard 
                    key={manuscript.id}
                    manuscript={manuscript}
                    review={review}
                    onStatusChange={handleReviewStatusChange}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            {getReviewsByStatus('accepted').length === 0 ? (
              <Card className="border-0 bg-white/80">
                <CardContent className="p-12 text-center">
                  <Eye className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Active Reviews</h3>
                  <p className="text-slate-600">Accept review invitations to start reviewing manuscripts.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {getReviewsByStatus('accepted').map(({ manuscript, review }) => (
                  <ReviewCard
                    key={manuscript.id}
                    manuscript={manuscript}
                    review={review}
                    onOpenForm={setActiveReviewForm}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {getReviewsByStatus('completed').length === 0 ? (
              <Card className="border-0 bg-white/80">
                <CardContent className="p-12 text-center">
                  <Check className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Completed Reviews Yet</h3>
                  <p className="text-slate-600">Your completed reviews will appear here for your records.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getReviewsByStatus('completed').map(({ manuscript, review }) => (
                  <ReviewCard 
                    key={manuscript.id}
                    manuscript={manuscript}
                    review={review}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="border-0 bg-white/80 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-teal-600" />
                      Reviewer Profile
                    </CardTitle>
                    {!editingProfile && (
                      <Button onClick={() => setEditingProfile(true)} variant="outline">
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Academic Title</Label>
                      {editingProfile ? (
                        <Input
                          value={profileData.academic_title}
                          onChange={(e) => setProfileData({ ...profileData, academic_title: e.target.value })}
                          placeholder="e.g., Professor, Dr., Ph.D."
                          className="mt-2"
                        />
                      ) : (
                        <p className="mt-2 text-slate-700">{profileData.academic_title || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Affiliation</Label>
                      {editingProfile ? (
                        <Input
                          value={profileData.affiliation}
                          onChange={(e) => setProfileData({ ...profileData, affiliation: e.target.value })}
                          placeholder="University or Institution"
                          className="mt-2"
                        />
                      ) : (
                        <p className="mt-2 text-slate-700">{profileData.affiliation || 'Not specified'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Research Interests & Expertise</Label>
                    <p className="text-xs text-slate-500 mb-2">
                      Add your areas of expertise to receive relevant review invitations
                    </p>
                    {editingProfile && (
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                          placeholder="Add research interest..."
                        />
                        <Button onClick={addInterest}>Add</Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.research_interests?.length > 0 ? (
                        profileData.research_interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                            {interest}
                            {editingProfile && (
                              <X 
                                className="w-3 h-3 cursor-pointer ml-1" 
                                onClick={() => removeInterest(interest)}
                              />
                            )}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-slate-500 text-sm">No research interests added yet</p>
                      )}
                    </div>
                  </div>

                  {editingProfile && (
                    <div className="flex gap-3 pt-4">
                      <Button onClick={saveProfile} className="bg-teal-600 hover:bg-teal-700">
                        Save Changes
                      </Button>
                      <Button onClick={() => setEditingProfile(false)} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  )}

                  {!editingProfile && (
                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-3">Review Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-2xl font-bold text-teal-600">{stats.total}</p>
                          <p className="text-xs text-slate-600">Total Reviews</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                          <p className="text-xs text-slate-600">Completed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                          <p className="text-xs text-slate-600">In Progress</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                          <p className="text-xs text-slate-600">Pending</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Award className="w-8 h-8 text-teal-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Reviewer Recognition</h4>
                      <p className="text-sm text-slate-700">
                        As a valued reviewer, your expertise helps maintain the quality of African scientific research. 
                        Complete more reviews to earn recognition badges and contribute to the advancement of science.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}