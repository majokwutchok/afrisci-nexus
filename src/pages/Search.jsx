import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search as SearchIcon, X, BookOpen, FileText, Users,
  Calendar, Tag, ChevronLeft, ChevronRight, SlidersHorizontal, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { value: 'all', label: 'All Disciplines' },
  { value: 'stem', label: 'STEM' },
  { value: 'medicine_health', label: 'Medicine & Health' },
  { value: 'agriculture_environment', label: 'Agriculture & Environment' },
  { value: 'social_sciences', label: 'Social Sciences' },
  { value: 'law_policy', label: 'Law & Policy' },
  { value: 'arts_humanities', label: 'Arts & Humanities' },
  { value: 'business_economics', label: 'Business & Economics' },
  { value: 'education_pedagogy', label: 'Education & Pedagogy' },
  { value: 'interdisciplinary', label: 'Interdisciplinary' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'citations', label: 'Most Cited' },
  { value: 'downloads', label: 'Most Downloaded' },
];

const PAGE_SIZE = 12;

// Full-text search scoring: title match > abstract > keywords > author
function scoreMatch(manuscript, journal, terms) {
  if (!terms.length) return 1;
  let score = 0;
  const titleText = (manuscript.title || '').toLowerCase();
  const abstractText = (manuscript.abstract || '').toLowerCase();
  const keywordText = (manuscript.keywords || []).join(' ').toLowerCase();
  const authorText = (manuscript.authors || []).map(a => a.name || '').join(' ').toLowerCase();
  const journalText = (journal?.title || '').toLowerCase();
  const doiText = (manuscript.doi || '').toLowerCase();

  for (const term of terms) {
    if (titleText.includes(term)) score += 10;
    if (abstractText.includes(term)) score += 4;
    if (keywordText.includes(term)) score += 6;
    if (authorText.includes(term)) score += 8;
    if (journalText.includes(term)) score += 3;
    if (doiText.includes(term)) score += 2;
  }
  return score;
}

function highlightText(text, terms) {
  if (!text || !terms.length) return text;
  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 font-semibold">{part}</mark> : part
  );
}

function ResultCard({ manuscript, journal, terms }) {
  const authors = manuscript.authors?.map(a => a.name).filter(Boolean) || [];
  const pubDate = manuscript.publication_date || manuscript.online_first_date || manuscript.created_date;
  const snippet = manuscript.abstract ? manuscript.abstract.slice(0, 220) + (manuscript.abstract.length > 220 ? '...' : '') : '';

  return (
    <Card className="bg-white hover:shadow-lg transition-all duration-200 border border-slate-200 group">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/ManuscriptDetail?id=${manuscript.id}`} className="font-bold text-slate-900 text-base leading-snug hover:text-teal-700 transition-colors line-clamp-2">
              {highlightText(manuscript.title, terms)}
            </Link>
            {authors.length > 0 && (
              <p className="mt-1 text-sm text-slate-600 flex items-center gap-1 flex-wrap">
                <Users className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                {highlightText(authors.slice(0, 3).join(', ') + (authors.length > 3 ? ` +${authors.length - 3} more` : ''), terms)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
              {journal && (
                <span className="flex items-center gap-1 text-teal-700 font-medium">
                  <BookOpen className="w-3 h-3" />{journal.title}
                </span>
              )}
              {pubDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{new Date(pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
              {manuscript.doi && (
                <span className="font-mono opacity-60">DOI: {manuscript.doi}</span>
              )}
            </div>
            {snippet && (
              <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
                {highlightText(snippet, terms)}
              </p>
            )}
            {manuscript.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {manuscript.keywords.slice(0, 5).map(kw => (
                  <span key={kw} className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">
                    <Tag className="w-2.5 h-2.5" />{highlightText(kw, terms)}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
              {manuscript.citation_count > 0 && <span>📚 {manuscript.citation_count} citations</span>}
              {manuscript.download_count > 0 && <span>⬇️ {manuscript.download_count} downloads</span>}
              {manuscript.access_type === 'open_access' && <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5 py-0">Open Access</Badge>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultSkeleton() {
  return (
    <Card className="bg-white border border-slate-200">
      <CardContent className="p-5">
        <div className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [journalFilter, setJournalFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [ms, js] = await Promise.all([
        base44.entities.Manuscript.filter({ status: 'published' }, '-publication_date', 1000),
        base44.entities.Journal.list('-created_date', 200),
      ]);
      setManuscripts(ms);
      setJournals(js);
      setIsLoading(false);
    };
    load();
  }, []);

  // Parse search terms once
  const searchTerms = useMemo(() =>
    query.trim().toLowerCase().split(/\s+/).filter(t => t.length > 1),
    [query]
  );

  const journalMap = useMemo(() => {
    const m = {};
    journals.forEach(j => { m[j.id] = j; });
    return m;
  }, [journals]);

  const results = useMemo(() => {
    if (!hasSearched) return [];

    let filtered = manuscripts.filter(ms => {
      // Category filter
      if (categoryFilter !== 'all') {
        const j = journalMap[ms.journal_id];
        if (!j || j.category !== categoryFilter) return false;
      }
      // Journal filter
      if (journalFilter !== 'all' && ms.journal_id !== journalFilter) return false;
      // Author filter
      if (authorFilter.trim()) {
        const af = authorFilter.trim().toLowerCase();
        const hasAuthor = (ms.authors || []).some(a => (a.name || '').toLowerCase().includes(af));
        if (!hasAuthor) return false;
      }
      // Date from
      if (dateFrom) {
        const pubDate = ms.publication_date || ms.online_first_date;
        if (!pubDate || new Date(pubDate) < new Date(dateFrom)) return false;
      }
      // Date to
      if (dateTo) {
        const pubDate = ms.publication_date || ms.online_first_date;
        if (!pubDate || new Date(pubDate) > new Date(dateTo)) return false;
      }
      // Full-text keyword check (must match at least 1 term if query provided)
      if (searchTerms.length > 0) {
        const score = scoreMatch(ms, journalMap[ms.journal_id], searchTerms);
        return score > 0;
      }
      return true;
    });

    // Scoring & sorting
    if (sortBy === 'relevance') {
      filtered = filtered
        .map(ms => ({ ms, score: scoreMatch(ms, journalMap[ms.journal_id], searchTerms) }))
        .sort((a, b) => b.score - a.score)
        .map(({ ms }) => ms);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.publication_date || b.created_date) - new Date(a.publication_date || a.created_date));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.publication_date || a.created_date) - new Date(b.publication_date || b.created_date));
    } else if (sortBy === 'citations') {
      filtered.sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0));
    } else if (sortBy === 'downloads') {
      filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    }

    return filtered;
  }, [hasSearched, manuscripts, searchTerms, categoryFilter, journalFilter, authorFilter, dateFrom, dateTo, sortBy, journalMap]);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback(() => {
    setPage(1);
    setHasSearched(true);
  }, []);

  const handleClear = () => {
    setQuery('');
    setAuthorFilter('');
    setCategoryFilter('all');
    setJournalFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('relevance');
    setPage(1);
    setHasSearched(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Unique journals for filter dropdown
  const journalOptions = useMemo(() =>
    journals.filter(j => j.status === 'active' || !j.status).sort((a, b) => a.title.localeCompare(b.title)),
    [journals]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Hero Search Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">Search All Research</h1>
          <p className="text-sky-200 text-lg mb-8">Full-text search across {manuscripts.length.toLocaleString()} published articles in {journals.length} journals</p>
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                className="pl-12 h-14 text-base text-slate-900 bg-white shadow-xl rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-teal-400"
                placeholder="Keywords, title, abstract, DOI, author..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={handleSearch} className="h-14 px-6 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-xl text-base flex-shrink-0">
              <SearchIcon className="w-5 h-5 mr-2" /> Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowFilters(s => !s)} className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-teal-700 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Advanced Filters
            </button>
            {(categoryFilter !== 'all' || journalFilter !== 'all' || authorFilter || dateFrom || dateTo) && (
              <button onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={journalFilter} onValueChange={v => { setJournalFilter(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="All Journals" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Journals</SelectItem>
                {journalOptions.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Filter by author..."
                value={authorFilter}
                onChange={e => { setAuthorFilter(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">Published From</label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium mb-1 block">Published Until</label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <ResultSkeleton key={i} />)}</div>
        ) : !hasSearched ? (
          <div className="text-center py-20 text-slate-400">
            <SearchIcon className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">Ready to search</h3>
            <p className="text-sm">Enter keywords above to search across all published articles, abstracts, and author names.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['climate change', 'machine learning', 'public health', 'food security', 'urban planning'].map(tag => (
                <button key={tag} onClick={() => { setQuery(tag); setHasSearched(true); }} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-sm hover:border-teal-400 hover:text-teal-700 transition-colors shadow-sm">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-14 h-14 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No articles found</h3>
            <p className="text-slate-500 text-sm">Try different keywords, remove filters, or broaden your date range.</p>
            <Button variant="outline" className="mt-4" onClick={handleClear}>Clear all filters</Button>
          </div>
        ) : (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{results.length.toLocaleString()}</span> articles found
                {query && <> for <span className="font-semibold text-teal-700">"{query}"</span></>}
              </p>
              <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
            </div>

            <div className="space-y-3 mb-6">
              {pageResults.map(ms => (
                <ResultCard key={ms.id} manuscript={ms} journal={journalMap[ms.journal_id]} terms={searchTerms} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-400'}`}>
                        {p}
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}