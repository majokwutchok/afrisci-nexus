import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  FileText,
  Download,
  TrendingUp,
  Calendar,
  Users,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';

const PublicationCard = ({ manuscript, journal }) => (
  <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)}>
            <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight line-clamp-2">
              {manuscript.title}
            </CardTitle>
          </Link>
          <p className="text-sm text-slate-600 font-medium mt-2">
            {manuscript.authors?.map(a => a.name).join(', ') || 'Unknown Authors'}
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 flex-shrink-0">Published</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-slate-600 text-sm line-clamp-3">{manuscript.abstract}</p>
      
      <div className="flex flex-wrap gap-2">
        {manuscript.keywords?.slice(0, 4).map((keyword) => (
          <Badge key={keyword} variant="outline" className="text-xs">
            {keyword}
          </Badge>
        ))}
        {manuscript.keywords?.length > 4 && (
          <Badge variant="outline" className="text-xs text-slate-500">
            +{manuscript.keywords.length - 4}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          <span>{journal?.title || 'Unknown Journal'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{manuscript.publication_date ? format(new Date(manuscript.publication_date), 'MMM yyyy') : 'Recently'}</span>
        </div>
        {manuscript.citation_count > 0 && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{manuscript.citation_count} citations</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3">
        <Link to={createPageUrl(`ManuscriptDetail?id=${manuscript.id}`)}>
          <Button size="sm" variant="outline" className="flex items-center gap-1 text-xs">
            Read Article
          </Button>
        </Link>
        {manuscript.manuscript_file_url && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
            onClick={() => window.open(manuscript.manuscript_file_url, '_blank')}
          >
            <Download className="w-3 h-3" />
            PDF
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function PublicationsPage() {
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterJournal, setFilterJournal] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [manuscriptData, journalData] = await Promise.all([
        base44.entities.Manuscript.list('-publication_date'),
        base44.entities.Journal.list()
      ]);
      
      const publishedManuscripts = manuscriptData.filter(m => m.status === 'published');
      setManuscripts(publishedManuscripts);
      setJournals(journalData);
    } catch (error) {
      console.error("Error loading publications:", error);
    }
    setIsLoading(false);
  };

  const filteredAndSortedManuscripts = manuscripts
    .filter(manuscript => {
      const matchesSearch = 
        manuscript.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manuscript.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manuscript.authors?.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        manuscript.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesJournal = filterJournal === 'all' || manuscript.journal_id === filterJournal;
      
      return matchesSearch && matchesJournal;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.publication_date || b.created_date) - new Date(a.publication_date || a.created_date);
        case 'citations':
          return (b.citation_count || 0) - (a.citation_count || 0);
        case 'views':
          return (b.view_count || 0) - (a.view_count || 0);
        default:
          return 0;
      }
    });

  const getJournalById = (id) => journals.find(j => j.id === id);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
      <SEO
        title="Published Research — Peer-Reviewed African Scientific Articles"
        description="Browse thousands of peer-reviewed research articles published in AfriSci Nexus journals. Discover cutting-edge science, medicine, agriculture, and social research from African scholars."
        keywords="African research articles, peer reviewed papers Africa, open access journals Africa, scientific publications Africa, African researchers"
        canonicalPath="/Publications"
        ogType="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Published Research — AfriSci Nexus",
          "description": "Browse peer-reviewed African scientific articles",
          "url": "https://afrisco-nexus.base44.app/Publications"
        }}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Published Research</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore the latest peer-reviewed scientific articles from across Africa
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-200" />
              <p className="text-3xl font-bold mb-1">{manuscripts.length}</p>
              <p className="text-sm text-blue-100">Total Articles</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
              <p className="text-3xl font-bold mb-1">{journals.length}</p>
              <p className="text-sm text-emerald-100">Journals</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-200" />
              <p className="text-3xl font-bold mb-1">{[...new Set(manuscripts.flatMap(m => m.authors?.map(a => a.email) || []))].length}</p>
              <p className="text-sm text-purple-100">Authors</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-amber-200" />
              <p className="text-3xl font-bold mb-1">{manuscripts.reduce((sum, m) => sum + (m.citation_count || 0), 0)}</p>
              <p className="text-sm text-amber-100">Total Citations</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, author, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-3 border-slate-200 focus:border-emerald-300 focus:ring-emerald-200 rounded-xl"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="citations">Most Cited</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterJournal} onValueChange={setFilterJournal}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Journals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Journals</SelectItem>
                  {journals.map((journal) => (
                    <SelectItem key={journal.id} value={journal.id}>
                      {journal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-slate-600 font-medium">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                Loading publications...
              </span>
            ) : (
              `Showing ${filteredAndSortedManuscripts.length} article${filteredAndSortedManuscripts.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>

        {/* Publications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border-0 bg-white/80">
                <CardHeader className="pb-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAndSortedManuscripts.length > 0 ? (
            filteredAndSortedManuscripts.map((manuscript) => (
              <PublicationCard 
                key={manuscript.id} 
                manuscript={manuscript} 
                journal={getJournalById(manuscript.journal_id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No articles found</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Try adjusting your search criteria or filters to find more articles
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}