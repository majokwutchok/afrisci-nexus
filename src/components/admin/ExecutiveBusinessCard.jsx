import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, CreditCard, Mail, Phone, Globe, MapPin } from "lucide-react";
import { LOGO_ICON_URL } from "@/components/brand/AfriSciLogo";

const JOURNALS = [
  { name: "AfriSci STEM Journal", abbr: "ASJ-STEM", color: "#0D9488" },
  { name: "African Journal of Medicine & Health", abbr: "AJMH", color: "#2563EB" },
  { name: "African Agriculture & Environment Review", abbr: "AAER", color: "#16A34A" },
  { name: "Journal of African Social Sciences", abbr: "JASS", color: "#7C3AED" },
  { name: "African Law & Policy Journal", abbr: "ALPJ", color: "#DC2626" },
  { name: "AfriSci Arts & Humanities", abbr: "AAH", color: "#D97706" },
  { name: "African Business & Economics Review", abbr: "ABER", color: "#0891B2" },
  { name: "Journal of African Education", abbr: "JAE", color: "#DB2777" },
  { name: "African Interdisciplinary Research", abbr: "AIR", color: "#059669" },
  { name: "AfriSci Innovation & Technology", abbr: "AIT", color: "#4F46E5" },
  { name: "African Public Health & Policy", abbr: "APHP", color: "#B45309" },
  { name: "AfriSci Environmental Science", abbr: "AES", color: "#065F46" },
];

// ── FRONT OF CARD ──────────────────────────────────────────────────────────
function CardFront() {
  return (
    <div
      id="bcard-front"
      style={{
        width: 1050,
        height: 600,
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 45%, #0D9488 100%)",
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#fff",
        boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}
    >
      {/* Background decorative circles */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(13,148,136,0.15)" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(245,158,11,0.12)" }} />
      <div style={{ position: "absolute", top: "40%", left: "55%", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

      {/* Gold accent bar left */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: "linear-gradient(180deg,#F59E0B,#D97706,#F59E0B)" }} />

      {/* Top section: Logo + tagline */}
      <div style={{ position: "absolute", top: 44, left: 44, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: "linear-gradient(135deg,#0D9488,#F59E0B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(13,148,136,0.5)"
        }}>
          <img src={LOGO_ICON_URL} alt="" style={{ width: 52, height: 52, objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.5 }}>
            <span style={{ background: "linear-gradient(90deg,#fff,#7FFFD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AfriSci</span>
            {" "}
            <span style={{ background: "linear-gradient(90deg,#F59E0B,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nexus</span>
            {" "}
            <span style={{ color: "#e2e8f0", fontSize: 26, fontWeight: 800 }}>Discovery</span>
          </div>
          <div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "#cbd5e1", marginTop: 3, fontWeight: 700 }}>
            African Scientific Excellence · Open Access
          </div>
        </div>
      </div>

      {/* Badge: 12 Journals */}
      <div style={{
        position: "absolute", top: 44, right: 44,
        background: "linear-gradient(135deg,#F59E0B,#D97706)",
        borderRadius: 50, padding: "10px 24px",
        fontSize: 15, fontWeight: 900, color: "#fff",
        boxShadow: "0 4px 16px rgba(245,158,11,0.5)",
        letterSpacing: 0.5
      }}>
        12 Peer-Reviewed Journals
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 140, left: 44, right: 44, height: 2, background: "linear-gradient(90deg,#F59E0B,rgba(255,255,255,0.2))" }} />

      {/* Person details */}
      <div style={{ position: "absolute", top: 168, left: 44 }}>
        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1, color: "#ffffff", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>Majok Wutchok</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#FCD34D", marginTop: 6, letterSpacing: 2.5, textTransform: "uppercase" }}>
          Founder &amp; CEO
        </div>
      </div>

      {/* Contact info */}
      <div style={{ position: "absolute", top: 278, left: 44, display: "flex", flexDirection: "column", gap: 11 }}>
        {[
          { icon: "📱", text: "+61 425 448 727" },
          { icon: "✉️", text: "majok@afriscinexus.com" },
          { icon: "✉️", text: "editorial@afriscinexus.com" },
          { icon: "✉️", text: "partnerships@afriscinexus.com" },
          { icon: "🌐", text: "www.afriscinexus.com" },
          { icon: "📍", text: "Perth, Western Australia, Australia" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#f1f5f9", fontWeight: 600 }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Stats block - right side */}
      <div style={{ position: "absolute", top: 168, right: 44, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { num: "54", label: "African Countries" },
          { num: "10K+", label: "Published Articles" },
          { num: "500+", label: "Expert Reviewers" },
          { num: "2M+", label: "Annual Downloads" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "10px 20px",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.2)",
            minWidth: 148,
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#FCD34D" }}>{s.num}</div>
            <div style={{ fontSize: 12, color: "#e2e8f0", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 50,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 28, fontSize: 13, color: "#cbd5e1", letterSpacing: 2, fontWeight: 700
      }}>
        <span>OPEN ACCESS</span>
        <span style={{ color: "#F59E0B" }}>✦</span>
        <span>PEER REVIEWED</span>
        <span style={{ color: "#F59E0B" }}>✦</span>
        <span>DOAJ INDEXED</span>
        <span style={{ color: "#F59E0B" }}>✦</span>
        <span>CROSSREF MEMBER</span>
        <span style={{ color: "#F59E0B" }}>✦</span>
        <span>ORCID INTEGRATED</span>
      </div>
    </div>
  );
}

// ── BACK OF CARD ──────────────────────────────────────────────────────────
function CardBack() {
  return (
    <div
      id="bcard-back"
      style={{
        width: 1050,
        height: 600,
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #0F766E 100%)",
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#fff",
        boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}
    >
      {/* Gold accent bar right */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 6, background: "linear-gradient(180deg,#F59E0B,#D97706,#F59E0B)" }} />

      {/* BG circles */}
      <div style={{ position: "absolute", top: -60, left: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(13,148,136,0.12)" }} />
      <div style={{ position: "absolute", bottom: -80, right: 80, width: 300, height: 300, borderRadius: "50%", background: "rgba(245,158,11,0.08)" }} />

      {/* Header */}
      <div style={{ position: "absolute", top: 32, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 17, letterSpacing: 4, textTransform: "uppercase", color: "#FCD34D", fontWeight: 900 }}>
          Our 12 Peer-Reviewed Journals
        </div>
        <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 5, letterSpacing: 2, fontWeight: 700 }}>
          Open Access · Double-Blind Review · DOI Registered
        </div>
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 90, left: 40, right: 40, height: 2, background: "linear-gradient(90deg,rgba(245,158,11,0.5),rgba(255,255,255,0.3),rgba(245,158,11,0.5))" }} />

      {/* Journals grid — 2 columns × 6 */}
      <div style={{
        position: "absolute", top: 108, left: 36, right: 36,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 22px"
      }}>
        {JOURNALS.map((j, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.08)",
            border: `1px solid ${j.color}55`,
            borderLeft: `4px solid ${j.color}`,
            borderRadius: 8, padding: "9px 14px",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: `${j.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 900, color: "#fff", letterSpacing: 0.3
            }}>
              {j.abbr.split("-")[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc", lineHeight: 1.3 }}>{j.name}</div>
              <div style={{ fontSize: 11, color: "#FCD34D", letterSpacing: 1, textTransform: "uppercase", marginTop: 2, fontWeight: 700 }}>{j.abbr}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 50,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 44px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg,#0D9488,#F59E0B)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <img src={LOGO_ICON_URL} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: "#e2e8f0" }}>AfriSci Nexus Discovery</span>
        </div>
        <span style={{ fontSize: 13, color: "#cbd5e1", letterSpacing: 1, fontWeight: 700 }}>www.afriscinexus.com · Perth, Western Australia</span>
      </div>
    </div>
  );
}

// ── SQUARE SOCIAL CARD ────────────────────────────────────────────────────
function CardSquare() {
  return (
    <div
      id="bcard-square"
      style={{
        width: 800,
        height: 800,
        background: "linear-gradient(145deg, #0F172A 0%, #1E3A8A 50%, #0D9488 100%)",
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#fff",
        boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "absolute", top: -100, right: -100, width: 350, height: 350, borderRadius: "50%", background: "rgba(13,148,136,0.15)" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(245,158,11,0.1)" }} />

      {/* Gold top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg,#F59E0B,#0D9488,#F59E0B)" }} />

      {/* Logo centered */}
      <div style={{ position: "absolute", top: 52, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 90, height: 90, borderRadius: 22,
          background: "linear-gradient(135deg,#0D9488,#F59E0B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 32px rgba(13,148,136,0.5)"
        }}>
          <img src={LOGO_ICON_URL} alt="" style={{ width: 66, height: 66, objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900 }}>
            <span style={{ background: "linear-gradient(90deg,#fff,#7FFFD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AfriSci</span>
            {" "}
            <span style={{ background: "linear-gradient(90deg,#F59E0B,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nexus</span>
            {" "}
            <span style={{ color: "#e2e8f0", fontSize: 30, fontWeight: 800 }}>Discovery</span>
          </div>
          <div style={{ fontSize: 13, letterSpacing: 3, color: "#cbd5e1", textTransform: "uppercase", marginTop: 6, fontWeight: 700 }}>African Scientific Excellence</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 264, left: 60, right: 60, height: 2, background: "linear-gradient(90deg,rgba(245,158,11,0.6),rgba(255,255,255,0.3),rgba(245,158,11,0.6))" }} />

      {/* Name */}
      <div style={{ position: "absolute", top: 286, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: "#ffffff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>Majok Wutchok</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#FCD34D", letterSpacing: 2.5, textTransform: "uppercase", marginTop: 8 }}>Founder &amp; CEO</div>
      </div>

      {/* Contacts */}
      <div style={{ position: "absolute", top: 404, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
        {[
          "📱 +61 425 448 727",
          "✉️ majok@afriscinexus.com",
          "✉️ editorial@afriscinexus.com",
          "🌐 www.afriscinexus.com",
          "📍 Perth, Western Australia",
        ].map((c, i) => (
          <div key={i} style={{ fontSize: 15.5, color: "#f1f5f9", fontWeight: 700 }}>{c}</div>
        ))}
      </div>

      {/* 12 Journals pill grid */}
      <div style={{ position: "absolute", top: 580, left: 36, right: 36, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {JOURNALS.map((j, i) => (
          <div key={i} style={{
            background: `${j.color}33`, border: `1px solid ${j.color}88`,
            borderRadius: 50, padding: "4px 12px",
            fontSize: 10.5, fontWeight: 800, color: "#fff", letterSpacing: 0.5
          }}>
            {j.abbr}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 46, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "#e2e8f0", letterSpacing: 2, fontWeight: 800 }}>12 PEER-REVIEWED JOURNALS · OPEN ACCESS · DOI REGISTERED</span>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function ExecutiveBusinessCard() {
  const [activeCard, setActiveCard] = useState("front");
  const [downloading, setDownloading] = useState(null); // null | "all" | cardId

  // Capture a specific card element to canvas (must be in DOM and visible)
  const captureCard = async (cardId) => {
    const { default: html2canvas } = await import("html2canvas");
    // Temporarily make the render container visible for capture
    const container = document.getElementById("bcard-render-all");
    const prevVis = container.style.visibility;
    const prevPos = container.style.position;
    container.style.visibility = "visible";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    const el = document.getElementById(cardId);
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });
    container.style.visibility = prevVis;
    container.style.position = prevPos;
    return canvas;
  };

  const triggerDownload = (canvas, filename, mimeType = "image/png", quality = 1.0) => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL(mimeType, quality);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCard = async (cardId, baseName, format) => {
    setDownloading(cardId + format);
    try {
      const canvas = await captureCard(cardId);
      const { mime, ext, quality } = FORMAT_OPTIONS[format];
      triggerDownload(canvas, `${baseName}.${ext}`, mime, quality);
    } catch (e) { console.error(e); }
    setDownloading(null);
  };

  const downloadAll = async () => {
    setDownloading("all");
    try {
      const cards = [
        { id: "bcard-front", base: "AfriSciNexus_Card_Front" },
        { id: "bcard-back", base: "AfriSciNexus_Card_Back" },
        { id: "bcard-square", base: "AfriSciNexus_Card_Square" },
      ];
      for (const c of cards) {
        const canvas = await captureCard(c.id);
        for (const [, { mime, ext, quality }] of Object.entries(FORMAT_OPTIONS)) {
          triggerDownload(canvas, `${c.base}.${ext}`, mime, quality);
          await new Promise(r => setTimeout(r, 300));
        }
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (e) { console.error(e); }
    setDownloading(null);
  };

  const printCard = async () => {
    const idMap = { front: "bcard-front", back: "bcard-back", square: "bcard-square" };
    try {
      const canvas = await captureCard(idMap[activeCard]);
      const w = window.open("", "_blank");
      const size = activeCard === "square" ? "8.5cm 8.5cm" : "8.5cm 5.5cm";
      w.document.write(`<html><head><title>Print</title>
        <style>@page{margin:0;size:${size}}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:100%;height:auto}</style>
        </head><body><img src="${canvas.toDataURL("image/png")}" onload="window.print();window.close();"/></body></html>`);
      w.document.close();
    } catch (e) { console.error(e); }
  };

  const FORMAT_OPTIONS = {
    png: { mime: "image/png", ext: "png", quality: 1.0, label: "PNG (Lossless)", color: "bg-blue-100 text-blue-800 border-blue-200" },
    jpg: { mime: "image/jpeg", ext: "jpg", quality: 0.95, label: "JPG (Print)", color: "bg-green-100 text-green-800 border-green-200" },
    webp: { mime: "image/webp", ext: "webp", quality: 0.95, label: "WebP (Web)", color: "bg-purple-100 text-purple-800 border-purple-200" },
  };

  const CARDS = [
    { id: "bcard-front", key: "front", label: "Front Card", base: "AfriSciNexus_Card_Front", icon: "📇", desc: "3.5\" × 2\" landscape — contact details" },
    { id: "bcard-back", key: "back", label: "Back Card", base: "AfriSciNexus_Card_Back", icon: "🗂", desc: "3.5\" × 2\" landscape — 12 journals" },
    { id: "bcard-square", key: "square", label: "Square / Social", base: "AfriSciNexus_Card_Square", icon: "📐", desc: "Square — LinkedIn / digital use" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-teal-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Executive Business Card</h2>
            <p className="text-sm text-slate-500">Majok Wutchok · Founder & CEO · AfriSci Nexus Discovery</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={printCard} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button
            onClick={downloadAll}
            disabled={!!downloading}
            className="bg-gradient-to-r from-blue-900 to-teal-600 hover:from-blue-800 hover:to-teal-500 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading === "all" ? "Downloading all..." : "Download All (PNG + JPG + WebP)"}
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>🖨 Print-Ready:</strong> All formats export at 3× resolution (300+ DPI equivalent). Standard business card: <strong>3.5" × 2"</strong> (88.9 × 50.8 mm). Square: <strong>2.5" × 2.5"</strong> ideal for LinkedIn & digital use. Available as <strong>PNG, JPG, WebP</strong>.
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {CARDS.map(ct => (
          <button
            key={ct.key}
            onClick={() => setActiveCard(ct.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
              activeCard === ct.key
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-slate-200 text-slate-600 hover:border-teal-300"
            }`}
          >
            <div>{ct.icon} {ct.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{ct.desc}</div>
          </button>
        ))}
      </div>

      {/* Card preview (scaled down for display) */}
      <div className="bg-slate-800 rounded-2xl p-8 overflow-x-auto">
        <div className="flex justify-center">
          <div style={{ transform: activeCard === "square" ? "scale(0.48)" : "scale(0.55)", transformOrigin: "top center",
            height: activeCard === "square" ? 384 : 330, display: "flex", alignItems: "flex-start" }}>
            {activeCard === "front" && <CardFront />}
            {activeCard === "back" && <CardBack />}
            {activeCard === "square" && <CardSquare />}
          </div>
        </div>
      </div>

      {/* All 3 cards always rendered off-screen at full size for capture */}
      <div
        id="bcard-render-all"
        style={{ position: "fixed", left: -9999, top: 0, visibility: "hidden", zIndex: -1, pointerEvents: "none" }}
      >
        <CardFront />
        <CardBack />
        <CardSquare />
      </div>

      {/* Per-card download section */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-base">Download by Format</h3>
        <div className="grid gap-4">
          {CARDS.map(card => (
            <div key={card.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <div className="font-bold text-slate-900">{card.label}</div>
                  <div className="text-xs text-slate-400">{card.desc}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FORMAT_OPTIONS).map(([fmt, opt]) => (
                  <button
                    key={fmt}
                    onClick={() => downloadCard(card.id, card.base, fmt)}
                    disabled={!!downloading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50 ${opt.color}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloading === card.id + fmt ? "..." : opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">Card Contact Details</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-teal-600" /> +61 425 448 727</div>
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-teal-600" /> majok@afriscinexus.com</div>
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-teal-600" /> editorial@afriscinexus.com</div>
          <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-teal-600" /> partnerships@afriscinexus.com</div>
          <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-teal-600" /> www.afriscinexus.com</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-600" /> Perth, Western Australia, Australia</div>
        </div>
      </div>
    </div>
  );
}