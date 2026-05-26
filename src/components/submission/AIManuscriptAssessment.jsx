import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  FileText,
  Shield,
  ListChecks,
  Tag,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const ScoreCard = ({ score, title, description, icon: Icon, color }) => {
  const getColorClass = (score) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${getColorClass(score)}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600">{description}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Score</span>
            <span className="text-2xl font-bold text-slate-900">{score}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

const SuggestionItem = ({ suggestion, type = 'info' }) => {
  const icons = {
    error: XCircle,
    warning: AlertCircle,
    info: CheckCircle,
    success: CheckCircle
  };
  const colors = {
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-orange-600 bg-orange-50 border-orange-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    success: 'text-green-600 bg-green-50 border-green-200'
  };
  
  const Icon = icons[type];
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${colors[type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{suggestion.title}</p>
        <p className="text-sm mt-1 opacity-90">{suggestion.description}</p>
        {suggestion.original && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium">Original:</p>
            <p className="text-xs bg-white/50 p-2 rounded">{suggestion.original}</p>
            <p className="text-xs font-medium mt-2">Suggested:</p>
            <p className="text-xs bg-white/50 p-2 rounded">{suggestion.suggested}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PlagiarismResult = ({ result }) => {
  const getSeverity = (score) => {
    if (score < 10) return { level: 'Low Risk', color: 'green', icon: CheckCircle };
    if (score < 25) return { level: 'Moderate', color: 'amber', icon: AlertCircle };
    return { level: 'High Risk', color: 'red', icon: XCircle };
  };

  const severity = getSeverity(result.similarity_score);
  const Icon = severity.icon;

  return (
    <Card className={`border-2 border-${severity.color}-200`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className={`w-5 h-5 text-${severity.color}-600`} />
            Plagiarism Check Results
          </CardTitle>
          <Badge className={`bg-${severity.color}-100 text-${severity.color}-800 border-${severity.color}-300`}>
            {result.similarity_score}% Similarity
          </Badge>
        </div>
        <CardDescription>
          {severity.level} - Based on similarity analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50">
          <Icon className={`w-6 h-6 text-${severity.color}-600`} />
          <div>
            <p className="font-semibold text-slate-900">{severity.level}</p>
            <p className="text-sm text-slate-600">
              {result.similarity_score < 10 
                ? 'Your manuscript appears to be original with minimal similarity to existing sources.'
                : result.similarity_score < 25
                ? 'Some similarities detected. Review highlighted sections and ensure proper citations.'
                : 'High similarity detected. Significant revisions recommended before submission.'}
            </p>
          </div>
        </div>

        {result.sources && result.sources.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Similar Sources Found</h4>
            <div className="space-y-2">
              {result.sources.map((source, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{source.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{source.source}</p>
                  </div>
                  <Badge variant="outline">{source.similarity}% match</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AIManuscriptAssessment({ manuscript, onClose }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState('');
  const [copiedText, setCopiedText] = useState('');

  const runAssessment = async () => {
    setError('AI manuscript assessment is temporarily unavailable. Integration credits have been exhausted. Please review your manuscript manually using the checklist below.');
  };


  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const overallScore = assessment 
    ? Math.round((assessment.grammar_score + (100 - assessment.plagiarism.similarity_score) + assessment.checklist.completion_score) / 3)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Manuscript Assessment</CardTitle>
                <CardDescription>
                  Comprehensive pre-submission analysis powered by AI
                </CardDescription>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>Close</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!assessment && !isAnalyzing && (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Analyze</h3>
              <p className="text-slate-600 mb-6">
                Get instant AI-powered feedback on grammar, plagiarism, completeness, and discoverability
              </p>
              <Button 
                onClick={runAssessment}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start AI Assessment
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-slate-600">Analyzing your manuscript...</p>
              <p className="text-sm text-slate-500 mt-2">This may take 15-30 seconds</p>
            </div>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {assessment && (
        <>
          {/* Overall Score */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-4">Overall Assessment Score</h3>
              <div className="flex items-center justify-center gap-8">
                <div>
                  <p className="text-6xl font-bold">{overallScore}</p>
                  <p className="text-slate-300 mt-2">out of 100</p>
                </div>
                <div className="text-left space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {overallScore >= 80 ? <ThumbsUp className="w-4 h-4 text-green-400" /> : <ThumbsDown className="w-4 h-4 text-amber-400" />}
                    <span>
                      {overallScore >= 80 ? 'Excellent - Ready for submission' :
                       overallScore >= 60 ? 'Good - Minor improvements suggested' :
                       'Needs Work - Review recommendations'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <ScoreCard
              score={assessment.grammar_score}
              title="Grammar & Style"
              description="Writing quality assessment"
              icon={FileText}
            />
            <ScoreCard
              score={100 - assessment.plagiarism.similarity_score}
              title="Originality"
              description="Plagiarism check score"
              icon={Shield}
            />
            <ScoreCard
              score={assessment.checklist.completion_score}
              title="Completeness"
              description="Manuscript preparation"
              icon={ListChecks}
            />
          </div>

          {/* Detailed Results Tabs */}
          <Tabs defaultValue="grammar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="grammar">
                <FileText className="w-4 h-4 mr-2" />
                Grammar & Style
              </TabsTrigger>
              <TabsTrigger value="plagiarism">
                <Shield className="w-4 h-4 mr-2" />
                Plagiarism
              </TabsTrigger>
              <TabsTrigger value="checklist">
                <ListChecks className="w-4 h-4 mr-2" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                <Tag className="w-4 h-4 mr-2" />
                Suggestions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grammar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Grammar & Style Analysis</CardTitle>
                  <CardDescription>
                    {assessment.grammar_issues.length} issues identified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assessment.grammar_issues.length > 0 ? (
                    assessment.grammar_issues.map((issue, idx) => (
                      <SuggestionItem key={idx} suggestion={issue} type={issue.type} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p>Excellent! No major grammar or style issues detected.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plagiarism">
              <PlagiarismResult result={assessment.plagiarism} />
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manuscript Preparation Checklist</CardTitle>
                  <CardDescription>
                    Completion score: {assessment.checklist.completion_score}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assessment.checklist.items.map((item, idx) => {
                    const statusConfig = {
                      complete: { icon: CheckCircle, color: 'green', bg: 'bg-green-50' },
                      incomplete: { icon: XCircle, color: 'red', bg: 'bg-red-50' },
                      needs_improvement: { icon: AlertCircle, color: 'amber', bg: 'bg-amber-50' }
                    };
                    const config = statusConfig[item.status];
                    const Icon = config.icon;

                    return (
                      <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg ${config.bg}`}>
                        <Icon className={`w-5 h-5 text-${config.color}-600 flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.item}</p>
                          <p className="text-sm text-slate-600 mt-1">{item.note}</p>
                        </div>
                        <Badge className={`bg-${config.color}-100 text-${config.color}-800`}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Improvements</CardTitle>
                  <CardDescription>
                    Optimized abstract and keywords for better discoverability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Improved Abstract</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(assessment.suggestions.improved_abstract, 'abstract')}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copiedText === 'abstract' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {assessment.suggestions.improved_abstract}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Suggested Keywords</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(assessment.suggestions.suggested_keywords.join(', '), 'keywords')}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copiedText === 'keywords' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assessment.suggestions.suggested_keywords.map((keyword, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-200">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Why These Improvements?</h4>
                    <p className="text-sm text-blue-800">{assessment.suggestions.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAssessment(null)}>
              Run New Assessment
            </Button>
            {onClose && (
              <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700">
                Continue to Submission
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}