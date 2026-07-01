import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import {
  Calendar, ExternalLink, ArrowLeft, Megaphone, Award, Globe, BookOpen, Star, Handshake, User
} from 'lucide-react';

const CATEGORY_CONFIG = {
  call_for_papers: { label: 'Call for Papers', icon: BookOpen, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  indexing: { label: 'Indexing Achievement', icon: Star, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  conference: { label: 'Conference', icon: Globe, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  announcement: { label: 'Announcement', icon: Megaphone, color: 'bg-teal-100 text-teal-800 border-teal-200' },
  award: { label: 'Award', icon: Award, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  partnership: { label: 'Partnership', icon: Handshake, color: 'bg-green-100 text-green-800 border-green-200' },
};

export default function NewsDetailPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    setIsLoading(true);
    base44.entities.NewsPost.get(id)
      .then(async (data) => {
        setPost(data);
        if (data?.category) {
          const others = await base44.entities.NewsPost.filter({ status: 'published', category: data.category }, '-published_date', 4).catch(() => []);
          setRelated(others.filter(p => p.id !== data.id).slice(0, 3));
        }
      })
      .catch(() => setPost(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!post || post.status !== 'published') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <Megaphone className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">News Post Not Found</h2>
        <p className="text-slate-600 mb-6">This post doesn't exist or is no longer available.</p>
        <Link to={createPageUrl('News')}>
          <Button>Back to News</Button>
        </Link>
      </div>
    );
  }

  const cfg = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.announcement;
  const Icon = cfg.icon;

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO
        title={post.title}
        description={post.summary}
        canonicalPath={`/NewsDetail?id=${post.id}`}
        ogImage={post.cover_image_url || undefined}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to={createPageUrl('News')} className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-8" />
        )}

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
          {post.is_featured && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">📌 Featured</span>}
          {post.deadline && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">
              ⏰ Deadline: {new Date(post.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200 flex-wrap">
          {post.author_name && (
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{post.author_name}</span>
          )}
          {post.published_date && (
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(post.published_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          )}
        </div>

        <p className="text-lg text-slate-700 leading-relaxed mb-6">{post.summary}</p>

        {post.content && (
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        )}

        {post.external_url && (
          <a href={post.external_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
            Learn More <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-slate-200">
            {post.tags.map(tag => (
              <span key={tag} className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg mb-4">More in {cfg.label}</h3>
            <div className="space-y-3">
              {related.map(r => (
                <Link key={r.id} to={createPageUrl(`NewsDetail?id=${r.id}`)} className="block p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all">
                  <p className="font-semibold text-slate-900 hover:text-teal-700 transition-colors">{r.title}</p>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-1">{r.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}