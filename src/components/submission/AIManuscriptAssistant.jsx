import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  FileText, 
  CheckCircle, 
  Tag, 
  Mail,
  Loader2,
  Copy,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIManuscriptAssistant({ 
  manuscriptTitle, 
  manuscriptAbstract, 
  manuscriptFileUrl,
  journalTitle,
  authors,
  onKeywordsSuggested 
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState("");
  const [grammarCheck, setGrammarCheck] = useState(null);
  const [suggestedKeywords, setSuggestedKeywords] = useState([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");

  const analyzeManuScript = async () => {
    setError('AI manuscript analysis is temporarily unavailable. Integration credits have been exhausted. Please review your manuscript manually.');
  };


  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const applyKeywords = () => {
    if (onKeywordsSuggested) {
      onKeywordsSuggested(suggestedKeywords);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Manuscript Assistant
        </CardTitle>
        <p className="text-sm text-slate-600">
          Get AI-powered insights, suggestions, and assistance for your submission
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={analyzeManuScript}
          disabled={isAnalyzing || !manuscriptAbstract}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Manuscript...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Manuscript with AI
            </>
          )}
        </Button>

        {(summary || grammarCheck || suggestedKeywords.length > 0 || coverLetter) && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="grammar" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Grammar
              </TabsTrigger>
              <TabsTrigger value="keywords" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                Keywords
              </TabsTrigger>
              <TabsTrigger value="cover" className="text-xs">
                <Mail className="w-3 h-3 mr-1" />
                Cover Letter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-3">
              {summary && (
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">Manuscript Summary</h4>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(summary)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="grammar" className="space-y-3">
              {grammarCheck && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Overall Quality</p>
                      <Badge className={
                        grammarCheck.overall_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                        grammarCheck.overall_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                        grammarCheck.overall_quality === 'needs_improvement' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {grammarCheck.overall_quality}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">Readability</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {grammarCheck.readability_score}/10
                      </p>
                    </div>
                  </div>

                  {grammarCheck.issues && grammarCheck.issues.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Issues Found</h4>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {grammarCheck.issues.map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {grammarCheck.suggestions && grammarCheck.suggestions.length > 0 && (
                    <div className="p-4 bg-white rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Suggestions</h4>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {grammarCheck.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="keywords" className="space-y-3">
              {suggestedKeywords.length > 0 && (
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">AI-Suggested Keywords</h4>
                      <Button size="sm" onClick={applyKeywords}>
                        Apply All
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedKeywords.map((keyword, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-purple-100"
                          onClick={() => onKeywordsSuggested && onKeywordsSuggested([keyword])}
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Alert>
                    <Tag className="h-4 w-4" />
                    <AlertDescription>
                      Click individual keywords to add them one by one, or use "Apply All" to add all suggestions.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cover" className="space-y-3">
              {coverLetter && (
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Draft Cover Letter</h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(coverLetter)}
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <Textarea 
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={12}
                      className="text-sm font-mono"
                    />
                  </div>
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      This is a draft cover letter. Please review and personalize it before submission.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}