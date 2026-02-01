
import React, { useState, useEffect } from "react";
import { Journal } from "@/entities/Journal";
import { Manuscript } from "@/entities/Manuscript";
// This import is likely unused now, but kept as it was in original and not explicitly removed by outline
import { Card, CardContent } from "@/components/ui/card"; // These imports are likely unused now, but kept as they were in original and not explicitly removed by outline
// These imports are likely unused now, but kept as they were in original and not explicitly removed by outline
// These imports are likely unused now, but kept as they were in original and not explicitly removed by outline
// Button might still be used for the success message or other UI elements, so keeping.
// Likely unused, but kept.
// Likely unused, but kept.
// Likely unused, but kept.
import { Alert, AlertDescription } from "@/components/ui/alert";
// Likely unused, but kept.
import {
  AlertCircle,
  CheckCircle
} from "lucide-react"; // Some of these icons (Plus, X, FileText, User, Mail, Building) are likely unused now, but kept as they were in original. Upload, AlertCircle, CheckCircle are still used.
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UniversalSubmissionForm from "../components/submission/UniversalSubmissionForm";

export default function Submit() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadJournals();
  }, []);

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

        <UniversalSubmissionForm
          onSubmit={handleSubmit}
          journals={journals}
          isLoading={isLoading} // Pass isLoading to allow the form to disable its submit button
          setError={setError} // Pass setError to allow the form to report errors
        />
      </div>
    </div>
  );
}
