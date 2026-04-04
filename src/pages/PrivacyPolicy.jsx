import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Mail, Globe, Lock, Eye, Database, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';

const LAST_UPDATED = "1 April 2026";

const sections = [
  {
    id: "overview",
    icon: Shield,
    title: "1. Overview & Scope",
    content: `AfriSci Nexus ("we", "our", "us") is committed to protecting the privacy and personal data of all individuals who interact with our platform — including authors, reviewers, editors, readers, and visitors. This Privacy Policy explains what data we collect, why we collect it, how we use and protect it, and your rights under applicable data protection law including the General Data Protection Regulation (GDPR), South Africa's Protection of Personal Information Act (POPIA), and equivalent national legislation across African jurisdictions.

This Policy applies to all services offered through afriscinexus.org and any associated mobile applications or APIs. By using our platform you acknowledge that you have read and understood this Policy.`
  },
  {
    id: "data-collected",
    icon: Database,
    title: "2. Data We Collect",
    content: `We collect the following categories of personal data:

**Account & Profile Data**
When you register, we collect your full name, email address, institutional affiliation, country of residence, ORCID identifier, Google Scholar URL, academic title, and areas of research interest.

**Manuscript & Submission Data**
When you submit a manuscript we collect the manuscript file, author list, keywords, cover letter, reviewer suggestions, and any supplementary files. We retain this data regardless of the outcome of the review process.

**Payment Data**
If you pay a submission or publication fee, we collect billing information. Payment card details are processed by our PCI-DSS compliant payment partners (Stripe, M-Pesa, MTN Mobile Money etc.) and are never stored on our servers.

**Usage & Analytics Data**
We automatically collect IP address, browser type, device type, pages visited, time spent on pages, referral source, and download events. This data is used in aggregated, anonymised form for platform analytics.

**Communications**
Emails, support tickets, and messages you send to our editorial team are retained to facilitate your request and for quality assurance.

**Cookies & Tracking**
We use strictly necessary cookies (session management, CSRF protection), functional cookies (language and preferences), and optional analytics cookies (Google Analytics). You can manage cookie preferences via our consent banner.`
  },
  {
    id: "legal-basis",
    icon: UserCheck,
    title: "3. Legal Basis for Processing",
    content: `We process your personal data on the following legal bases:

**Contract Performance** — Processing your account data and manuscript submissions is necessary to provide the publishing services you have requested.

**Legitimate Interests** — We process usage analytics and security logs to maintain platform integrity, detect fraud, and improve our services. We have balanced these interests against your privacy rights.

**Consent** — For optional communications such as newsletters and marketing emails. You may withdraw consent at any time by clicking "Unsubscribe" in any email or updating your profile settings.

**Legal Obligation** — We may process data where required by applicable law, court order, or regulatory authority.

**Vital Interests** — In exceptional circumstances where processing is necessary to protect someone's life.`
  },
  {
    id: "how-we-use",
    icon: Eye,
    title: "4. How We Use Your Data",
    content: `We use your personal data to:

• Create and manage your AfriSci Nexus account
• Process manuscript submissions and coordinate peer review
• Assign editors and reviewers and facilitate blind review processes
• Communicate editorial decisions, revision requests, and publication confirmations
• Issue DOIs and publish accepted articles (author names are public upon publication)
• Process payments and issue receipts or fee waivers
• Send system notifications (submission received, review complete, decision issued)
• Send newsletters and platform announcements (with your consent)
• Conduct platform analytics to improve user experience
• Comply with legal, regulatory, and reporting obligations
• Prevent fraud, abuse, and unauthorised access
• Respond to support queries and complaints`
  },
  {
    id: "sharing",
    icon: Globe,
    title: "5. Data Sharing & Third Parties",
    content: `We do not sell your personal data. We share data only in the following circumstances:

**Editorial Process**
During peer review, manuscripts are shared with assigned reviewers in accordance with the chosen review type (double-blind, single-blind, or open review). Author identities are protected in double-blind reviews.

**Service Providers**
We engage trusted third-party processors including: cloud hosting (AWS / Google Cloud), payment processors (Stripe, Flutterwave), email delivery (SendGrid), analytics (Google Analytics — with IP anonymisation), and DOI registration (Crossref). All processors are bound by Data Processing Agreements.

**Index Databases & Repositories**
Upon acceptance, metadata (title, abstract, authors, keywords, DOI) may be submitted to indexing services including PubMed, Scopus, Web of Science, DOAJ, and African Journals Online (AJOL).

**Legal Requirements**
We may disclose data to law enforcement or regulatory bodies when required by law or to protect the rights, property, or safety of AfriSci Nexus, our users, or the public.

**Business Transfers**
In the event of a merger or acquisition, personal data may be transferred. We will notify users before any such transfer and before data becomes subject to a different privacy policy.`
  },
  {
    id: "retention",
    icon: RefreshCw,
    title: "6. Data Retention",
    content: `We retain personal data for as long as necessary to fulfil the purposes described in this Policy:

• **Account data** — retained for the lifetime of your account plus 5 years after closure, to satisfy legal and reporting obligations
• **Manuscript data** — indefinitely for published articles; 7 years for rejected or withdrawn submissions
• **Payment records** — 7 years in accordance with financial and tax regulations
• **Usage logs** — 12 months
• **Marketing consent records** — until consent is withdrawn plus 3 years

You may request deletion of your account and associated data (subject to overriding legal obligations and the legitimate interests of the scientific record) by contacting privacy@afriscinexus.org.`
  },
  {
    id: "security",
    icon: Lock,
    title: "7. Security Measures",
    content: `We implement industry-standard technical and organisational measures to protect your personal data against unauthorised access, disclosure, alteration, or destruction:

• **Encryption in transit** — All data transmitted between your browser and our servers is encrypted using TLS 1.2 or higher (HTTPS)
• **Encryption at rest** — Sensitive fields in our database are encrypted using AES-256
• **Access control** — Role-based access controls ensure that only authorised staff can access personal data, on a need-to-know basis
• **Two-factor authentication** — Available for all user accounts; mandatory for editorial staff
• **Regular audits** — We conduct annual penetration testing and quarterly security reviews
• **Incident response** — We maintain a documented breach response procedure and will notify affected users and relevant authorities within 72 hours of discovering a material breach, in accordance with GDPR Article 33`
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "8. Your Rights",
    content: `Depending on your jurisdiction, you have the following rights regarding your personal data:

**Right of Access** — Request a copy of all personal data we hold about you.

**Right to Rectification** — Request correction of inaccurate or incomplete data.

**Right to Erasure ("Right to Be Forgotten")** — Request deletion of your data, subject to overriding legal obligations and the integrity of the scientific record.

**Right to Restriction** — Request that we restrict processing of your data while a dispute is resolved.

**Right to Data Portability** — Request your data in a structured, machine-readable format (JSON or CSV).

**Right to Object** — Object to processing based on legitimate interests or for direct marketing purposes.

**Right to Withdraw Consent** — Where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing.

**Right to Lodge a Complaint** — You have the right to complain to your national data protection authority. For EU residents, this is your local Supervisory Authority. For South African residents, this is the Information Regulator (www.justice.gov.za/inforeg/).

To exercise any of these rights, email privacy@afriscinexus.org. We will respond within 30 days.`
  },
  {
    id: "international",
    icon: Globe,
    title: "9. International Transfers",
    content: `AfriSci Nexus operates globally. Your data may be processed in countries outside your own, including countries that may not have equivalent data protection laws. Where we transfer data outside the EEA or countries without an adequacy decision, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission, or equivalent safeguards.

We are committed to ensuring that any cross-border data transfers are conducted lawfully and that recipients provide adequate protection for your data.`
  },
  {
    id: "children",
    icon: AlertTriangle,
    title: "10. Children's Privacy",
    content: `AfriSci Nexus is an academic publishing platform intended for use by adults. We do not knowingly collect personal data from individuals under the age of 16. If you believe a minor has provided us with personal data, please contact us immediately at privacy@afriscinexus.org and we will promptly delete the information.`
  },
  {
    id: "changes",
    icon: RefreshCw,
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy periodically to reflect changes in our practices, technology, or applicable law. We will notify registered users of material changes by email and/or a prominent notice on our platform at least 14 days before the changes take effect. The "Last Updated" date at the top of this page will always indicate when the most recent revision was made. Continued use of our services after the effective date constitutes acceptance of the revised Policy.`
  },
  {
    id: "contact",
    icon: Mail,
    title: "12. Contact & Data Controller",
    content: `AfriSci Nexus is the data controller for personal data processed through this platform.

**Data Protection Officer**
privacy@afriscinexus.org

**Registered Address**
AfriSci Nexus Publishing Ltd
c/o African Development Centre
Nairobi, Kenya

**General Enquiries**
editorial@afriscinexus.org | +254 20 000 0000

For complaints that cannot be resolved directly, you retain the right to contact your national supervisory authority.`
  }
];

export default function PrivacyPolicy() {
  const [openSection, setOpenSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Privacy Policy</h1>
          <p className="text-sky-200 text-lg max-w-2xl mx-auto">
            We are committed to protecting your personal data and your right to privacy.
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
                        if (line.startsWith('**') && line.includes('**')) {
                          return <p key={i} className="text-slate-700">{line.replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</p>;
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
          <p className="text-slate-700 text-sm">Questions about this policy?</p>
          <a href="mailto:privacy@afriscinexus.com" className="font-bold text-teal-700 hover:underline text-sm">
            privacy@afriscinexus.com
          </a>
        </div>
      </div>
    </div>
  );
}