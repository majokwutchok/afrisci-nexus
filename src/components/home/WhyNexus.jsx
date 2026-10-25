import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, Fingerprint, UserCheck, HandCoins, Activity, Route, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

// Every reason links to the page that backs it up.
const REASONS = [
  {
    icon: BookOpenCheck,
    title: 'Free to read, forever',
    text: 'Every article is open access under a CC BY 4.0 licence. Anyone can read, share and build on your work, and you keep the copyright.',
    link: { to: 'OpenAccess', label: 'Open access policy' },
  },
  {
    icon: Fingerprint,
    title: 'A DOI for every article',
    text: 'Articles are registered with Crossref under our prefix 10.67418, so they are citable, discoverable and linked to the scholarly record.',
    link: { to: 'Accreditations', label: 'Accreditations and indexing' },
  },
  {
    icon: UserCheck,
    title: 'Independent expert review',
    text: 'Each manuscript is assessed by reviewers in its field, who typically report within 14 to 21 days. As a COPE member we follow its ethics guidance.',
    link: { to: 'ReviewGuidelines', label: 'Peer review guidelines' },
  },
  {
    icon: HandCoins,
    title: 'Fair fees, with waivers',
    text: 'Waivers and institutional partnerships mean cost is never a barrier, and a waiver never depends on the editorial decision.',
    link: { to: 'FeesWaiverPolicy', label: 'Fees and waivers' },
  },
  {
    icon: Activity,
    title: 'See your reach as it grows',
    text: 'Views, full text reads, downloads, citations and reader countries update on your article page the moment they happen.',
    link: { to: 'Publications', label: 'Browse published articles' },
  },
  {
    icon: Route,
    title: 'Follow every step',
    text: 'Follow your manuscript through screening, review and publication in your author dashboard, from the day you submit.',
    link: { to: 'MyManuscripts', label: 'Track a submission' },
  },
];

const CREDENTIALS = [
  ['ISSN (online)', '3079-4730'],
  ['DOI prefix', '10.67418'],
  ['Licence', 'CC BY 4.0'],
  ['Ethics', 'COPE member'],
];

export default function WhyNexus() {
  return (
    <section aria-labelledby="why-title" className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="lg:sticky lg:top-8 lg:self-start">
        <h2 id="why-title" className="text-3xl font-bold tracking-tight text-slate-900">Why publish with AfriSci Nexus?</h2>
        <p className="mt-3 max-w-md text-[17px] leading-relaxed text-slate-600">
          Open access research from Africa and beyond, built to be found, read and cited.
        </p>

        <dl className="mt-8 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-200">
          {CREDENTIALS.map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-3">
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>

        <Link to={createPageUrl('Submit')}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
          Submit your manuscript <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
        {REASONS.map(({ icon: Icon, title, text, link }) => (
          <li key={title} className="flex flex-col">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-100">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
            <Link to={createPageUrl(link.to)} className="mt-3 w-fit text-sm font-medium text-blue-800 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-800">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
