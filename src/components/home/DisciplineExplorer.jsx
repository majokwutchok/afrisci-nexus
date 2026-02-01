import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Microscope, Heart, Sprout, Users, Scale, Palette, TrendingUp, GraduationCap, Network } from 'lucide-react';

// High-impact background images for each discipline
const disciplineBackgrounds = {
  stem: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=400&auto=format&fit=crop",
  medicine_health: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=400&auto=format&fit=crop",
  agriculture_environment: "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deac?q=80&w=400&auto=format&fit=crop",
  social_sciences: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
  law_policy: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?q=80&w=400&auto=format&fit=crop",
  arts_humanities: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=400&auto=format&fit=crop",
  business_economics: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=400&auto=format&fit=crop",
  education_pedagogy: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&auto=format&fit=crop",
  interdisciplinary: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=400&auto=format&fit=crop"
};

const disciplines = [
  { 
    key: "stem", 
    name: "STEM", 
    fullName: "Science, Technology, Engineering & Mathematics",
    icon: Microscope, 
    color: "text-blue-600", 
    bg: "bg-blue-50",
    gradient: "from-blue-500 to-purple-600"
  },
  { 
    key: "medicine_health", 
    name: "Medicine & Health", 
    fullName: "Medical Sciences & Public Health",
    icon: Heart, 
    color: "text-red-600", 
    bg: "bg-red-50",
    gradient: "from-red-500 to-pink-600"
  },
  { 
    key: "agriculture_environment", 
    name: "Agriculture & Environment", 
    fullName: "Agricultural Sciences & Environmental Studies",
    icon: Sprout, 
    color: "text-green-600", 
    bg: "bg-green-50",
    gradient: "from-green-500 to-emerald-600"
  },
  { 
    key: "social_sciences", 
    name: "Social Sciences", 
    fullName: "Sociology, Psychology & Anthropology",
    icon: Users, 
    color: "text-purple-600", 
    bg: "bg-purple-50",
    gradient: "from-purple-500 to-indigo-600"
  },
  { 
    key: "arts_humanities", 
    name: "Arts & Humanities", 
    fullName: "Literature, History & Cultural Studies",
    icon: Palette, 
    color: "text-pink-600", 
    bg: "bg-pink-50",
    gradient: "from-pink-500 to-rose-600"
  },
  { 
    key: "business_economics", 
    name: "Business & Economics", 
    fullName: "Economic Sciences & Management Studies",
    icon: TrendingUp, 
    color: "text-orange-600", 
    bg: "bg-orange-50",
    gradient: "from-orange-500 to-amber-600"
  },
  { 
    key: "education_pedagogy", 
    name: "Education & Pedagogy", 
    fullName: "Educational Sciences & Learning Theory",
    icon: GraduationCap, 
    color: "text-yellow-600", 
    bg: "bg-yellow-50",
    gradient: "from-yellow-500 to-orange-500"
  },
  { 
    key: "law_policy", 
    name: "Law & Policy", 
    fullName: "Legal Studies & Public Policy",
    icon: Scale, 
    color: "text-slate-600", 
    bg: "bg-slate-50",
    gradient: "from-slate-600 to-gray-700"
  },
  { 
    key: "interdisciplinary", 
    name: "Interdisciplinary", 
    fullName: "Cross-disciplinary Research",
    icon: Network, 
    color: "text-indigo-600", 
    bg: "bg-indigo-50",
    gradient: "from-indigo-500 to-cyan-600"
  }
];

export default function DisciplineExplorer() {
  return (
    <section className="text-center">
      <h2 className="text-3xl font-bold mb-2">Explore by Discipline</h2>
      <p className="mt-2 max-w-2xl mx-auto text-slate-600 mb-8">
        From groundbreaking medical research to innovative environmental solutions, find journals in your field.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {disciplines.map(discipline => (
          <Link key={discipline.key} to={createPageUrl(`Journals?category=${discipline.key}`)}>
            <Card className="group overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white h-full">
              {/* Background Image with Overlay */}
              <div className="relative h-32 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-700"
                  style={{backgroundImage: `url(${disciplineBackgrounds[discipline.key]})`}}
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${discipline.gradient} opacity-75 group-hover:opacity-85 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <discipline.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors duration-300 mb-2">
                  {discipline.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {discipline.fullName}
                </p>
                
                {/* Explore Button */}
                <div className="mt-4">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${discipline.gradient} text-white text-sm font-medium shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105`}>
                    Explore Journals
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}