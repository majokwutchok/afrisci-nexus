import React, { useState } from 'react';
import { DollarSign, ChevronDown, ChevronUp, Mail, HeartHandshake, Building2, FileText, ShieldCheck, HelpCircle } from 'lucide-react';

const LAST_UPDATED = "1 April 2026";

const sections = [
  {
    id: "overview",
    icon: DollarSign,
    title: "1. About Article Processing Charges (APCs)",
    content: `AfriSci Nexus publishes all accepted articles as open access, meaning every article is freely available to readers worldwide at no cost. To sustain this model — covering peer review coordination, copyediting, typesetting, DOI registration, indexing, and permanent hosting — journals on our platform charge an Article Processing Charge (APC) upon acceptance of a manuscript.

APCs are only ever charged after a manuscript has been peer reviewed and accepted for publication. We never charge submission fees, and authors are never charged if their manuscript is rejected.

Each journal's specific APC amount is listed on its journal page and in the author submission guidelines. APCs may be paid via bank transfer, credit card, or regional mobile money services (M-Pesa, MTN Mobile Money, Airtel Money, Orange Money, and others).`
  },
  {
    id: "waivers",
    icon: HeartHandshake,
    title: "2. Fee Waivers",
    content: `We recognise that the cost of an APC can be a barrier to publishing quality research, particularly for authors from low-resource settings. AfriSci Nexus offers full fee waivers on a case-by-case basis, depending on the author's individual situation.

**Who can request a waiver**

• Authors affiliated with institutions in low-income and lower-middle-income countries (per the World Bank classification)
• Independent researchers and early-career scholars without institutional funding
• Authors who can demonstrate genuine financial hardship
• Students submitting as sole or lead author without grant funding
• Authors from countries or regions facing conflict, displacement, or humanitarian crisis

**How to request a waiver**

Waiver requests are submitted during the payment step of the publication process, after your manuscript has been accepted. Simply select "Request a Fee Waiver" and provide a short explanation of your situation. Our editorial finance team reviews every request individually and responds within 5 business days. A waiver request never delays the publication of your accepted article.`
  },
  {
    id: "subsidies",
    icon: FileText,
    title: "3. Partial Fee Subsidies",
    content: `Where a full waiver is not warranted but the standard APC still presents a significant burden, we offer partial subsidies that reduce the fee owed. Subsidies are assessed on the same criteria as full waivers and are typically granted in increments of 25%, 50%, or 75% off the standard APC.

Partial subsidies are commonly granted to:

• Authors from middle-income countries with limited institutional research funding
• Co-authored papers where only some authors have access to funding
• Researchers publishing their first article with AfriSci Nexus

If you are unsure whether you qualify for a full waiver or a partial subsidy, request a waiver and describe your circumstances — our team will determine the appropriate level of support.`
  },
  {
    id: "institutional",
    icon: Building2,
    title: "4. Institutional Partnerships",
    content: `Universities, research institutes, hospitals, and other organisations can enter into an Institutional Partnership Agreement with AfriSci Nexus. Partner institutions pay an annual membership fee that covers a fixed or unlimited number of author APCs across the year, allowing affiliated researchers to publish without paying individual fees.

Benefits of an institutional partnership include:

• APCs automatically waived for all eligible authors at the partner institution
• Discounted bulk-rate pricing compared to individual APCs
• A dedicated institutional dashboard for tracking submissions and publications
• Priority manuscript handling

If your institution is a partner, simply select your institution during submission and your APC will be automatically waived. To enquire about setting up an institutional partnership, visit our Institutional Partnership page or contact partnerships@afriscinexus.org.`
  },
  {
    id: "how-determined",
    icon: HelpCircle,
    title: "5. How Waiver Decisions Are Made",
    content: `Every waiver and subsidy request is reviewed individually by our editorial finance team, taking into account:

• The author's country of affiliation and its income classification
• Availability of institutional or grant funding
• Institutional partnership status
• Any hardship circumstances described in the request
• Journal-specific waiver funding availability

Decisions are made transparently and fairly, and full or partial waivers are never conditional on the outcome of peer review — waiver eligibility has no bearing on editorial decisions, and editorial decisions have no bearing on waiver eligibility. These two processes are handled by entirely separate teams.`
  },
  {
    id: "transparency",
    icon: ShieldCheck,
    title: "6. Our Commitment to Transparency",
    content: `We are committed to a transparent, equitable fee policy:

• All APC amounts are published on each journal's page — there are no hidden fees
• Peer review and editorial decisions are made independently of any author's ability to pay
• No author is ever charged a fee before their manuscript has been accepted
• Waiver and subsidy requests are confidential and only visible to our finance and editorial administration team
• This policy is reviewed annually and updated to reflect the needs of our author community`
  },
  {
    id: "contact",
    icon: Mail,
    title: "7. Questions About Fees",
    content: `If you have any questions about APCs, waivers, subsidies, or institutional partnerships, our team is happy to help.

**Fee & Waiver Enquiries**
finance@afriscinexus.org

**Institutional Partnerships**
partnerships@afriscinexus.org

**General Enquiries**
editorial@afriscinexus.com`
  }
];

export default function FeesWaiverPolicy() {
  const [openSection, setOpenSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <DollarSign className="w-8 h-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">APC & Fee Waiver Policy</h1>
          <p className="text-sky-200 text-lg max-w-2xl mx-auto">
            Clear, fair publishing fees — with waivers and subsidies available so cost is never a barrier to publishing quality African research.
          </p>
          <p className="text-sky-300 text-sm mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Quick nav */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Navigation</p>
          <div className="flex flex-wrap gap-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setOpenSection(s.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  openSection === s.id
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                {s.title.split('. ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map(section => {
            const Icon = section.icon;
            const isOpen = openSection === section.id;
            return (
              <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="font-bold text-slate-900">{section.title}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-slate-100">
                    <div className="pt-4 text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                      {section.content.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={i} className="font-bold text-slate-900 mt-4 first:mt-0">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (line.startsWith('• ')) {
                          return <p key={i} className="flex items-start gap-2"><span className="text-teal-500 mt-1">•</span><span>{line.slice(2)}</span></p>;
                        }
                        return line.trim() ? <p key={i}>{line}</p> : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 bg-teal-50 rounded-2xl border border-teal-200 text-center">
          <p className="text-slate-700 text-sm">Need a fee waiver or have a question about publishing costs?</p>
          <a href="mailto:finance@afriscinexus.org" className="font-bold text-teal-700 hover:underline text-sm">
            finance@afriscinexus.org
          </a>
        </div>
      </div>
    </div>
  );
}