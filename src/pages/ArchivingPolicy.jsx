import React, { useState } from 'react';
import { Archive, ChevronDown, ChevronUp, Mail, Server, ShieldCheck, Clock, Globe } from 'lucide-react';

const LAST_UPDATED = "1 April 2026";

const sections = [
  {
    id: "overview",
    icon: Archive,
    title: "1. Our Commitment to Long-Term Preservation",
    content: `AfriSci Nexus is committed to ensuring that every article we publish remains permanently accessible, even in the unlikely event that our platform ceases operation. As a digital-only open access publisher, long-term preservation of the scholarly record is core to our editorial responsibility to authors, readers, and the wider research community.

This Archiving Policy sets out the systems and practices we use to guarantee permanent access to published content.`
  },
  {
    id: "digital-preservation",
    icon: Server,
    title: "2. Digital Preservation Infrastructure",
    content: `Every published article — including its full text, metadata, and DOI record — is stored redundantly across geographically distributed cloud infrastructure with automated daily backups. In addition:

• All article metadata (title, authors, abstract, DOI) is registered with Crossref, which maintains an independent permanent record even if our own hosting is affected
• Full-text PDF and HTML copies are retained in cold storage backups separate from our live database
• DOIs assigned to published articles are permanent identifiers that will always resolve to the article, or to a preservation copy in the event of a platform migration`
  },
  {
    id: "dark-archive",
    icon: ShieldCheck,
    title: "3. Dark Archive & Succession Planning",
    content: `AfriSci Nexus maintains a "dark archive" of every published article — a preserved, offline copy that is not publicly accessible under normal operation but can be activated for public release in the event our platform becomes permanently unavailable.

We are actively pursuing formal preservation partnerships with recognised digital preservation services (such as CLOCKSS and Portico) as part of our roadmap. Until such partnerships are finalised, our internal dark archive and Crossref metadata registration serve as the interim safeguard for the permanent scholarly record.`
  },
  {
    id: "continuity",
    icon: Clock,
    title: "4. Continuity of Access",
    content: `In the event that AfriSci Nexus were to cease publishing operations:

• All published articles would remain accessible for a minimum transitional period while a successor host or archive is arranged
• Authors and their institutions would be notified in advance wherever possible
• DOI records would be updated to point to the new permanent location of the content, in line with Crossref's requirements for registered publishers
• We would prioritise transferring the full archive to a recognised not-for-profit preservation service or institutional repository network`
  },
  {
    id: "no-retraction",
    icon: Globe,
    title: "5. Version of Record Integrity",
    content: `Once an article is published, its Version of Record is preserved unchanged. Any corrections, retractions, or expressions of concern are handled transparently through a formal erratum or retraction notice linked to the original article — the original publication is never silently altered or removed from the record.`
  },
  {
    id: "contact",
    icon: Mail,
    title: "6. Questions About Preservation",
    content: `If you have questions about our archiving practices or preservation partnerships, please contact our editorial team.

**Editorial Enquiries**
editorial@afriscinexus.com

**General Preservation Enquiries**
archiving@afriscinexus.org`
  }
];

export default function ArchivingPolicy() {
  const [openSection, setOpenSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Archive className="w-8 h-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Archiving Policy</h1>
          <p className="text-sky-200 text-lg max-w-2xl mx-auto">
            How we guarantee permanent, long-term access to every article we publish.
          </p>
          <p className="text-sky-300 text-sm mt-3">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
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
          <p className="text-slate-700 text-sm">Questions about our preservation practices?</p>
          <a href="mailto:archiving@afriscinexus.org" className="font-bold text-teal-700 hover:underline text-sm">
            archiving@afriscinexus.org
          </a>
        </div>
      </div>
    </div>
  );
}