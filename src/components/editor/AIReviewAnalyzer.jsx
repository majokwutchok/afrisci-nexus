import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIReviewAnalyzer({ manuscript, onDecisionSuggested }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeReviews = async () => {
    if (!manuscript.review_history || manuscript.review_history.length === 0) {
      setAnalysis({ error: 'No reviews available to analyze' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const completedReviews = manuscript.review_history.filter(r => r.status === 'completed');
      
      if (completedReviews.length === 0) {
        setAnalysis({ error: 'No completed reviews available to analyze' });
        setIsAnalyzing(false);
        return;
      }

      const reviewsText = completedReviews.map((review, idx) => `
Reviewer ${idx + 1}:
Recommendation: ${review.recommendation}
Comments: ${review.comments || 'No comments provided'}
Confidential Comments: ${review.confidential_comments || 'None'}
      `).join('\n\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `As an editorial assistant AI, analyze the following peer reviews for manuscript "${manuscript.title}":

${reviewsText}

Provide a comprehensive analysis including:
1. Summary of key points from all reviewers
2. Areas of consensus and disagreement
3. Any potential bias indicators (personal attacks, irrelevant criticism, inconsistent logic)
4. Confidence score for each reviewer's feedback (0-100)
5. Suggested editorial decision based on the reviews
6. Reasoning for the suggested decision

Be objective and thorough.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            consensus_points: { type: 'array', items: { type: 'string' } },
            disagreement_points: { type: 'array', items: { type: 'string' } },
            bias_flags: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  reviewer_index: { type: 'number' },
                  issue: { type: 'string' },
                  severity: { type: 'string' }
                }
              }
            },
            reviewer_confidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  reviewer_index: { type: 'number' },
                  confidence_score: { type: 'number' },
                  reasoning: { type: 'string' }
                }
              }
            },
            suggested_decision: { type: 'string' },
            decision_reasoning: { type: 'string' },
            overall_consensus_score: { type: 'number' }
          }
        }
      });

      setAnalysis(response);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      setAnalysis({ error: 'Failed to analyze reviews. Please try again.' });
    }

    setIsAnalyzing(false);
  };

  const getDecisionIcon = (decision) => {
    switch (decision?.toLowerCase()) {
      case 'accept':
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case 'reject':
        return <ThumbsDown className="w-5 h-5 text-red-600" />;
      case 'minor_revision':
      case 'major_revision':
        return <Minus className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision?.toLowerCase()) {
      case 'accept':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'reject':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'minor_revision':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'major_revision':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const formatDecision = (decision) => {
    return decision?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || decision;
  };

  if (!manuscript.review_history || manuscript.review_history.length === 0) {
    return (
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Review Analysis
            <Badge className="bg-purple-600 text-white">AI-Powered</Badge>
          </CardTitle>
          <CardDescription>
            AI-powered analysis of peer reviews to assist editorial decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No reviews available yet. Reviews must be completed before analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Review Analysis
              <Badge className="bg-purple-600 text-white">AI-Powered</Badge>
            </CardTitle>
            <CardDescription>
              Get AI-powered insights from peer reviews to make informed editorial decisions
            </CardDescription>
          </div>
          <Button
            onClick={analyzeReviews}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Reviews
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-slate-600">Analyzing {manuscript.review_history.filter(r => r.status === 'completed').length} peer reviews...</p>
            <p className="text-sm text-slate-500">This may take a few moments</p>
          </div>
        )}

        {analysis && !analysis.error && (
          <div className="space-y-6">
            {/* Overall Consensus Score */}
            <div className="p-4 rounded-lg bg-white border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Overall Consensus</h4>
                <Badge className="text-lg px-3 py-1 bg-purple-600 text-white">
                  {analysis.overall_consensus_score}%
                </Badge>
              </div>
              <Progress value={analysis.overall_consensus_score} className="h-2" />
              <p className="text-sm text-slate-600 mt-2">
                {analysis.overall_consensus_score >= 80 ? 'Strong agreement among reviewers' :
                 analysis.overall_consensus_score >= 60 ? 'Moderate agreement among reviewers' :
                 analysis.overall_consensus_score >= 40 ? 'Mixed feedback from reviewers' :
                 'Significant disagreement among reviewers'}
              </p>
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-lg bg-white border-2 border-blue-200">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Executive Summary
              </h4>
              <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Suggested Decision */}
            <div className={`p-6 rounded-lg border-2 ${getDecisionColor(analysis.suggested_decision)}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg">
                  {getDecisionIcon(analysis.suggested_decision)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">
                    Suggested Decision: {formatDecision(analysis.suggested_decision)}
                  </h4>
                  <p className="text-sm leading-relaxed">{analysis.decision_reasoning}</p>
                  {onDecisionSuggested && (
                    <Button
                      onClick={() => onDecisionSuggested(analysis.suggested_decision)}
                      className="mt-4 bg-white hover:bg-slate-50 text-slate-900 border"
                      size="sm"
                    >
                      Apply This Decision
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Consensus Points */}
            {analysis.consensus_points && analysis.consensus_points.length > 0 && (
              <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Areas of Agreement
                </h4>
                <ul className="space-y-2">
                  {analysis.consensus_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-green-800">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disagreement Points */}
            {analysis.disagreement_points && analysis.disagreement_points.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Areas of Disagreement
                </h4>
                <ul className="space-y-2">
                  {analysis.disagreement_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-800">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviewer Confidence Scores */}
            {analysis.reviewer_confidence && analysis.reviewer_confidence.length > 0 && (
              <div className="p-4 rounded-lg bg-white border-2 border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                  Reviewer Confidence Assessment
                </h4>
                <div className="space-y-3">
                  {analysis.reviewer_confidence.map((reviewer, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">
                          Reviewer {reviewer.reviewer_index + 1}
                        </span>
                        <Badge 
                          className={`${
                            reviewer.confidence_score >= 80 ? 'bg-green-500' :
                            reviewer.confidence_score >= 60 ? 'bg-blue-500' :
                            reviewer.confidence_score >= 40 ? 'bg-amber-500' :
                            'bg-red-500'
                          } text-white`}
                        >
                          {reviewer.confidence_score}% confidence
                        </Badge>
                      </div>
                      <Progress value={reviewer.confidence_score} className="h-2 mb-2" />
                      <p className="text-sm text-slate-600">{reviewer.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bias Flags */}
            {analysis.bias_flags && analysis.bias_flags.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <Shield className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <p className="font-semibold text-red-900 mb-3">⚠️ Potential Bias Detected</p>
                  <div className="space-y-2">
                    {analysis.bias_flags.map((flag, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-red-900">
                            Reviewer {flag.reviewer_index + 1}
                          </span>
                          <Badge 
                            className={`${
                              flag.severity === 'high' ? 'bg-red-600' :
                              flag.severity === 'medium' ? 'bg-amber-600' :
                              'bg-yellow-600'
                            } text-white`}
                          >
                            {flag.severity} severity
                          </Badge>
                        </div>
                        <p className="text-sm text-red-800">{flag.issue}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-red-800 mt-3">
                    Please review these flagged items carefully before making a decision.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                This AI analysis is meant to assist your decision-making process. Please use your editorial judgment and expertise when making final decisions.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {analysis && analysis.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{analysis.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}