import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, X, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SearchPage() {
  // In a real app, these would be state variables
  const searchResults = []; // Placeholder for results
  const isLoading = false;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
       <div className="text-center py-24 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Advanced Search</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-sky-200">
          Refine your search to find the exact research you need.
        </p>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <div className="space-y-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search by keywords, author, title, DOI..."
                className="pl-12 h-12 text-lg"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Select>
                <SelectTrigger><SelectValue placeholder="All Journals" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="j1">Journal of African STEM</SelectItem>
                  <SelectItem value="j2">West African Journal of Social Sciences</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger><SelectValue placeholder="All Disciplines" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stem">STEM</SelectItem>
                  <SelectItem value="social_sciences">Social Sciences</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" placeholder="Publication Date After" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost"><X className="w-4 h-4 mr-2" />Clear Filters</Button>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                <SearchIcon className="w-4 h-4 mr-2" /> Search
              </Button>
            </div>
          </div>
        </Card>

        {/* Search Results */}
        <div className="mt-12">
          {isLoading ? (
            <p>Loading...</p>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {/* Results would be mapped here */}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Start Your Search</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Use the filters above to find articles and journals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}