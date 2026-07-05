import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Globe, Monitor, Link2, Eye, TrendingUp } from "lucide-react";

const COLORS = ["#0D9488", "#1E40AF", "#F59E0B", "#DC2626", "#7C3AED", "#0EA5E9"];

const StatBox = ({ title, value, icon: Icon }) => (
  <Card className="bg-white shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <Icon className="h-5 w-5 text-teal-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </CardContent>
  </Card>
);

function groupCount(items, key) {
  const map = {};
  items.forEach(i => {
    const val = i[key] || "unknown";
    map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default function PlatformAnalyticsDashboard() {
  const [stats, setStats] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, msData] = await Promise.all([
        base44.entities.ReadershipStats.list("-created_date", 2000),
        base44.entities.Manuscript.list("-created_date", 500)
      ]);
      setStats(statsData);
      setManuscripts(msData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setIsLoading(false);
  };

  const countryData = useMemo(() => groupCount(stats, "country").slice(0, 10), [stats]);
  const deviceData = useMemo(() => groupCount(stats, "device_type"), [stats]);
  const referrerData = useMemo(() => groupCount(stats, "referrer_source"), [stats]);
  const viewTypeData = useMemo(() => groupCount(stats, "view_type"), [stats]);

  const topArticles = useMemo(() => {
    const counts = {};
    stats.forEach(s => {
      if (!s.manuscript_id) return;
      counts[s.manuscript_id] = (counts[s.manuscript_id] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, title: manuscripts.find(m => m.id === id)?.title || "Untitled" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [stats, manuscripts]);

  const recentActivity = useMemo(() => stats.slice(0, 15), [stats]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28" /><Skeleton className="h-28" />
          <Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Analytics & Readership</h2>
          <p className="text-sm text-slate-500 mt-1">Live traffic pulled directly from readership records — no integration credits used.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatBox title="Total Views Tracked" value={stats.length} icon={Eye} />
        <StatBox title="Countries Reached" value={new Set(stats.map(s => s.country)).size} icon={Globe} />
        <StatBox title="Articles With Traffic" value={new Set(stats.map(s => s.manuscript_id)).size} icon={TrendingUp} />
        <StatBox title="Referral Sources" value={new Set(stats.map(s => s.referrer_source)).size} icon={Link2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Globe className="w-4 h-4 text-teal-600" /> Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={countryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#0D9488" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Monitor className="w-4 h-4 text-blue-600" /> Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={deviceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {deviceData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Link2 className="w-4 h-4 text-amber-600" /> Referrer Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={referrerData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {referrerData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Eye className="w-4 h-4 text-purple-600" /> Visitor / View Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={viewTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7C3AED" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-4 h-4 text-emerald-600" /> Top Performing Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topArticles.length === 0 && <p className="text-sm text-slate-500">No readership data yet.</p>}
            {topArticles.map((a, idx) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-5 flex-shrink-0">#{idx + 1}</span>
                  <span className="text-sm font-medium text-slate-800 truncate">{a.title}</span>
                </div>
                <span className="text-sm font-bold text-teal-700 flex-shrink-0 ml-2">{a.count} views</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Recent Live Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {recentActivity.length === 0 && <p className="text-sm text-slate-500">No activity recorded yet.</p>}
            {recentActivity.map((s, idx) => (
              <div key={s.id || idx} className="flex flex-wrap items-center gap-2 text-xs text-slate-600 py-1.5 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">{manuscripts.find(m => m.id === s.manuscript_id)?.title?.slice(0, 40) || "Article"}</span>
                <span className="text-slate-400">•</span>
                <span>{s.country || "Unknown"}</span>
                <span className="text-slate-400">•</span>
                <span>{s.device_type || "unknown device"}</span>
                <span className="text-slate-400">•</span>
                <span>{s.view_type?.replace(/_/g, " ")}</span>
                <span className="text-slate-400">•</span>
                <span>via {s.referrer_source || "direct"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}