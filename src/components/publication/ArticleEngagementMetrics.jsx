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
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    if (!manuscript) return;

    const fetch = async () => {
      // Use live counts from manuscript entity, supplemented by ReadershipStats if available
      try {
        const stats = await base44.entities.ReadershipStats.filter({ manuscript_id: manuscript.id });
        const abstract_views = stats.filter(s => s.view_type === "abstract").length;
        const full_text_views = stats.filter(s => s.view_type === "full_text").length;
        const pdf_downloads = stats.filter(s => s.view_type === "pdf_download").length;
        setLiveStats({ abstract_views, full_text_views, pdf_downloads });
      } catch {
        setLiveStats(null);
      }
    };

    fetch();
  }, [manuscript?.id]);

  if (!manuscript) return null;

  const views = manuscript.view_count || 0;
  const downloads = manuscript.download_count || 0;
  const citations = manuscript.citation_count || 0;

  const detailedAbstract = liveStats?.abstract_views ?? null;
  const detailedFull = liveStats?.full_text_views ?? null;
  const detailedPDF = liveStats?.pdf_downloads ?? null;

  const maxStat = Math.max(views, downloads, citations, 1);

  const metrics = [
    {
      label: "Total Views",
      value: views,
      icon: Eye,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "PDF Downloads",
      value: downloads,
      icon: Download,
      color: "bg-teal-500",
      textColor: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      label: "Citations",
      value: citations,
      icon: Quote,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
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

        {/* Detailed breakdown if ReadershipStats available */}
        {liveStats && (detailedAbstract !== null || detailedFull !== null) && (
          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">View Breakdown</p>
            {[
              { label: "Abstract only", value: detailedAbstract },
              { label: "Full text", value: detailedFull },
              { label: "PDF download", value: detailedPDF },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-800">{(value || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center pt-1">
          Updated in real-time
        </p>
      </CardContent>
    </Card>
  );
}