import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Mail, Scale, AlertTriangle, BookOpen, CreditCard, UserCheck, RefreshCw, Globe, Gavel } from 'lucide-react';

const LAST_UPDATED = "1 April 2026";

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: `By accessing or using the AfriSci Nexus platform (afriscinexus.org) — including submitting manuscripts, performing peer review, editing journals, or browsing published content — you agree to be legally bound by these Terms and Conditions ("Terms") and our Privacy Policy, which is incorporated herein by reference.

If you are using the platform on behalf of an institution or organisation, you represent that you have authority to bind that entity to these Terms, and references to "you" shall include that entity.

If you do not agree to these Terms, you must not use our platform. We reserve the right to amend these Terms at any time. Continued use after notice of changes constitutes acceptance.`
  },
  {
    id: "platform",
    icon: BookOpen,
    title: "2. Platform Description",
    content: `AfriSci Nexus is an open-access academic publishing platform dedicated to advancing African scientific research. Our services include:

• **Manuscript submission portal** — submit, track, and revise research manuscripts
• **Peer review management** — coordinate double-blind, single-blind, and open peer review
• **Journal browsing and search** — discover peer-reviewed journals across 9 disciplines
• **Author and reviewer dashboards** — manage submissions, reviews, and profiles
• **AI-assisted tools** — manuscript assessment, journal matching, and reviewer suggestions
• **Payment processing** — submission fees, publication fees, and fee waiver requests
• **DOI registration** — assign and register Digital Object Identifiers for accepted articles
• **Publication and archiving** — publish, index, and preserve accepted research

We reserve the right to modify, suspend, or discontinue any part of the platform with reasonable notice.`
  },
  {
    id: "accounts",
    icon: UserCheck,
    title: "3. User Accounts & Eligibility",
    content: `**Eligibility**
You must be at least 18 years of age and have the legal capacity to enter into binding agreements to use our platform. Our services are intended for researchers, academics, and institutions.

**Account Registration**
You agree to provide accurate, complete, and current information during registration and to keep this information up to date. Providing false information, including false credentials or institutional affiliations, is grounds for immediate account termination.

**Account Security**
You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately at security@afriscinexus.org if you suspect unauthorised access. We will not be liable for any loss resulting from unauthorised use of your credentials.

**Account Suspension & Termination**
We reserve the right to suspend or permanently terminate accounts that violate these Terms, engage in research misconduct, abuse the peer review system, or engage in fraudulent activity.

**ORCID Integration**
We strongly encourage authors to register an ORCID identifier (orcid.org) to ensure unambiguous author attribution. By linking your ORCID to AfriSci Nexus you grant us permission to read your public ORCID profile data.`
  },
  {
    id: "submission",
    icon: FileText,
    title: "4. Manuscript Submission Rules",
    content: `By submitting a manuscript to AfriSci Nexus, you confirm and warrant that:

**Originality**
The work is original, has not been previously published in any form, and is not under consideration elsewhere simultaneously (unless pre-print disclosure is made).

**Authorship**
All listed authors have made a genuine intellectual contribution to the work in accordance with ICMJE criteria. The corresponding author has obtained permission from all co-authors to submit. Honorary authorship and ghost authorship are prohibited and constitute research misconduct.

**Ethics**
Research involving human subjects has received appropriate institutional ethics approval. Research involving animals has complied with applicable welfare legislation. All required consents, permits, and approvals have been obtained.

**Disclosure of Conflicts of Interest**
All financial and non-financial conflicts of interest have been disclosed in accordance with our conflict of interest policy.

**Data Integrity**
Figures, images, and data have not been inappropriately manipulated. Raw data is available upon request from the editor.

**Pre-prints**
You may post a pre-print to recognised repositories (bioRxiv, medRxiv, AfricArXiv, SSRN, etc.) before, during, or after submission. Please disclose the pre-print DOI in your cover letter.

**Simultaneous Submission**
Submitting the same manuscript (or substantially similar work) to more than one journal simultaneously is prohibited and will result in immediate rejection and account suspension.`
  },
  {
    id: "intellectual-property",
    icon: Scale,
    title: "5. Intellectual Property & Licensing",
    content: `**Copyright**
Authors retain copyright in their work. By submitting to AfriSci Nexus, you grant us a non-exclusive, worldwide, royalty-free licence to publish, reproduce, distribute, display, and archive the article in all media formats, including print and digital.

**Open Access Licence**
Unless otherwise specified, all articles published on AfriSci Nexus are made available under the Creative Commons Attribution 4.0 International Licence (CC BY 4.0). This allows anyone to share and adapt the work, provided appropriate credit is given, a link to the licence is provided, and any changes are indicated.

**Platform Intellectual Property**
All platform software, design, branding (including the AfriSci Nexus name and logo), editorial tools, and content not owned by authors are the exclusive intellectual property of AfriSci Nexus Publishing Ltd. You may not reproduce, modify, distribute, or create derivative works without our express written consent.

**Third-Party Content**
If your manuscript includes third-party copyrighted material (figures, tables, excerpts), you are responsible for obtaining and providing evidence of the necessary permissions before publication.

**ORCID & Crossref**
DOIs are registered with Crossref in accordance with their metadata standards. ORCID identifiers are used in accordance with ORCID's public data licence.`
  },
  {
    id: "peer-review",
    icon: BookOpen,
    title: "6. Peer Review Obligations",
    content: `**For Reviewers**
By accepting a review invitation you agree to:

• Complete the review within the agreed timeframe (typically 21 days)
• Provide a thorough, constructive, and objective evaluation
• Maintain strict confidentiality of the manuscript content, authors (where applicable), and review process
• Declare any conflicts of interest that may affect your objectivity before accepting the assignment
• Not use unpublished information from the manuscript for your own research without explicit written permission from the authors
• Adhere to COPE's Ethical Guidelines for Peer Reviewers

**Confidentiality**
Manuscripts under review are confidential documents. You must not share them with colleagues (including junior researchers or students) without prior written approval from the editor.

**For Editors**
Handling editors agree to make fair, impartial, and timely editorial decisions, to maintain confidentiality, and to recuse themselves from handling manuscripts where a conflict of interest exists.`
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "7. Fees, Payments & Waivers",
    content: `**Submission Fees**
Certain journals charge a submission fee payable upon submission. Fees are listed on each journal's homepage and during the submission checkout process. Submission fees are non-refundable once the manuscript has entered editorial assessment.

**Publication Fees (APCs)**
Article Processing Charges (APCs) are payable upon acceptance. APCs vary by journal and are clearly disclosed before submission.

**Payment Methods**
We accept international credit/debit cards (via Stripe), M-Pesa, MTN Mobile Money, Airtel Money, Orange Money, EcoCash, Tigo Pesa, PayPal, and bank transfer. Currency conversion applies to non-USD payments.

**Fee Waivers**
Full or partial fee waivers are available for corresponding authors from low-income countries (World Bank Group 1 classification) or those demonstrating financial hardship. Waiver requests must be submitted during the submission process with a brief justification. Waivers are granted at the discretion of the editorial office and are not guaranteed.

**Refund Policy**
Submission fees: non-refundable. APCs: refundable in full if a published article is retracted due to an editorial error on our part. APCs are non-refundable if an article is retracted due to author misconduct.

**Invoicing**
Tax invoices are issued automatically upon payment. Institutional purchase orders are accepted for APCs; contact billing@afriscinexus.org.`
  },
  {
    id: "prohibited",
    icon: AlertTriangle,
    title: "8. Prohibited Conduct",
    content: `You agree not to use the AfriSci Nexus platform to:

• Submit plagiarised, fabricated, or falsified research
• Manipulate the peer review process, including submitting fake reviewer identities or self-review
• Harass, intimidate, or discriminate against editors, reviewers, or other users
• Scrape, crawl, or systematically harvest content without authorisation
• Circumvent access controls or attempt to gain unauthorised access to other accounts or our systems
• Upload malware, viruses, or other malicious code
• Use our platform for commercial advertising without prior written agreement
• Misrepresent your institutional affiliation, credentials, or authorship
• Engage in citation manipulation or coercive citation practices
• Submit manuscripts to multiple journals simultaneously without disclosure

Violations may result in immediate account termination, retraction of published articles, notification to your institution, and referral to relevant professional bodies or law enforcement.`
  },
  {
    id: "liability",
    icon: Gavel,
    title: "9. Disclaimers & Limitation of Liability",
    content: `**Service Availability**
The platform is provided "as is" and "as available". We do not guarantee uninterrupted, error-free, or secure access to our services. We reserve the right to perform maintenance that may temporarily affect availability.

**Content Accuracy**
Published articles represent the views of the authors and not AfriSci Nexus. We do not warrant the accuracy, completeness, or fitness for any purpose of published research. Peer review is a quality indicator, not a guarantee of correctness.

**Limitation of Liability**
To the maximum extent permitted by applicable law, AfriSci Nexus shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of (or inability to use) our platform, including loss of data, revenue, reputation, or research opportunities.

Our total aggregate liability to you for any claim arising from these Terms or your use of the platform shall not exceed the greater of: (a) the fees paid by you to us in the 12 months preceding the claim; or (b) USD 500.

Nothing in these Terms limits liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be limited by law.`
  },
  {
    id: "governing-law",
    icon: Scale,
    title: "10. Governing Law & Dispute Resolution",
    content: `These Terms are governed by the laws of Western Australia, Australia, without regard to its conflict of law provisions.

**Dispute Resolution**
We encourage you to contact us first at legal@afriscinexus.org to resolve any dispute informally. If a resolution cannot be reached within 30 days, disputes shall be submitted to binding arbitration under the rules of the Australian Centre for International Commercial Arbitration (ACICA), with the arbitration conducted in Perth, Western Australia in the English language.

**Class Action Waiver**
You agree to resolve disputes with AfriSci Nexus on an individual basis and waive the right to participate in any class or representative action.

**Jurisdiction**
For users in the European Union, mandatory consumer protection rights under EU law are unaffected by this clause. For users in jurisdictions where mandatory local law applies, that law will govern to the extent it conflicts with these Terms.`
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "11. Changes to These Terms",
    content: `We may revise these Terms at any time. For material changes, we will provide at least 14 days' notice via email to your registered address and a prominent notice on the platform. The "Last Updated" date at the top of this page reflects the most recent revision.

Your continued use of the platform after the effective date of revised Terms constitutes your acceptance of those Terms. If you do not agree to the revised Terms, you must stop using the platform and may request account closure by contacting us.`
  },
  {
    id: "contact",
    icon: Mail,
    title: "12. Contact Information",
    content: `For questions, concerns, or notices relating to these Terms, please contact:

**AfriSci Nexus Publishing Ltd**
legal@afriscinexus.org

**Editorial Office**
editorial@afriscinexus.org

**Billing & Payments**
billing@afriscinexus.org

**Data Protection**
privacy@afriscinexus.org

**Head Office**
AfriSci Nexus Discovery
Perth, Western Australia, Australia`
  }
];

export default function TermsConditions() {
  const [openSection, setOpenSection] = useState("acceptance");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Scale className="w-8 h-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Terms & Conditions</h1>
          <p className="text-sky-200 text-lg max-w-2xl mx-auto">
            Please read these terms carefully before using the AfriSci Nexus platform.
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
                    <div className="pt-4 text-sm text-slate-700 leading-relaxed space-y-2">
                      {section.content.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={i} className="font-bold text-slate-900 mt-4 first:mt-0">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (line.startsWith('• ')) {
                          return <p key={i} className="flex items-start gap-2"><span className="text-teal-500 mt-0.5">•</span><span>{line.slice(2)}</span></p>;
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
          <p className="text-slate-700 text-sm mb-1">Questions about these terms?</p>
          <a href="mailto:legal@afriscinexus.org" className="font-bold text-teal-700 hover:underline text-sm">
            legal@afriscinexus.org
          </a>
        </div>
      </div>
    </div>
  );
}