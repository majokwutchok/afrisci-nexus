import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Renders the first active, in-date sponsored placement for a given slot.
// Always labelled "Sponsored" and rel="sponsored nofollow" per policy.
export default function SponsoredAdSlot({ slot = "news_banner" }) {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AdPlacement.filter({ slot, status: "active" }, "-created_date", 5)
      .then((rows) => {
        const today = new Date().toISOString().slice(0, 10);
        const live = (rows || []).find(a => (!a.start_date || a.start_date <= today) && (!a.end_date || a.end_date >= today));
        setAd(live || null);
      })
      .catch(() => setAd(null))
      .finally(() => setLoading(false));
  }, [slot]);

  if (loading || !ad) return null;

  return (
    <a href={ad.link_url} target="_blank" rel="noopener nofollow sponsored" className="block group">
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
        {ad.creative_url ? (
          <img src={ad.creative_url} alt={`${ad.sponsor_name} advertisement`} className="w-full h-32 sm:h-40 object-cover" />
        ) : (
          <div className="p-6">
            <p className="font-semibold text-slate-900 group-hover:text-teal-700">{ad.title}</p>
            <p className="text-sm text-slate-500 mt-1">{ad.sponsor_name}</p>
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide font-semibold bg-black/60 text-white px-2 py-0.5 rounded">Sponsored</span>
      </div>
    </a>
  );
}