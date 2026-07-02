import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import {
  Calendar, ExternalLink, Search, Megaphone, Award, Globe, BookOpen, Star, Handshake
} from 'lucide-react';

const CATEGORY_CONFIG = {
  call_for_papers: { label: 'Call for Papers', icon: BookOpen, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  indexing: { label: 'Indexing Achievement', icon: Star, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  conference: { label: 'Conference', icon: Globe, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  announcement: { label: 'Announcement', icon: Megaphone, color: 'bg-teal-100 text-teal-800 border-teal-200' },
  award: { label: 'Award', icon: Award, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  partnership: { label: 'Partnership', icon: Handshake, color: 'bg-green-100 text-green-800 border-green-200' },
};

function NewsCard({ post }) {
  const cfg = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.announcement;
  const Icon = cfg.icon;
  return (
    <article className="group bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <Link to={createPageUrl(`NewsPostDetail?id=${post.id}`)} className="flex flex-col flex-1">
        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
            {post.is_featured && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">📌 Featured</span>}
            {post.deadline && <span className="text-xs text-red-600 font-medium">⏰ {new Date(post.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
          </div>
          <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">{post.title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">{post.summary}</p>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {post.published_date ? new Date(post.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
            </span>
            <span className="text-teal-600 text-xs font-semibold">Read more →</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function NewsAnnouncements() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.NewsPost.filter({ status: 'published' }, '-published_date', 200)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = ['all', ...Object.keys(CATEGORY_CONFIG)];

  const filtered = useMemo(() => posts.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) && !p.summary?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [posts, activeCategory, search]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO
        title="News & Announcements"
        description="Stay updated with calls for papers, indexing milestones, conferences, and platform news from AfriSci Nexus."
        canonicalPath="/NewsAnnouncements"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">News & Announcements</h1>
          <p className="text-blue-100 max-w-2xl">Calls for papers, indexing milestones, conferences, awards, and platform updates from AfriSci Nexus.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            placeholder="Search news..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => {
            const cfg = cat === 'all' ? { label: 'All' } : CATEGORY_CONFIG[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${isActive ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Megaphone className="w-14 h-14 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-400 text-lg">No news posts found</p>
            <p className="text-sm text-slate-300 mt-1">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(post => <NewsCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
}