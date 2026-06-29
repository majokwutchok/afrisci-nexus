import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Check, Download, Upload, FileText, BookOpen, Star, AlertCircle, X, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const RATING_CRITERIA = [
  { key: "originality",  label: "Originality & Novelty",     description: "How original and novel is the research?",           weight: 0.25 },
  { key: "methodology",  label: "Methodology & Rigor",       description: "Are the methods sound and well-described?",         weight: 0.30 },
  { key: "clarity",      label: "Clarity & Presentation",    description: "Is the paper well-written and clearly structured?", weight: 0.15 },
  { key: "significance", label: "Significance & Impact",     description: "How significant is the contribution to the field?", weight: 0.20 },
  { key: "references",   label: "Literature & References",   description: "Are references adequate and up to date?",           weight: 0.10 },
];

function RatingRow({ criterion, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {criterion.label}
            <span className="ml-2 text-xs font-normal text-slate-400">weight {Math.round(criterion.weight * 100)}%</span>
          </p>
          <p className="text-xs text-slate-500">{criterion.description}</p>
        </div>
        <span className="text-lg font-bold text-teal-600 w-10 text-right">{value ?? "—"}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => onChange(score)}
            className={`flex-1 h-10 rounded-lg border-2 font-semibold text-sm transition-all duration-150 ${
              value === score
                ? "bg-teal-600 border-teal-600 text-white shadow-md"
                : "bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-600"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-400 px-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

export default function ReviewForm({ manuscript, review, onSubmit, onCancel }) {
  const [ratings, setRatings] = useState({
    originality: review?.ratings?.originality ?? null,
    methodology: review?.ratings?.methodology ?? null,
    clarity: review?.ratings?.clarity ?? null,
    significance: review?.ratings?.significance ?? null,
    references: review?.ratings?.references ?? null,
  });
  const [comments, setComments] = useState(review?.comments || "");
  const [confidentialComments, setConfidentialComments] = useState(review?.confidential_comments || "");
  const [recommendation, setRecommendation] = useState(review?.recommendation || "");
  const [annotatedFile, setAnnotatedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showAbstract, setShowAbstract] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setRating = (key, value) => setRatings((prev) => ({ ...prev, [key]: value }));

  const avgRating = () => {
    const vals = Object.values(ratings).filter((v) => v !== null);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const weightedAvg = () => {
    let total = 0, weight = 0;
    RATING_CRITERIA.forEach(c => {
      if (ratings[c.key] != null) {
        total += ratings[c.key] * c.weight;
        weight += c.weight;
      }
    });
    return weight > 0 ? (total / weight).toFixed(2) : null;
  };

  const allRated = RATING_CRITERIA.every((c) => ratings[c.key] !== null);
  const canSubmit = allRated && recommendation && comments.trim().length >= 50;

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAnnotatedFile(file_url);
    } catch {
      setShowUrlInput(true);
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let total = 0, weight = 0;
    RATING_CRITERIA.forEach(c => {
      if (ratings[c.key] != null) { total += ratings[c.key] * c.weight; weight += c.weight; }
    });
    const wScore = weight > 0 ? parseFloat((total / weight).toFixed(2)) : null;
    await onSubmit({
      comments,
      confidential_comments: confidentialComments,
      recommendation,
      ratings,
      weighted_score: wScore,
      annotated_file: annotatedFile,
    });
    setSubmitting(false);
  };

  const progress = (Object.values(ratings).filter((v) => v !== null).length / 5) * 50
    + (comments.trim().length >= 50 ? 25 : 0)
    + (recommendation ? 25 : 0);

  return (
    <div className="space-y-6">
      {/* Manuscript Info */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-teal-50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">{manuscript.title}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-1">
            {manuscript.keywords?.slice(0, 4).map((kw) => (
              <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex gap-3">
            {manuscript.manuscript_file_url && (
              <a href={manuscript.manuscript_file_url} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="w-4 h-4 mr-2" /> Download Manuscript
                </Button>
              </a>
            )}
            <Link to={createPageUrl("ReviewGuidelines")} className="flex-1">
              <Button variant="ghost" className="w-full text-teal-600" size="sm">
                <BookOpen className="w-4 h-4 mr-2" /> Guidelines
              </Button>
            </Link>
          </div>
          <button
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            onClick={() => setShowAbstract(!showAbstract)}
          >
            {showAbstract ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showAbstract ? "Hide" : "Show"} Abstract
          </button>
          {showAbstract && (
            <p className="text-sm text-slate-700 bg-white/70 rounded-lg p-3 border border-slate-200">
              {manuscript.abstract}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-slate-700">
          <span>Review Completion</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Numerical Ratings */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Evaluation Criteria (1 = Poor, 5 = Excellent)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {RATING_CRITERIA.map((c) => (
            <RatingRow key={c.key} criterion={c} value={ratings[c.key]} onChange={(v) => setRating(c.key, v)} />
          ))}
          {avgRating() && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Simple Average</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xl font-bold ${
                    avgRating() >= 4 ? "text-green-600" : avgRating() >= 3 ? "text-amber-600" : "text-red-600"
                  }`}>{avgRating()}</span>
                  <span className="text-slate-400 text-sm">/ 5</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Weighted Score</span>
                <div className="flex items-center gap-1">
                  <span className={`text-2xl font-bold ${
                    weightedAvg() >= 4 ? "text-green-600" : weightedAvg() >= 3 ? "text-amber-600" : "text-red-600"
                  }`}>{weightedAvg()}</span>
                  <span className="text-slate-400 text-sm">/ 5</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Comments for Authors *</CardTitle>
          <p className="text-xs text-slate-500">Minimum 50 characters. Be constructive and specific.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Provide detailed, constructive feedback for the authors. Include specific suggestions for improvement, questions about methodology, and observations about clarity..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className={`text-xs mt-1 ${comments.length >= 50 ? "text-green-600" : "text-slate-400"}`}>
              {comments.length} characters {comments.length < 50 ? `(${50 - comments.length} more needed)` : "✓"}
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold">Confidential Comments for Editor</Label>
            <p className="text-xs text-slate-500 mb-2">Not visible to authors.</p>
            <Textarea
              placeholder="Share any concerns or notes exclusively with the editor..."
              value={confidentialComments}
              onChange={(e) => setConfidentialComments(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Annotated PDF Upload */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-600" />
            Upload Annotated File (optional)
          </CardTitle>
          <p className="text-xs text-slate-500">Upload your annotated copy of the manuscript (PDF or Word).</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showUrlInput ? (
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files[0])}
              disabled={uploading}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                ⚠ Direct upload unavailable (credits exhausted until 2026-07-25). Paste a public link to your annotated file.
              </p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => { if (manualUrl.trim()) { setAnnotatedFile(manualUrl.trim()); setShowUrlInput(false); } }}>
                  Save
                </Button>
              </div>
              <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => setShowUrlInput(false)}>← Try file upload instead</button>
            </div>
          )}
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-teal-600">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              Uploading file...
            </div>
          )}
          {annotatedFile && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Annotated file linked successfully.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Final Recommendation *</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={recommendation} onValueChange={setRecommendation}>
            <SelectTrigger>
              <SelectValue placeholder="Select your recommendation..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accept">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Accept</Badge>
                  <span className="text-xs">Ready for publication as-is</span>
                </div>
              </SelectItem>
              <SelectItem value="minor_revision">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Minor Revision</Badge>
                  <span className="text-xs">Small improvements needed</span>
                </div>
              </SelectItem>
              <SelectItem value="major_revision">
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800">Major Revision</Badge>
                  <span className="text-xs">Significant changes required</span>
                </div>
              </SelectItem>
              <SelectItem value="reject">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Reject</Badge>
                  <span className="text-xs">Not suitable for publication</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Validation notice */}
      {!canSubmit && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            {!allRated && "Please rate all 5 evaluation criteria. "}
            {comments.trim().length < 50 && "Author comments must be at least 50 characters. "}
            {!recommendation && "Please select a recommendation."}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </div>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Submit Review
            </>
          )}
        </Button>
      </div>
    </div>
  );
}