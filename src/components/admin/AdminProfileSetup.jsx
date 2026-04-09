import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, User } from 'lucide-react';

export default function AdminProfileSetup() {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [profileData, setProfileData] = useState({
    admin_author_bio: '',
    admin_author_interests: '',
    admin_reviewer_expertise: '',
    admin_reviewer_max_reviews: '5',
    admin_editor_bio: '',
    admin_editor_journals: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const loadAdminProfile = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    if (user) {
      setAdminUser(user);
      setProfileData({
        admin_author_bio: user.admin_author_bio || '',
        admin_author_interests: user.admin_author_interests || '',
        admin_reviewer_expertise: user.admin_reviewer_expertise || '',
        admin_reviewer_max_reviews: user.admin_reviewer_max_reviews || '5',
        admin_editor_bio: user.admin_editor_bio || '',
        admin_editor_journals: user.admin_editor_journals || ''
      });
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async (role) => {
    setIsSaving(true);
    setErrorMessage('');
    const roleFieldMap = {
      author: ['admin_author_bio', 'admin_author_interests'],
      reviewer: ['admin_reviewer_expertise', 'admin_reviewer_max_reviews'],
      editor: ['admin_editor_bio', 'admin_editor_journals']
    };
    const fieldsToUpdate = roleFieldMap[role].reduce((acc, field) => ({
      ...acc,
      [field]: profileData[field],
      [`admin_${role}_enabled`]: true
    }), {});
    try {
      await base44.auth.updateMe(fieldsToUpdate);
      setSuccessMessage(`${role.charAt(0).toUpperCase() + role.slice(1)} profile saved!`);
      setActiveRole(null);
      loadAdminProfile();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(`Failed to save ${role} profile.`);
      console.error(err);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-teal-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admin Publication Profiles</h2>
          <p className="text-sm text-slate-500">Set up your author, reviewer, and editor profiles to publish and manage research directly.</p>
        </div>
      </div>

      {errorMessage && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Author Profile */}
        <Card className={`border-2 transition-all cursor-pointer ${activeRole === 'author' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}>
          <CardHeader onClick={() => setActiveRole(activeRole === 'author' ? null : 'author')}>
            <div className="flex items-center justify-between">
              <CardTitle>📝 Author Profile</CardTitle>
              {adminUser?.admin_author_enabled && <Badge className="bg-green-100 text-green-800">Active</Badge>}
            </div>
          </CardHeader>
          {activeRole === 'author' && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Author Bio</label>
                <Textarea
                  rows={3}
                  value={profileData.admin_author_bio}
                  onChange={e => setProfileData({ ...profileData, admin_author_bio: e.target.value })}
                  placeholder="Brief bio highlighting your research expertise..."
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Research Interests (comma-separated)</label>
                <Input
                  value={profileData.admin_author_interests}
                  onChange={e => setProfileData({ ...profileData, admin_author_interests: e.target.value })}
                  placeholder="Climate change, Public health, AI research..."
                />
              </div>
              <Button
                onClick={() => handleSaveProfile('author')}
                disabled={isSaving}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Author Profile'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Reviewer Profile */}
        <Card className={`border-2 transition-all cursor-pointer ${activeRole === 'reviewer' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
          <CardHeader onClick={() => setActiveRole(activeRole === 'reviewer' ? null : 'reviewer')}>
            <div className="flex items-center justify-between">
              <CardTitle>👁️ Reviewer Profile</CardTitle>
              {adminUser?.admin_reviewer_enabled && <Badge className="bg-blue-100 text-blue-800">Active</Badge>}
            </div>
          </CardHeader>
          {activeRole === 'reviewer' && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Review Expertise</label>
                <Textarea
                  rows={3}
                  value={profileData.admin_reviewer_expertise}
                  onChange={e => setProfileData({ ...profileData, admin_reviewer_expertise: e.target.value })}
                  placeholder="Your areas of expertise, review experience, methodologies..."
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Max Reviews Per Month</label>
                <Input
                  type="number"
                  value={profileData.admin_reviewer_max_reviews}
                  onChange={e => setProfileData({ ...profileData, admin_reviewer_max_reviews: e.target.value })}
                  min="1"
                  max="20"
                />
              </div>
              <Button
                onClick={() => handleSaveProfile('reviewer')}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Reviewer Profile'}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Editor Profile */}
        <Card className={`border-2 transition-all cursor-pointer ${activeRole === 'editor' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
          <CardHeader onClick={() => setActiveRole(activeRole === 'editor' ? null : 'editor')}>
            <div className="flex items-center justify-between">
              <CardTitle>✏️ Editor Profile</CardTitle>
              {adminUser?.admin_editor_enabled && <Badge className="bg-purple-100 text-purple-800">Active</Badge>}
            </div>
          </CardHeader>
          {activeRole === 'editor' && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Editor Bio</label>
                <Textarea
                  rows={3}
                  value={profileData.admin_editor_bio}
                  onChange={e => setProfileData({ ...profileData, admin_editor_bio: e.target.value })}
                  placeholder="Your editorial vision, experience, and leadership approach..."
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Journals You Edit (comma-separated)</label>
                <Input
                  value={profileData.admin_editor_journals}
                  onChange={e => setProfileData({ ...profileData, admin_editor_journals: e.target.value })}
                  placeholder="Journal names..."
                />
              </div>
              <Button
                onClick={() => handleSaveProfile('editor')}
                disabled={isSaving}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Editor Profile'}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}