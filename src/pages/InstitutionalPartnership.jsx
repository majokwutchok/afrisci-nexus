import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import {
  Building2, Globe, TrendingUp, Shield, Users, BookOpen,
  CheckCircle, Star, ArrowRight, Sparkles, Handshake,
  GraduationCap, Award, Zap, MapPin, FileText, DollarSign
} from "lucide-react";
import SEO from '@/components/SEO';

const tiers = [
  {
    name: "Starter",
    price: 10000,
    authors: 10,
    color: "border-slate-200",
    headerColor: "bg-slate-50",
    badge: "",
    perks: [
      "10 author slots annually",
      "Unlimited submissions per enrolled author",
      "All journals open access",
      "Priority submission processing",
      "Institutional profile page",
      "Annual impact report",
      "DOI assignment & CrossRef registration",
    ],
  },
  {
    name: "Growth",
    price: 15000,
    authors: 25,
    color: "border-teal-400 ring-2 ring-teal-400",
    headerColor: "bg-teal-600",
    badge: "Most Popular",
    perks: [
      "25 author slots annually",
      "Unlimited submissions per enrolled author",
      "All journals open access",
      "Expedited review (14-day target)",
      "Dedicated editorial liaison",
      "Institutional profile page",
      "Bi-annual impact report",
      "Co-branded press releases",
      "DOI assignment & CrossRef registration",
      "Google Scholar & Scopus indexing support",
    ],
  },
  {
    name: "Premier",
    price: 25000,
    authors: 50,
    color: "border-amber-400",
    headerColor: "bg-amber-500",
    badge: "Best Value",
    perks: [
      "50 author slots annually",
      "Unlimited submissions per enrolled author",
      "All journals open access",
      "Fast-track review (10-day target)",
      "Dedicated editorial team",
      "Custom journal branding option",
      "Quarterly impact dashboards",
      "Full co-branded marketing",
      "DOI assignment & CrossRef registration",
      "Google Scholar, Scopus & DOAJ indexing",
      "Annual gala recognition",
      "Research visibility PR campaign",
    ],
  },
];

const reasons = [
  {
    icon: Globe,
    color: "bg-blue-100 text-blue-700",
    title: "Global Discoverability",
    body: "Every article published on AfriSci Nexus is indexed by Google Scholar, BASE, OpenAIRE and CORE — giving African research the same global reach as top Western journals.",
  },
  {
    icon: TrendingUp,
    color: "bg-teal-100 text-teal-700",
    title: "Measurable Research Impact",
    body: "Real-time citation tracking, download analytics and readership maps let institutions quantify the impact of their scholars across 54 African countries and beyond.",
  },
  {
    icon: Shield,
    color: "bg-purple-100 text-purple-700",
    title: "Trusted & Independent",
    body: "AfriSci Nexus Discovery is headquartered in Perth, Western Australia — an independent platform free from predatory fees and editorial gatekeeping. African research evaluated by African and global scholars on equal terms.",
  },
  {
    icon: Zap,
    color: "bg-amber-100 text-amber-700",
    title: "AI-Powered Peer Review",
    body: "Our AI reviewer-matching reduces time-to-decision by 40%. Authors get faster feedback; editors get better reviewer fits — all while maintaining rigorous double-blind standards.",
  },
  {
    icon: GraduationCap,
    color: "bg-emerald-100 text-emerald-700",
    title: "Capacity Building",
    body: "Institutional partners receive access to writing workshops, LaTeX tools, submission guidelines and editorial training — building in-house research publication capacity.",
  },
  {
    icon: Award,
    color: "bg-rose-100 text-rose-700",
    title: "Institutional Recognition",
    body: "Partner institutions are featured on our platform, press releases and annual impact reports, elevating their reputation among funders, governments and international collaborators.",
  },
];

const underServed = [
  { country: "South Sudan", flag: "🇸🇸", note: "Fewer than 200 indexed articles nationally. A partnership unlocks instant global visibility for every researcher." },
  { country: "Eritrea", flag: "🇪🇷", note: "Rich scientific tradition, minimal global indexing. Partnership bridges the gap immediately." },
  { country: "CAR", flag: "🇨🇫", note: "Partner universities gain access to a publication pipeline with zero infrastructure cost." },
  { country: "Guinea-Bissau", flag: "🇬🇼", note: "First-mover advantage: be the first nationally indexed institution on AfriSci Nexus." },
  { country: "Burundi", flag: "🇧🇮", note: "Affordable tiered pricing designed for institutions in emerging research economies." },
];

const INITIAL_FORM = {
  institution_name: "",
  country: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  tier: "Growth",
  num_authors: "",
  message: "",
};

export default function InstitutionalPartnership() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: "partnerships@afriscinexus.com",
        subject: `Institutional Partnership Application — ${form.institution_name}`,
        body: `
New Partnership Application

Institution: ${form.institution_name}
Country: ${form.country}
Contact: ${form.contact_name} (${form.contact_email}) ${form.contact_phone}
Tier: ${form.tier}
Estimated Authors: ${form.num_authors}

Message:
${form.message}
        `.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO
        title="Institutional Partnerships"
        description="Partner your university or research institution with AfriSci Nexus — affordable publishing agreements giving 10-50 authors global research visibility."
        canonicalPath="/InstitutionalPartnership"
      />
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #14B8A6 0%, transparent 60%), radial-gradient(circle at 80% 20%, #38BDF8 0%, transparent 50%)" }} />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Badge className="bg-teal-500/30 text-teal-200 border border-teal-400/40 mb-4">🤝 Institutional Partnerships</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Partner with Africa's<br />Premier Research Platform
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
            Give your institution's researchers a world-class open-access publishing home. 
            10–50 authors publish freely under one institutional agreement.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setActiveTab("apply")} className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-1">
              Apply Now <ArrowRight className="inline w-4 h-4 ml-1" />
            </button>
            <button onClick={() => setActiveTab("pricing")} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200">
              View Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {[
              { id: "overview", label: "Why Partner", icon: Sparkles },
              { id: "pricing", label: "Pricing & Tiers", icon: DollarSign },
              { id: "underserved", label: "Your Country's Opportunity", icon: MapPin },
              { id: "terms", label: "Terms & Conditions", icon: FileText },
              { id: "apply", label: "Apply Now", icon: Handshake },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Why African Institutions Should Partner</h2>
              <p className="text-slate-600">A partnership with AfriSci Nexus is not just publishing — it's strategic visibility, capacity building, and a seat at the global research table.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reasons.map(r => (
                <Card key={r.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center mb-4`}>
                      <r.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{r.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{r.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="bg-gradient-to-r from-teal-600 to-blue-700 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">African Research Deserves a Global Stage</h3>
              <p className="text-teal-100 max-w-2xl mx-auto mb-6">
                Currently, over 70% of African research is invisible to global databases because it's published in under-resourced local journals. AfriSci Nexus changes that — immediately, affordably, and permanently.
              </p>
              <button onClick={() => setActiveTab("apply")} className="bg-white text-teal-700 font-bold px-8 py-3 rounded-xl hover:bg-teal-50 transition-colors">
                Partner With Us Today
              </button>
            </div>
          </div>
        )}

        {/* ── PRICING ── */}
        {activeTab === "pricing" && (
          <div className="space-y-10">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Institutional Pricing Tiers</h2>
              <p className="text-slate-600 mb-3">One upfront annual agreement. All your enrolled authors publish freely across all AfriSci Nexus journals. No per-article fees.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 text-left">
                <strong>💡 How we compare:</strong> Springer Nature institutional read-&-publish agreements start at <strong>$50,000+/yr</strong> for small institutions. Elsevier deals regularly exceed <strong>$200,000/yr</strong>. Individual APCs on these platforms average <strong>$2,000–$5,000 per article</strong>. AfriSci Nexus offers comparable global indexing, DOI registration, and peer review at a fraction of the cost — purpose-built for the African research context.
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {tiers.map(tier => (
                <Card key={tier.name} className={`relative border-2 ${tier.color} overflow-hidden`}>
                  {tier.badge && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-teal-600 text-white">{tier.badge}</Badge>
                    </div>
                  )}
                  <div className={`${tier.headerColor} ${tier.name === "Growth" ? "text-white" : "text-slate-800"} p-6`}>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-extrabold">${tier.price.toLocaleString()}</span>
                      <span className="text-sm ml-1 opacity-75">/ year</span>
                    </div>
                    <p className="text-sm mt-1 opacity-80">Up to {tier.authors} authors</p>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    {tier.perks.map(p => (
                      <div key={p} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        {p}
                      </div>
                    ))}
                    <Button
                      className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white"
                      onClick={() => { setForm(f => ({ ...f, tier: tier.name })); setActiveTab("apply"); }}
                    >
                      Select {tier.name} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-blue-100 rounded-lg p-3"><Users className="w-6 h-6 text-blue-700" /></div>
                <div>
                  <h4 className="font-bold text-blue-900 text-lg">Custom Enterprise Plans</h4>
                  <p className="text-blue-700 text-sm mt-1">Need more than 50 authors, a multi-campus agreement, or a government-level national partnership? Contact us for a custom quote.</p>
                  <Link to={createPageUrl("Contact")}>
                    <Button variant="outline" size="sm" className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100">Contact for Custom Quote</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── UNDERSERVED ── */}
        {activeTab === "underserved" && (
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">First-Mover Advantage for Under-Published Nations</h2>
              <p className="text-slate-600">Countries with low research publication rates have the most to gain. Early institutional partners lock in the lowest rates and highest visibility.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {underServed.map(c => (
                <Card key={c.country} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{c.flag}</div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{c.country}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{c.note}</p>
                    <button onClick={() => setActiveTab("apply")} className="mt-4 text-sm text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1">
                      Apply from {c.country} <ArrowRight className="w-3 h-3" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white">
              <div className="flex items-start gap-4">
                <Star className="w-10 h-10 flex-shrink-0 text-yellow-300" />
                <div>
                  <h3 className="text-xl font-bold mb-2">The South Sudan Opportunity</h3>
                  <p className="text-emerald-100 leading-relaxed mb-4">
                    South Sudan, with fewer than 200 nationally indexed research articles, is a country where a single institutional partnership could <strong className="text-white">triple the nation's global research visibility overnight</strong>. University of Juba, Rumbek University, and Upper Nile University researchers deserve the same global platform as Oxford or Nairobi. AfriSci Nexus makes that possible today — for less than the cost of sending one researcher to a conference abroad.
                  </p>
                  <button onClick={() => setActiveTab("apply")} className="bg-white text-teal-700 font-bold px-6 py-2.5 rounded-lg hover:bg-teal-50 transition-colors">
                    Apply Now — Special Introductory Rate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TERMS ── */}
        {activeTab === "terms" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Partnership Terms & Conditions</h2>
            <p className="text-slate-500 text-sm">Effective from the date of agreement execution. Subject to periodic review.</p>
            {[
              {
                title: "1. Agreement Scope",
                body: "An Institutional Partnership Agreement ('Agreement') grants the named institution access to AfriSci Nexus publishing services for a fixed number of author slots ('Author Quota') over a 12-month period ('Term'). Author slots are non-transferable between institutions but may be reallocated among staff or students of the same institution.",
              },
              {
                title: "2. Payment Terms",
                body: "The full annual partnership fee is due upfront upon execution of the Agreement. AfriSci Nexus issues a formal invoice within 3 business days of application approval. Accepted payment methods include bank transfer (SWIFT/SEPA), M-Pesa Business, and credit card. Pricing is in USD. Partial payments are not accepted.",
              },
              {
                title: "3. Author Quota & Usage",
                body: "Each enrolled author may submit unlimited manuscripts during the Term. Published articles count against the quota only if accepted and published. Rejected or withdrawn submissions do not consume quota. Unused slots do not roll over to the following year.",
              },
              {
                title: "4. Editorial Independence",
                body: "AfriSci Nexus maintains full editorial independence. Partnership status confers no preferential treatment in peer review decisions. All manuscripts are evaluated solely on scientific merit through double-blind review.",
              },
              {
                title: "5. Open Access & Licensing",
                body: "All articles published under institutional agreements are released under Creative Commons CC BY 4.0. Authors retain copyright. Articles are permanently free to read, download, share, and adapt with attribution.",
              },
              {
                title: "6. Institutional Branding",
                body: "Partner institutions receive a dedicated profile page on afriscinexus.com displaying their logo, research focus areas, and published article portfolio. AfriSci Nexus may feature partner institutions in press releases and marketing materials unless opted out in writing.",
              },
              {
                title: "7. Renewal & Cancellation",
                body: "Partners receive a renewal notice 60 days before Term expiry. Pricing for renewal is subject to the then-current rate schedule with a 10% loyalty discount for continuing partners. Cancellation mid-term does not entitle a refund but authors may continue to use remaining quota until Term end.",
              },
              {
                title: "8. Dispute Resolution",
                body: "Disputes arising from this Agreement shall be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be referred to mediation under the rules of the African Centre for Dispute Resolution (ACDR).",
              },
            ].map(section => (
              <Card key={section.title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-slate-900 text-base mb-2">{section.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{section.body}</p>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-slate-400 text-center">By submitting a partnership application you agree to these terms. A formal agreement will be sent for signature prior to payment.</p>
          </div>
        )}

        {/* ── APPLY ── */}
        {activeTab === "apply" && (
          <div className="max-w-2xl mx-auto">
            {submitted ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Received!</h2>
                <p className="text-slate-600 mb-6">Thank you for your interest in partnering with AfriSci Nexus. Our partnerships team will contact you within 2 business days with your formal agreement and invoice.</p>
                <Link to={createPageUrl("Contact")}>
                  <Button variant="outline">Contact Us in the Meantime</Button>
                </Link>
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-blue-700 text-white rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Handshake className="w-5 h-5" /> Institutional Partnership Application
                  </CardTitle>
                  <p className="text-teal-100 text-sm mt-1">Complete the form below. Our team reviews all applications within 2 business days.</p>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Institution Name *</label>
                        <Input name="institution_name" value={form.institution_name} onChange={handleChange} placeholder="e.g. University of Juba" required />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Country *</label>
                        <Input name="country" value={form.country} onChange={handleChange} placeholder="e.g. South Sudan" required />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Contact Name *</label>
                        <Input name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Full name" required />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Title / Role</label>
                        <Input name="contact_role" value={form.contact_role || ""} onChange={handleChange} placeholder="e.g. Research Dean" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Email Address *</label>
                        <Input type="email" name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="official@institution.edu" required />
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Phone / WhatsApp</label>
                        <Input name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="+211 ..." />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">Partnership Tier *</label>
                      <select
                        name="tier"
                        value={form.tier}
                        onChange={handleChange}
                        className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      >
                        <option value="Starter">Starter — 10 authors / $10,000/yr</option>
                        <option value="Growth">Growth — 25 authors / $15,000/yr</option>
                        <option value="Premier">Premier — 50 authors / $25,000/yr</option>
                        <option value="Custom">Custom Enterprise Plan</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">Estimated Number of Active Authors</label>
                      <Input type="number" name="num_authors" value={form.num_authors} onChange={handleChange} placeholder="e.g. 18" min="1" max="500" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">Message / Questions</label>
                      <Textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us about your institution, research focus areas, or any questions about the partnership..." rows={4} />
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600">
                      By submitting this form you confirm you have read and agree to our{" "}
                      <button type="button" onClick={() => setActiveTab("terms")} className="text-teal-600 underline font-medium">Partnership Terms & Conditions</button>.
                      A formal agreement document and invoice will be sent upon approval.
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 text-base">
                      {loading ? "Submitting…" : "Submit Partnership Application"}
                      {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}