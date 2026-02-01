import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Search,
  Calendar,
  TrendingUp,
  BookOpen,
  FileText,
  Download,
  ExternalLink,
  Filter,
  Archive as ArchiveIcon,
  Clock,
  Star,
  Users,
  BarChart3
} from 'lucide-react';

const categoryLabels = {
  stem: "STEM",
  medicine_health: "Medicine & Health",
  agriculture_environment: "Agriculture & Environment",
  social_sciences: "Social Sciences",
  law_policy: "Law & Policy",
  arts_humanities: "Arts & Humanities",
  business_economics: "Business & Economics",
  education_pedagogy: "Education & Pedagogy",
  interdisciplinary: "Interdisciplinary"
};

const PublicationCard = ({ manuscript, journal, showYear = false }) => {
  const publicationYear = manuscript.publication_date 
    ? new Date(manuscript.publication_date).getFullYear()
    : manuscript.online_first_date
    ? new Date(manuscript.online_first_date).getFullYear()
    : null;

  return (
    <Card className="hover:shadow-lg transition-all border-l-4 border-l-teal-500">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <Link to={createPageUrl('ManuscriptDetail') + '?id=' + manuscript.id}>
              <h3 className="font-bold text-slate-900 hover:text-teal-600 transition-colors line-clamp-2">
                {manuscript.title}
              </h3>
            </Link>
            {showYear && publicationYear && (
              <Badge className="mt-2 bg-slate-100 text-slate-700">
                {publicationYear}
              </Badge>
            )}
          </div>
          <Badge className={manuscript.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
            {manuscript.status === 'published' ? 'Published' : 'Online First'}
          </Badge>
        </div>
        
        <div className="text-sm text-slate-600">
          <p className="font-medium">{manuscript.authors?.map(a => a.name).join(', ')}</p>
          <p className="text-xs mt-1">{journal?.title}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-700 line-clamp-3">{manuscript.abstract}</p>
        
        <div className="flex flex-wrap gap-2">
          {manuscript.keywords?.slice(0, 3).map(keyword => (
            <Badge key={keyword} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {manuscript.citation_count || 0} citations
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {manuscript.download_count || 0} downloads
            </span>
          </div>
          <Link to={createPageUrl('ManuscriptDetail') + '?id=' + manuscript.id}>
            <Button size="sm" variant="outline">
              View
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const TimelineView = ({ publications, journals }) => {
  const yearGroups = publications.reduce((acc, manuscript) => {
    const year = manuscript.publication_date 
      ? new Date(manuscript.publication_date).getFullYear()
      : manuscript.online_first_date
      ? new Date(manuscript.online_first_date).getFullYear()
      : 'Unknown';
    
    if (!acc[year]) acc[year] = [];
    acc[year].push(manuscript);
    return acc;
  }, {});

  const sortedYears = Object.keys(yearGroups).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      {sortedYears.map(year => (
        <div key={year}>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-full">
              <Calendar className="w-4 h-4" />
              <span className="font-bold">{year}</span>
            </div>
            <div className="h-px flex-1 bg-slate-200"></div>
            <Badge variant="outline">{yearGroups[year].length} publications</Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {yearGroups[year].map(manuscript => (
              <PublicationCard
                key={manuscript.id}
                manuscript={manuscript}
                journal={journals.find(j => j.id === manuscript.journal_id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function Archive() {
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    startYear: '',
    endYear: '',
    categories: [],
    journals: [],
    minCitations: ''
  });
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allManuscripts, allJournals] = await Promise.all([
        base44.entities.Manuscript.list(),
        base44.entities.Journal.list()
      ]);

      const publishedManuscripts = allManuscripts.filter(m => 
        m.status === 'published' || m.status === 'online_first'
      );

      setManuscripts(publishedManuscripts);
      setJournals(allJournals);
    } catch (error) {
      console.error('Error loading archive:', error);
    }
    setIsLoading(false);
  };

  const toggleCategory = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleJournal = (journalId) => {
    setFilters(prev => ({
      ...prev,
      journals: prev.journals.includes(journalId)
        ? prev.journals.filter(j => j !== journalId)
        : [...prev.journals, journalId]
    }));
  };

  const filteredManuscripts = manuscripts.filter(manuscript => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = manuscript.title?.toLowerCase().includes(query);
      const matchesAbstract = manuscript.abstract?.toLowerCase().includes(query);
      const matchesKeywords = manuscript.keywords?.some(k => k.toLowerCase().includes(query));
      const matchesAuthors = manuscript.authors?.some(a => a.name.toLowerCase().includes(query));
      
      if (!matchesTitle && !matchesAbstract && !matchesKeywords && !matchesAuthors) {
        return false;
      }
    }

    // Year filter
    if (filters.startYear || filters.endYear) {
      const pubYear = manuscript.publication_date 
        ? new Date(manuscript.publication_date).getFullYear()
        : manuscript.online_first_date
        ? new Date(manuscript.online_first_date).getFullYear()
        : null;

      if (pubYear) {
        if (filters.startYear && pubYear < parseInt(filters.startYear)) return false;
        if (filters.endYear && pubYear > parseInt(filters.endYear)) return false;
      }
    }

    // Category filter
    if (filters.categories.length > 0) {
      const journal = journals.find(j => j.id === manuscript.journal_id);
      if (!journal || !filters.categories.includes(journal.category)) return false;
    }

    // Journal filter
    if (filters.journals.length > 0) {
      if (!filters.journals.includes(manuscript.journal_id)) return false;
    }

    // Citations filter
    if (filters.minCitations) {
      const citations = manuscript.citation_count || 0;
      if (citations < parseInt(filters.minCitations)) return false;
    }

    return true;
  });

  // Sort manuscripts
  const sortedManuscripts = [...filteredManuscripts].sort((a, b) => {
    switch (sortBy) {
      case 'date_desc':
        return new Date(b.publication_date || b.online_first_date) - new Date(a.publication_date || a.online_first_date);
      case 'date_asc':
        return new Date(a.publication_date || a.online_first_date) - new Date(b.publication_date || b.online_first_date);
      case 'citations':
        return (b.citation_count || 0) - (a.citation_count || 0);
      case 'downloads':
        return (b.download_count || 0) - (a.download_count || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const stats = {
    total: filteredManuscripts.length,
    totalCitations: filteredManuscripts.reduce((sum, m) => sum + (m.citation_count || 0), 0),
    totalDownloads: filteredManuscripts.reduce((sum, m) => sum + (m.download_count || 0), 0),
    oldestYear: Math.min(...filteredManuscripts.map(m => {
      const date = m.publication_date || m.online_first_date;
      return date ? new Date(date).getFullYear() : 9999;
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
              <ArchiveIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Research Archive</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore our comprehensive repository of published research across all disciplines
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Publications</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <BookOpen className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Citations</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalCitations.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Downloads</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalDownloads.toLocaleString()}</p>
                </div>
                <Download className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Archive Since</p>
                  <p className="text-3xl font-bold mt-1">{stats.oldestYear !== 9999 ? stats.oldestYear : 'N/A'}</p>
                </div>
                <Clock className="w-10 h-10 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by title, author, keywords, or abstract..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Advanced Filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Advanced Filters</h3>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Start Year</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2000"
                    value={filters.startYear}
                    onChange={(e) => setFilters(prev => ({ ...prev, startYear: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>End Year</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2024"
                    value={filters.endYear}
                    onChange={(e) => setFilters(prev => ({ ...prev, endYear: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Min Citations</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={filters.minCitations}
                    onChange={(e) => setFilters(prev => ({ ...prev, minCitations: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Newest First</SelectItem>
                      <SelectItem value="date_asc">Oldest First</SelectItem>
                      <SelectItem value="citations">Most Cited</SelectItem>
                      <SelectItem value="downloads">Most Downloaded</SelectItem>
                      <SelectItem value="title">Title (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category Filters */}
              <div>
                <Label className="mb-3 block">Filter by Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${key}`}
                        checked={filters.categories.includes(key)}
                        onCheckedChange={() => toggleCategory(key)}
                      />
                      <Label htmlFor={`cat-${key}`} className="text-sm cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Journal Filters */}
              {journals.length > 0 && (
                <div>
                  <Label className="mb-3 block">Filter by Journal</Label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {journals.slice(0, 6).map(journal => (
                      <div key={journal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`journal-${journal.id}`}
                          checked={filters.journals.includes(journal.id)}
                          onCheckedChange={() => toggleJournal(journal.id)}
                        />
                        <Label htmlFor={`journal-${journal.id}`} className="text-sm cursor-pointer line-clamp-1">
                          {journal.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {(filters.categories.length > 0 || filters.journals.length > 0 || filters.startYear || filters.endYear || filters.minCitations) && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ startYear: '', endYear: '', categories: [], journals: [], minCitations: '' })}
                  size="sm"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : sortedManuscripts.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No publications found</h3>
              <p className="text-slate-600">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="grid" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-slate-600">
                Showing <span className="font-semibold text-slate-900">{sortedManuscripts.length}</span> publications
              </p>
              <TabsList>
                <TabsTrigger value="grid">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Timeline
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="grid">
              <div className="grid md:grid-cols-2 gap-6">
                {sortedManuscripts.map(manuscript => (
                  <PublicationCard
                    key={manuscript.id}
                    manuscript={manuscript}
                    journal={journals.find(j => j.id === manuscript.journal_id)}
                    showYear={true}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <TimelineView publications={sortedManuscripts} journals={journals} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}