import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

// Category names and accent colours (kept to the site palette).
const CATEGORY = {
  call_for_papers: { label: 'Call for papers', color: '#1E40AF' },
  indexing: { label: 'Indexing', color: '#B45309' },
  conference: { label: 'Conference', color: '#7C3AED' },
  announcement: { label: 'Announcement', color: '#0F766E' },
  award: { label: 'Award', color: '#B45309' },
  partnership: { label: 'Partnership', color: '#0F766E' },
};
const MAX_POSTS = 4;

function parseDate(value) {
  if (!value) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}
const fmt = (d, opts) => d.toLocaleDateString('en-GB', opts);

/** "Open until 31 Jan 2027", "Closes in 5 days", "Closes today", or "Closed". */
export function deadlineStatus(deadline, now = new Date()) {
  const d = parseDate(deadline);
  if (!d) return null;
  const end = new Date(d); end.setHours(23, 59, 59, 999);
  const days = Math.ceil((end - now) / 86400000);
  if (end < now) return { text: 'Closed', tone: 'closed' };
  if (days <= 1) return { text: 'Closes today', tone: 'soon' };
  if (days <= 14) return { text: `Closes in ${days} days`, tone: 'soon' };
  return { text: `Open until ${fmt(d, { day: 'numeric', month: 'short', year: 'numeric' })}`, tone: 'open' };
}
const TONE = {
  open: 'text-emerald-800 bg-emerald-50 ring-emerald-200',
  soon: 'text-amber-900 bg-amber-50 ring-amber-200',
  closed: 'text-slate-500 bg-slate-50 ring-slate-200',
};

function postHref(post) {
  return post.external_url || createPageUrl(`ResearchNewsArticle?id=${post.id}`);
}

function NewsRow({ post }) {
  const cat = CATEGORY[post.category] || CATEGORY.announcement;
  const date = parseDate(post.published_date) || parseDate(post.created_date);
  const status = deadlineStatus(post.deadline);
  const external = Boolean(post.external_url);
  // Skip a summary that only repeats the title.
  const summary = post.summary && post.summary.trim().toLowerCase() !== String(post.title || '').trim().toLowerCase() ? post.summary : '';
  const Anchor = external ? 'a' : Link;
  const anchorProps = external ? { href: post.external_url, target: '_blank', rel: 'noopener noreferrer' } : { to: postHref(post) };

  return (
    <li className="border-t border-slate-200">
      <Anchor {...anchorProps} className="group grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-5 py-5 outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-x-6 rounded-sm">
        {date ? (
          <time dateTime={date.toISOString().slice(0, 10)} className="row-span-2 flex flex-col leading-none text-slate-900 sm:row-span-1">
            <span className="text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">{fmt(date, { day: 'numeric' })}</span>
            <span className="mt-1.5 text-sm text-slate-500">{fmt(date, { month: 'short', year: 'numeric' })}</span>
          </time>
        ) : <span className="row-span-2 sm:row-span-1" />}

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium" style={{ color: cat.color }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} aria-hidden="true" />
            {cat.label}
            {post.is_featured && <span className="font-normal text-slate-500">Featured</span>}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold leading-snug text-slate-900 decoration-slate-300 underline-offset-4 group-hover:underline sm:text-xl">
            {post.title}
            {external && <span className="sr-only"> (opens in a new tab)</span>}
          </h3>
          {summary && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-slate-600 line-clamp-2">{summary}</p>}
        </div>

        {status && (
          <span className={`col-start-2 mt-3 w-fit self-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset sm:col-start-3 sm:mt-0.5 ${TONE[status.tone]}`}>
            {status.text}
          </span>
        )}
      </Anchor>
    </li>
  );
}

export default function NewsSection() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    base44.entities.NewsPost.filter({ status: 'published' }, '-published_date', 8)
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : rows?.items || [];
        // Featured first, then newest; open calls before closed ones of the same date.
        list.sort((a, b) => (b.is_featured === true) - (a.is_featured === true));
        setPosts(list.slice(0, MAX_POSTS));
      })
      .catch(() => setPosts([]));
  }, []);

  if (posts && posts.length === 0) return null;

  const structuredData = posts && {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AfriSci Nexus news and announcements',
    itemListElement: posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: p.external_url || `https://afriscinexus.com/ResearchNewsArticle?id=${p.id}`,
      item: {
        '@type': 'NewsArticle',
        headline: p.title,
        description: p.summary,
        datePublished: p.published_date,
        author: { '@type': 'Organization', name: p.author_name || 'AfriSci Nexus' },
        publisher: { '@type': 'Organization', name: 'AfriSci Nexus' },
      },
    })),
  };

  return (
    <section aria-labelledby="news-title">
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="news-title" className="text-3xl font-bold tracking-tight text-slate-900">News and announcements</h2>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
            Calls for papers, partnerships and platform updates from the editorial office.
          </p>
        </div>
        <Link to={createPageUrl('ResearchNewsAndAnnouncements')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-800 hover:text-blue-950">
          All news <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {posts === null ? (
        <ul className="mt-6" aria-busy="true" aria-label="Loading news">
          {[0, 1].map((i) => (
            <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-6 border-t border-slate-200 py-5">
              <div className="h-10 w-12 animate-pulse rounded bg-slate-100" />
              <div className="space-y-2"><div className="h-4 w-28 animate-pulse rounded bg-slate-100" /><div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" /></div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 border-b border-slate-200">
          {posts.map((post) => <NewsRow key={post.id} post={post} />)}
        </ul>
      )}
    </section>
  );
}
