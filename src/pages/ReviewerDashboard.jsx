import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Manuscript } from "@/entities/Manuscript";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Download } from "lucide-react";

const ReviewCard = ({ manuscript, review, onStatusChange, onSubmitReview }) => {
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('');

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-bold line-clamp-2">{manuscript.title}</CardTitle>
        <p className="text-xs text-slate-500">Invitation Date: {new Date(review.date).toLocaleDateString()}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {review.status === 'invited' && (
          <div className="flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(manuscript.id, 'accepted')}>
              <Check className="w-4 h-4 mr-2" /> Accept
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onStatusChange(manuscript.id, 'declined')}>
              <X className="w-4 h-4 mr-2" /> Decline
            </Button>
          </div>
        )}
        {review.status === 'accepted' && (
          <div className="space-y-3">
            <a href={manuscript.manuscript_file_url} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Download Manuscript</Button>
            </a>
            <Textarea 
              placeholder="Your comments for the author..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <Select onValueChange={setRecommendation}>
              <SelectTrigger>
                <SelectValue placeholder="Select recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accept">Accept</SelectItem>
                <SelectItem value="minor_revision">Minor Revision</SelectItem>
                <SelectItem value="major_revision">Major Revision</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => onSubmitReview(manuscript.id, comments, recommendation)}>
              Submit Review
            </Button>
          </div>
        )}
        {review.status === 'completed' && (
          <p className="text-sm text-green-700 font-medium">Review submitted. Thank you!</p>
        )}
         {review.status === 'declined' && (
          <p className="text-sm text-red-700 font-medium">Invitation declined.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default function ReviewerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allManuscripts, setAllManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      const manuscripts = await Manuscript.list();
      setAllManuscripts(manuscripts);
    } catch (error) {
      console.error("Error loading reviewer data:", error);
    }
    setIsLoading(false);
  };

  const myReviews = allManuscripts.map(ms => ({
    manuscript: ms,
    review: ms.review_history?.find(r => r.reviewer_id === currentUser?.id)
  })).filter(item => item.review);

  const getReviewsByStatus = (status) => myReviews.filter(r => r.review.status === status);

  const handleReviewStatusChange = async (manuscriptId, newStatus) => {
    const manuscript = allManuscripts.find(ms => ms.id === manuscriptId);
    const updatedHistory = manuscript.review_history.map(r => 
      r.reviewer_id === currentUser.id ? { ...r, status: newStatus } : r
    );
    await Manuscript.update(manuscriptId, { review_history: updatedHistory });
    loadData();
  };

  const handleReviewSubmit = async (manuscriptId, comments, recommendation) => {
    const manuscript = allManuscripts.find(ms => ms.id === manuscriptId);
    const updatedHistory = manuscript.review_history.map(r => 
      r.reviewer_id === currentUser.id ? { ...r, status: 'completed', comments, recommendation } : r
    );
    await Manuscript.update(manuscriptId, { review_history: updatedHistory, status: 'under_review' }); // keep it under review
    loadData();
  };

  if (isLoading) return <div className="p-6">Loading reviewer dashboard...</div>;
  if (!currentUser) return <div className="p-6">Please log in to see your reviews.</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-slate-900">Reviewer Dashboard</h1>
        
        <Tabs defaultValue="invitations">
          <TabsList>
            <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
            <TabsTrigger value="active">Active Reviews</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="mt-6">
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
             {getReviewsByStatus('invited').length === 0 && <p>No pending invitations.</p>}
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getReviewsByStatus('accepted').map(({ manuscript, review }) => (
                <ReviewCard 
                  key={manuscript.id}
                  manuscript={manuscript}
                  review={review}
                  onSubmitReview={handleReviewSubmit}
                />
              ))}
            </div>
            {getReviewsByStatus('accepted').length === 0 && <p>No active reviews.</p>}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getReviewsByStatus('completed').map(({ manuscript, review }) => (
                <ReviewCard 
                  key={manuscript.id}
                  manuscript={manuscript}
                  review={review}
                />
              ))}
            </div>
             {getReviewsByStatus('completed').length === 0 && <p>No completed reviews.</p>}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}