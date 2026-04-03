import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Check, Image, Palette, Type } from "lucide-react";
import { LOGO_ICON_URL, LOGO_FULL_URL } from "../brand/AfriSciLogo";

const BRAND_COLORS = [
  { name: "Teal Primary",    hex: "#0D9488", tw: "teal-600",  role: "Primary brand" },
  { name: "Teal Dark",       hex: "#0F766E", tw: "teal-700",  role: "Hover states" },
  { name: "Gold Accent",     hex: "#F59E0B", tw: "amber-500", role: "Accents / CTAs" },
  { name: "Gold Dark",       hex: "#D97706", tw: "amber-600", role: "Gold hover" },
  { name: "Navy Deep",       hex: "#1E3A8A", tw: "blue-900",  role: "Header background" },
  { name: "Sky Mid",         hex: "#38BDF8", tw: "sky-400",   role: "Highlights" },
  { name: "Slate Light",     hex: "#F8FAFC", tw: "slate-50",  role: "Page background" },
  { name: "Slate Dark",      hex: "#0F172A", tw: "slate-900", role: "Body text" },
];

const ASSETS = [
  {
    label: "Full Logotype",
    description: "Primary brand logo with icon + wordmark",
    url: LOGO_FULL_URL,
    filename: "afrisci-nexus-logotype.png",
    badge: "PNG",
    bg: "bg-white border-2 border-slate-100",
  },
  {
    label: "Icon Mark",
    description: "Standalone icon for favicons, app icons, social media",
    url: LOGO_ICON_URL,
    filename: "afrisci-nexus-icon.png",
    badge: "PNG",
    bg: "bg-gradient-to-br from-teal-600 to-teal-800",
  },
];

function ColorSwatch({ color }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer group"
      onClick={copy}
    >
      <div
        className="w-12 h-12 rounded-xl shadow-inner flex-shrink-0 ring-2 ring-white"
        style={{ background: color.hex }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{color.name}</p>
        <p className="text-xs text-slate-500">{color.role}</p>
        <p className="text-xs font-mono text-teal-700 mt-0.5">{color.hex}</p>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
      </div>
    </div>
  );
}

function AssetCard({ asset }) {
  const download = () => {
    const a = document.createElement("a");
    a.href = asset.url;
    a.download = asset.filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
      <div className={`h-52 flex items-center justify-center p-6 ${asset.bg}`}>
        <img
          src={asset.url}
          alt={asset.label}
          className="max-h-40 max-w-full object-contain drop-shadow-xl"
        />
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-slate-900">{asset.label}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{asset.description}</p>
          </div>
          <Badge className="bg-teal-100 text-teal-800 text-xs">{asset.badge}</Badge>
        </div>
        <Button
          className="w-full mt-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold gap-2"
          onClick={download}
        >
          <Download className="w-4 h-4" />
          Download {asset.label}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BrandAssets() {
  return (
    <div className="space-y-10">
      {/* Hero banner */}
      <div
        className="rounded-2xl p-10 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #0D9488 60%, #F59E0B 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 0%, transparent 60%)" }}
        />
        <div className="relative z-10">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">Official Brand Kit</Badge>
          <h2 className="text-4xl font-extrabold mb-2 tracking-tight">AfriSci Nexus Brand Assets</h2>
          <p className="text-sky-100 text-lg max-w-xl">
            Download official logos, icon marks, and color palettes for use in publications, presentations, and partner materials.
          </p>
        </div>
      </div>

      {/* Logo downloads */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-teal-100 rounded-xl">
            <Image className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Logo Files</h3>
            <p className="text-sm text-slate-500">High-resolution assets for all use cases</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {ASSETS.map(a => <AssetCard key={a.label} asset={a} />)}
        </div>
      </section>

      {/* Typography */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <Type className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Brand Typography</h3>
            <p className="text-sm text-slate-500">Recommended typefaces for publications and UI</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Primary UI", font: "Inter", usage: "Interface, body copy, labels", sample: "Advancing African Science" },
            { name: "Display / Hero", font: "Poppins", usage: "Headlines, hero text, titles", sample: "AfriSci Nexus" },
            { name: "Academic", font: "Merriweather", usage: "Article abstracts, long-form text", sample: "Peer-Reviewed Research" },
          ].map(t => (
            <Card key={t.name} className="border border-slate-100 shadow-sm p-5">
              <Badge className="bg-blue-100 text-blue-800 text-xs mb-3">{t.name}</Badge>
              <p className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: t.font }}>{t.sample}</p>
              <p className="text-sm font-semibold text-slate-700">{t.font}</p>
              <p className="text-xs text-slate-500 mt-1">{t.usage}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Color palette */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-100 rounded-xl">
            <Palette className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Color Palette</h3>
            <p className="text-sm text-slate-500">Click any swatch to copy the hex value</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BRAND_COLORS.map(c => <ColorSwatch key={c.hex} color={c} />)}
        </div>
      </section>

      {/* Usage guidelines */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-slate-900">Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-slate-700">
            {[
              "Always maintain clear space around the logo equal to the height of the 'A' in AfriSci.",
              "Do not stretch, rotate, recolor, or add effects to the logo mark.",
              "Use the icon-only mark for small contexts (16px–48px) such as favicons and app icons.",
              "On dark backgrounds, use the white/teal variant of the logotype.",
              "The gold accent (#F59E0B) is reserved for CTAs, highlights, and awards — do not use it as a primary fill.",
              "Never place the logo on a background that conflicts with the teal/navy color palette.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}