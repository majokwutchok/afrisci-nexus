import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Journal } from '@/entities/Journal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Globe, Award, BookOpen, Users as UsersIcon } from 'lucide-react';

const EditorCard = ({ editor, journals }) => {
  const editorJournals = journals.filter(j => editor.editor_roles?.includes(j.id));
  
  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {editor.full_name?.charAt(0) || 'E'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{editor.full_name}</h3>
            <p className="text-teal-700 font-medium mb-2">{editor.academic_title || 'Editor'}</p>
            
            <div className="space-y-2 mb-4">
              {editor.affiliation && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>{editor.affiliation}</span>
                </div>
              )}
              {editor.country && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>{editor.country}</span>
                </div>
              )}
              {editor.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${editor.email}`} className="hover:text-teal-600 transition-colors">
                    {editor.email}
                  </a>
                </div>
              )}
            </div>

            {editor.research_interests && editor.research_interests.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">Research Interests:</p>
                <div className="flex flex-wrap gap-2">
                  {editor.research_interests.map((interest, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {editorJournals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Editor for:</p>
                <div className="flex flex-wrap gap-2">
                  {editorJournals.map((journal) => (
                    <Badge key={journal.id} className="bg-emerald-100 text-emerald-800 text-xs">
                      {journal.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function EditorialBoardPage() {
  const [editors, setEditors] = useState([]);
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEditorialBoard();
  }, []);

  const loadEditorialBoard = async () => {
    setIsLoading(true);
    try {
      const [allUsers, allJournals] = await Promise.all([
        User.list(),
        Journal.list()
      ]);
      
      // Filter users who are editors (have editor_roles or are admin)
      const editorialMembers = allUsers.filter(
        u => (u.editor_roles && u.editor_roles.length > 0) || u.role === 'admin'
      );
      
      setEditors(editorialMembers);
      setJournals(allJournals);
    } catch (error) {
      console.error("Error loading editorial board:", error);
    }
    setIsLoading(false);
  };

  const editorInChiefs = editors.filter(e => 
    journals.some(j => j.editor_in_chief === e.full_name)
  );
  
  const associateEditors = editors.filter(e => 
    !journals.some(j => j.editor_in_chief === e.full_name) && e.editor_roles?.length > 0
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-24 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <UsersIcon className="w-16 h-16 mx-auto mb-6 text-sky-200" />
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Editorial Board</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-sky-200">
          Meet our distinguished international team of editors committed to advancing African scientific research.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-3 text-blue-200" />
              <p className="text-4xl font-bold mb-1">{editors.length}</p>
              <p className="text-sm text-blue-100">Total Editors</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-emerald-200" />
              <p className="text-4xl font-bold mb-1">{journals.length}</p>
              <p className="text-sm text-emerald-100">Journals Managed</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <Globe className="w-8 h-8 mx-auto mb-3 text-purple-200" />
              <p className="text-4xl font-bold mb-1">{[...new Set(editors.map(e => e.country))].filter(Boolean).length}</p>
              <p className="text-sm text-purple-100">Countries Represented</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <CardContent className="p-6 text-center">
              <UsersIcon className="w-8 h-8 mx-auto mb-3 text-amber-200" />
              <p className="text-4xl font-bold mb-1">{editorInChiefs.length}</p>
              <p className="text-sm text-amber-100">Editors-in-Chief</p>
            </CardContent>
          </Card>
        </div>

        {/* Editors-in-Chief Section */}
        <div className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Editors-in-Chief</h2>
            <p className="text-slate-600">Leading our journals with excellence and integrity</p>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i} className="border-0 bg-white/80">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : editorInChiefs.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {editorInChiefs.map((editor) => (
                <EditorCard key={editor.id} editor={editor} journals={journals} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No editors-in-chief information available yet.</p>
          )}
        </div>

        {/* Associate Editors Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Associate Editors</h2>
            <p className="text-slate-600">Expert scholars supporting our peer review process</p>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="border-0 bg-white/80">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : associateEditors.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {associateEditors.map((editor) => (
                <EditorCard key={editor.id} editor={editor} journals={journals} />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No associate editors information available yet.</p>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center bg-white p-12 rounded-2xl shadow-xl border border-slate-200/60">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Join Our Editorial Team</h2>
          <p className="max-w-2xl mx-auto text-slate-600 mb-6">
            We are always looking for dedicated scholars to join our editorial board. If you're passionate about advancing African research and maintaining the highest standards of peer review, we'd love to hear from you.
          </p>
          <a href="mailto:editorial@afriscinexus.org" className="inline-block bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300">
            Express Your Interest
          </a>
        </div>
      </div>
    </div>
  );
}