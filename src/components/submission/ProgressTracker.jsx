import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  Users, 
  Edit, 
  CheckCircle, 
  XCircle,
  Eye,
  Calendar
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const statusConfig = {
  submitted: {
    icon: FileText,
    color: "bg-blue-100 text-blue-800",
    title: "Submitted",
    description: "Manuscript submitted and awaiting initial review"
  },
  editor_assigned: {
    icon: Eye,
    color: "bg-purple-100 text-purple-800",
    title: "Editor Assigned",
    description: "An editor has been assigned to handle your submission"
  },
  under_review: {
    icon: Users,
    color: "bg-yellow-100 text-yellow-800",
    title: "Under Peer Review",
    description: "Manuscript is being reviewed by expert peers"
  },
  revision_requested: {
    icon: Edit,
    color: "bg-orange-100 text-orange-800",
    title: "Revision Requested",
    description: "Reviewers have requested changes to your manuscript"
  },
  revised: {
    icon: Clock,
    color: "bg-indigo-100 text-indigo-800",
    title: "Revised & Resubmitted",
    description: "Your revised manuscript is under review"
  },
  accepted: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    title: "Accepted",
    description: "Congratulations! Your manuscript has been accepted"
  },
  rejected: {
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    title: "Rejected",
    description: "Unfortunately, your manuscript was not accepted"
  },
  published: {
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-800",
    title: "Published",
    description: "Your article is now published and available online"
  }
};

const TimelineItem = ({ status, date, actor, comment, isActive, isCompleted }) => {
  const config = statusConfig[status] || {
    icon: FileText,
    color: "bg-slate-100 text-slate-800",
    title: status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown',
    description: ""
  };
  const Icon = config.icon;
  
  return (
    <div className="flex items-start gap-4 pb-6">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isActive ? 'bg-emerald-600 text-white' :
        isCompleted ? 'bg-emerald-100 text-emerald-700' :
        'bg-slate-100 text-slate-400'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h4 className={`font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>
            {config.title}
          </h4>
          {date && (
            <span className="text-sm text-slate-500">
              {format(new Date(date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mb-2">{config.description}</p>
        <p className="text-xs text-slate-500">By: {actor || "Chief Editor"}</p>
        {comment && (
          <p className="text-sm bg-slate-50 p-2 rounded-lg mt-2 italic">{comment}</p>
        )}
      </div>
    </div>
  );
};

export default function ProgressTracker({ manuscript, showReviewDetails = false }) {
  const timeline = manuscript.timeline || [];
  const currentStatus = manuscript.status;
  const currentConfig = statusConfig[currentStatus] || {
    icon: FileText,
    color: "bg-slate-100 text-slate-800",
    title: currentStatus ? currentStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown',
    description: ""
  };
  
  const statusOrder = ['submitted', 'editor_assigned', 'under_review', 'revision_requested', 'revised', 'accepted', 'published'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  const estimatedDays = {
    submitted: 7,
    editor_assigned: 14,
    under_review: 45,
    revision_requested: 30,
    revised: 21,
    accepted: 14,
    published: 30
  };

  const submissionDate = manuscript.submission_date ? new Date(manuscript.submission_date) : new Date();
  const daysSinceSubmission = differenceInDays(new Date(), submissionDate);

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <Card className="border-0 bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Manuscript Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge className={currentConfig.color} variant="secondary">
                {currentConfig.title}
              </Badge>
              <p className="text-sm text-slate-600 mt-1">
                {currentConfig.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{daysSinceSubmission}</p>
              <p className="text-sm text-slate-500">days since submission</p>
            </div>
          </div>
          
          {estimatedDays[currentStatus] && (
            <div className="bg-white rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Estimated timeline for {currentConfig.title.toLowerCase()}:</span>
                <span className="text-sm text-blue-600 font-semibold">
                  {estimatedDays[currentStatus]} days
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200"></div>
            {timeline.length > 0 ? (
              timeline.map((item, index) => (
                <TimelineItem
                  key={index}
                  status={item.status}
                  date={item.date}
                  actor={item.actor}
                  comment={item.comment}
                  isActive={item.status === currentStatus}
                  isCompleted={statusOrder.indexOf(item.status) < currentIndex}
                />
              ))
            ) : (
              <TimelineItem
                status={currentStatus}
                date={manuscript.submission_date}
                isActive={true}
                isCompleted={false}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Details */}
      {showReviewDetails && manuscript.review_history && manuscript.review_history.length > 0 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Review Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {manuscript.review_history.map((review, index) => (
                <div key={index} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {manuscript.review_type === 'open_review' ? review.reviewer_name || `Reviewer ${index + 1}` : `Reviewer ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          Invited: {format(new Date(review.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      review.status === 'completed' ? 'default' :
                      review.status === 'accepted' ? 'secondary' :
                      review.status === 'declined' ? 'destructive' : 'outline'
                    }>
                      {review.status}
                    </Badge>
                  </div>
                  
                  {review.reminder_count > 0 && (
                    <p className="text-xs text-amber-600 mb-2">
                      {review.reminder_count} reminder{review.reminder_count > 1 ? 's' : ''} sent
                    </p>
                  )}
                  
                  {review.review_due_date && (
                    <p className="text-xs text-slate-500 mb-2">
                      Due: {format(new Date(review.review_due_date), 'MMM d, yyyy')}
                    </p>
                  )}
                  
                  {review.recommendation && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-sm font-medium mb-1">
                        Recommendation: <Badge variant="outline">{review.recommendation.replace('_', ' ')}</Badge>
                      </p>
                      {review.comments && manuscript.review_type !== 'double_blind' && (
                        <p className="text-sm text-slate-700">{review.comments}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}