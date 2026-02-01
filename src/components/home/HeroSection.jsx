import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, ShieldCheck, Globe, BookOpen } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative bg-blue-900 text-white overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532187863486-abf9db50b6aa?q=80&w=2070&auto=format&fit=crop')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-blue-900/80 to-transparent"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
          The Nexus of African Scientific Excellence
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-blue-100 drop-shadow-md">
          Discover, publish, and collaborate on groundbreaking research from across the African continent and beyond.
        </p>
        
        <div className="mt-10 max-w-xl mx-auto">
          <form className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-300" />
            <Input
              type="search"
              placeholder="Search for articles, authors, or journals..."
              className="w-full pl-12 pr-4 py-3 h-14 rounded-full bg-white/10 border-white/20 text-white placeholder:text-sky-200 backdrop-blur-sm focus:bg-white/20 focus:ring-2 focus:ring-teal-400"
            />
          </form>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={createPageUrl("Submit")}>
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              Submit Your Manuscript <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to={createPageUrl("Journals")}>
            <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white hover:text-blue-800 w-full sm:w-auto font-semibold backdrop-blur-sm">
              Explore Journals
            </Button>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-sky-200">
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-400"/> Peer-Reviewed</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-teal-400"/> Open Access</span>
            <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-400"/> Multi-Disciplinary</span>
        </div>
      </div>
    </div>
  );
}