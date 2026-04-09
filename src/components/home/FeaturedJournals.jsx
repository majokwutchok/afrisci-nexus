import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Custom high-impact images for each journal category
const categoryImages = {
  stem: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=800&auto=format&fit=crop", // Circuit board/technology
  medicine_health: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=800&auto=format&fit=crop", // Medical research/DNA
  agriculture_environment: "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deac?q=80&w=800&auto=format&fit=crop", // Agriculture/plants
  social_sciences: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop", // People/community
  law_policy: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?q=80&w=800&auto=format&fit=crop", // Gavel/law books
  arts_humanities: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=800&auto=format&fit=crop", // Art/culture
  business_economics: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop", // Business/economics charts
  education_pedagogy: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop", // Education/learning
  interdisciplinary: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=800&auto=format&fit=crop" // Network/connections
};

// Fallback images array for backup
const fallbackImages = [
  "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1557683325-3ba8f0df79de?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512418490876-f92213b245b4?q=80&w=800&auto=format&fit=crop",
];

const categoryColors = {
  stem: "bg-blue-100 text-blue-800",
  medicine_health: "bg-red-100 text-red-800",
  agriculture_environment: "bg-green-100 text-green-800",
  social_sciences: "bg-purple-100 text-purple-800",
  law_policy: "bg-gray-100 text-gray-800",
  arts_humanities: "bg-pink-100 text-pink-800",
  business_economics: "bg-orange-100 text-orange-800",
  education_pedagogy: "bg-yellow-100 text-yellow-800",
  interdisciplinary: "bg-indigo-100 text-indigo-800"
};

const categoryGradients = {
  stem: "from-blue-600 to-purple-600",
  medicine_health: "from-red-500 to-pink-600",
  agriculture_environment: "from-green-500 to-emerald-600",
  social_sciences: "from-purple-500 to-indigo-600",
  law_policy: "from-slate-600 to-gray-700",
  arts_humanities: "from-pink-500 to-rose-600",
  business_economics: "from-orange-500 to-amber-600",
  education_pedagogy: "from-yellow-500 to-orange-500",
  interdisciplinary: "from-indigo-500 to-cyan-600"
};

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

const getJournalImage = (journal, index) => {
  if (journal.category && categoryImages[journal.category]) {
    return categoryImages[journal.category];
  }
  return fallbackImages[index % fallbackImages.length];
};

export default function FeaturedJournals({ journals, isLoading }) {
  const displayJournals = journals;

  return (
    <section>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Featured Journals</h2>
        <Link to={createPageUrl("Journals")} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden"><Skeleton className="h-80 w-full" /></Card>
          ))
        ) : (
          displayJournals.map((journal, index) => (
            <Card key={journal.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white">
              {/* Custom Image with Overlay */}
              <div className="relative h-48 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500"
                  style={{backgroundImage: `url(${getJournalImage(journal, index)})`}}
                />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${categoryGradients[journal.category] || 'from-slate-600 to-slate-800'} opacity-60 group-hover:opacity-70 transition-opacity duration-300`} />
                
                {/* Category Badge on Image */}
                <div className="absolute top-4 left-4">
                  <Badge className={`${categoryColors[journal.category]} border-white/20 backdrop-blur-sm shadow-lg`}>
                    {categoryLabels[journal.category]}
                  </Badge>
                </div>
                
                {/* Impact Factor Badge (if available) */}
                {journal.impact_factor && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm shadow-lg font-bold">
                      IF: {journal.impact_factor}
                    </Badge>
                  </div>
                )}
                
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors duration-200 leading-tight">
                    {journal.title}
                  </h3>
                </div>
              </div>
              
              <CardContent className="p-6 flex-grow">
                <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">{journal.description}</p>
                
                {/* Open Access Badge */}
                {journal.is_open_access && (
                  <div className="mt-3">
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Open Access
                    </Badge>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="p-6 pt-0 border-t border-slate-100">
                <div className="w-full">
                  <p className="text-xs text-slate-500 mb-3">
                    <span className="font-medium">Editor-in-Chief:</span> {journal.editor_in_chief}
                  </p>
                  
                  {/* View Details Button */}
                  <Link 
                    to={createPageUrl(`JournalDetail?id=${journal.id}`)}
                    className="block w-full"
                  >
                    <div className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r ${categoryGradients[journal.category] || 'from-slate-600 to-slate-700'} text-white text-center font-medium text-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
                      Explore Journal
                    </div>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}