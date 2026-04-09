import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, BookOpen, Users, TrendingUp, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Approximate SVG coords (x,y) on a 1000x500 equirectangular projection
const COUNTRIES = {
  // Africa (origin hubs)
  nigeria:       { x: 500, y: 280, label: "Nigeria", continent: "africa" },
  kenya:         { x: 570, y: 310, label: "Kenya", continent: "africa" },
  southafrica:   { x: 545, y: 390, label: "South Africa", continent: "africa" },
  ghana:         { x: 480, y: 285, label: "Ghana", continent: "africa" },
  ethiopia:      { x: 580, y: 285, label: "Ethiopia", continent: "africa" },
  egypt:         { x: 558, y: 240, label: "Egypt", continent: "africa" },
  tanzania:      { x: 565, y: 330, label: "Tanzania", continent: "africa" },
  cameroon:      { x: 515, y: 295, label: "Cameroon", continent: "africa" },
  // Global destinations
  usa:           { x: 195, y: 210, label: "United States", continent: "other" },
  uk:            { x: 450, y: 165, label: "United Kingdom", continent: "other" },
  germany:       { x: 480, y: 158, label: "Germany", continent: "other" },
  france:        { x: 460, y: 168, label: "France", continent: "other" },
  china:         { x: 750, y: 210, label: "China", continent: "other" },
  india:         { x: 660, y: 250, label: "India", continent: "other" },
  brazil:        { x: 280, y: 340, label: "Brazil", continent: "other" },
  australia:     { x: 820, y: 390, label: "Australia", continent: "other" },
  canada:        { x: 190, y: 170, label: "Canada", continent: "other" },
  japan:         { x: 810, y: 200, label: "Japan", continent: "other" },
  netherlands:   { x: 472, y: 156, label: "Netherlands", continent: "other" },
  sweden:        { x: 488, y: 140, label: "Sweden", continent: "other" },
};

const CONNECTIONS = [
  // [from, to, citations, type]
  { from: "nigeria",     to: "usa",         citations: 1240, type: "citation" },
  { from: "nigeria",     to: "uk",          citations: 980,  type: "citation" },
  { from: "kenya",       to: "usa",         citations: 870,  type: "citation" },
  { from: "kenya",       to: "germany",     citations: 540,  type: "citation" },
  { from: "southafrica", to: "uk",          citations: 1100, type: "citation" },
  { from: "southafrica", to: "australia",   citations: 620,  type: "citation" },
  { from: "ghana",       to: "uk",          citations: 460,  type: "citation" },
  { from: "ethiopia",    to: "usa",         citations: 390,  type: "citation" },
  { from: "egypt",       to: "france",      citations: 730,  type: "citation" },
  { from: "tanzania",    to: "netherlands", citations: 310,  type: "citation" },
  { from: "cameroon",    to: "france",      citations: 420,  type: "citation" },
  { from: "nigeria",     to: "china",       citations: 290,  type: "collaboration" },
  { from: "kenya",       to: "india",       citations: 360,  type: "collaboration" },
  { from: "southafrica", to: "brazil",      citations: 280,  type: "collaboration" },
  { from: "egypt",       to: "china",       citations: 510,  type: "collaboration" },
  { from: "nigeria",     to: "canada",      citations: 340,  type: "collaboration" },
  { from: "southafrica", to: "japan",       citations: 220,  type: "collaboration" },
  { from: "ghana",       to: "sweden",      citations: 190,  type: "collaboration" },
  { from: "ethiopia",    to: "germany",     citations: 305,  type: "collaboration" },
];

function arc(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.25;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

function AnimatedArc({ path, color, delay, duration, thickness }) {
  const pathRef = useRef(null);
  const [pathLen, setPathLen] = useState(0);

  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength());
  }, [path]);

  return (
    <g>
      {/* Static faint base line */}
      <path d={path} fill="none" stroke={color} strokeWidth={thickness * 0.5} strokeOpacity={0.15} />
      {/* Animated travelling dot */}
      {pathLen > 0 && (
        <motion.path
          ref={pathRef}
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${pathLen * 0.12} ${pathLen}`}
          strokeDashoffset={pathLen}
          animate={{ strokeDashoffset: [pathLen, -pathLen] }}
          transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
          strokeOpacity={0.85}
        />
      )}
    </g>
  );
}

function Tooltip({ country, x, y }) {
  return (
    <foreignObject x={Math.min(x + 8, 880)} y={Math.max(y - 60, 10)} width={160} height={70}>
      <div className="bg-slate-900/90 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/20 pointer-events-none">
        <p className="font-bold text-sm mb-0.5">{country.label}</p>
        <p className="text-slate-300">{country.continent === "africa" ? "🌍 Research Origin" : "🔗 Global Reach"}</p>
      </div>
    </foreignObject>
  );
}

export default function GlobalResearchMap() {
  const [mode, setMode] = useState("citation"); // citation | collaboration
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [activeOrigin, setActiveOrigin] = useState(null);

  const visibleConnections = CONNECTIONS.filter(c =>
    c.type === mode && (activeOrigin ? c.from === activeOrigin : true)
  );

  const africaOrigins = [...new Set(CONNECTIONS.map(c => c.from))];
  const totalCitations = CONNECTIONS.filter(c => c.type === "citation").reduce((s, c) => s + c.citations, 0);
  const totalCollabs = CONNECTIONS.filter(c => c.type === "collaboration").reduce((s, c) => s + c.citations, 0);
  const reachCount = new Set(CONNECTIONS.map(c => c.to)).size;

  return (
    <section className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-teal-400" />
            <h2 className="text-white font-bold text-xl">Global Research Impact</h2>
            <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs">Live Map</Badge>
          </div>
          <p className="text-slate-400 text-sm">Mapping African research citations and collaborations worldwide</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("citation")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "citation" ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
          >
            Citations
          </button>
          <button
            onClick={() => setMode("collaboration")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "collaboration" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
          >
            Collaborations
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-white/5 mx-6 rounded-xl overflow-hidden mb-4">
        {[
          { label: "Total Citations", value: totalCitations.toLocaleString(), icon: BookOpen, color: "text-teal-400" },
          { label: "Collaborations", value: totalCollabs.toLocaleString(), icon: Users, color: "text-purple-400" },
          { label: "Countries Reached", value: reachCount, icon: TrendingUp, color: "text-amber-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 px-4 py-3 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
            <div>
              <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="relative mx-6 mb-4 rounded-xl overflow-hidden bg-slate-900/60 border border-white/5">
        <svg viewBox="0 0 1000 500" className="w-full" style={{ maxHeight: 400 }}>
          {/* Ocean background */}
          <rect width="1000" height="500" fill="#0a1628" />

          {/* Simple land silhouettes (very rough) */}
          {/* North America */}
          <ellipse cx="200" cy="200" rx="120" ry="90" fill="#1e3a5f" opacity="0.5" />
          {/* South America */}
          <ellipse cx="270" cy="340" rx="70" ry="90" fill="#1e3a5f" opacity="0.5" />
          {/* Europe */}
          <ellipse cx="480" cy="160" rx="60" ry="40" fill="#1e3a5f" opacity="0.5" />
          {/* Africa */}
          <ellipse cx="530" cy="310" rx="75" ry="100" fill="#1a3a2f" opacity="0.7" />
          {/* Asia */}
          <ellipse cx="720" cy="200" rx="150" ry="90" fill="#1e3a5f" opacity="0.5" />
          {/* Australia */}
          <ellipse cx="820" cy="390" rx="60" ry="45" fill="#1e3a5f" opacity="0.5" />
          {/* Grid lines */}
          {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#ffffff" strokeWidth="0.3" strokeOpacity="0.05" />
          ))}
          {[0, 125, 250, 375, 500].map(y => (
            <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#ffffff" strokeWidth="0.3" strokeOpacity="0.05" />
          ))}

          {/* Connection arcs */}
          {visibleConnections.map((conn, i) => {
            const from = COUNTRIES[conn.from];
            const to = COUNTRIES[conn.to];
            const color = mode === "citation" ? "#14b8a6" : "#a855f7";
            const thickness = Math.max(1, Math.min(3, conn.citations / 400));
            return (
              <AnimatedArc
                key={`${conn.from}-${conn.to}-${i}`}
                path={arc(from.x, from.y, to.x, to.y)}
                color={color}
                delay={i * 0.4}
                duration={3 + (i % 3)}
                thickness={thickness}
              />
            );
          })}

          {/* Country dots */}
          {Object.entries(COUNTRIES).map(([key, country]) => {
            const isAfrica = country.continent === "africa";
            const isActive = activeOrigin === key;
            const isHovered = hoveredCountry === key;
            const baseR = isAfrica ? 7 : 5;

            return (
              <g key={key}
                onMouseEnter={() => setHoveredCountry(key)}
                onMouseLeave={() => setHoveredCountry(null)}
                onClick={() => isAfrica && setActiveOrigin(activeOrigin === key ? null : key)}
                style={{ cursor: isAfrica ? "pointer" : "default" }}
              >
                {/* Pulse ring for africa nodes */}
                {isAfrica && (
                  <motion.circle
                    cx={country.x} cy={country.y}
                    r={baseR + 4}
                    fill="none"
                    stroke={isActive ? "#f59e0b" : "#14b8a6"}
                    strokeWidth="1.5"
                    initial={{ opacity: 0.8, r: baseR + 2 }}
                    animate={{ opacity: [0.6, 0], r: [baseR + 2, baseR + 14] }}
                    transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                  />
                )}
                <circle
                  cx={country.x} cy={country.y}
                  r={isHovered || isActive ? baseR + 3 : baseR}
                  fill={isAfrica ? (isActive ? "#f59e0b" : "#14b8a6") : "#60a5fa"}
                  stroke={isAfrica ? "#fff" : "#93c5fd"}
                  strokeWidth="1"
                  opacity={isHovered ? 1 : 0.85}
                />
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredCountry && COUNTRIES[hoveredCountry] && (
            <Tooltip country={COUNTRIES[hoveredCountry]} x={COUNTRIES[hoveredCountry].x} y={COUNTRIES[hoveredCountry].y} />
          )}
        </svg>
      </div>

      {/* Origin filter */}
      <div className="px-6 pb-6">
        <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wide">Filter by origin country</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveOrigin(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!activeOrigin ? "bg-teal-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
          >
            All Countries
          </button>
          {africaOrigins.map(key => (
            <button
              key={key}
              onClick={() => setActiveOrigin(activeOrigin === key ? null : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeOrigin === key ? "bg-amber-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
            >
              {COUNTRIES[key]?.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}