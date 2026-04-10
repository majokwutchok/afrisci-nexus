import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  BookOpen, 
  Globe, 
  Award,
  Filter,
  Star,
  CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

const categoryColors = {
  stem: "bg-blue-100 text-blue-800 border-blue-200",
  medicine_health: "bg-red-100 text-red-800 border-red-200",
  agriculture_environment: "bg-green-100 text-green-800 border-green-200",
  social_sciences: "bg-purple-100 text-purple-800 border-purple-200",
  law_policy: "bg-gray-100 text-gray-800 border-gray-200",
  arts_humanities: "bg-pink-100 text-pink-800 border-pink-200",
  business_economics: "bg-orange-100 text-orange-800 border-orange-200",
  education_pedagogy: "bg-yellow-100 text-yellow-800 border-yellow-200",
  interdisciplinary: "bg-indigo-100 text-indigo-800 border-indigo-200"
};

const coverBgs = {
  stem: "from-blue-950 via-blue-900 to-cyan-900",
  medicine_health: "from-red-950 via-rose-900 to-pink-900",
  agriculture_environment: "from-green-950 via-green-900 to-emerald-900",
  social_sciences: "from-purple-950 via-violet-900 to-purple-900",
  law_policy: "from-slate-950 via-slate-900 to-gray-900",
  arts_humanities: "from-amber-950 via-orange-900 to-amber-900",
  business_economics: "from-indigo-950 via-indigo-900 to-blue-900",
  education_pedagogy: "from-sky-950 via-sky-900 to-blue-900",
  interdisciplinary: "from-teal-950 via-teal-900 to-cyan-900",
};

const coverIcons = {
  stem: "⚛️", medicine_health: "🏥", agriculture_environment: "🌱",
  social_sciences: "🌐", law_policy: "⚖️", arts_humanities: "🎨",
  business_economics: "📈", education_pedagogy: "🎓", interdisciplinary: "🔬",
};

const JournalCard = ({ journal }) => (
  <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 overflow-hidden">
    {/* Branded Cover */}
    <Link to={createPageUrl(`JournalDetail?id=${journal.id}`)}>
      <div className={`relative bg-gradient-to-br ${coverBgs[journal.category] || 'from-slate-900 to-slate-800'} h-36 overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <circle cx="85%" cy="30%" r="80" fill="white" fillOpacity="0.3"/>
            <circle cx="10%" cy="80%" r="50" fill="white" fillOpacity="0.15"/>
          </svg>
        </div>
        <div className="relative p-4 h-full flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/40">AfriSci Nexus Discovery</span>
          </div>
          <div>
            <span className="text-2xl mb-1 block">{coverIcons[journal.category] || "📖"}</span>
            <p className="text-white font-bold text-sm leading-tight line-clamp-2">{journal.title}</p>
          </div>
        </div>
      </div>
    </Link>
    <CardHeader className="p-5 pb-3 bg-white">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <Link to={createPageUrl(`JournalDetail?id=${journal.id}`)}>
            <CardTitle className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
              {journal.title}
            </CardTitle>
          </Link>
          {journal.editor_in_chief && <p className="text-xs text-slate-500 mt-0.5">{journal.editor_in_chief}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {journal.is_open_access && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />OA
            </Badge>
          )}
          {journal.impact_factor && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-semibold">
              <Star className="w-3 h-3" />{journal.impact_factor}
            </div>
          )}
        </div>
      </div>
      <Badge className={`${categoryColors[journal.category]} text-xs font-medium w-fit border`}>
        {categoryLabels[journal.category]}
      </Badge>
    </CardHeader>
    <CardContent className="p-5 pt-0 bg-white">
      <p className="text-slate-600 text-sm line-clamp-2 mb-3">{journal.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1"><Globe className="w-3 h-3" />{journal.languages?.length || 1} lang</div>
          {journal.issn && <span className="font-mono">ISSN: {journal.issn}</span>}
        </div>
        <Link to={createPageUrl(`JournalDetail?id=${journal.id}`)}>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            View Details
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Journal.list('-created_date', 200);
      setJournals(data);
    } catch (error) {
      console.error("Error loading journals:", error);
    }
    setIsLoading(false);
  };

  const filteredJournals = journals.filter(journal => {
    const matchesSearch = journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         journal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         journal.editor_in_chief?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || journal.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(categoryLabels);
  const journalsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = journals.filter(j => j.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <SEO
        title="Browse African Academic Journals — 12 Peer-Reviewed Publications"
        description="Explore 12 peer-reviewed African academic journals covering STEM, medicine, law, agriculture, social sciences, humanities and more. All open-access, all serving African research."
        keywords="African academic journals, peer reviewed journals Africa, open access journals Africa, STEM journals Africa, medical journals Africa, social science journals Africa"
        canonicalPath="/Journals"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "African Academic Journals — AfriSci Nexus",
          "description": "Browse 50+ open-access peer-reviewed African academic journals",
          "url": "https://afrisco-nexus.base44.app/Journals"
        }}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Scientific Journals</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore our 12 peer-reviewed journals across all major disciplines
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search journals, topics, or editors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 border-slate-200 focus:border-emerald-300 focus:ring-emerald-200 rounded-xl"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 rounded-xl">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Categories Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 shadow-sm mb-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 rounded-lg py-2 text-xs font-medium"
              >
                All ({journals.length})
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 rounded-lg py-2 text-xs font-medium"
                >
                  {categoryLabels[category].split(' ')[0]} ({journalsByCategory[category] || 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeCategory} className="mt-0">
            {/* Results */}
            <div className="mb-6">
              <p className="text-slate-600 font-medium">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    Loading journals...
                  </span>
                ) : (
                  `Showing ${filteredJournals.length} journal${filteredJournals.length !== 1 ? 's' : ''}`
                )}
              </p>
            </div>

            {/* Journals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="border-0 bg-white/80">
                    <div className="h-1 bg-gray-200" />
                    <CardHeader className="p-6 pb-4">
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-20 rounded-lg" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredJournals.length > 0 ? (
                filteredJournals.map((journal) => (
                  <JournalCard key={journal.id} journal={journal} />
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-12 h-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No journals found</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Try adjusting your search criteria or browse different categories
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}