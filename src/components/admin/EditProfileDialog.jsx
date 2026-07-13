import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import PhotoCaptureInput from './PhotoCaptureInput';

export default function EditProfileDialog({ app, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (app) {
      setForm({
        full_name: app.full_name || '',
        academic_title: app.academic_title || '',
        affiliation: app.affiliation || '',
        country: app.country || '',
        research_interests: (app.research_interests || []).join(', '),
        profile_photo_url: app.profile_photo_url || '',
        orcid: app.orcid || '',
        google_scholar_url: app.google_scholar_url || '',
        facebook_url: app.facebook_url || '',
        linkedin_url: app.linkedin_url || '',
        x_url: app.x_url || '',
        motivation: app.motivation || '',
      });
    }
  }, [app]);

  if (!form) return null;

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.RoleApplication.update(app.id, {
      full_name: form.full_name,
      academic_title: form.academic_title,
      affiliation: form.affiliation,
      country: form.country,
      research_interests: form.research_interests.split(',').map(s => s.trim()).filter(Boolean),
      profile_photo_url: form.profile_photo_url,
      orcid: form.orcid,
      google_scholar_url: form.google_scholar_url,
      facebook_url: form.facebook_url,
      linkedin_url: form.linkedin_url,
      x_url: form.x_url,
      motivation: form.motivation,
    });
    setSaving(false);
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {app.role === 'editor' ? 'Editor' : 'Reviewer'} Profile</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Full name" value={form.full_name} onChange={handleChange('full_name')} />
          <Input placeholder="Academic title" value={form.academic_title} onChange={handleChange('academic_title')} />
          <Input placeholder="Affiliation / Institution" value={form.affiliation} onChange={handleChange('affiliation')} />
          <Input placeholder="Country" value={form.country} onChange={handleChange('country')} />
          <Input placeholder="ORCID" value={form.orcid} onChange={handleChange('orcid')} />
          <Input placeholder="Google Scholar URL" value={form.google_scholar_url} onChange={handleChange('google_scholar_url')} />
          <Input placeholder="Facebook URL" value={form.facebook_url} onChange={handleChange('facebook_url')} />
          <Input placeholder="LinkedIn URL" value={form.linkedin_url} onChange={handleChange('linkedin_url')} />
          <Input placeholder="X (Twitter) URL" value={form.x_url} onChange={handleChange('x_url')} />
          <PhotoCaptureInput
            value={form.profile_photo_url}
            onChange={(dataUrl) => setForm(f => ({ ...f, profile_photo_url: dataUrl }))}
          />
          <Input
            className="md:col-span-2"
            placeholder="Research specialties, comma separated"
            value={form.research_interests}
            onChange={handleChange('research_interests')}
          />
          <Textarea
            className="md:col-span-2"
            placeholder="Short bio / motivation"
            value={form.motivation}
            onChange={handleChange('motivation')}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}