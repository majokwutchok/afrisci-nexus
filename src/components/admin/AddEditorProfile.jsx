import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';

const EMPTY_FORM = {
  full_name: '',
  applicant_email: '',
  academic_title: '',
  affiliation: '',
  country: '',
  research_interests: '',
  profile_photo_url: '',
  orcid: '',
  google_scholar_url: '',
  motivation: '',
};

export default function AddEditorProfile({ onAdded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.RoleApplication.create({
      role: 'editor',
      status: 'approved',
      applicant_email: form.applicant_email,
      full_name: form.full_name,
      academic_title: form.academic_title,
      affiliation: form.affiliation,
      country: form.country,
      research_interests: form.research_interests.split(',').map(s => s.trim()).filter(Boolean),
      profile_photo_url: form.profile_photo_url,
      orcid: form.orcid,
      google_scholar_url: form.google_scholar_url,
      motivation: form.motivation,
      reviewed_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    setSuccess(true);
    setForm(EMPTY_FORM);
    onAdded?.();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-amber-600" />
          Add Editor Profile
        </CardTitle>
        <p className="text-sm text-slate-500">Manually add an editor — they'll appear instantly on the public Editorial Board page.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Full name *" value={form.full_name} onChange={handleChange('full_name')} required />
          <Input type="email" placeholder="Email *" value={form.applicant_email} onChange={handleChange('applicant_email')} required />
          <Input placeholder="Academic title (e.g. Professor)" value={form.academic_title} onChange={handleChange('academic_title')} />
          <Input placeholder="Affiliation / Institution *" value={form.affiliation} onChange={handleChange('affiliation')} required />
          <Input placeholder="Country *" value={form.country} onChange={handleChange('country')} required />
          <Input placeholder="ORCID (optional)" value={form.orcid} onChange={handleChange('orcid')} />
          <Input placeholder="Profile photo URL (optional)" value={form.profile_photo_url} onChange={handleChange('profile_photo_url')} />
          <Input placeholder="Google Scholar URL (optional)" value={form.google_scholar_url} onChange={handleChange('google_scholar_url')} />
          <Input
            className="md:col-span-2"
            placeholder="Research specialties, comma separated (e.g. Public Health, Genomics)"
            value={form.research_interests}
            onChange={handleChange('research_interests')}
          />
          <Textarea
            className="md:col-span-2"
            placeholder="Short bio / motivation (optional)"
            value={form.motivation}
            onChange={handleChange('motivation')}
          />
          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><UserPlus className="w-4 h-4 mr-2" />Add Editor</>}
            </Button>
            {success && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
                <CheckCircle className="w-4 h-4" /> Editor added and published to Editorial Board
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}