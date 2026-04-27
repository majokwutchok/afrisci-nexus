import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, FileText, TrendingUp, BookOpen } from "lucide-react";

export default function ResearcherDirectory() {
  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Manuscript.filter({ status: "published" }, "-publication_date", 500),
      base44.entities.Journal.list("-created_date", 200),
    ]).then(([ms, j]) => {
      setManuscripts(ms);
      setJournals(j);
      setIsLoading(false);
    });
  }, []);

  const journalMap = useMemo(() => Object.fromEntries(journals.map(j => [j.id, j])), [journals]);

  // Build a map of author email → aggregated profile
  const authors = useMemo(() => {
    const map = {};
    manuscripts.forEach(ms => {
      (ms.authors || []).forEach(a => {
        const key = a.email || a.name;
        if (!key) return;
        if (!map[key]) {
          map[key] = {
            key,
            name: a.name,
            email: a.email,
            affiliation: a.affiliation,
            articles: [],
            totalCitations: 0,
            journals: new Set(),
          };
        }
        map[key].articles.push(ms);
        map[key].totalCitations += ms.citation_count || 0;
        if (ms.journal_id) map[key].journals.add(ms.journal_id);
      });
    });
    return Object.values(map).sort((a, b) => b.totalCitations - a.totalCitations);
  }, [manuscripts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return authors;
    const q = search.toLowerCase();
    return authors.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.affiliation?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    );
  }, [authors, search]);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/20 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Researcher Directory</h1>
          </div>
          <p className="text-slate-600 max-w-xl mx-auto">
            Discover researchers who have published in AfriSci Nexus journals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
            <CardContent className="p-5 text-center">
              <Users className="w-7 h-7 mx-auto mb-1 text-blue-200" />
              <p className="text-2xl font-bold">{authors.length}</p>
              <p className="text-xs text-blue-100">Researchers</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg">
            <CardContent className="p-5 text-center">
              <FileText className="w-7 h-7 mx-auto mb-1 text-emerald-200" />
              <p className="text-2xl font-bold">{manuscripts.length}</p>
              <p className="text-xs text-emerald-100">Publications</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg col-span-2 md:col-span-1">
            <CardContent className="p-5 text-center">
              <TrendingUp className="w-7 h-7 mx-auto mb-1 text-amber-200" />
              <p className="text-2xl font-bold">{manuscripts.reduce((s, m) => s + (m.citation_count || 0), 0)}</p>
              <p className="text-xs text-amber-100">Total Citations</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by name, affiliation, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 py-3 rounded-xl border-slate-200"
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(9).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No researchers found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(author => (
              <Link
                key={author.key}
                to={createPageUrl(`ResearcherProfile?key=${encodeURIComponent(author.key)}`)}
              >
                <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-0 bg-white cursor-pointer group">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {author.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{author.name}</p>
                        {author.affiliation && (
                          <p className="text-xs text-slate-500 truncate">{author.affiliation}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {author.articles.length} article{author.articles.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {author.totalCitations} citation{author.totalCitations !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {author.journals.size} journal{author.journals.size !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}