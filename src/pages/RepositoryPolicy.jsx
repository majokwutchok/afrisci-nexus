import React, { useState } from 'react';
import { Building, ChevronDown, ChevronUp, Mail, FileText, CheckCircle2, Layers } from 'lucide-react';

const LAST_UPDATED = "1 April 2026";

const sections = [
  {
    id: "overview",
    icon: Building,
    title: "1. Self-Archiving & Repository Deposit",
    content: `Yes. AfriSci Nexus allows authors to deposit versions of their work in an institutional or other repository of their choice. As a fully open access publisher, we actively encourage authors to maximise the visibility and long-term accessibility of their research by depositing it in institutional repositories, subject repositories, and personal or academic websites.

Because all AfriSci Nexus articles are published open access under a Creative Commons licence, authors retain broad rights to share and redistribute their work — self-archiving does not require special permission from the editorial team.`
  },
  {
    id: "which-version",
    icon: Layers,
    title: "2. Which Version Can Be Deposited",
    content: `Authors may deposit the following versions of their manuscript, at any stage:

**Submitted Version (Preprint)**
The author's original manuscript prior to peer review. May be deposited at any time, including before submission to AfriSci Nexus, with no embargo.

**Accepted Version (Postprint)**
The peer-reviewed, revised manuscript as accepted for publication, before copyediting and typesetting. May be deposited immediately upon acceptance, with no embargo.

**Published Version (Version of Record)**
The final, formatted, and typeset article exactly as it appears on AfriSci Nexus, including DOI and pagination. Since all articles are open access, the Version of Record may also be deposited immediately, with no embargo period.`
  },
  {
    id: "where",
    icon: Building,
    title: "3. Eligible Repositories",
    content: `Authors are free to deposit their work in any repository of their choosing, including:

• Institutional repositories (university or employer repositories)
• Subject-specific repositories (e.g. arXiv, bioRxiv, medRxiv, SSRN, AJOL)
• National and regional research repositories
• Personal academic websites and ORCID/Google Scholar profiles
• ResearchGate and similar academic networking platforms
• Funder-mandated repositories (e.g. PubMed Central, Europe PMC) where required by grant conditions`
  },
  {
    id: "requirements",
    icon: CheckCircle2,
    title: "4. Requirements for Deposit",
    content: `When depositing any version of your work, we ask that you:

• Include a full citation to the AfriSci Nexus Version of Record, including the DOI
• Add a statement noting where the final published version can be found, e.g. "This is the accepted manuscript of an article published in [Journal Name] by AfriSci Nexus. The Version of Record is available at https://doi.org/[DOI]"
• Retain the original Creative Commons licence notice when depositing the Version of Record
• Update the repository record with the DOI once it is assigned, if depositing prior to publication`
  },
  {
    id: "funder-mandates",
    icon: FileText,
    title: "5. Funder & Institutional Mandates",
    content: `We recognise that many funders (e.g. Wellcome Trust, Gates Foundation, national research councils) and institutions require immediate open access deposit as a condition of funding. Because every AfriSci Nexus article is published open access with no embargo, our publishing model is inherently compatible with these mandates — authors can satisfy funder repository requirements immediately upon publication, without needing an embargo waiver.`
  },
  {
    id: "contact",
    icon: Mail,
    title: "6. Questions About Repository Deposit",
    content: `If you need a letter confirming your self-archiving rights for your institution or funder, or have any questions about this policy, please contact our editorial team.

**Editorial Enquiries**
editorial@afriscinexus.com

**Repository & Compliance Enquiries**
compliance@afriscinexus.org`
  }
];

export default function RepositoryPolicy() {
  const [openSection, setOpenSection] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Building className="w-8 h-8 text-teal-300" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Repository & Self-Archiving Policy</h1>
          <p className="text-sky-200 text-lg max-w-2xl mx-auto">
            Yes — authors may freely deposit their work in an institutional or other repository of their choice, at any stage.
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
          <p className="text-slate-700 text-sm">Need a repository compliance letter or have a question?</p>
          <a href="mailto:compliance@afriscinexus.org" className="font-bold text-teal-700 hover:underline text-sm">
            compliance@afriscinexus.org
          </a>
        </div>
      </div>
    </div>
  );
}