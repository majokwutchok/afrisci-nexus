import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Award, ArrowRight } from 'lucide-react';

export default function ReviewerCTA() {
  return (
    <div className="bg-gradient-to-br from-teal-600 to-blue-800 p-8 md:p-12 rounded-2xl text-white shadow-2xl">
      <Award className="h-12 w-12 text-amber-300 mb-4" />
      <h3 className="text-3xl font-bold">Join Our Expert Reviewers</h3>
      <p className="mt-4 text-lg text-teal-100">
        Help shape the future of African research. Lend your expertise to our community, gain recognition, and contribute to scientific excellence.
      </p>
      <Link to={createPageUrl("Profile")}>
        <Button size="lg" variant="secondary" className="mt-6 bg-white text-teal-700 hover:bg-slate-100">
          Become a Reviewer <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}