import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Suggests related articles based on keywords and category
 * Displayed at the end of manuscript detail pages
 */
export default function SuggestedArticles({ manuscript, journal }) {
  const [suggestedArticles, setSuggestedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!manuscript || !journal) return;
    
    loadSuggestedArticles();
  }, [manuscript?.id, journal?.id]);

  const loadSuggestedArticles = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all published articles
      const allArticles = await base44.entities.Manuscript.filter({
        status: 'published'
      }, '-publication_date', 50);

      if (!allArticles || allArticles.length === 0) {
        setSuggestedArticles([]);
        return;
      }

      // Score articles based on keyword overlap and same journal
      const manuscriptKeywords = new Set(manuscript.keywords?.map(k => k.toLowerCase()) || []);
      
      const scored = allArticles
        .filter(a => a.id !== manuscript.id) // Exclude current article
        .map(article => {
          let score = 0;

          // Same journal (highest priority)
          if (article.journal_id === manuscript.journal_id) {
            score += 50;
          }

          // Keyword matches
          const articleKeywords = new Set(article.keywords?.map(k => k.toLowerCase()) || []);
          let keywordMatches = 0;
          manuscriptKeywords.forEach(kw => {
            if (articleKeywords.has(kw)) keywordMatches++;
          });
          score += keywordMatches * 15;

          // Recent articles get slight boost
          const daysSincePublish = (new Date() - new Date(article.publication_date)) / (1000 * 60 * 60 * 24);
          if (daysSincePublish < 180) {
            score += Math.max(0, 20 - daysSincePublish / 9);
          }

          // Popular articles boost (citations + downloads)
          score += (article.citation_count || 0) * 2;
          score += (article.download_count || 0) * 0.5;

          return { article, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ article }) => article);

      setSuggestedArticles(scored);
    } catch (error) {
      console.error('Error loading suggested articles:', error);
      setSuggestedArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recommended Reading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (suggestedArticles.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-teal-600" />
          Recommended Reading
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Articles related to this research
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedArticles.map((article, idx) => (
          <div
            key={article.id}
            onClick={() => navigate(`/ManuscriptDetail?id=${article.id}`)}
            className="block"
          >
            <div className="p-4 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all group cursor-pointer">
              {/* Article Number & Badge */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-600 bg-teal-100 rounded-full w-6 h-6 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Related
                  </Badge>
                </div>
              </div>

              {/* Title */}
              <h4 className="font-semibold text-slate-900 group-hover:text-teal-700 line-clamp-2 mb-2 transition-colors">
                {article.title}
              </h4>

              {/* Authors */}
              <p className="text-xs text-slate-600 mb-2 line-clamp-1">
                {article.authors?.map(a => a.name).join(', ') || 'N/A'}
              </p>

              {/* Keywords */}
              {article.keywords && article.keywords.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {article.keywords.slice(0, 2).map(kw => (
                    <Badge 
                      key={kw} 
                      variant="secondary" 
                      className="text-xs bg-slate-100"
                    >
                      {kw}
                    </Badge>
                  ))}
                  {article.keywords.length > 2 && (
                    <span className="text-xs text-slate-500">
                      +{article.keywords.length - 2} more
                    </span>
                  )}
                </div>
              )}

              {/* Metrics */}
              <div className="flex gap-4 text-xs text-slate-600 mb-3">
                {article.citation_count > 0 && (
                  <span>📊 {article.citation_count} citation{article.citation_count !== 1 ? 's' : ''}</span>
                )}
                {article.download_count > 0 && (
                  <span>📥 {article.download_count} downloads</span>
                )}
              </div>

              {/* Read More Button */}
              <div className="flex items-center gap-2 text-sm text-teal-600 group-hover:text-teal-700 font-medium">
                Read Article
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}

        {/* View All Articles CTA */}
        <Button 
          onClick={() => navigate('/Publications')}
          variant="outline" 
          className="w-full border-teal-300 text-teal-600 hover:bg-teal-50"
        >
          Browse All Articles
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}