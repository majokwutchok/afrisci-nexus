import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2, Upload, Plus, ChevronRight, ChevronLeft, Send } from 'lucide-react';

const DISCIPLINES = [
  'STEM & Engineering', 'Medicine & Health Sciences', 'Agriculture & Environment',
  'Social Sciences', 'Law & Policy', 'Arts & Humanities',
  'Business & Economics', 'Education & Pedagogy', 'Interdisciplinary'
];

const COUNTRIES = [
  'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Ethiopia', 'Egypt', 'Tanzania',
  'Uganda', 'Rwanda', 'Senegal', 'Côte d\'Ivoire', 'Cameroon', 'Zambia', 'Zimbabwe',
  'Botswana', 'Mozambique', 'Angola', 'Sudan', 'Morocco', 'Tunisia', 'Algeria',
  'Other African Country', 'Outside Africa'
];

const STEPS = [
  { id: 1, title: 'Personal Information' },
  { id: 2, title: 'Academic Profile' },
  { id: 3, title: 'Research Expertise' },
  { id: 4, title: 'Motivation & Experience' },
  { id: 5, title: 'Review & Submit' },
];

export default function EditorApplicationForm({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: '',
    academic_title: '',
    affiliation: '',
    department: '',
    years_experience: '',
    orcid: '',
    google_scholar_url: '',
    phd_institution: '',
    phd_year: '',
    publications_count: '',
    notable_publications: '',
    research_interests: [],
    preferred_disciplines: [],
    editor_bio: '',
    motivation_letter: '',
    previous_editorial_experience: '',
    languages: '',
    availability_hours_per_month: '',
    editor_photo_url: '',
    agree_terms: false,
    agree_code_of_conduct: false,
  });

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const addInterest = () => {
    const val = newInterest.trim();
    if (val && !form.research_interests.includes(val)) {
      update('research_interests', [...form.research_interests, val]);
      setNewInterest('');
    }
  };

  const removeInterest = (i) => update('research_interests', form.research_interests.filter(x => x !== i));

  const toggleDiscipline = (d) => {
    const list = form.preferred_disciplines.includes(d)
      ? form.preferred_disciplines.filter(x => x !== d)
      : [...form.preferred_disciplines, d];
    update('preferred_disciplines', list);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update('editor_photo_url', file_url);
    setUploadingPhoto(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await base44.auth.updateMe({
        ...form,
        editor_interest: true,
        editor_status: 'pending',
        editor_application_date: new Date().toISOString().split('T')[0],
      });
      await base44.integrations.Core.SendEmail({
        to: 'editorial@afriscinexus.org',
        subject: `New Editor Application: ${form.full_name}`,
        body: `A new editor application has been submitted by ${form.full_name} (${form.email}) from ${form.affiliation}.\n\nPlease review in the Admin Dashboard > Editor Applications.\n\nAfriSci Nexus Platform`
      });
      onSuccess?.();
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    }
    setIsSubmitting(false);
  };

  const canProceed = () => {
    if (step === 1) return form.full_name && form.email && form.country;
    if (step === 2) return form.academic_title && form.affiliation;
    if (step === 3) return form.research_interests.length > 0 && form.preferred_disciplines.length > 0;
    if (step === 4) return form.editor_bio && form.motivation_letter;
    if (step === 5) return form.agree_terms && form.agree_code_of_conduct;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <Card className="w-full max-w-2xl border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-900 to-teal-700 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Editor Application</CardTitle>
              <p className="text-blue-200 text-sm mt-1">AfriSci Nexus Editorial Board</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Progress */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              {STEPS.map(s => (
                <div key={s.id} className={`flex-1 text-center text-xs font-medium ${step >= s.id ? 'text-white' : 'text-blue-300'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold
                    ${step > s.id ? 'bg-teal-400 text-white' : step === s.id ? 'bg-white text-blue-900' : 'bg-blue-700 text-blue-300'}`}>
                    {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className="hidden sm:block">{s.title}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-blue-700 rounded-full h-1.5">
              <div className="bg-teal-400 h-1.5 rounded-full transition-all" style={{ width: `${((step - 1) / 4) * 100}%` }} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {error && (
            <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input className="mt-1" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Dr. Jane Doe" />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input className="mt-1" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="jane@university.edu" />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input className="mt-1" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+254 700 000 000" />
                </div>
                <div>
                  <Label>Country *</Label>
                  <Select value={form.country} onValueChange={v => update('country', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Profile Photo</Label>
                <div className="mt-1 flex items-center gap-4">
                  {form.editor_photo_url && (
                    <img src={form.editor_photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-teal-200" />
                  )}
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                    {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Academic Profile</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Academic Title *</Label>
                  <Select value={form.academic_title} onValueChange={v => update('academic_title', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select title" /></SelectTrigger>
                    <SelectContent>
                      {['Professor', 'Associate Professor', 'Assistant Professor', 'Senior Lecturer', 'Lecturer', 'Dr.', 'Researcher'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Institution / Affiliation *</Label>
                  <Input className="mt-1" value={form.affiliation} onChange={e => update('affiliation', e.target.value)} placeholder="University of Nairobi" />
                </div>
                <div>
                  <Label>Department / Faculty</Label>
                  <Input className="mt-1" value={form.department} onChange={e => update('department', e.target.value)} placeholder="Faculty of Science" />
                </div>
                <div>
                  <Label>Years of Academic Experience</Label>
                  <Select value={form.years_experience} onValueChange={v => update('years_experience', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      {['1-3 years', '4-7 years', '8-12 years', '13-20 years', '20+ years'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PhD Institution</Label>
                  <Input className="mt-1" value={form.phd_institution} onChange={e => update('phd_institution', e.target.value)} placeholder="University of Cape Town" />
                </div>
                <div>
                  <Label>PhD Year</Label>
                  <Input className="mt-1" value={form.phd_year} onChange={e => update('phd_year', e.target.value)} placeholder="e.g. 2015" />
                </div>
                <div>
                  <Label>Number of Publications</Label>
                  <Input className="mt-1" type="number" value={form.publications_count} onChange={e => update('publications_count', e.target.value)} placeholder="e.g. 25" />
                </div>
                <div>
                  <Label>ORCID ID</Label>
                  <Input className="mt-1" value={form.orcid} onChange={e => update('orcid', e.target.value)} placeholder="0000-0000-0000-0000" />
                </div>
              </div>
              <div>
                <Label>Google Scholar / ResearchGate URL</Label>
                <Input className="mt-1" value={form.google_scholar_url} onChange={e => update('google_scholar_url', e.target.value)} placeholder="https://scholar.google.com/..." />
              </div>
              <div>
                <Label>Notable Publications (list up to 3)</Label>
                <Textarea className="mt-1" rows={3} value={form.notable_publications} onChange={e => update('notable_publications', e.target.value)} placeholder="1. Author(s), Title, Journal, Year&#10;2. ..." />
              </div>
            </div>
          )}

          {/* Step 3: Research Expertise */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Research Expertise</h3>
              <div>
                <Label>Research Interests & Keywords * <span className="text-slate-400 text-xs">(press Enter or Add)</span></Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newInterest}
                    onChange={e => setNewInterest(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    placeholder="e.g. Malaria epidemiology"
                  />
                  <Button type="button" onClick={addInterest} variant="outline"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.research_interests.map(i => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {i}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeInterest(i)} />
                    </Badge>
                  ))}
                  {form.research_interests.length === 0 && <p className="text-sm text-slate-400">No interests added yet</p>}
                </div>
              </div>
              <div>
                <Label>Preferred Disciplines to Edit * <span className="text-slate-400 text-xs">(select all that apply)</span></Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DISCIPLINES.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiscipline(d)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        form.preferred_disciplines.includes(d)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Languages you can review in</Label>
                <Input className="mt-1" value={form.languages} onChange={e => update('languages', e.target.value)} placeholder="e.g. English, French, Swahili" />
              </div>
              <div>
                <Label>Availability (hours/month for editorial work)</Label>
                <Select value={form.availability_hours_per_month} onValueChange={v => update('availability_hours_per_month', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select availability" /></SelectTrigger>
                  <SelectContent>
                    {['2-5 hours', '5-10 hours', '10-20 hours', '20+ hours'].map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Motivation */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Motivation & Experience</h3>
              <div>
                <Label>Short Bio * <span className="text-slate-400 text-xs">(will appear publicly on editorial board page)</span></Label>
                <Textarea className="mt-1" rows={3} value={form.editor_bio} onChange={e => update('editor_bio', e.target.value)} placeholder="A brief professional biography describing your research background and expertise..." />
              </div>
              <div>
                <Label>Motivation Letter * <span className="text-slate-400 text-xs">(why do you want to join the editorial board?)</span></Label>
                <Textarea className="mt-1" rows={5} value={form.motivation_letter} onChange={e => update('motivation_letter', e.target.value)} placeholder="Describe your motivation for joining AfriSci Nexus editorial board, how you can contribute to advancing African science, and any specific goals you have as an editor..." />
              </div>
              <div>
                <Label>Previous Editorial / Peer Review Experience</Label>
                <Textarea className="mt-1" rows={3} value={form.previous_editorial_experience} onChange={e => update('previous_editorial_experience', e.target.value)} placeholder="List any journals you've reviewed for, editorial board memberships, or relevant experience..." />
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Review & Submit</h3>
              <div className="space-y-3 bg-slate-50 rounded-xl p-4 text-sm">
                <div className="grid sm:grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Name:</span> <span className="font-medium">{form.full_name}</span></div>
                  <div><span className="text-slate-500">Email:</span> <span className="font-medium">{form.email}</span></div>
                  <div><span className="text-slate-500">Title:</span> <span className="font-medium">{form.academic_title}</span></div>
                  <div><span className="text-slate-500">Institution:</span> <span className="font-medium">{form.affiliation}</span></div>
                  <div><span className="text-slate-500">Country:</span> <span className="font-medium">{form.country}</span></div>
                  <div><span className="text-slate-500">Experience:</span> <span className="font-medium">{form.years_experience}</span></div>
                  <div><span className="text-slate-500">Publications:</span> <span className="font-medium">{form.publications_count || 'Not specified'}</span></div>
                  <div><span className="text-slate-500">Availability:</span> <span className="font-medium">{form.availability_hours_per_month || 'Not specified'}</span></div>
                </div>
                <div>
                  <span className="text-slate-500">Disciplines: </span>
                  {form.preferred_disciplines.map(d => <Badge key={d} variant="secondary" className="mr-1 text-xs">{d}</Badge>)}
                </div>
                <div>
                  <span className="text-slate-500">Expertise: </span>
                  {form.research_interests.map(i => <Badge key={i} variant="outline" className="mr-1 text-xs">{i}</Badge>)}
                </div>
              </div>

              <div className="space-y-3 border border-slate-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={form.agree_terms} onChange={e => update('agree_terms', e.target.checked)} />
                  <span className="text-sm text-slate-700">I confirm that all information provided in this application is accurate and truthful. I understand that false information will disqualify my application.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={form.agree_code_of_conduct} onChange={e => update('agree_code_of_conduct', e.target.checked)} />
                  <span className="text-sm text-slate-700">I agree to abide by AfriSci Nexus's Code of Conduct, editorial policies, and maintain confidentiality of the peer review process.</span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
              {step === 1 ? 'Cancel' : <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>}
            </Button>
            {step < 5 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-teal-600 to-emerald-700"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-gradient-to-r from-teal-600 to-emerald-700"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Application
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}