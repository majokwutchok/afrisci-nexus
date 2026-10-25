import React from "react";
import { useImpactData } from "@/lib/impact/useImpactData";
import { countryName, continentOf } from "@/lib/impact/impactCore";

// "Our Global Reach": where readers come from, by continent, from the same live data as the impact map.
const ORDER = ["Africa", "Europe", "Asia", "North America", "South America", "Oceania"];

export default function ReadershipMap() {
  const { data } = useImpactData();
  const readers = data?.readers || [];
  const groups = new Map(ORDER.map((c) => [c, { total: 0, countries: [] }]));
  for (const r of readers) {
    const g = groups.get(continentOf(r.code));
    if (!g) continue;
    g.total += r.count;
    g.countries.push(r);
  }
  const total = readers.reduce((s, r) => s + r.count, 0);
  const rows = ORDER.map((c) => [c, groups.get(c)]).filter(([, g]) => g.total > 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h3 className="text-2xl font-bold tracking-tight text-slate-900">Our Global Reach</h3>
      <p className="mt-1 text-[15px] leading-relaxed text-slate-600">
        {data
          ? total
            ? `Readers in ${readers.length} ${readers.length === 1 ? "country" : "countries"} across ${rows.length} ${rows.length === 1 ? "continent" : "continents"}.`
            : "Reader locations are recorded from now on. The first countries will appear here shortly."
          : "Loading reader locations…"}
      </p>
      {rows.length > 0 && (
        <ul className="mt-5 space-y-4">
          {rows.map(([name, g]) => (
            <li key={name}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-900">{name}</span>
                <span className="tabular-nums text-slate-600">{Math.round((g.total / total) * 100)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-blue-800" style={{ width: `${Math.max(4, (g.total / total) * 100)}%` }} />
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {g.countries.slice(0, 4).map((c) => countryName(c.code)).join(", ")}
                {g.countries.length > 4 ? ` and ${g.countries.length - 4} more` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
