import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  Sparkles,
  FileSearch,
  BookOpen,
  Users,
  Loader2,
  Info,
  Shield,
  X,
  Plus
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ManuscriptPreparationChecklist = ({ checklist, onUpdate }) => {
  const checklistItems = [
    { id: 'title', label: 'Clear and descriptive title', category: 'structure' },
    { id: 'abstract', label: 'Abstract within word limit (250-300 words)', category: 'structure' },
    { id: 'keywords', label: 'At least 3-5 relevant keywords', category: 'structure' },
    { id: 'introduction', label: 'Clear introduction and research objectives', category: 'content' },
    { id: 'methodology', label: 'Detailed methodology section', category: 'content' },
    { id: 'results', label: 'Results clearly presented with figures/tables', category: 'content' },
    { id: 'discussion', label: 'Discussion and interpretation of findings', category: 'content' },
    { id: 'conclusion', label: 'Conclusion and future directions', category: 'content' },
    { id: 'references', label: 'All references properly cited and formatted', category: 'formatting' },
    { id: 'figures', label: 'All figures and tables numbered and labeled', category: 'formatting' },
    { id: 'ethics', label: 'Ethics approval statement (if applicable)', category: 'compliance' },
    { id: 'conflicts', label: 'Conflict of interest statement', category: 'compliance' },
    { id: 'funding', label: 'Funding sources acknowledged', category: 'compliance' },
    { id: 'data', label: 'Data availability statement', category: 'compliance' }
  ];

  const categories = {
    structure: { label: 'Structure', color: 'bg-blue-100 text-blue-800' },
    content: { label: 'Content', color: 'bg-emerald-100 text-emerald-800' },
    formatting: { label: 'Formatting', color: 'bg-purple-100 text-purple-800' },
    compliance: { label: 'Compliance', color: 'bg-amber-100 text-amber-800' }
  };

  const completedCount = Object.keys(checklist).filter(k => checklist[k]).length;
  const progress = (completedCount / checklistItems.length) * 100;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Manuscript Preparation Checklist
        </CardTitle>
        <CardDescription>
          Ensure your manuscript meets all requirements before submission
        </CardDescription>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">
              {completedCount} of {checklistItems.length} completed
            </span>
            <span className="text-slate-600 font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(categories).map(([catKey, catValue]) => {
          const items = checklistItems.filter(item => item.category === catKey);
          return (
            <div key={catKey}>
              <Badge className={`${catValue.color} mb-2`}>{catValue.label}</Badge>
              <div className="space-y-2 ml-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <Checkbox
                      id={item.id}
                      checked={checklist[item.id] || false}
                      onCheckedChange={(checked) => onUpdate({ ...checklist, [item.id]: checked })}
                    />
                    <label
                      htmlFor={item.id}
                      className={`text-sm cursor-pointer ${
                        checklist[item.id] ? 'text-slate-500 line-through' : 'text-slate-700'
                      }`}
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const PlagiarismChecker = ({ manuscriptText }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkPlagiarism = async () => {
    if (!manuscriptText || manuscriptText.length < 100) {
      setResult({ error: 'Please provide at least 100 characters of text to check.' });
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the following academic manuscript text for potential plagiarism concerns. 
        Check for:
        1. Overly generic or commonly used phrases that might appear in multiple sources
        2. Signs of potential unattributed content
        3. Areas that need proper citation
        4. Overall originality assessment
        
        Provide a similarity score (0-100%) and specific recommendations.
        
        Text to analyze:
        ${manuscriptText.substring(0, 5000)}
        
        Respond with analysis and recommendations.`,
        response_json_schema: {
          type: 'object',
          properties: {
            similarity_score: { type: 'number' },
            risk_level: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      setResult(response);
    } catch (error) {
      setResult({ error: 'Failed to check plagiarism. Please try again.' });
    }

    setIsChecking(false);
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          Plagiarism & Originality Check
          <Badge className="bg-purple-600 text-white">AI-Powered</Badge>
        </CardTitle>
        <CardDescription>
          Verify the originality of your manuscript content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkPlagiarism}
          disabled={isChecking || !manuscriptText}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Text...
            </>
          ) : (
            <>
              <FileSearch className="w-4 h-4 mr-2" />
              Check Originality
            </>
          )}
        </Button>

        {result && !result.error && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white border-2 border-purple-200">
              <div>
                <p className="text-sm text-slate-600 mb-1">Similarity Score</p>
                <p className="text-3xl font-bold text-slate-900">{result.similarity_score}%</p>
              </div>
              <Badge
                className={`text-lg px-4 py-2 ${
                  result.similarity_score < 15
                    ? 'bg-green-500'
                    : result.similarity_score < 30
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                } text-white`}
              >
                {result.risk_level}
              </Badge>
            </div>

            {result.concerns && result.concerns.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <p className="font-semibold text-amber-900 mb-2">Areas of Concern:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-800">
                    {result.concerns.map((concern, i) => (
                      <li key={i}>{concern}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <p className="font-semibold text-blue-900 mb-2">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {result && result.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{result.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const GrammarStyleChecker = ({ manuscriptText, onApplySuggestion }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const checkGrammarStyle = async () => {
    if (!manuscriptText || manuscriptText.length < 100) {
      setSuggestions({ error: 'Please provide at least 100 characters of text to check.' });
      return;
    }

    setIsChecking(true);
    setSuggestions(null);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `As an academic writing expert, analyze this manuscript excerpt for:
        1. Grammar and punctuation errors
        2. Style improvements for academic writing
        3. Clarity and readability issues
        4. Sentence structure recommendations
        5. Word choice suggestions
        
        Text to analyze:
        ${manuscriptText.substring(0, 3000)}
        
        Provide specific, actionable suggestions with examples.`,
        response_json_schema: {
          type: 'object',
          properties: {
            overall_score: { type: 'number' },
            grammar_issues: { type: 'array', items: { type: 'string' } },
            style_suggestions: { type: 'array', items: { type: 'string' } },
            clarity_improvements: { type: 'array', items: { type: 'string' } },
            readability_score: { type: 'string' }
          }
        }
      });

      setSuggestions(response);
    } catch (error) {
      setSuggestions({ error: 'Failed to analyze text. Please try again.' });
    }

    setIsChecking(false);
  };

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Grammar & Style Analysis
          <Badge className="bg-emerald-600 text-white">AI-Powered</Badge>
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to improve your writing quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkGrammarStyle}
          disabled={isChecking || !manuscriptText}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Writing...
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Analyze Writing Quality
            </>
          )}
        </Button>

        {suggestions && !suggestions.error && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-white border-2 border-emerald-200">
                <p className="text-sm text-slate-600 mb-1">Overall Quality</p>
                <p className="text-2xl font-bold text-slate-900">{suggestions.overall_score}/100</p>
              </div>
              <div className="p-4 rounded-lg bg-white border-2 border-emerald-200">
                <p className="text-sm text-slate-600 mb-1">Readability</p>
                <p className="text-2xl font-bold text-slate-900">{suggestions.readability_score}</p>
              </div>
            </div>

            {suggestions.grammar_issues && suggestions.grammar_issues.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <p className="font-semibold text-red-900 mb-2">Grammar Issues:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-800">
                    {suggestions.grammar_issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {suggestions.style_suggestions && suggestions.style_suggestions.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <p className="font-semibold text-blue-900 mb-2">Style Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {suggestions.style_suggestions.map((sugg, i) => (
                      <li key={i}>{sugg}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {suggestions.clarity_improvements && suggestions.clarity_improvements.length > 0 && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <AlertDescription>
                  <p className="font-semibold text-emerald-900 mb-2">Clarity Improvements:</p>
                  <ul className="list-disc list-inside space-y-1 text-emerald-800">
                    {suggestions.clarity_improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {suggestions && suggestions.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{suggestions.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const ReviewerPreferences = ({ preferredReviewers, nonPreferredReviewers, onUpdate }) => {
  const [newPreferred, setNewPreferred] = useState('');
  const [newNonPreferred, setNewNonPreferred] = useState('');
  const [newNonPreferredReason, setNewNonPreferredReason] = useState('');

  const addPreferred = () => {
    if (newPreferred.trim() && !preferredReviewers.some(r => r.email === newPreferred.trim())) {
      onUpdate({
        preferred: [...preferredReviewers, { email: newPreferred.trim(), name: '' }],
        nonPreferred: nonPreferredReviewers
      });
      setNewPreferred('');
    }
  };

  const addNonPreferred = () => {
    if (newNonPreferred.trim() && !nonPreferredReviewers.some(r => r.email === newNonPreferred.trim())) {
      onUpdate({
        preferred: preferredReviewers,
        nonPreferred: [...nonPreferredReviewers, {
          email: newNonPreferred.trim(),
          name: '',
          reason: newNonPreferredReason.trim()
        }]
      });
      setNewNonPreferred('');
      setNewNonPreferredReason('');
    }
  };

  const removePreferred = (email) => {
    onUpdate({
      preferred: preferredReviewers.filter(r => r.email !== email),
      nonPreferred: nonPreferredReviewers
    });
  };

  const removeNonPreferred = (email) => {
    onUpdate({
      preferred: preferredReviewers,
      nonPreferred: nonPreferredReviewers.filter(r => r.email !== email)
    });
  };

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-600" />
          Reviewer Preferences
        </CardTitle>
        <CardDescription>
          Suggest preferred or non-preferred reviewers for your manuscript
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferred Reviewers */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Preferred Reviewers
          </h4>
          <p className="text-sm text-slate-600 mb-3">
            Suggest experts you believe are qualified to review your work
          </p>
          <div className="space-y-2">
            {preferredReviewers.map((reviewer) => (
              <div
                key={reviewer.email}
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{reviewer.email}</p>
                  {reviewer.name && <p className="text-sm text-slate-600">{reviewer.name}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePreferred(reviewer.email)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Reviewer email address"
                value={newPreferred}
                onChange={(e) => setNewPreferred(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPreferred()}
              />
              <Button onClick={addPreferred} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Non-Preferred Reviewers */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Non-Preferred Reviewers
          </h4>
          <p className="text-sm text-slate-600 mb-3">
            Identify reviewers who should not review your work (e.g., conflicts of interest)
          </p>
          <div className="space-y-2">
            {nonPreferredReviewers.map((reviewer) => (
              <div
                key={reviewer.email}
                className="p-3 rounded-lg bg-red-50 border border-red-200"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{reviewer.email}</p>
                    {reviewer.name && <p className="text-sm text-slate-600">{reviewer.name}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNonPreferred(reviewer.email)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {reviewer.reason && (
                  <p className="text-sm text-slate-600 italic">Reason: {reviewer.reason}</p>
                )}
              </div>
            ))}
            <div className="space-y-2">
              <Input
                placeholder="Reviewer email address"
                value={newNonPreferred}
                onChange={(e) => setNewNonPreferred(e.target.value)}
              />
              <Textarea
                placeholder="Reason for exclusion (optional but recommended)"
                value={newNonPreferredReason}
                onChange={(e) => setNewNonPreferredReason(e.target.value)}
                rows={2}
              />
              <Button onClick={addNonPreferred} className="w-full bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Non-Preferred Reviewer
              </Button>
            </div>
          </div>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            These are suggestions only. The editor will make the final decision on reviewer assignments based on expertise and availability.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default function ManuscriptPreparationTools({
  manuscriptText,
  checklist,
  onChecklistUpdate,
  reviewerPreferences,
  onReviewerPreferencesUpdate
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Manuscript Preparation Tools</h2>
        <p className="text-slate-600">
          Use these AI-powered tools to ensure your manuscript meets the highest standards
        </p>
      </div>

      <div className="grid gap-6">
        <ManuscriptPreparationChecklist
          checklist={checklist}
          onUpdate={onChecklistUpdate}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <PlagiarismChecker manuscriptText={manuscriptText} />
          <GrammarStyleChecker manuscriptText={manuscriptText} />
        </div>

        <ReviewerPreferences
          preferredReviewers={reviewerPreferences.preferred || []}
          nonPreferredReviewers={reviewerPreferences.nonPreferred || []}
          onUpdate={onReviewerPreferencesUpdate}
        />
      </div>
    </div>
  );
}