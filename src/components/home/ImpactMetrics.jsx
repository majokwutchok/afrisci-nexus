import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Download, BookMarked, RefreshCw, Globe, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ISO2 country code map for flag emoji
const COUNTRY_FLAGS = {
  "Nigeria": "🇳🇬", "Kenya": "🇰🇪", "South Africa": "🇿🇦", "Ethiopia": "🇪🇹",
  "Ghana": "🇬🇭", "Tanzania": "🇹🇿", "Uganda": "🇺🇬", "Rwanda": "🇷🇼",
  "Cameroon": "🇨🇲", "Senegal": "🇸🇳", "Egypt": "🇪🇬", "Morocco": "🇲🇦",
  "Ivory Coast": "🇨🇮", "Zimbabwe": "🇿🇼", "Mozambique": "🇲🇿", "Zambia": "🇿🇲",
  "Angola": "🇦🇴", "Madagascar": "🇲🇬", "Malawi": "🇲🇼", "Botswana": "🇧🇼",
  "Namibia": "🇳🇦", "Mali": "🇲🇱", "Burkina Faso": "🇧🇫", "Guinea": "🇬🇳",
  "Sudan": "🇸🇩", "Algeria": "🇩🇿", "Tunisia": "🇹🇳", "Libya": "🇱🇾",
  "Somalia": "🇸🇴", "Congo": "🇨🇬", "DRC": "🇨🇩", "Chad": "🇹🇩",
  "Niger": "🇳🇪", "Sierra Leone": "🇸🇱", "Togo": "🇹🇬", "Benin": "🇧🇯",
  "Eritrea": "🇪🇷", "Liberia": "🇱🇷", "Mauritania": "🇲🇷", "Eswatini": "🇸🇿",
  "Lesotho": "🇱🇸", "Djibouti": "🇩🇯", "Comoros": "🇰🇲", "Gambia": "🇬🇲",
  "Guinea-Bissau": "🇬🇼", "Equatorial Guinea": "🇬🇶", "Gabon": "🇬🇦",
  "Seychelles": "🇸🇨", "Cape Verde": "🇨🇻", "Sao Tome": "🇸🇹",
  "United States": "🇺🇸", "United Kingdom": "🇬🇧", "Germany": "🇩🇪",
  "France": "🇫🇷", "China": "🇨🇳", "India": "🇮🇳", "Brazil": "🇧🇷",
  "Canada": "🇨🇦", "Australia": "🇦🇺", "Japan": "🇯🇵",
};

const getFlag = (country) => COUNTRY_FLAGS[country] || "🌐";

function AnimatedCount({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
}

function CountryRow({ country, views, downloads, rank, maxViews }) {
  const pct = Math.max(4, Math.round((views / maxViews) * 100));
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 group hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors">
      <span className="text-slate-400 text-xs w-4 font-mono">{rank}</span>
      <span className="text-2xl leading-none">{getFlag(country)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-700 truncate">{country}</span>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0 ml-2">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{views.toLocaleString()}</span>
            {downloads > 0 && <span className="flex items-center gap-1"><Download className="w-3 h-3" />{downloads.toLocaleString()}</span>}
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ImpactMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(async () => {
    let readershipStats, manuscripts;
    try {
      [readershipStats, manuscripts] = await Promise.all([
        base44.entities.ReadershipStats.list('-view_date', 1000),
        base44.entities.Manuscript.filter({ status: 'published' }, '-publication_date', 200),
      ]);
    } catch {
      setLoading(false);
      return;
    }

    // Aggregate by country from ReadershipStats
    const countryMap = {};
    readershipStats.forEach(s => {
      if (!s.country) return;
      if (!countryMap[s.country]) countryMap[s.country] = { views: 0, downloads: 0 };
      countryMap[s.country].views += 1;
      if (s.view_type === 'pdf_download') countryMap[s.country].downloads += 1;
    });

    const countryRows = Object.entries(countryMap)
      .map(([country, d]) => ({ country, ...d }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    // Use manuscript fields for accurate KPI totals
    const totalViews = manuscripts.reduce((sum, m) => sum + (m.view_count || 0), 0);
    const totalDownloads = manuscripts.reduce((sum, m) => sum + (m.download_count || 0), 0);
    const totalCitations = manuscripts.reduce((sum, m) => sum + (m.citation_count || 0), 0);
    const uniqueCountries = Object.keys(countryMap).length || new Set(manuscripts.flatMap(m => m.authors?.map(a => a.affiliation)).filter(Boolean)).size;

    // Continent breakdown
    const continentMap = {};
    readershipStats.forEach(s => {
      if (!s.continent) return;
      continentMap[s.continent] = (continentMap[s.continent] || 0) + 1;
    });

    setData({ countryRows, totalViews, totalDownloads, totalCitations, uniqueCountries, continentMap, maxViews: countryRows[0]?.views || 1, totalPublished: manuscripts.length });
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const PIE_COLORS = [
    '#14B8A6','#3B82F6','#F59E0B','#8B5CF6','#EF4444',
    '#10B981','#F97316','#06B6D4','#EC4899','#6366F1'
  ];

  const CONTINENT_COLORS = {
    "Africa": "bg-emerald-500", "Europe": "bg-blue-500", "Asia": "bg-amber-500",
    "North America": "bg-purple-500", "South America": "bg-pink-500", "Oceania": "bg-cyan-500",
  };

  return (
    <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-teal-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-bold">Impact Metrics</h2>
              <Badge className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs">Live</Badge>
            </div>
            <p className="text-sm text-slate-400">Real-time global readership & engagement</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {lastUpdated && (
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-pulse" />
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Top KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {[
            { label: "Total Views", value: data?.totalViews, icon: Eye, color: "from-blue-500/20 to-cyan-500/20 border-blue-400/30" },
            { label: "Downloads", value: data?.totalDownloads, icon: Download, color: "from-emerald-500/20 to-teal-500/20 border-emerald-400/30" },
            { label: "Citations", value: data?.totalCitations, icon: BookMarked, color: "from-purple-500/20 to-indigo-500/20 border-purple-400/30" },
            { label: "Countries", value: data?.uniqueCountries, icon: Globe, color: "from-amber-500/20 to-orange-500/20 border-amber-400/30" },
            { label: "Published", value: data?.totalPublished, icon: FileText, color: "from-rose-500/20 to-pink-500/20 border-rose-400/30" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-xl border bg-gradient-to-br ${color} p-3 backdrop-blur`}>
              <Icon className="w-4 h-4 text-white/70 mb-1" />
              <p className="text-xl font-bold text-white">
                {loading ? <span className="text-slate-400">—</span> : <AnimatedCount value={value || 0} />}
              </p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Country Pie Chart */}
        <div className="lg:col-span-2 p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Visitors by Country
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-64"><Skeleton className="w-48 h-48 rounded-full" /></div>
          ) : data?.countryRows?.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data.countryRows.slice(0, 10)}
                  dataKey="views"
                  nameKey="country"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={55}
                  paddingAngle={2}
                  label={({ country, percent }) => percent > 0.04 ? `${getFlag(country)} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {data.countryRows.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value.toLocaleString() + ' views', name]}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => `${getFlag(value)} ${value}`}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No readership data yet. Visitor stats will appear here once articles are read.</p>
            </div>
          )}
        </div>

        {/* Continent breakdown */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">By Continent</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : data?.continentMap && Object.keys(data.continentMap).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.continentMap)
                .sort((a, b) => b[1] - a[1])
                .map(([continent, count]) => {
                  const total = Object.values(data.continentMap).reduce((a, b) => a + b, 0);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={continent}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{continent}</span>
                        <span className="text-slate-500">{pct}% · {count.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CONTINENT_COLORS[continent] || 'bg-slate-400'} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center pt-8">No continent data available yet.</p>
          )}

          {/* Device split */}
          {!loading && data && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Auto-Refresh</h3>
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 flex-shrink-0" />
                Metrics update automatically every 30 seconds
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}