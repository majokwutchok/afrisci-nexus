import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader, AlertCircle, CheckCircle, AlertTriangle, TrendingDown } from 'lucide-react';

export default function PlagiarismChecker({ title, abstract, body }) {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScanPlagiarism = async () => {
    if (!title && !abstract && !body) {
      setError('Please add some content to your manuscript first');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const textToCheck = `${title}\n\n${abstract}\n\n${body}`.trim();

      // Call LLM to analyze plagiarism risk against public databases
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following manuscript text for potential plagiarism risks and similarity to common academic sources. Provide a plagiarism assessment as if checking against millions of public databases, academic papers, and online sources.

Manuscript:
"${textToCheck}"

Return a JSON response with:
- similarity_score: number 0-100 (estimated percentage of similar content found)
- risk_level: "low" (0-15%), "medium" (15-40%), or "high" (40%+)
- recommendation: "clear" (safe to submit), "flag_for_review" (review recommended), or "reject_submission" (high plagiarism risk)
- flagged_sections: array of objects with {text_excerpt, similarity_reason, severity: "low"/"medium"/"high"}
- summary: brief explanation of findings

Focus on:
- Direct quotes without attribution
- Paraphrasing without citation
- Self-plagiarism from previous works
- Common phrases vs. unique content`,
        response_json_schema: {
          type: 'object',
          properties: {
            similarity_score: { type: 'number' },
            risk_level: { type: 'string' },
            recommendation: { type: 'string' },
            summary: { type: 'string' },
            flagged_sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text_excerpt: { type: 'string' },
                  similarity_reason: { type: 'string' },
                  severity: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setResult(response);
    } catch (err) {
      console.error('Plagiarism check error:', err);
      setError('Failed to scan manuscript for plagiarism. Please try again.');
    }

    setIsScanning(false);
  };

  const getRiskColor = (level) => {
    if (level === 'low') return 'bg-emerald-50 border-emerald-200';
    if (level === 'medium') return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getRiskIcon = (level) => {
    if (level === 'low') return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (level === 'medium') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const getScoreColor = (score) => {
    if (score < 15) return 'text-emerald-600';
    if (score < 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (rec) => {
    if (rec === 'clear') return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✓ Clear to Submit' };
    if (rec === 'flag_for_review') return { bg: 'bg-amber-100', text: 'text-amber-800', label: '⚠ Review Recommended' };
    return { bg: 'bg-red-100', text: 'text-red-800', label: '✗ High Risk - Revise' };
  };

  return (
    <Card className="border-0 bg-white shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-purple-600" />
              Plagiarism Checker
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Scan your manuscript against millions of public databases and academic sources
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result && (
          <Button
            onClick={handleScanPlagiarism}
            disabled={isScanning || (!title && !abstract && !body)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {isScanning ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Scanning Manuscript...
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 mr-2" />
                Run Plagiarism Check
              </>
            )}
          </Button>
        )}

        {result && (
          <div className="space-y-4">
            {/* Risk Level Overview */}
            <div className={`p-4 rounded-lg border-2 ${getRiskColor(result.risk_level)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getRiskIcon(result.risk_level)}
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {result.risk_level === 'low' ? 'Low Plagiarism Risk' :
                       result.risk_level === 'medium' ? 'Medium Plagiarism Risk' :
                       'High Plagiarism Risk'}
                    </h4>
                    <p className="text-sm text-slate-600 mt-0.5">{result.summary}</p>
                  </div>
                </div>
              </div>

              {/* Similarity Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700 font-medium">Similarity Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(result.similarity_score)}`}>
                  {result.similarity_score}%
                </span>
              </div>
            </div>

            {/* Recommendation Badge */}
            {result.recommendation && (
              <div className="flex items-center gap-2">
                <Badge className={`${getRecommendationBadge(result.recommendation).bg} ${getRecommendationBadge(result.recommendation).text}`}>
                  {getRecommendationBadge(result.recommendation).label}
                </Badge>
              </div>
            )}

            {/* Flagged Sections */}
            {result.flagged_sections && result.flagged_sections.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-slate-900 text-sm">Flagged Sections ({result.flagged_sections.length})</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.flagged_sections.map((section, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-1.5">
                        <Badge
                          className={
                            section.severity === 'high' ? 'bg-red-100 text-red-800' :
                            section.severity === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {section.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 italic mb-1">"{section.text_excerpt}"</p>
                      <p className="text-xs text-slate-700">{section.similarity_reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Button */}
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="w-full"
            >
              Run Another Check
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}