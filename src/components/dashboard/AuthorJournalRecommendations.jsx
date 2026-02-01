import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthorJournalRecommendations({ userProfile }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const [allJournals] = await Promise.all([
        base44.entities.Journal.list()
      ]);
      setJournals(allJournals);

      // Get quick recommendations based on user's research interests
      if (userProfile?.research_interests && userProfile.research_interests.length > 0) {
        const relevantJournals = allJournals
          .filter(j => userProfile.research_interests.some(interest =>
            j.category.toLowerCase().includes(interest.toLowerCase()) ||
            j.title.toLowerCase().includes(interest.toLowerCase()) ||
            j.description?.toLowerCase().includes(interest.toLowerCase())
          ))
          .slice(0, 3);

        setRecommendations(relevantJournals);
      } else {
        // Show top-rated journals if no specific interests
        setRecommendations(
          allJournals
            .sort((a, b) => (b.impact_factor || 0) - (a.impact_factor || 0))
            .slice(0, 3)
        );
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <CardTitle>Recommended Journals for You</CardTitle>
          </div>
          <Badge className="bg-teal-100 text-teal-800">AI-Selected</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length > 0 ? (
          <>
            <div className="space-y-2">
              {recommendations.map((journal) => (
                <div key={journal.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 hover:border-teal-200 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{journal.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{journal.category}</Badge>
                      {journal.is_open_access && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Open Access</Badge>
                      )}
                      {journal.impact_factor && (
                        <span className="text-xs text-slate-600">IF: {journal.impact_factor}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to={createPageUrl('Submit')} className="block mt-4">
              <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Full Recommendations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-600 mb-4">
              Get AI-powered journal recommendations during manuscript submission
            </p>
            <Link to={createPageUrl('Submit')}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Submission
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}