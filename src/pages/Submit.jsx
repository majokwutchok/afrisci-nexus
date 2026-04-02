import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Journal } from "@/entities/Journal";
import { Manuscript } from "@/entities/Manuscript";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UniversalSubmissionForm from "../components/submission/UniversalSubmissionForm";
import AIManuscriptAssessment from "../components/submission/AIManuscriptAssessment";
import AIJournalRecommender from "../components/submission/AIJournalRecommender";

export default function Submit() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [draftManuscript, setDraftManuscript] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentManuscript, setCurrentManuscript] = useState(null);

  useEffect(() => {
    loadJournals();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        setUserProfile(user);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadJournals = async () => {
    try {
      const data = await Journal.list('-created_date');
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

      await Manuscript.create({
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
      setError("Failed to submit manuscript. Please try again.");
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit Your Manuscript</h1>
          <p className="text-lg text-slate-600">AI-powered submission with intelligent journal matching</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">AI Manuscript Assessment</h3>
                  <p className="text-sm text-slate-600">Get instant feedback on grammar, plagiarism, and discoverability before submission</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setDraftManuscript({
                    title: "Sample Manuscript Title",
                    abstract: "This is a sample abstract for demonstration purposes.",
                    keywords: ["sample", "demo"]
                  });
                  setShowAssessment(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try Assessment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Journal Recommender */}
        {userProfile && journals.length > 0 && (
          <div className="mb-8">
            <AIJournalRecommender
              authorProfile={userProfile}
              manuscript={currentManuscript || {
                title: '',
                abstract: '',
                keywords: [],
                field: ''
              }}
              journals={journals}
              onRecommendationsReady={(recs) => {
                // Store recommendations for later use
              }}
              onSelectJournal={(journal) => {
                // Can be used to pre-select journal in form
              }}
            />
          </div>
        )}

        <UniversalSubmissionForm
          onSubmit={handleSubmit}
          journals={journals}
          isLoading={isLoading}
          setError={setError}
          onManuscriptChange={setCurrentManuscript}
        />
      </div>
    </div>
  );
}