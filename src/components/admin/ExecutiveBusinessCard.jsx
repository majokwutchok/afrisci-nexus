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
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: "linear-gradient(180deg,#F59E0B,#D97706,#F59E0B)" }} />

      {/* Top section: Logo + tagline */}
      <div style={{ position: "absolute", top: 44, left: 40, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: "linear-gradient(135deg,#0D9488,#F59E0B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(13,148,136,0.5)"
        }}>
          <img src={LOGO_ICON_URL} alt="" style={{ width: 52, height: 52, objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
            <span style={{ background: "linear-gradient(90deg,#fff,#7FFFD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AfriSci</span>
            {" "}
            <span style={{ background: "linear-gradient(90deg,#F59E0B,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nexus</span>
            {" "}
            <span style={{ color: "#cbd5e1", fontSize: 22, fontWeight: 700 }}>Discovery</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#94a3b8", marginTop: 2 }}>
            African Scientific Excellence · Open Access
          </div>
        </div>
      </div>

      {/* Badge: 12 Journals */}
      <div style={{
        position: "absolute", top: 44, right: 44,
        background: "linear-gradient(135deg,#F59E0B,#D97706)",
        borderRadius: 50, padding: "8px 20px",
        fontSize: 13, fontWeight: 800, color: "#fff",
        boxShadow: "0 4px 16px rgba(245,158,11,0.4)"
      }}>
        12 Peer-Reviewed Journals
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 136, left: 40, right: 44, height: 1, background: "linear-gradient(90deg,#F59E0B,rgba(255,255,255,0.1))" }} />

      {/* Person details */}
      <div style={{ position: "absolute", top: 164, left: 40 }}>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.5, color: "#fff" }}>Majok Wutchok</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#F59E0B", marginTop: 4, letterSpacing: 1.5, textTransform: "uppercase" }}>
          Founder &amp; CEO
        </div>
      </div>

      {/* Contact info */}
      <div style={{ position: "absolute", top: 270, left: 40, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: "📱", text: "+61 425 448 727" },
          { icon: "✉️", text: "majok@afriscinexus.com" },
          { icon: "✉️", text: "editorial@afriscinexus.com" },
          { icon: "✉️", text: "partnerships@afriscinexus.com" },
          { icon: "🌐", text: "www.afriscinexus.com" },
          { icon: "📍", text: "Perth, Western Australia, Australia" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Stats block - right side */}
      <div style={{ position: "absolute", top: 164, right: 44, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { num: "54", label: "African Countries" },
          { num: "10K+", label: "Published Articles" },
          { num: "500+", label: "Expert Reviewers" },
          { num: "2M+", label: "Annual Downloads" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "10px 20px",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.1)",
            minWidth: 140,
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#F59E0B" }}>{s.num}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
        background: "rgba(0,0,0,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 32, fontSize: 11, color: "#64748b", letterSpacing: 1.5
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
      <div style={{ position: "absolute", top: 36, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#F59E0B", fontWeight: 700 }}>
          Our 12 Peer-Reviewed Journals
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, letterSpacing: 2 }}>
          Open Access · Double-Blind Review · DOI Registered
        </div>
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 88, left: 40, right: 40, height: 1, background: "linear-gradient(90deg,rgba(245,158,11,0.3),rgba(255,255,255,0.15),rgba(245,158,11,0.3))" }} />

      {/* Journals grid — 2 columns × 6 */}
      <div style={{
        position: "absolute", top: 106, left: 36, right: 36,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px"
      }}>
        {JOURNALS.map((j, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${j.color}33`,
            borderLeft: `3px solid ${j.color}`,
            borderRadius: 8, padding: "9px 14px",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${j.color}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 900, color: j.color, letterSpacing: 0.3
            }}>
              {j.abbr.split("-")[0]}
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>{j.name}</div>
              <div style={{ fontSize: 9.5, color: j.color, letterSpacing: 1, textTransform: "uppercase", marginTop: 1 }}>{j.abbr}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 44px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg,#0D9488,#F59E0B)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <img src={LOGO_ICON_URL} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8" }}>AfriSci Nexus Discovery</span>
        </div>
        <span style={{ fontSize: 11, color: "#475569", letterSpacing: 1 }}>www.afriscinexus.com · Perth, Western Australia</span>
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
          <div style={{ fontSize: 32, fontWeight: 900 }}>
            <span style={{ background: "linear-gradient(90deg,#fff,#7FFFD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AfriSci</span>
            {" "}
            <span style={{ background: "linear-gradient(90deg,#F59E0B,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Nexus</span>
            {" "}
            <span style={{ color: "#94a3b8", fontSize: 26 }}>Discovery</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#64748b", textTransform: "uppercase", marginTop: 4 }}>African Scientific Excellence</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 258, left: 60, right: 60, height: 1, background: "linear-gradient(90deg,rgba(245,158,11,0.4),rgba(255,255,255,0.2),rgba(245,158,11,0.4))" }} />

      {/* Name */}
      <div style={{ position: "absolute", top: 280, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontSize: 38, fontWeight: 900, color: "#fff" }}>Majok Wutchok</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", letterSpacing: 2, textTransform: "uppercase", marginTop: 6 }}>Founder &amp; CEO</div>
      </div>

      {/* Contacts */}
      <div style={{ position: "absolute", top: 390, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {[
          "📱 +61 425 448 727",
          "✉️ majok@afriscinexus.com",
          "✉️ editorial@afriscinexus.com",
          "🌐 www.afriscinexus.com",
          "📍 Perth, Western Australia",
        ].map((c, i) => (
          <div key={i} style={{ fontSize: 13.5, color: "#cbd5e1" }}>{c}</div>
        ))}
      </div>

      {/* 12 Journals pill grid */}
      <div style={{ position: "absolute", top: 568, left: 36, right: 36, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {JOURNALS.map((j, i) => (
          <div key={i} style={{
            background: `${j.color}22`, border: `1px solid ${j.color}55`,
            borderRadius: 50, padding: "3px 10px",
            fontSize: 9, fontWeight: 700, color: j.color, letterSpacing: 0.5
          }}>
            {j.abbr}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 44, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 10, color: "#475569", letterSpacing: 2 }}>12 PEER-REVIEWED JOURNALS · OPEN ACCESS · DOI REGISTERED</span>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function ExecutiveBusinessCard() {
  const [activeCard, setActiveCard] = useState("front");
  const [downloading, setDownloading] = useState(false);

  const downloadCard = async (cardId, filename) => {
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const element = document.getElementById(cardId);
      if (!element) return;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  };

  const downloadAll = async () => {
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const cards = [
        { id: "bcard-front", name: "AfriSciNexus_BusinessCard_Front.png" },
        { id: "bcard-back", name: "AfriSciNexus_BusinessCard_Back.png" },
        { id: "bcard-square", name: "AfriSciNexus_BusinessCard_Social.png" },
      ];
      for (const c of cards) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
        const link = document.createElement("a");
        link.download = c.name;
        link.href = canvas.toDataURL("image/png", 1.0);
        link.click();
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  const printCard = () => {
    const el = document.getElementById(
      activeCard === "front" ? "bcard-front" : activeCard === "back" ? "bcard-back" : "bcard-square"
    );
    if (!el) return;
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Print Business Card</title>
      <style>
        @page { margin: 0; size: ${activeCard === "square" ? "8.5cm 8.5cm" : "8.5cm 5.5cm"}; }
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
        img { max-width: 100%; height: auto; }
      </style></head><body>
      <img src="${el.toDataURL ? el.toDataURL() : ""}" onload="window.print();window.close();" />
      </body></html>
    `);
    // fallback - capture and print
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null }).then(canvas => {
        w.document.body.innerHTML = `<img src="${canvas.toDataURL()}" onload="window.print();window.close();" style="max-width:100%;height:auto;" />`;
      });
    });
  };

  const CARD_TYPES = [
    { id: "front", label: "📇 Front (Landscape)", desc: "Standard 3.5\" × 2\" business card front" },
    { id: "back", label: "🗂 Back (Journals)", desc: "Standard 3.5\" × 2\" — 12 journals listing" },
    { id: "square", label: "📐 Square (Social)", desc: "Square format for LinkedIn / digital use" },
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
            disabled={downloading}
            className="bg-gradient-to-r from-blue-900 to-teal-600 hover:from-blue-800 hover:to-teal-500 text-white gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Downloading..." : "Download All Formats"}
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>🖨 Print-Ready:</strong> All formats export at 3× resolution (300+ DPI equivalent). Standard business card: <strong>3.5" × 2"</strong> (88.9 × 50.8 mm). Square card: <strong>2.5" × 2.5"</strong> ideal for digital & social media use.
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {CARD_TYPES.map(ct => (
          <button
            key={ct.id}
            onClick={() => setActiveCard(ct.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
              activeCard === ct.id
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-slate-200 text-slate-600 hover:border-teal-300"
            }`}
          >
            <div>{ct.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{ct.desc}</div>
          </button>
        ))}
      </div>

      {/* Card preview */}
      <div className="bg-slate-100 rounded-2xl p-8 overflow-x-auto">
        <div className="flex flex-col items-center gap-6">
          {/* All 3 cards rendered (but only selected shown prominently, others hidden off-screen for export) */}
          <div style={{ display: activeCard === "front" ? "block" : "none" }}>
            <CardFront />
          </div>
          <div style={{ display: activeCard === "back" ? "block" : "none" }}>
            <CardBack />
          </div>
          <div style={{ display: activeCard === "square" ? "block" : "none" }}>
            <CardSquare />
          </div>

          {/* Always render all in hidden div for download */}
          <div style={{ position: "fixed", left: -9999, top: -9999, pointerEvents: "none", opacity: 0, zIndex: -1 }}>
            {activeCard !== "front" && <CardFront />}
            {activeCard !== "back" && <CardBack />}
            {activeCard !== "square" && <CardSquare />}
          </div>
        </div>
      </div>

      {/* Per-format download buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { id: "bcard-front", label: "Front Card", file: "AfriSciNexus_Card_Front.png", icon: "📇" },
          { id: "bcard-back", label: "Back Card (Journals)", file: "AfriSciNexus_Card_Back.png", icon: "🗂" },
          { id: "bcard-square", label: "Square / Social", file: "AfriSciNexus_Card_Square.png", icon: "📐" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => downloadCard(f.id, f.file)}
            disabled={downloading}
            className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-400 hover:shadow-md transition-all text-left"
          >
            <span className="text-2xl">{f.icon}</span>
            <div className="flex-1">
              <div className="font-semibold text-slate-900 text-sm">{f.label}</div>
              <div className="text-xs text-slate-400">{f.file}</div>
            </div>
            <Download className="w-4 h-4 text-teal-600" />
          </button>
        ))}
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