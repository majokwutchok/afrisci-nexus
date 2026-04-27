import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Sparkles, Globe } from "lucide-react";
import SubmissionWizard from "../components/submission/SubmissionWizard";
import AIManuscriptAssessment from "../components/submission/AIManuscriptAssessment";

export default function Submit() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [draftManuscript, setDraftManuscript] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadJournals();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await base44.auth.me();
      if (user) setUserProfile(user);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadJournals = async () => {
    try {
      const data = await base44.entities.Journal.list('-created_date');
      setJournals(data.filter(j => j.status === 'active'));
    } catch (error) {
      console.error("Error loading journals:", error);
      // Optionally set an error state here if journal loading fails
      setError("Failed to load available journals.");
    }
  };

  const handleSubmit = async (manuscriptData) => {
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const timeline = [{
        status: 'submitted',
        date: new Date().toISOString().split('T')[0],
        actor: 'Author',
        comment: 'Manuscript submitted for review'
      }];

      await base44.entities.Manuscript.create({
        ...manuscriptData,
        status: 'submitted',
        submission_date: new Date().toISOString().split('T')[0],
        timeline
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("MyManuscripts"));
      }, 2000);
    } catch (error) {
    console.error("Submission error:", error);
    setError(error.message || "Failed to submit manuscript. Please try again.");
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center border-0 shadow-2xl bg-white">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Manuscript Submitted!</h2>
            <p className="text-slate-600 mb-4">
              Your manuscript has been successfully submitted for peer review. You will receive updates via email.
            </p>
            <div className="text-sm text-slate-500">
              Redirecting to your manuscripts...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showAssessment && draftManuscript) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <AIManuscriptAssessment 
            manuscript={draftManuscript}
            onClose={() => setShowAssessment(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Author registration gate */}
        {userProfile && userProfile.author_application_status !== "approved" && !userProfile.author_registered && (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <AlertCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Author Registration Required</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                You need to register as an author before submitting a manuscript.
                {userProfile.author_application_status === "pending" && " Your application is currently under review — you'll be notified once approved."}
              </p>
            </div>
            {userProfile.author_application_status !== "pending" && (
              <Link to={createPageUrl("Apply?role=author")}>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white flex-shrink-0">Register as Author</Button>
              </Link>
            )}
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit Your Manuscript</h1>
          <p className="text-lg text-slate-600">AI-powered submission with intelligent journal matching</p>
        </div>

        {/* Cross-submission options */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-sm font-semibold text-slate-600 self-center">Submit to:</span>
          <Link to={createPageUrl("Submit")}>
            <button className="px-4 py-2 rounded-lg bg-blue-900 text-white text-sm font-medium">AfriSci Nexus</button>
          </Link>
          <Link to={createPageUrl("SpringerNatureSubmission")}>
            <button className="px-4 py-2 rounded-lg border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 text-sm font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Springer Nature
            </button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <SubmissionWizard
          journals={journals}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}