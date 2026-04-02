import React, { useState, useEffect, Suspense } from 'react';
import SEO from '../components/SEO';
import { Journal } from '@/entities/Journal';
import { Manuscript } from '@/entities/Manuscript';
import { ReadershipStats } from '@/entities/ReadershipStats';
import { User } from '@/entities/User';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '../components/layout/Footer';
import HomeHeader from '../components/home/HomeHeader';

// Lazy load components for better initial page load performance
const HeroSection = React.lazy(() => import('../components/home/HeroSection'));
const StatsBar = React.lazy(() => import('../components/home/StatsBar'));
const FeaturedJournals = React.lazy(() => import('../components/home/FeaturedJournals'));
const WhyNexus = React.lazy(() => import('../components/home/WhyNexus'));
const LatestPublications = React.lazy(() => import('../components/home/LatestPublications'));
const DisciplineExplorer = React.lazy(() => import('../components/home/DisciplineExplorer'));
const ReviewerCTA = React.lazy(() => import('../components/home/ReviewerCTA'));
const ReadershipMap = React.lazy(() => import('../components/home/ReadershipMap'));

export default function HomePage() {
  const [data, setData] = useState({
    journals: [],
    publications: [],
    stats: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          journalData,
          publicationData,
          readershipData,
          userData,
        ] = await Promise.all([
          Journal.list('-created_date', 4),
          Manuscript.filter({ status: 'published' }, '-publication_date', 20),
          ReadershipStats.list(),
          User.list(),
        ]);
        setData({
          journals: journalData,
          publications: publicationData,
          stats: readershipData,
          users: userData,
        });
      } catch (error) {
        console.error("Failed to fetch homepage data:", error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);
  
  const platformStats = {
    journals: 12, // Hardcoded for visual appeal
    articles: data.publications.length > 0 ? 1300 : 0, // Hardcoded
    reviewers: data.users.filter(u => u.reviewer_status === 'active').length > 0 ? 500 : 0, // Hardcoded
    countries: [...new Set(data.stats.map(s => s.country))].length > 0 ? 54 : 0, // Hardcoded
  };

  const ComponentLoader = () => (
    <div className="space-y-12 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "AfriSci Nexus — African Open Access Peer-Reviewed Journals",
    "description": "Africa's leading open-access academic publishing platform. Submit manuscripts, discover peer-reviewed research across 54 African countries.",
    "url": "https://afrisco-nexus.base44.app/",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://afrisco-nexus.base44.app/"}]
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      <SEO
        title="African Open Access Peer-Reviewed Journals & Research"
        description="AfriSci Nexus — Africa's leading open-access academic publishing platform. 50+ peer-reviewed journals, 10,000+ articles across STEM, medicine, agriculture, social sciences. Serving 54 African countries."
        keywords="African journals, open access research Africa, peer reviewed journals, academic publishing Africa, AfriSci Nexus, African science, submit manuscript, research papers Africa"
        canonicalPath="/"
        structuredData={structuredData}
      />
      <HomeHeader />
      
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><p>Loading...</p></div>}>
        <HeroSection />
      </Suspense>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<ComponentLoader />}>
          <StatsBar stats={platformStats} isLoading={isLoading} />
        </Suspense>
      </main>

      <div className="space-y-24 py-24">
         <Suspense fallback={<ComponentLoader />}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <FeaturedJournals journals={data.journals} isLoading={isLoading} />
            </div>
            
            <WhyNexus />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <LatestPublications publications={data.publications} journals={data.journals} isLoading={isLoading} />
            </div>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
               <DisciplineExplorer />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <ReadershipMap stats={data.stats} isLoading={isLoading} />
                <ReviewerCTA />
              </div>
            </div>
         </Suspense>
      </div>
      
       <Footer />
    </div>
  );
}