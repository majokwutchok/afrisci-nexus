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
  
  const aboutLinks = [
    { title: "Our Mission", url: createPageUrl("About") },
    { title: "Editorial Board", url: createPageUrl("Editorial") },
    { title: "Open Access Policy", url: createPageUrl("OpenAccess") },
    { title: "Contact Us", url: createPageUrl("Contact") },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <p className="text-sm text-slate-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} AfriSci Nexus. All Rights Reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to={createPageUrl("PrivacyPolicy")} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Privacy Policy</Link>
            <Link to={createPageUrl("TermsConditions")} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">Terms &amp; Conditions</Link>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-500 hover:text-teal-400"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-500 hover:text-teal-400"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-slate-500 hover:text-teal-400"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}