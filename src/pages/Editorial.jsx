import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Mail, Globe, Award, BookOpen, Users, Edit3, CheckCircle,
  ExternalLink, Building2, GraduationCap
} from 'lucide-react';
import OrcidBadge from '@/components/OrcidBadge';
import SEO from '@/components/SEO';

const GRAD_COLORS = [
  'from-teal-500 to-emerald-600',
  'from-blue-500 to-sky-600',
  'from-purple-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
];

function editorColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRAD_COLORS[Math.abs(hash) % GRAD_COLORS.length];
}

function EditorCard({ editor }) {
  return (
    <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Top accent */}
      <div className={`h-1.5 bg-gradient-to-r ${editorColor(editor.full_name)}`} />
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar / Photo */}
          <div className="flex-shrink-0">
            {editor.profile_photo_url ? (
              <img
                src={editor.profile_photo_url}
                alt={editor.full_name}
                className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-slate-100"
              />
            ) : (
              <div className={`w-20 h-20 bg-gradient-to-br ${editorColor(editor.full_name)} rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md`}>
                {editor.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{editor.full_name}</h3>
            {editor.academic_title && (
              <p className="text-teal-700 font-medium text-sm mt-0.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> {editor.academic_title}
              </p>
            )}

            <div className="mt-2 space-y-1">
              {editor.affiliation && (
                <p className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{editor.affiliation}</span>
                </p>
              )}
              {editor.country && (
                <p className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> {editor.country}
                </p>
              )}
              {editor.applicant_email && (
                <a href={`mailto:${editor.applicant_email}`} className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {editor.applicant_email}
                </a>
              )}
            </div>

            {/* Research interests */}
            {editor.research_interests?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {editor.research_interests.slice(0, 4).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Links */}
            <div className="mt-3 flex flex-wrap gap-2">
              {editor.orcid && <OrcidBadge orcid={editor.orcid} showVerified size="sm" />}
              {editor.google_scholar_url && (
                <a href={editor.google_scholar_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 hover:bg-blue-100 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Scholar
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Motivation snippet */}
        {editor.motivation && (
          <p className="mt-4 text-xs text-slate-500 italic border-t border-slate-100 pt-3 line-clamp-2">
            "{editor.motivation}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function EditorialBoardPage() {
  const [editors, setEditors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadEditors();
  }, []);

  const loadEditors = async () => {
    setIsLoading(true);
    const approved = await base44.entities.RoleApplication.filter(
      { role: 'editor', status: 'approved' },
      '-reviewed_date',
      200
    );
    setEditors(approved);
    setIsLoading(false);
  };

  const uniqueCountries = [...new Set(editors.map(e => e.country).filter(Boolean))].length;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      <SEO
        title="Editorial Board"
        description="Meet the distinguished international editorial board of AfriSci Nexus, committed to advancing African scientific research through rigorous peer review."
        canonicalPath="/Editorial"
      />
      {/* Hero */}
      <div className="text-center py-24 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <Users className="w-16 h-16 mx-auto mb-6 text-sky-200" />
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Editorial Board</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-sky-200">
          Meet our distinguished international team of editors committed to advancing African scientific research.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-14">
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-3 text-blue-200" />
              <p className="text-4xl font-bold mb-1">{isLoading ? '—' : editors.length}</p>
              <p className="text-sm text-blue-100">Active Editors</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Globe className="w-8 h-8 mx-auto mb-3 text-purple-200" />
              <p className="text-4xl font-bold mb-1">{isLoading ? '—' : uniqueCountries}</p>
              <p className="text-sm text-purple-100">Countries Represented</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-lg col-span-2 md:col-span-1">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-teal-200" />
              <p className="text-4xl font-bold mb-1">
                {isLoading ? '—' : [...new Set(editors.flatMap(e => e.research_interests || []))].length}
              </p>
              <p className="text-sm text-teal-100">Research Specialties</p>
            </CardContent>
          </Card>
        </div>

        {/* Editors Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : editors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editors.map(editor => (
              <EditorCard key={editor.id} editor={editor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No editors listed yet. Check back soon.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 text-center bg-white p-12 rounded-2xl shadow-xl border border-slate-200/60">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Join Our Editorial Team</h2>
          <p className="max-w-2xl mx-auto text-slate-600 mb-6">
            We are always looking for dedicated scholars to join our editorial board. If you're passionate about advancing African research, we'd love to hear from you.
          </p>
          {submitted ? (
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-8 py-4 rounded-xl font-semibold">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Application Submitted! We'll be in touch soon.
            </div>
          ) : (
            <Link to={createPageUrl("Apply?role=editor")}>
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                Apply to Join Editorial Board
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}