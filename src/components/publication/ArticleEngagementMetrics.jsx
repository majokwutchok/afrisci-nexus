import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Download, Quote, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const target = value || 0;
    const duration = 800;
    const start = Date.now();
    const from = display;

    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

function MetricBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ArticleEngagementMetrics({ manuscript }) {
  const [counts, setCounts] = useState({
    views: manuscript?.view_count || 0,
    downloads: manuscript?.download_count || 0,
    citations: manuscript?.citation_count || 0,
  });
  const [breakdown, setBreakdown] = useState(null);

  // Sync initial values from prop changes
  useEffect(() => {
    if (!manuscript) return;
    setCounts({
      views: manuscript.view_count || 0,
      downloads: manuscript.download_count || 0,
      citations: manuscript.citation_count || 0,
    });
  }, [manuscript?.view_count, manuscript?.download_count, manuscript?.citation_count]);

  // Load ReadershipStats breakdown + subscribe to future changes
  useEffect(() => {
    if (!manuscript?.id) return;

    const loadBreakdown = async () => {
      try {
        const stats = await base44.entities.ReadershipStats.filter({ manuscript_id: manuscript.id });
        setBreakdown({
          abstract_views: stats.filter(s => s.view_type === "abstract").length,
          full_text_views: stats.filter(s => s.view_type === "full_text").length,
          pdf_downloads: stats.filter(s => s.view_type === "pdf_download").length,
        });
      } catch {
        setBreakdown(null);
      }
    };

    loadBreakdown();

    // Real-time subscription to Manuscript changes (view/download/citation counts)
    const unsubManuscript = base44.entities.Manuscript.subscribe((event) => {
      if (event.id !== manuscript.id) return;
      if (event.type === "update" && event.data) {
        setCounts({
          views: event.data.view_count || 0,
          downloads: event.data.download_count || 0,
          citations: event.data.citation_count || 0,
        });
      }
    });

    // Real-time subscription to new ReadershipStats records for this article
    const unsubStats = base44.entities.ReadershipStats.subscribe((event) => {
      if (event.type !== "create" || event.data?.manuscript_id !== manuscript.id) return;
      setBreakdown(prev => {
        if (!prev) return prev;
        const field =
          event.data.view_type === "abstract" ? "abstract_views" :
          event.data.view_type === "full_text" ? "full_text_views" :
          "pdf_downloads";
        return { ...prev, [field]: (prev[field] || 0) + 1 };
      });
    });

    return () => {
      unsubManuscript();
      unsubStats();
    };
  }, [manuscript?.id]);

  if (!manuscript) return null;

  const { views, downloads, citations } = counts;
  const maxStat = Math.max(views, downloads, citations, 1);

  const metrics = [
    { label: "Total Views", value: views, icon: Eye, color: "bg-blue-500", textColor: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "PDF Downloads", value: downloads, icon: Download, color: "bg-teal-500", textColor: "text-teal-600", bgColor: "bg-teal-50" },
    { label: "Citations", value: citations, icon: Quote, color: "bg-purple-500", textColor: "text-purple-600", bgColor: "bg-purple-50" },
  ];

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-600" />
          Article Engagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map(({ label, value, icon: Icon, color, textColor, bgColor }) => (
          <div key={label}>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${bgColor}`}>
              <div className={`p-2 rounded-md ${color} bg-opacity-15`}>
                <Icon className={`w-4 h-4 ${textColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className={`text-xl font-bold ${textColor}`}>
                  <AnimatedNumber value={value} />
                </p>
              </div>
            </div>
            <MetricBar value={value} max={maxStat} color={color} />
          </div>
        ))}

        {breakdown && (
          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">View Breakdown</p>
            {[
              { label: "Abstract only", value: breakdown.abstract_views },
              { label: "Full text", value: breakdown.full_text_views },
              { label: "PDF download", value: breakdown.pdf_downloads },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-800">{(value || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center pt-1">
          Live — updates automatically
        </p>
      </CardContent>
    </Card>
  );
}