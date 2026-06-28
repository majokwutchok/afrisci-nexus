import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, TrendingUp, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PublicationCard = ({ pub, journal }) => (
  <Card className="flex flex-col md:flex-row items-center p-4 gap-4 hover:bg-slate-100/70 transition-colors border-0 shadow-sm">
    <div className="flex-shrink-0 bg-teal-100 text-teal-700 p-4 rounded-lg">
      <FileText className="h-6 w-6" />
    </div>
    <div className="flex-1 text-center md:text-left">
      <Link to={createPageUrl(`ManuscriptDetail?id=${pub.id}`)} className="font-semibold text-slate-800 hover:text-emerald-700 line-clamp-2">
        {pub.title}
      </Link>
      <p className="text-sm text-slate-600 mt-1 line-clamp-1">
        {pub.authors?.map((a, i) => (
          <span key={i}>
            {i > 0 && ', '}
            <Link
              to={`/AuthorProfile?email=${encodeURIComponent(a.email || '')}&name=${encodeURIComponent(a.name || '')}`}
              className="hover:text-teal-600 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              {a.name}
            </Link>
          </span>
        ))}
      </p>
      <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-xs">
        {journal && <Badge variant="secondary">{journal.title}</Badge>}
        <span className="text-slate-500">{pub.publication_date ? format(new Date(pub.publication_date), 'dd MMM yyyy') : ''}</span>
      </div>
      {pub.doi && (
        <a
          href={`https://doi.org/${pub.doi}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline mt-1 block truncate"
        >
          https://doi.org/{pub.doi}
        </a>
      )}
    </div>
  </Card>
);

export default function LatestPublications({ publications, journals, isLoading }) {
  const getJournalById = (id) => journals.find(j => j.id === id);
  
  const popular = [...publications].sort((a,b) => (b.view_count || 0) - (a.view_count || 0));
  const openAccess = publications.filter(p => p.access_type === 'open_access');

  const renderList = (pubs) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
       {pubs.slice(0, 6).map(pub => {
         const journal = getJournalById(pub.journal_id);
         return <PublicationCard key={pub.id} pub={pub} journal={journal} />;
       })}
    </div>
  );

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Latest Research</h2>
        <p className="mt-2 max-w-2xl mx-auto text-slate-600">
          Stay informed with the newest articles published across our journals.
        </p>
      </div>
      
      <Tabs defaultValue="recent" className="w-full">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="recent"><Sparkles className="w-4 h-4 mr-2" />Recent</TabsTrigger>
            <TabsTrigger value="popular"><TrendingUp className="w-4 h-4 mr-2" />Popular</TabsTrigger>
            <TabsTrigger value="open_access"><FileText className="w-4 h-4 mr-2" />Open Access</TabsTrigger>
          </TabsList>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="recent">
              {renderList(publications)}
            </TabsContent>
            <TabsContent value="popular">
              {renderList(popular)}
            </TabsContent>
            <TabsContent value="open_access">
              {renderList(openAccess)}
            </TabsContent>
          </>
        )}
      </Tabs>
      
      <div className="text-center mt-8">
        <Link to={createPageUrl("Publications")}>
          <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 hover:text-teal-700">
            Explore All Publications <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}