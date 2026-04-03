import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, BookOpen, Video, HelpCircle, CheckCircle,
  Lightbulb, Zap, Award, X, Download, ExternalLink,
  ChevronRight, Clock, Users, Star
} from 'lucide-react';

// --- Resource Panel Content ---
const RESOURCE_CONTENT = {
  templates: {
    title: "Manuscript Templates",
    badge: "Popular",
    sections: [
      {
        heading: "Word Templates",
        items: [
          { name: "General Research Article Template", desc: "Standard format for empirical and theoretical research papers. Includes structured sections: Abstract, Introduction, Methods, Results, Discussion, References.", action: "Download .docx" },
          { name: "Review Article Template", desc: "For comprehensive literature reviews and systematic reviews. Pre-formatted with PRISMA flow diagram placeholder.", action: "Download .docx" },
          { name: "Short Communication Template", desc: "Concise format (2,000–3,000 words) for preliminary findings and rapid communications.", action: "Download .docx" },
        ]
      },
      {
        heading: "LaTeX Templates",
        items: [
          { name: "AfriSci Nexus LaTeX Class", desc: "Official .cls file with journal-specific formatting. Compatible with Overleaf and local TeX installations.", action: "Download .zip" },
          { name: "Overleaf Template", desc: "Start writing immediately in your browser — no installation required.", action: "Open in Overleaf" },
        ]
      },
      {
        heading: "Formatting Notes",
        tip: "All manuscripts must be submitted in 12pt Times New Roman or Arial, double-spaced, with 2.5cm margins. Figures should be supplied separately at 300 DPI minimum."
      }
    ]
  },
  checklist: {
    title: "Submission Checklist",
    sections: [
      {
        heading: "Before You Submit",
        checklist: [
          "Manuscript file (Word or PDF) with line numbers enabled",
          "Title page with all author names, affiliations, and ORCID IDs",
          "Structured abstract (250 words max) with Objective, Methods, Results, Conclusion",
          "5–8 keywords not already in the title",
          "All figures at 300 DPI, labelled Figure 1, Figure 2…",
          "All tables with captions and source notes",
          "References formatted in the journal's required style (APA / Vancouver / ACS)",
          "Ethical approval statement (if applicable)",
          "Conflict of interest declaration",
          "Data availability statement",
          "Cover letter addressed to the Editor-in-Chief",
          "Suggested reviewers (minimum 3) with email addresses",
        ]
      },
      {
        heading: "For Revised Manuscripts",
        checklist: [
          "Point-by-point response letter addressing every reviewer comment",
          "Highlighted / tracked-changes version of the manuscript",
          "Clean revised manuscript without track changes",
          "Updated figures or tables if changed",
        ]
      }
    ]
  },
  style: {
    title: "Style Guides",
    sections: [
      {
        heading: "Citation Styles by Discipline",
        items: [
          { name: "APA 7th Edition", desc: "Required for Social Sciences, Education, and Psychology journals. Author-date in-text citations.", action: "View Guide" },
          { name: "Vancouver / NLM", desc: "Required for Medicine, Health Sciences, and Nursing journals. Numbered citations in order of appearance.", action: "View Guide" },
          { name: "ACS Style", desc: "Required for Chemistry, Biology, and Environmental Science journals.", action: "View Guide" },
          { name: "Chicago Author-Date", desc: "Used for Law, Policy, and Humanities journals.", action: "View Guide" },
        ]
      },
      {
        heading: "Language & Spelling",
        tip: "AfriSci Nexus accepts manuscripts in English (British or American — consistent throughout), French, Portuguese, and Swahili. Manuscripts in languages other than English must include an English abstract."
      },
      {
        heading: "Units & Nomenclature",
        tip: "Use SI units throughout. Gene and protein names should follow official nomenclature (HGNC, NCBI). Statistical results should include effect sizes and confidence intervals alongside p-values."
      }
    ]
  },
  abstract: {
    title: "Title & Abstract Guide",
    sections: [
      {
        heading: "Crafting Your Title",
        items: [
          { name: "Be Specific and Informative", desc: "Include the main variable, population, and geographic context where relevant. E.g., 'Malaria Prevalence Among Under-5s in Rural Tanzania: A Cross-Sectional Survey'." },
          { name: "Keep It Concise", desc: "Aim for 10–15 words. Avoid abbreviations, jargon, and questions in the title." },
          { name: "Front-Load Keywords", desc: "Place the most important terms at the beginning — search engines and readers scan titles from left to right." },
        ]
      },
      {
        heading: "Structured Abstract Format",
        checklist: [
          "Objective / Background — What problem does the study address?",
          "Methods — Study design, setting, participants, and interventions",
          "Results — Key quantitative findings with statistics",
          "Conclusion — Main implication and relevance to the field",
          "Keywords — 5 to 8 terms not already in the title",
        ]
      },
      {
        heading: "Common Mistakes to Avoid",
        tip: "Don't include citations in the abstract. Don't use 'In this paper we…' — describe the findings directly. Don't copy sentences verbatim from the body of the paper."
      }
    ]
  },
  graphical: {
    title: "Graphical Abstract Tool",
    badge: "New",
    sections: [
      {
        heading: "What Is a Graphical Abstract?",
        tip: "A graphical abstract is a single image summarising the main finding of your article. It appears on the journal's table of contents and in search results, dramatically increasing click-through rates."
      },
      {
        heading: "Recommended Free Tools",
        items: [
          { name: "BioRender", desc: "The most popular science figure tool. Drag-and-drop icons, pre-built templates for biology, chemistry, and medicine.", action: "Open BioRender" },
          { name: "Canva for Science", desc: "General-purpose design tool with academic poster and figure templates. Easy to use for non-designers.", action: "Open Canva" },
          { name: "Inkscape", desc: "Free, open-source vector editor. Best for publication-quality scalable graphics.", action: "Download Inkscape" },
          { name: "Figma", desc: "Collaborative UI/design tool increasingly used for research figures. Free tier available.", action: "Open Figma" },
        ]
      },
      {
        heading: "Specifications",
        checklist: [
          "Dimensions: 800 × 400 px minimum (landscape orientation)",
          "Format: TIFF, PNG, or EPS at 300 DPI",
          "No additional text beyond the title — use visuals to tell the story",
          "Use a white or light background for best journal display",
          "Ensure all icons and images are licensed for commercial/academic reuse",
        ]
      }
    ]
  },
  video: {
    title: "Video Abstract Guidelines",
    sections: [
      {
        heading: "Why Create a Video Abstract?",
        tip: "Articles with video abstracts receive on average 3× more downloads and 2× more citations within the first year of publication. They also reach a non-specialist audience through social media."
      },
      {
        heading: "Production Tips",
        items: [
          { name: "Keep It Under 5 Minutes", desc: "Aim for 2–3 minutes. Cover: the problem, your approach, and the key finding. Don't try to present everything." },
          { name: "Script First", desc: "Write a script of approximately 300–450 words, then record. A script prevents rambling and keeps time on track." },
          { name: "Use Slides or Screen Recording", desc: "You don't need a camera. A slide deck narrated by you is perfectly acceptable. Tools: Loom, OBS Studio, PowerPoint recorder." },
          { name: "Captions Are Required", desc: "Add subtitles for accessibility. YouTube's auto-captions or CapCut can generate them automatically." },
        ]
      },
      {
        heading: "Technical Requirements",
        checklist: [
          "Format: MP4 (H.264 codec)",
          "Resolution: 1080p (1920 × 1080) preferred, 720p minimum",
          "Audio: Clear speech, no loud background noise",
          "File size: Under 500 MB",
          "Do not include music with copyright restrictions",
        ]
      }
    ]
  }
};

const TipCard = ({ text }) => (
  <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
    <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-slate-700">{text}</p>
  </div>
);

function ResourcePanel({ resourceKey, onClose }) {
  const content = RESOURCE_CONTENT[resourceKey];
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{content.title}</h2>
            {content.badge && <Badge className="bg-teal-100 text-teal-800 text-xs">{content.badge}</Badge>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-7">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h3 className="font-bold text-slate-800 text-base mb-3">{section.heading}</h3>
              {section.tip && <TipCard text={section.tip} />}
              {section.items && (
                <div className="space-y-3">
                  {section.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-colors group">
                      <ChevronRight className="w-4 h-4 text-teal-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                      </div>
                      {item.action && (
                        <Badge variant="outline" className="text-xs text-teal-700 border-teal-200 flex-shrink-0 cursor-pointer group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-colors">
                          {item.action}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {section.checklist && (
                <ul className="space-y-2">
                  {section.checklist.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
}

const RESOURCES = [
  { key: "templates", icon: FileText, title: "Manuscript Templates", description: "Download Word and LaTeX templates pre-formatted for AfriSci Nexus journals.", badge: "Popular", linkText: "Download Templates" },
  { key: "checklist", icon: CheckCircle, title: "Submission Checklist", description: "Ensure your manuscript is complete before submission with our comprehensive checklist.", linkText: "View Checklist" },
  { key: "style", icon: BookOpen, title: "Style Guides", description: "Detailed guides on citation styles, formatting, and journal-specific requirements.", linkText: "Access Guides" },
  { key: "graphical", icon: Zap, title: "Graphical Abstract Tool", description: "Create compelling visual summaries of your research with our free online tool.", badge: "New", linkText: "Create Now" },
  { key: "abstract", icon: Award, title: "Title & Abstract Guide", description: "Learn how to craft effective titles and abstracts that maximize discoverability.", linkText: "Read Guide" },
  { key: "video", icon: Video, title: "Video Abstract Guidelines", description: "Enhance your article with a video abstract. See our best practices and examples.", linkText: "Watch Tutorial" },
];

const WRITING_TIPS = [
  { title: "Start with a Strong Introduction", text: "Clearly state your research question, explain its significance, and outline your approach. Make readers understand why your work matters from the very first paragraph." },
  { title: "Be Clear and Concise", text: "Use simple, direct language. Avoid jargon where possible. Each sentence should add value to your narrative — if it doesn't, cut it." },
  { title: "Use Active Voice", text: 'Active voice makes your writing more engaging and easier to understand. "We analyzed the data" is clearer than "The data was analyzed by us."' },
  { title: "Tell a Story", text: "Structure your paper as a narrative. Guide readers through your research journey from problem → gap in knowledge → your approach → results → implications." },
  { title: "Visual Elements Matter", text: "Use high-quality figures and tables. They should be self-explanatory and add information, not just repeat text. Always reference every figure/table in the body." },
];

const FAQS = [
  { q: "How long does the peer review process take?", a: "On average, 4–6 weeks from submission to initial decision. Timelines vary by reviewer availability and manuscript complexity. You can track your status in real time from your dashboard." },
  { q: "Can I suggest reviewers for my manuscript?", a: "Yes. We encourage authors to suggest 3–5 potential reviewers with their institutional email addresses. You may also list researchers you prefer not to review your work. Final selection is at the editor's discretion." },
  { q: "What happens if I need to make corrections after publication?", a: "Minor typos or factual corrections are handled via an Erratum notice. More significant corrections are published as a Corrigendum. In cases of serious methodological error or data integrity issues, articles may be retracted in accordance with COPE guidelines." },
  { q: "How do I apply for a fee waiver?", a: "Fee waivers are available for corresponding authors from low-income countries (World Bank classification) and those without institutional funding. Select 'Request Waiver' during submission checkout and provide a brief justification. We review all requests within 5 business days." },
  { q: "Can I post my manuscript to a preprint server?", a: "Yes. We support preprints on bioRxiv, medRxiv, SSRN, AfricArXiv, and other recognised servers both before and after submission. Please disclose the preprint DOI in your cover letter." },
  { q: "What file formats are accepted for submission?", a: "Manuscripts: Word (.docx) or PDF. Figures: TIFF, PNG, or EPS at 300 DPI. Supplementary data: any format. Final accepted manuscripts must be submitted as editable Word files for typesetting." },
];

export default function AuthorResources() {
  const [activePanel, setActivePanel] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      {/* Panel overlay */}
      {activePanel && (
        <ResourcePanel resourceKey={activePanel} onClose={() => setActivePanel(null)} />
      )}

      {/* Hero */}
      <div className="text-center py-20 px-4 bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-600 text-white">
        <BookOpen className="w-14 h-14 mx-auto mb-5 text-teal-100" />
        <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg">Author Resources</h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-teal-50">
          Everything you need to successfully publish your research with AfriSci Nexus.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* Writing & Preparation Tools */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Writing & Preparation Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {RESOURCES.map(r => {
              const Icon = r.icon;
              return (
                <Card
                  key={r.key}
                  className="border-0 bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                  onClick={() => setActivePanel(r.key)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-base font-bold text-slate-900">{r.title}</h3>
                          {r.badge && <Badge className="bg-teal-100 text-teal-800 text-xs">{r.badge}</Badge>}
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{r.description}</p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 group-hover:text-teal-900 transition-colors">
                          {r.linkText} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Writing Tips */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Writing Tips for Success</h2>
          <div className="space-y-3">
            {WRITING_TIPS.map(tip => (
              <div key={tip.title} className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border-l-4 border-emerald-500">
                <Lightbulb className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{tip.title}</h4>
                  <p className="text-sm text-slate-700">{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Research Tools */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Research Tools & Software</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-teal-600" /> Reference Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Zotero", desc: "Free, open-source — syncs across devices, Word & Google Docs plugins", url: "https://www.zotero.org" },
                  { name: "Mendeley", desc: "Reference manager with PDF annotation and social network for researchers", url: "https://www.mendeley.com" },
                  { name: "EndNote", desc: "Professional reference management — institutional licences often available", url: "https://endnote.com" },
                  { name: "AfricArXiv", desc: "Pan-African preprint repository — deposit your work before peer review", url: "https://africarxiv.org" },
                ].map(t => (
                  <a key={t.name} href={t.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 group hover:no-underline">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">{t.name} <ExternalLink className="w-3 h-3 inline opacity-50" /></p>
                      <p className="text-xs text-slate-500">{t.desc}</p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-5 h-5 text-teal-600" /> Writing & Editing Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Grammarly", desc: "Grammar, style, and clarity checker — free browser extension", url: "https://www.grammarly.com" },
                  { name: "Overleaf", desc: "Collaborative online LaTeX editor with journal templates", url: "https://www.overleaf.com" },
                  { name: "Hemingway Editor", desc: "Highlights complex sentences and passive voice", url: "https://hemingwayapp.com" },
                  { name: "DeepL Write", desc: "AI writing assistant — especially useful for non-native English writers", url: "https://www.deepl.com/write" },
                ].map(t => (
                  <a key={t.name} href={t.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 group hover:no-underline">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">{t.name} <ExternalLink className="w-3 h-3 inline opacity-50" /></p>
                      <p className="text-xs text-slate-500">{t.desc}</p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Webinars */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Webinars & Training</h2>
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
            <CardContent className="p-7">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Video className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Upcoming Webinars</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Writing an Effective Abstract", date: "May 14, 2026 • 2:00 PM EAT", badge: "Free" },
                      { title: "Navigating Peer Review", date: "May 21, 2026 • 2:00 PM EAT", badge: "Free" },
                      { title: "Open Access & Your Rights", date: "June 4, 2026 • 10:00 AM EAT", badge: "Free" },
                    ].map(w => (
                      <div key={w.title} className="p-4 bg-white rounded-xl border border-blue-100 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{w.title}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{w.date}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">{w.badge}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Recorded Sessions</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Open Access Publishing 101", meta: "45 min · Beginner", stars: 5 },
                      { title: "Data Visualization Best Practices", meta: "60 min · Intermediate", stars: 5 },
                      { title: "Research Ethics & Integrity", meta: "50 min · All levels", stars: 4 },
                    ].map(v => (
                      <div key={v.title} className="p-4 bg-white rounded-xl border border-blue-100">
                        <p className="font-semibold text-slate-900 text-sm">{v.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{v.meta}</p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: v.stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-start justify-between gap-3 p-5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="flex items-start gap-2.5">
                    <HelpCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-900 text-sm">{faq.q}</span>
                  </span>
                  <span className={`flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>
                    <X className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? '' : 'rotate-45'}`} />
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 pl-12 text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto text-center bg-white p-10 rounded-2xl shadow-xl border border-slate-200/60">
          <Users className="w-10 h-10 text-teal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Need More Help?</h2>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto text-sm">
            Our editorial team is here to support you throughout the publication process. Don't hesitate to reach out.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white">
              Contact Editorial Team
            </Button>
            <Button variant="outline">Browse Help Centre</Button>
          </div>
        </section>
      </div>
    </div>
  );
}