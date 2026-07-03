import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CheckCircle, Clock, Target, Globe, Shield, BookOpen,
  ExternalLink, Star, Award, TrendingUp, Users, Zap
} from "lucide-react";
import SEO from '@/components/SEO';

const STATUS = {
  achieved: { label: "Achieved", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, iconColor: "text-emerald-600" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock, iconColor: "text-amber-500" },
  planned: { label: "Planned", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Target, iconColor: "text-blue-500" },
};

const registrations = [
  {
    category: "🔑 Foundation — Must Have First",
    items: [
      {
        name: "ISSN International Centre",
        acronym: "ISSN",
        status: "achieved",
        priority: "Critical",
        priorityColor: "bg-red-100 text-red-700",
        logo: "🔖",
        url: "https://www.issn.org/",
        description: "The International Standard Serial Number is the fundamental identifier for any serial publication. Without a valid ISSN, no indexing database will accept a journal. Each journal needs its own ISSN (and a separate e-ISSN for the online version).",
        impact: "Required by ALL indexing bodies",
        why: "ISSN is the global passport for journals. No ISSN = invisible to every database.",
      },
      {
        name: "CrossRef — DOI Registration",
        acronym: "CrossRef / DOI",
        status: "achieved",
        priority: "Critical",
        priorityColor: "bg-red-100 text-red-700",
        logo: "🔗",
        url: "https://www.crossref.org/",
        description: "CrossRef membership gives each published article a permanent Digital Object Identifier (DOI). DOIs make articles permanently citable, trackable and machine-readable. CrossRef also powers metadata syndication across 5,000+ academic tools.",
        impact: "Cited by Google Scholar, Scopus, WoS",
        why: "A DOI turns a PDF into a globally recognised scholarly object with citation tracking.",
      },
      {
        name: "COPE — Committee on Publication Ethics",
        acronym: "COPE",
        status: "achieved",
        priority: "Critical",
        priorityColor: "bg-red-100 text-red-700",
        logo: "⚖️",
        url: "https://publicationethics.org/",
        description: "COPE membership demonstrates commitment to the highest ethical standards in publishing. Required or strongly preferred by DOAJ, Scopus, and Web of Science. COPE provides frameworks for handling misconduct, plagiarism and peer review manipulation.",
        impact: "Required for DOAJ & Scopus eligibility",
        why: "Ethical compliance signals credibility to every indexer and author worldwide.",
      },
    ],
  },
  {
    category: "📂 Open Access Directories",
    items: [
      {
        name: "Directory of Open Access Journals",
        acronym: "DOAJ",
        status: "in_progress",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "📁",
        url: "https://doaj.org/",
        description: "DOAJ is the gold-standard whitelist of legitimate open-access journals. Listing in DOAJ proves a journal is not predatory. Required by many funders (Wellcome Trust, NIH, Gates Foundation) as a condition of publishing grant-funded research.",
        impact: "Required by major research funders",
        why: "DOAJ listing is the globally-recognised badge of OA legitimacy. Authors from funded projects must publish here.",
      },
      {
        name: "African Journals OnLine",
        acronym: "AJOL",
        status: "in_progress",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "🌍",
        url: "https://www.ajol.info/",
        description: "AJOL is the world's largest and most prominent platform for African-published research. It provides regional and global discoverability specifically for journals from Africa and is widely used by African universities, libraries and researchers.",
        impact: "Primary discovery platform for African research",
        why: "Directly reaches the African academic community — the core audience for AfriSci Nexus journals.",
      },
      {
        name: "OpenAIRE",
        acronym: "OpenAIRE",
        status: "planned",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "🌐",
        url: "https://www.openaire.eu/",
        description: "OpenAIRE is the European Open Science infrastructure, aggregating research from 10,000+ repositories and journals. Widely used to comply with Horizon Europe open-access mandates. Listing ensures discoverability to all EU-funded researchers.",
        impact: "Reaches EU Horizon-funded researchers",
        why: "Africa-Europe research collaborations increasingly require Horizon compliance.",
      },
      {
        name: "BASE — Bielefeld Academic Search Engine",
        acronym: "BASE",
        status: "planned",
        priority: "Medium",
        priorityColor: "bg-yellow-100 text-yellow-700",
        logo: "🔍",
        url: "https://www.base-search.net/",
        description: "BASE is one of the world's most voluminous search engines for academic web resources, indexing 350M+ documents. OAI-PMH metadata harvesting integration gets all AfriSci Nexus articles automatically indexed.",
        impact: "350M+ indexed documents aggregator",
        why: "Passive, automated discoverability boost once OAI-PMH endpoint is live.",
      },
    ],
  },
  {
    category: "📊 Prestige Indexing Databases",
    items: [
      {
        name: "Scopus",
        acronym: "Scopus (Elsevier)",
        status: "planned",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "📈",
        url: "https://www.elsevier.com/solutions/scopus",
        description: "Scopus is Elsevier's abstract and citation database covering 90M+ records. Scopus indexing is a major institutional KPI — many African universities measure research output by Scopus-indexed articles. Requires 3+ years of publishing history and COPE membership.",
        impact: "Required KPI at most African universities",
        why: "Scopus indexing directly drives institutional partnership value — universities measure output by Scopus records.",
      },
      {
        name: "Web of Science",
        acronym: "WoS (Clarivate)",
        status: "planned",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "🏆",
        url: "https://clarivate.com/web-of-science/",
        description: "Web of Science (Clarivate) is the most prestigious citation index globally. Impact Factor is calculated from WoS data. Indexing here elevates AfriSci Nexus journals to the same visibility tier as Nature, Science and The Lancet.",
        impact: "Impact Factor source — highest prestige",
        why: "WoS indexing transforms journal reputation and unlocks top-tier author submissions from globally competitive researchers.",
      },
      {
        name: "PubMed / MEDLINE (NLM)",
        acronym: "PubMed",
        status: "planned",
        priority: "Medium",
        priorityColor: "bg-yellow-100 text-yellow-700",
        logo: "🏥",
        url: "https://www.ncbi.nlm.nih.gov/pmc/",
        description: "PubMed and PubMed Central are the US National Library of Medicine's databases, essential for health, biomedical and life sciences journals. Critical for AfriSci Nexus medicine, public health and agriculture journals to reach clinical researchers globally.",
        impact: "Essential for health & biomedical journals",
        why: "African medicine, public health and climate journals gain access to 35M+ indexed biomedical citations.",
      },
      {
        name: "EBSCO Discovery Service",
        acronym: "EBSCO",
        status: "planned",
        priority: "Medium",
        priorityColor: "bg-yellow-100 text-yellow-700",
        logo: "📚",
        url: "https://www.ebsco.com/",
        description: "EBSCO provides library discovery services to 10,000+ academic institutions globally. Inclusion in EBSCO databases means articles appear in library catalogue searches at universities worldwide, driving downloads and citations.",
        impact: "10,000+ university library catalogues",
        why: "Library discovery is how most students and researchers first encounter journal articles.",
      },
    ],
  },
  {
    category: "🆔 Author & Research Identity",
    items: [
      {
        name: "ORCID Integration & Validation",
        acronym: "ORCID",
        status: "achieved",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "👤",
        url: "https://orcid.org/",
        description: "ORCID provides persistent digital identifiers for researchers. Full integration includes: (1) automatic ORCID format validation on author, reviewer, and editor signup forms; (2) verified ORCID badges linking to official profiles on editorial boards and reviewer pages; (3) author profiles with clickable ORCID links. Reduces fraud, ensures correct attribution, and builds trust with major publishers.",
        impact: "Complete integration + verification + public profiles",
        why: "ORCID validation eliminates fake identities at signup. Public ORCID display on editorial boards signals institutional credibility to Nature, Elsevier, and African government funders.",
      },
      {
        name: "ROR — Research Organization Registry",
        acronym: "ROR",
        status: "planned",
        priority: "Medium",
        priorityColor: "bg-yellow-100 text-yellow-700",
        logo: "🏛️",
        url: "https://ror.org/",
        description: "ROR provides unique identifiers for research institutions, ensuring correct affiliation metadata in CrossRef, Scopus and OpenAIRE. Critical for institutional partnership reporting — funders and partners use ROR to track research output.",
        impact: "Institutional affiliation tracking",
        why: "Institutional partners need ROR-accurate metadata to report research output to funders and governments.",
      },
      {
        name: "Sherpa Romeo",
        acronym: "Sherpa Romeo",
        status: "planned",
        priority: "Medium",
        priorityColor: "bg-yellow-100 text-yellow-700",
        logo: "📋",
        url: "https://v2.sherpa.ac.uk/romeo/",
        description: "Sherpa Romeo lists journal open access and archiving policies. Researchers check Sherpa Romeo before submitting to know their rights. Listing ensures AfriSci Nexus journal policies are visible to every author worldwide checking self-archiving permissions.",
        impact: "Author rights visibility globally",
        why: "Authors and institutional repositories check Sherpa Romeo before every submission.",
      },
    ],
  },
  {
    category: "🌍 African & Regional Recognition",
    items: [
      {
        name: "African Index Medicus (WHO AFRO)",
        acronym: "AIM / AFRO",
        status: "planned",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "🩺",
        url: "https://indexmedicus.afro.who.int/",
        description: "The WHO's African Index Medicus indexes health and biomedical research from Africa, used by health ministries, WHO programmes and NGOs across the continent. Essential for AfriSci Nexus health and environmental journals.",
        impact: "WHO & African health ministry reach",
        why: "Health policy in Africa is driven by AIM-indexed evidence. Critical for journals covering medicine, public health and climate.",
      },
      {
        name: "African Union Research Grants",
        acronym: "AU / AUDA-NEPAD",
        status: "planned",
        priority: "Medium",
        priorityColor: "bg-yellow-100 text-yellow-700",
        logo: "🏅",
        url: "https://www.nepad.org/",
        description: "Recognition from the African Union's research funding arm (AUDA-NEPAD) positions AfriSci Nexus as an approved dissemination platform for AU-funded research, opening doors to government partnerships and national research council collaborations across all 54 countries.",
        impact: "54 African government research bodies",
        why: "AU recognition signals official endorsement, accelerating institutional adoption in government-funded universities.",
      },
      {
        name: "Google Scholar Indexing",
        acronym: "Google Scholar",
        status: "achieved",
        priority: "High",
        priorityColor: "bg-orange-100 text-orange-700",
        logo: "🔎",
        url: "https://scholar.google.com/",
        description: "Google Scholar is the most-used academic search tool globally, especially in Africa where institutional library subscriptions are limited. Properly structured HTML article pages with Scholar meta tags ensure every AfriSci Nexus article is automatically discovered.",
        impact: "1B+ academic searches per month",
        why: "Over 80% of African researchers use Google Scholar as their primary literature discovery tool.",
      },
    ],
  },
];

const stats = [
  { label: "Registrations Achieved", value: "4", icon: CheckCircle, color: "text-emerald-600 bg-emerald-100" },
  { label: "In Progress", value: "2", icon: Clock, color: "text-amber-600 bg-amber-100" },
  { label: "Planned (Roadmap)", value: "11", icon: Target, color: "text-blue-600 bg-blue-100" },
  { label: "Estimated Reach When Complete", value: "2B+", icon: Globe, color: "text-purple-600 bg-purple-100" },
];

export default function Accreditations() {
  const allItems = registrations.flatMap(c => c.items);
  const achieved = allItems.filter(i => i.status === "achieved").length;
  const inProgress = allItems.filter(i => i.status === "in_progress").length;
  const planned = allItems.filter(i => i.status === "planned").length;

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO
        title="Accreditations & Indexing Roadmap"
        description="AfriSci Nexus's roadmap to registering with every major international indexing body, including DOAJ, Scopus, Web of Science, and Google Scholar."
        canonicalPath="/Accreditations"
      />
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #14B8A6 0%, transparent 60%), radial-gradient(circle at 80% 20%, #818CF8 0%, transparent 50%)" }} />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Badge className="bg-teal-500/30 text-teal-200 border border-teal-400/40 mb-4">🏅 Global Recognition Roadmap</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            International Accreditations<br />& Indexing
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Our roadmap to registering AfriSci Nexus with every major international indexing body, database and standards organisation — ensuring African research reaches every corner of the global scholarly community.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Achieved", value: achieved, icon: CheckCircle, color: "text-emerald-600 bg-emerald-100" },
              { label: "In Progress", value: inProgress, icon: Clock, color: "text-amber-600 bg-amber-100" },
              { label: "On Roadmap", value: planned, icon: Target, color: "text-blue-600 bg-blue-100" },
              { label: "Total Registrations", value: allItems.length, icon: Globe, color: "text-purple-600 bg-purple-100" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${s.color}`}>
              <s.icon className={`w-3.5 h-3.5 ${s.iconColor}`} /> {s.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-medium">
            🔴 Critical Priority
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-xs font-medium">
            🟠 High Priority
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-medium">
            🟡 Medium Priority
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12">
        {registrations.map(section => (
          <div key={section.category}>
            <h2 className="text-xl font-bold text-slate-800 mb-5">{section.category}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {section.items.map(item => {
                const s = STATUS[item.status];
                return (
                  <Card key={item.name} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{item.logo}</span>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">{item.name}</h3>
                            <span className="text-xs text-slate-500 font-medium">{item.acronym}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <Badge className={`border text-xs ${s.color}`}>
                            <s.icon className={`w-3 h-3 mr-1 ${s.iconColor}`} />{s.label}
                          </Badge>
                          <Badge className={`border text-xs ${item.priorityColor}`}>{item.priority}</Badge>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mb-3">{item.description}</p>
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">WHY IT MATTERS FOR AFRISCI NEXUS</p>
                        <p className="text-sm text-slate-700">{item.why}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full">
                          📊 {item.impact}
                        </span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                          Official site <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <Award className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
          <h3 className="text-2xl font-bold mb-3">Help Us Accelerate Global Recognition</h3>
          <p className="text-teal-100 max-w-2xl mx-auto mb-6">
            Institutional partners directly accelerate our indexing roadmap. Each partnership demonstrates publishing volume and institutional credibility required by Scopus and Web of Science evaluation committees.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl("InstitutionalPartnership")}>
              <Button className="bg-white text-teal-700 hover:bg-teal-50 font-bold px-6">
                Become an Institutional Partner
              </Button>
            </Link>
            <Link to={createPageUrl("Contact")}>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-6">
                Contact Partnerships Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}