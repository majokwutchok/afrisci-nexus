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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Logo and mission */}
          <div className="lg:col-span-2">
            <Link to={createPageUrl("Home")} className="inline-block mb-4">
              <AfriSciLogo variant="header" theme="dark" />
            </Link>
            <p className="text-sm text-slate-400 mb-6 max-w-sm">
              Elevating African research on the global stage through open access publishing and rigorous peer review.
            </p>
            <form className="flex gap-2">
              <Input type="email" placeholder="Your email for newsletter" className="bg-slate-800 border-slate-700 text-white placeholder-slate-500" />
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">Subscribe</Button>
            </form>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Authors</h4>
            <ul className="space-y-3">
              {authorLinks.map(link => (
                <li key={link.title}>
                  <Link to={link.url} className="hover:text-teal-400 transition-colors text-sm">{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-3">
              {exploreLinks.map(link => (
                <li key={link.title}>
                  <Link to={link.url} className="hover:text-teal-400 transition-colors text-sm">{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">About</h4>
            <ul className="space-y-3">
              {aboutLinks.map(link => (
                <li key={link.title}>
                  <Link to={link.url} className="hover:text-teal-400 transition-colors text-sm">{link.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500 text-center md:text-left mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} AfriSci Nexus. All Rights Reserved.
          </p>
          <div className="flex space-x-5">
            <a href="#" className="text-slate-500 hover:text-teal-400"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-teal-400"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-teal-400"><Facebook className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}