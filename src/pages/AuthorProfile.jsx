import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, Globe, Mail, Award, TrendingUp, Download, Eye,
  ExternalLink, Building2, Calendar, Quote, User as UserIcon
} from 'lucide-react';

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg ${color}`}>
      <Icon className="w-5 h-5 mb-2 opacity-80" />
      <p className="text-3xl font-bold">{value?.toLocaleString() ?? '—'}</p>
      <p className="text-sm opacity-80 mt-0.5">{label}</p>
    </div>
  );
}

function PublicationCard({ manuscript, journals }) {
  const journal = journals.find(j => j.id === manuscript.journal_id);
  return (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/ManuscriptDetail?id=${manuscript.id}`}
              className="font-semibold text-slate-900 hover:text-teal-700 transition-colors line-clamp-2"
            >
              {manuscript.title}
            </Link>
            {journal && (
              <p className="text-sm text-teal-600 font-medium mt-1">{journal.title}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Published {manuscript.publication_date ? new Date(manuscript.publication_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
            </p>
            {manuscript.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {manuscript.keywords.slice(0, 4).map(kw => (
                  <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-xs text-slate-500">
            {manuscript.citation_count > 0 && (
              <span className="flex items-center gap-1"><Quote className="w-3 h-3" />{manuscript.citation_count}</span>
            )}
            {manuscript.download_count > 0 && (
              <span className="flex items-center gap-1"><Download className="w-3 h-3" />{manuscript.download_count}</span>
            )}
            {manuscript.view_count > 0 && (
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{manuscript.view_count}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuthorProfile() {
  const params = new URLSearchParams(window.location.search);
  const authorEmail = params.get('email');
  const authorName = params.get('name');

  const [manuscripts, setManuscripts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorInfo, setAuthorInfo] = useState(null);

  useEffect(() => {
    if (!authorEmail && !authorName) { setLoading(false); return; }
    loadProfile();
  }, [authorEmail, authorName]);

  const loadProfile = async () => {
    setLoading(true);
    const allManuscripts = await base44.entities.Manuscript.filter({ status: 'published' }, '-publication_date', 500);
    const allJournals = await base44.entities.Journal.list('-created_date', 200);

    // Find manuscripts where this person is an author
    const authored = allManuscripts.filter(m =>
      m.authors?.some(a =>
        (authorEmail && a.email?.toLowerCase() === authorEmail.toLowerCase()) ||
        (authorName && a.name?.toLowerCase() === authorName.toLowerCase())
      )
    );

    // Extract consistent author info from first match
    let info = null;
    for (const m of authored) {
      const match = m.authors?.find(a =>
        (authorEmail && a.email?.toLowerCase() === authorEmail.toLowerCase()) ||
        (authorName && a.name?.toLowerCase() === authorName.toLowerCase())
      );
      if (match) { info = match; break; }
    }

    setManuscripts(authored);
    setJournals(allJournals);
    setAuthorInfo(info);
    setLoading(false);
  };

  const totalCitations = manuscripts.reduce((s, m) => s + (m.citation_count || 0), 0);
  const totalDownloads = manuscripts.reduce((s, m) => s + (m.download_count || 0), 0);
  const totalViews = manuscripts.reduce((s, m) => s + (m.view_count || 0), 0);
  const uniqueJournals = new Set(manuscripts.map(m => m.journal_id).filter(Boolean)).size;

  const journalFreq = {};
  manuscripts.forEach(m => {
    if (m.journal_id) journalFreq[m.journal_id] = (journalFreq[m.journal_id] || 0) + 1;
  });

  const displayName = authorInfo?.name || authorName || 'Author';
  const displayEmail = authorInfo?.email || authorEmail;

  if (!authorEmail && !authorName) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <p>No author specified. Please provide an email or name in the URL.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="w-28 h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-2xl flex-shrink-0">
            <span className="text-4xl font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="text-center sm:text-left">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-64 bg-white/20" />
                <Skeleton className="h-5 w-48 bg-white/15" />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold tracking-tight">{displayName}</h1>
                {authorInfo?.affiliation && (
                  <p className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sky-200">
                    <Building2 className="w-4 h-4" /> {authorInfo.affiliation}
                  </p>
                )}
                {displayEmail && (
                  <a href={`mailto:${displayEmail}`} className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-sky-300 hover:text-white transition-colors text-sm">
                    <Mail className="w-4 h-4" /> {displayEmail}
                  </a>
                )}
                {authorInfo?.orcid && (
                  <a href={`https://orcid.org/${authorInfo.orcid}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 hover:bg-white/20 transition-colors">
                    <ExternalLink className="w-3 h-3" /> ORCID: {authorInfo.orcid}
                  </a>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                  <Badge className="bg-teal-500/20 text-teal-200 border border-teal-400/30">
                    {manuscripts.length} Publications
                  </Badge>
                  {authorInfo?.is_corresponding && (
                    <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/30">Corresponding Author</Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <StatCard icon={Quote} value={totalCitations} label="Total Citations" color="bg-gradient-to-br from-purple-600 to-indigo-600" />
          <StatCard icon={Download} value={totalDownloads} label="Downloads" color="bg-gradient-to-br from-emerald-600 to-teal-600" />
          <StatCard icon={Eye} value={totalViews} label="Total Views" color="bg-gradient-to-br from-blue-600 to-cyan-500" />
          <StatCard icon={BookOpen} value={uniqueJournals} label="Journals" color="bg-gradient-to-br from-amber-500 to-orange-600" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Publications List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Publications ({manuscripts.length})
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : manuscripts.length > 0 ? (
              <div className="space-y-3">
                {manuscripts.map(m => (
                  <PublicationCard key={m.id} manuscript={m} journals={journals} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No published articles found for this author.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Journals Published In */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-5">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600" /> Journals Published In
                </h3>
                {loading ? (
                  <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(journalFreq)
                      .sort((a, b) => b[1] - a[1])
                      .map(([jid, count]) => {
                        const j = journals.find(x => x.id === jid);
                        return j ? (
                          <div key={jid} className="flex items-center justify-between gap-2">
                            <Link to={`/JournalDetail?id=${jid}`} className="text-sm text-slate-700 hover:text-teal-600 transition-colors truncate">
                              {j.title}
                            </Link>
                            <Badge variant="secondary" className="flex-shrink-0 text-xs">{count}</Badge>
                          </div>
                        ) : null;
                      })}
                    {Object.keys(journalFreq).length === 0 && <p className="text-sm text-slate-400">None yet</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most Cited */}
            {!loading && manuscripts.filter(m => m.citation_count > 0).length > 0 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" /> Top Cited Articles
                  </h3>
                  <div className="space-y-3">
                    {[...manuscripts]
                      .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0))
                      .slice(0, 3)
                      .map(m => (
                        <div key={m.id}>
                          <Link to={`/ManuscriptDetail?id=${m.id}`} className="text-sm font-medium text-slate-800 hover:text-teal-600 transition-colors line-clamp-2">
                            {m.title}
                          </Link>
                          <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                            <Quote className="w-3 h-3" /> {m.citation_count} citations
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            {!loading && manuscripts.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-5">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" /> Publication Activity
                  </h3>
                  {(() => {
                    const byYear = {};
                    manuscripts.forEach(m => {
                      const y = m.publication_date ? new Date(m.publication_date).getFullYear() : 'Unknown';
                      byYear[y] = (byYear[y] || 0) + 1;
                    });
                    const max = Math.max(...Object.values(byYear));
                    return (
                      <div className="space-y-2">
                        {Object.entries(byYear).sort((a, b) => b[0] - a[0]).map(([year, count]) => (
                          <div key={year}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600 font-medium">{year}</span>
                              <span className="text-slate-500">{count} article{count > 1 ? 's' : ''}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                                style={{ width: `${(count / max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}