import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ExternalLink, ArrowRight, Megaphone, Award, Globe, BookOpen, Star, Handshake } from 'lucide-react';
import { createPageUrl } from '@/utils';

const CATEGORY_CONFIG = {
  call_for_papers: { label: 'Call for Papers', icon: BookOpen, color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  indexing: { label: 'Indexing Achievement', icon: Star, color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  conference: { label: 'Conference', icon: Globe, color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  announcement: { label: 'Announcement', icon: Megaphone, color: 'bg-teal-100 text-teal-800 border-teal-200', dot: 'bg-teal-500' },
  award: { label: 'Award', icon: Award, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  partnership: { label: 'Partnership', icon: Handshake, color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
};

function NewsCard({ post, featured }) {
  const cfg = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.announcement;
  const Icon = cfg.icon;

  if (featured) {
    return (
      <article className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white shadow-2xl">
        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-25 transition-opacity" />
        )}
        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30`}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
            <span className="text-xs text-blue-200">📌 Featured</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{post.title}</h3>
          <p className="text-blue-100 text-base mb-5 leading-relaxed">{post.summary}</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm text-blue-200">
              {post.published_date && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(post.published_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              )}
              {post.deadline && (
                <span className="flex items-center gap-1.5 text-amber-300 font-semibold">⏰ Deadline: {new Date(post.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
            {post.external_url ? (
              <a href={post.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                Learn More <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 bg-white/10 text-white text-sm px-4 py-2 rounded-xl border border-white/20">
                {post.author_name}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {post.cover_image_url && (
        <img src={post.cover_image_url} alt={post.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
          {post.deadline && <span className="text-xs text-red-600 font-medium">⏰ {new Date(post.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
        </div>
        <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">{post.title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">{post.summary}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {post.published_date ? new Date(post.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
          </span>
          {post.external_url ? (
            <a href={post.external_url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 text-xs font-semibold flex items-center gap-1">
              Read more <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs text-slate-400">{post.author_name}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function NewsSection() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    base44.entities.NewsPost.filter({ status: 'published' }, '-published_date', 10)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && posts.length === 0) return null;

  const featured = posts.find(p => p.is_featured);
  const rest = posts.filter(p => !p.is_featured).slice(0, 6);

  // Structured data for Google News / SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "AfriSci Nexus News",
    "itemListElement": posts.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "NewsArticle",
        "headline": p.title,
        "description": p.summary,
        "datePublished": p.published_date,
        "author": { "@type": "Organization", "name": p.author_name || "AfriSci Nexus" },
        "publisher": { "@type": "Organization", "name": "AfriSci Nexus" }
      }
    }))
  };

  return (
    <section aria-label="AfriSci Nexus News and Announcements" className="py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Section Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-8 h-1 bg-teal-500 rounded-full"></span>
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-widest">Latest News</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            News & Announcements
          </h2>
          <p className="text-slate-500 mt-2 text-base max-w-xl">
            Stay updated with calls for papers, indexing milestones, conferences, and platform news from AfriSci Nexus.
          </p>
        </div>
        <Link to={createPageUrl('NewsAndAnnouncements')} className="hidden md:inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 font-semibold text-sm transition-colors">
          All News <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {featured && <NewsCard post={featured} featured />}
          {rest.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map(post => <NewsCard key={post.id} post={post} />)}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center md:hidden">
        <Link to={createPageUrl('NewsAndAnnouncements')} className="inline-flex items-center gap-2 text-teal-600 font-semibold text-sm">
          View All News <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}