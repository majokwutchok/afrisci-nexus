import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Twitter, Linkedin, Facebook } from 'lucide-react';
import AfriSciLogo from '../brand/AfriSciLogo';

export default function Footer() {
  const authorLinks = [
    { title: "Submit Manuscript", url: createPageUrl("Submit") },
    { title: "Submission Guidelines", url: createPageUrl("Guidelines") },
    { title: "Track Submission", url: createPageUrl("MyManuscripts") },
    { title: "Author Resources", url: createPageUrl("AuthorResources") },
  ];

  const exploreLinks = [
    { title: "Browse All Journals", url: createPageUrl("Journals") },
    { title: "Latest Publications", url: createPageUrl("Publications") },
    { title: "By Discipline", url: createPageUrl("Journals") },
    { title: "Advanced Search", url: createPageUrl("Search") },
  ];
  
  const partnerLinks = [
    { title: "Institutional Partnership", url: createPageUrl("InstitutionalPartnership") },
    { title: "Partnership Pricing", url: createPageUrl("InstitutionalPartnership") },
    { title: "Apply as Partner", url: createPageUrl("InstitutionalPartnership") },
    { title: "Partner Terms", url: createPageUrl("InstitutionalPartnership") },
  ];

  const aboutLinks = [
    { title: "Our Mission", url: createPageUrl("About") },
    { title: "Editorial Board", url: createPageUrl("Editorial") },
    { title: "Open Access Policy", url: createPageUrl("OpenAccess") },
    { title: "Accreditations & Indexing", url: createPageUrl("Accreditations") },
    { title: "Contact Us", url: createPageUrl("Contact") },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 mb-8 sm:mb-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <AfriSciLogo variant="footer" theme="dark" />
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Advancing African scientific research through open-access publishing.
            </p>
            <div className="flex space-x-3 mt-4">
              <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Partnership — prominent */}
          <div>
            <h4 className="text-teal-400 font-semibold mb-4">🤝 Partnerships</h4>
            <ul className="space-y-2">
              {partnerLinks.map(link => (
                <li key={link.title}>
                  <Link to={link.url} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Authors */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Authors</h4>
            <ul className="space-y-2">
              {authorLinks.map(link => (
                <li key={link.title}>
                  <Link to={link.url} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold mb-4">Explore</h4>
            <ul className="space-y-2">
              {exploreLinks.map(link => (
                <li key={link.title}>
                  <Link to={link.url} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-semibold mb-4">About</h4>
            <ul className="space-y-2">
              {aboutLinks.map(link => (
                <li key={link.title}>
                  <Link to={link.url} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} AfriSci Nexus. All Rights Reserved.</p>
          <div className="flex gap-4">
            <Link to={createPageUrl("PrivacyPolicy")} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Privacy Policy</Link>
            <Link to={createPageUrl("TermsConditions")} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}