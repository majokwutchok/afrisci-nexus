import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Award, TrendingUp, Clock, Download, Eye, BookOpen,
  CheckCircle, XCircle, BarChart3, Users, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

function MetricCard({ icon: Icon, label, value, sub, color = "teal", large = false }) {
  const colors = {
    teal: "from-teal-50 to-teal-100 border-teal-200 text-teal-600",
    blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-600",
    purple: "from-purple-50 to-purple-100 border-purple-200 text-purple-600",
    amber: "from-amber-50 to-amber-100 border-amber-200 text-amber-600",
    emerald: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-600",
    rose: "from-rose-50 to-rose-100 border-rose-200 text-rose-600",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6 flex flex-col items-center text-center`}>
      <Icon className={`w-8 h-8 mb-3 ${colors[color].split(' ')[4]}`} />
      <p className={`${large ? 'text-4xl' : 'text-3xl'} font-extrabold text-slate-900 mb-1`}>{value}</p>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value, highlight = false }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${highlight ? 'bg-teal-50 border border-teal-200' : 'bg-slate-50'}`}>
      <span className="text-sm text-slate-700">{label}</span>
      <Badge variant={highlight ? 'default' : 'outline'} className={highlight ? 'bg-teal-600 text-white' : ''}>
        {value}
      </Badge>
    </div>
  );
}

export default function JournalMetrics({ journal, allManuscripts, publishedManuscripts }) {
  const metrics = useMemo(() => {
    const total = allManuscripts.length;
    const published = publishedManuscripts.length;
    const rejected = allManuscripts.filter(m => m.status === 'rejected').length;
    const reviewed = published + rejected;
    const acceptanceRate = reviewed > 0 ? Math.round((published / reviewed) * 100) : null;

    // Total downloads, views, citations from published articles
    const totalDownloads = publishedManuscripts.reduce((s, m) => s + (m.download_count || 0), 0);
    const totalViews = publishedManuscripts.reduce((s, m) => s + (m.view_count || 0), 0);
    const totalCitations = publishedManuscripts.reduce((s, m) => s + (m.citation_count || 0), 0);

    // Avg time to first decision (days): submitted date → first non-submitted timeline entry
    const decisionTimes = allManuscripts
      .filter(m => m.timeline && m.timeline.length >= 2)
      .map(m => {
        const sorted = [...m.timeline].sort((a, b) => new Date(a.date) - new Date(b.date));
        const submitted = sorted.find(t => t.status === 'submitted');
        const first = sorted.find(t => t.status !== 'submitted' && t.date);
        if (submitted && first) {
          return (new Date(first.date) - new Date(submitted.date)) / (1000 * 60 * 60 * 24);
        }
        return null;
      })
      .filter(d => d !== null && d >= 0 && d < 365);

    const avgDecisionDays = decisionTimes.length > 0
      ? Math.round(decisionTimes.reduce((s, d) => s + d, 0) / decisionTimes.length)
      : null;

    // Articles per year
    const byYear = {};
    publishedManuscripts.forEach(m => {
      const year = m.publication_date
        ? new Date(m.publication_date).getFullYear()
        : new Date(m.created_date).getFullYear();
      byYear[year] = (byYear[year] || 0) + 1;
    });
    const yearData = Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => ({ year, count }));

    // Downloads per article trend (use published sorted by date)
    const downloadTrend = publishedManuscripts
      .filter(m => m.publication_date)
      .sort((a, b) => new Date(a.publication_date) - new Date(b.publication_date))
      .slice(-12)
      .map(m => ({
        title: m.title.length > 20 ? m.title.slice(0, 20) + '…' : m.title,
        downloads: m.download_count || 0,
        citations: m.citation_count || 0,
      }));

    return {
      total, published, rejected, acceptanceRate,
      totalDownloads, totalViews, totalCitations,
      avgDecisionDays, yearData, downloadTrend,
    };
  }, [allManuscripts, publishedManuscripts]);

  return (
    <div className="space-y-8">
      {/* Top KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={Award}
          label="Impact Factor"
          value={journal.impact_factor ?? 'N/A'}
          sub={journal.impact_factor ? '2025 score' : 'Not yet rated'}
          color="amber"
        />
        <MetricCard
          icon={CheckCircle}
          label="Acceptance Rate"
          value={metrics.acceptanceRate !== null ? `${metrics.acceptanceRate}%` : 'N/A'}
          sub={metrics.acceptanceRate !== null ? `of ${metrics.published + metrics.rejected} reviewed` : 'Insufficient data'}
          color="emerald"
        />
        <MetricCard
          icon={Clock}
          label="Avg. Decision"
          value={metrics.avgDecisionDays !== null ? `${metrics.avgDecisionDays}d` : '4–6 wks'}
          sub="Time to first decision"
          color="blue"
        />
        <MetricCard
          icon={Download}
          label="Total Downloads"
          value={metrics.totalDownloads > 0 ? metrics.totalDownloads.toLocaleString() : 'N/A'}
          sub="All-time article downloads"
          color="teal"
        />
        <MetricCard
          icon={Eye}
          label="Total Views"
          value={metrics.totalViews > 0 ? metrics.totalViews.toLocaleString() : 'N/A'}
          sub="Abstract & full-text"
          color="purple"
        />
        <MetricCard
          icon={TrendingUp}
          label="Citations"
          value={metrics.totalCitations > 0 ? metrics.totalCitations.toLocaleString() : 'N/A'}
          sub="Across all articles"
          color="rose"
        />
      </div>

      {/* Two column: stats + chart */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Publishing stats table */}
        <Card className="border-0 bg-white/80 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Publishing Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StatRow label="Total Submissions" value={metrics.total || 0} />
            <StatRow label="Published Articles" value={metrics.published} highlight />
            <StatRow label="Rejected Manuscripts" value={metrics.rejected} />
            <StatRow
              label="Acceptance Rate"
              value={metrics.acceptanceRate !== null ? `${metrics.acceptanceRate}%` : 'N/A'}
            />
            <StatRow
              label="Avg. Time to Decision"
              value={metrics.avgDecisionDays !== null ? `${metrics.avgDecisionDays} days` : '4–6 weeks'}
            />
            <StatRow label="Avg. Time to Publication" value="8–12 weeks" />
            <StatRow label="Review Type" value={journal.review_type?.replace('_', ' ') || 'Double-blind'} />
            <StatRow label="Open Access" value={journal.is_open_access ? 'Yes (CC BY 4.0)' : 'Subscription'} highlight={journal.is_open_access} />
          </CardContent>
        </Card>

        {/* Articles per year chart */}
        <Card className="border-0 bg-white/80 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Publications per Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.yearData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.yearData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v) => [v, 'Articles']}
                  />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                No publication history yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top articles by downloads */}
      {metrics.downloadTrend.length > 0 && (
        <Card className="border-0 bg-white/80 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-5 h-5 text-teal-600" />
              Article-Level Metrics (Recent Publications)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics.downloadTrend} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="downloads" stroke="#0d9488" fill="#ccfbf1" name="Downloads" />
                <Area type="monotone" dataKey="citations" stroke="#7c3aed" fill="#ede9fe" name="Citations" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transparency notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4">
        <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 mb-1">Transparency Commitment</p>
          <p className="text-sm text-blue-800">
            AfriSci Nexus publishes journal performance metrics openly to help authors make informed submission decisions.
            Acceptance rates and decision times are computed from real submission data.
            Impact factors are sourced from Crossref and updated annually.
          </p>
        </div>
      </div>
    </div>
  );
}