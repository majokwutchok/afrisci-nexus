import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Upload, UserPlus, Eye, ShieldCheck, Building2,
  BookOpen, Calendar, TrendingUp, ArrowRight, Sparkles, Star, Megaphone
} from "lucide-react";
import { format } from "date-fns";

// ── Marketing Banner ────────────────────────────────────────────────────────
function MarketingBanner({ gradient, icon: Icon, badge, title, description, cta, href, badgeColor }) {
  return (
    <Link to={href}>
      <div className={`relative rounded-xl overflow-hidden p-5 text-white cursor-pointer group transition-transform hover:-translate-y-1 hover:shadow-xl duration-200 ${gradient}`}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <Icon className="w-full h-full" />
        </div>
        <Badge className={`text-xs mb-3 ${badgeColor}`}>{badge}</Badge>
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight mb-1">{title}</h3>
            <p className="text-white/80 text-xs leading-relaxed mb-3">{description}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors">
              {cta} <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ article, journal }) {
  return (
    <Link to={createPageUrl(`ManuscriptDetail?id=${article.id}`)}>
      <div className="group p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-150 cursor-pointer">
        <div className="flex items-start gap-2 mb-2">
          <div className="p-1.5 bg-teal-50 rounded flex-shrink-0 mt-0.5">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-teal-700 transition-colors line-clamp-2">
            {article.title}
          </p>
        </div>
        <div className="ml-7 space-y-1">
          {article.authors?.[0] && (
            <p className="text-xs text-slate-500">
              {article.authors[0].name}{article.authors.length > 1 ? ` +${article.authors.length - 1}` : ""}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {article.publication_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(article.publication_date), "MMM yyyy")}
              </span>
            )}
            {article.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.view_count.toLocaleString()}
              </span>
            )}
          </div>
          {journal && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 font-normal">
              {journal.title}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export default function HomeSidebar() {
  const [articles, setArticles] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [arts, jrnls] = await Promise.all([
          base44.entities.Manuscript.filter({ status: "published" }, "-publication_date", 8),
          base44.entities.Journal.filter({ status: "active" }, "-created_date", 50),
        ]);
        setArticles(arts);
        setJournals(jrnls);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const journalMap = Object.fromEntries(journals.map(j => [j.id, j]));

  const banners = [
    {
      gradient: "bg-gradient-to-br from-teal-500 to-teal-700",
      icon: Megaphone,
      badge: "📢 Open Call",
      badgeColor: "bg-white/20 text-white border-0",
      title: "Call for Manuscripts",
      description: "Submit your research to Africa's leading open-access platform. Fast, fair peer review.",
      cta: "Submit Now",
      href: createPageUrl("Submit"),
    },
    {
      gradient: "bg-gradient-to-br from-blue-600 to-blue-800",
      icon: UserPlus,
      badge: "✍️ Authors",
      badgeColor: "bg-white/20 text-white border-0",
      title: "Become an Author",
      description: "Join 5,000+ researchers publishing with AfriSci Nexus. Free registration.",
      cta: "Register Free",
      href: createPageUrl("Apply?role=author"),
    },
    {
      gradient: "bg-gradient-to-br from-purple-600 to-purple-800",
      icon: Eye,
      badge: "🔬 Reviewers",
      badgeColor: "bg-white/20 text-white border-0",
      title: "Become a Reviewer",
      description: "Shape African science. Join 500+ expert reviewers and earn recognition.",
      cta: "Apply Now",
      href: createPageUrl("Apply?role=reviewer"),
    },
    {
      gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
      icon: ShieldCheck,
      badge: "🏅 Editors",
      badgeColor: "bg-white/20 text-white border-0",
      title: "Join Editorial Board",
      description: "Lead a journal in your discipline. Applications open for all fields.",
      cta: "Apply as Editor",
      href: createPageUrl("Apply?role=editor"),
    },
    {
      gradient: "bg-gradient-to-br from-emerald-500 to-green-700",
      icon: Star,
      badge: "🌍 Open Access",
      badgeColor: "bg-white/20 text-white border-0",
      title: "100% Open Access",
      description: "All AfriSci Nexus articles are freely available to readers worldwide — forever.",
      cta: "Learn More",
      href: createPageUrl("OpenAccess"),
    },
    {
      gradient: "bg-gradient-to-br from-indigo-600 to-indigo-800",
      icon: Building2,
      badge: "🤝 Institutions",
      badgeColor: "bg-white/20 text-white border-0",
      title: "Institutional Partnership",
      description: "10–50 authors publish freely under one annual agreement. From $1,200/yr.",
      cta: "Partner with Us",
      href: createPageUrl("InstitutionalPartnership"),
    },
    ];

  return (
    <aside className="space-y-6">
      {/* Marketing Banners */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Get Involved</h2>
        </div>
        <div className="p-4 space-y-3">
          {banners.map((b, i) => <MarketingBanner key={i} {...b} />)}
        </div>
      </div>

      {/* Latest Published Articles */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Latest Articles</h2>
          </div>
          <Link to={createPageUrl("Publications")}>
            <Button variant="ghost" size="sm" className="text-xs text-teal-600 hover:text-teal-700 h-6 px-2">
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No articles published yet.</p>
            </div>
          ) : (
            articles.map(article => (
              <ArticleCard key={article.id} article={article} journal={journalMap[article.journal_id]} />
            ))
          )}
        </div>

        {!loading && articles.length > 0 && (
          <div className="p-3 border-t border-slate-50">
            <Link to={createPageUrl("Publications")}>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Browse All Publications <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}