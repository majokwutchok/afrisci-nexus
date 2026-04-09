import React, { useState, useEffect, Suspense } from 'react';
import SEO from '../components/SEO';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '../components/layout/Footer';
import HomeHeader from '../components/home/HomeHeader';

import HeroSection from '../components/home/HeroSection';
import StatsBar from '../components/home/StatsBar';
import FeaturedJournals from '../components/home/FeaturedJournals';
import WhyNexus from '../components/home/WhyNexus';
import LatestPublications from '../components/home/LatestPublications';
import DisciplineExplorer from '../components/home/DisciplineExplorer';
import ReviewerCTA from '../components/home/ReviewerCTA';
import ReadershipMap from '../components/home/ReadershipMap';
import ImpactMetrics from '../components/home/ImpactMetrics';
import NewsSection from '../components/home/NewsSection';
import HomeSidebar from '../components/home/HomeSidebar';

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
        const [journalData, publicationData, readershipData, userData] = await Promise.all([
          base44.entities.Journal.list('-created_date', 200),
          base44.entities.Manuscript.filter({ status: 'published' }, '-publication_date', 20),
          base44.entities.ReadershipStats.list('-view_date', 500),
          base44.entities.User.filter({ reviewer_status: 'active' }, '-created_date', 200),
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
    journals: isLoading ? null : data.journals.length || 0,
    articles: isLoading ? null : data.publications.length || 0,
    reviewers: isLoading ? null : data.users.length || 0,
    countries: isLoading ? null : [...new Set(data.stats.map(s => s.country).filter(Boolean))].length || 0,
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

      <div className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8 items-start">
            {/* Main Content Column */}
            <div className="lg:col-span-3 space-y-24">
              <Suspense fallback={<ComponentLoader />}>
                <FeaturedJournals journals={data.journals} isLoading={isLoading} />
                <NewsSection />
                <WhyNexus />
                <LatestPublications publications={data.publications} journals={data.journals} isLoading={isLoading} />
                <DisciplineExplorer />
                <ImpactMetrics />
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <ReadershipMap stats={data.stats} isLoading={isLoading} />
                  <ReviewerCTA />
                </div>
              </Suspense>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1 lg:sticky lg:top-8">
              <HomeSidebar />
            </div>
          </div>
        </div>
      </div>
      
       <Footer />
    </div>
  );
}