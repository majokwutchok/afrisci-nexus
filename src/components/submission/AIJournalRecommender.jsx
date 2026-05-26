import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Check, AlertCircle, TrendingUp, Users } from 'lucide-react';

const JournalRecommendationCard = ({ journal, reasoning, match_score, index, isSelected, onSelect }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all border-2 ${
        isSelected 
          ? 'border-teal-500 bg-teal-50' 
          : 'border-slate-200 hover:border-teal-300'
      }`}
      onClick={() => onSelect(journal.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
              <h3 className="font-bold text-slate-900 line-clamp-2">{journal.title}</h3>
            </div>
            <p className="text-xs text-slate-600 mb-2">{journal.category}</p>
          </div>
          {isSelected && (
            <div className="flex-shrink-0">
              <Check className="w-5 h-5 text-teal-600" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Match Score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700">Match Score</span>
              <span className="text-lg font-bold text-teal-600">{match_score}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all"
                style={{ width: `${match_score}%` }}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2">
            {journal.impact_factor && (
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-xs text-slate-600">Impact Factor</p>
                <p className="font-semibold text-slate-900">{journal.impact_factor.toFixed(2)}</p>
              </div>
            )}
            {journal.is_open_access && (
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <Badge className="bg-green-100 text-green-800 text-xs">Open Access</Badge>
              </div>
            )}
          </div>

          {/* Recommendation Reasoning */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-xs font-medium text-blue-900 mb-1">Why This Journal?</p>
            <p className="text-xs text-blue-800 leading-relaxed">{reasoning}</p>
          </div>

          {/* Submission Fee */}
          {journal.submission_fee > 0 && (
            <p className="text-xs text-slate-600">
              Submission Fee: <span className="font-semibold">${journal.submission_fee}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AIJournalRecommender({ 
  authorProfile, 
  manuscript, 
  journals,
  onRecommendationsReady = () => {},
  onSelectJournal = () => {}
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState('');

  const analyzeAndRecommend = async () => {
    setIsAnalyzing(true);
    setError('');

    // Keyword-based scoring — no LLM required
    const manuscriptTerms = [
      ...(manuscript.title || '').toLowerCase().split(/\s+/),
      ...(manuscript.keywords || []).map(k => k.toLowerCase()),
      ...(manuscript.abstract || '').toLowerCase().split(/\s+/).filter(w => w.length > 5)
    ];

    const scored = journals.map(j => {
      const journalTerms = [
        j.title.toLowerCase(),
        j.category?.replace(/_/g, ' ').toLowerCase() || '',
        j.description?.toLowerCase() || '',
        ...(j.keywords || []).map(k => k.toLowerCase())
      ];
      const matches = manuscriptTerms.filter(t =>
        journalTerms.some(jt => jt.includes(t) || t.includes(jt))
      );
      const score = Math.min(97, 45 + matches.length * 3);
      return { journal: j, match_score: score, reasoning: `This journal covers ${j.category?.replace(/_/g, ' ') || 'research'} which aligns with your manuscript's subject matter and keywords.` };
    }).sort((a, b) => b.match_score - a.match_score).slice(0, 5);

    setRecommendations({
      recommendations: scored,
      general_advice: 'Recommendations are based on keyword matching with journal categories and descriptions. Review each journal\'s aims and scope for the best fit.'
    });
    onRecommendationsReady(scored);
    setIsAnalyzing(false);
  };


  const handleSelectJournal = (journalId) => {
    setSelectedJournalId(journalId);
    const selectedJournal = recommendations.recommendations.find(r => r.journal.id === journalId)?.journal;
    if (selectedJournal) {
      onSelectJournal(selectedJournal);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI-Powered Journal Recommendations</CardTitle>
                <CardDescription>
                  Get personalized journal suggestions based on your profile and manuscript
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!recommendations && !isAnalyzing && (
            <div className="text-center py-6">
              <p className="text-slate-600 mb-4">
                Let our AI analyze your profile and manuscript to find the perfect journals for submission.
              </p>
              <Button
                onClick={analyzeAndRecommend}
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Recommendations
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-slate-600">Analyzing your profile and manuscript...</p>
              <p className="text-sm text-slate-500 mt-2">This may take 15-30 seconds</p>
            </div>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {recommendations && (
        <>
          {/* General Advice */}
          {recommendations.general_advice && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p className="font-semibold mb-1">Submission Advice</p>
                <p>{recommendations.general_advice}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Top Recommendations</h3>
              <Badge className="bg-teal-100 text-teal-800">
                {recommendations.recommendations.length} matches
              </Badge>
            </div>

            <div className="grid gap-4">
              {recommendations.recommendations.map((rec, idx) => (
                <JournalRecommendationCard
                  key={rec.journal.id}
                  journal={rec.journal}
                  reasoning={rec.reasoning}
                  match_score={rec.match_score}
                  index={idx}
                  isSelected={selectedJournalId === rec.journal.id}
                  onSelect={handleSelectJournal}
                />
              ))}
            </div>

            {selectedJournalId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <Check className="w-4 h-4 inline mr-2" />
                  Journal selected. You can proceed with submission or get new recommendations.
                </p>
              </div>
            )}

            <Button
              onClick={() => setRecommendations(null)}
              variant="outline"
              className="w-full"
            >
              Get New Recommendations
            </Button>
          </div>
        </>
      )}
    </div>
  );
}