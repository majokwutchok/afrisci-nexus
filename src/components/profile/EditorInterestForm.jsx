import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function EditorInterestForm({ userProfile, onSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(userProfile?.editor_photo_url || '');
  const [formData, setFormData] = useState({
    editor_bio: userProfile?.editor_bio || '',
    editor_credentials: userProfile?.editor_credentials || '',
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      let photoUrl = userProfile?.editor_photo_url;

      // Upload photo if changed
      if (photoFile) {
        const uploadResponse = await base44.integrations.Core.UploadFile({
          file: photoFile
        });
        photoUrl = uploadResponse.file_url;
      }

      // Update user profile
      const updateData = {
        editor_interest: true,
        editor_bio: formData.editor_bio,
        editor_credentials: formData.editor_credentials,
        editor_photo_url: photoUrl,
        editor_status: userProfile?.editor_status === 'approved' ? 'approved' : 'pending',
        editor_application_date: userProfile?.editor_application_date || new Date().toISOString().split('T')[0]
      };

      await base44.auth.updateMe(updateData);

      setSuccessMessage('Your editor profile has been submitted for approval!');
      setIsEditing(false);
      setPhotoFile(null);
      onSuccess?.();
    } catch (err) {
      setError('Failed to save editor profile. Please try again.');
      console.error('Error:', err);
    }
    setIsSaving(false);
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Not Approved' }
  };

  const currentStatus = userProfile?.editor_status || 'pending';
  const status = statusConfig[currentStatus];
  const hasApplied = userProfile?.editor_interest;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Become an Editor</CardTitle>
              <CardDescription>
                {hasApplied ? 'Your editor profile' : 'Express your interest in editorial roles'}
              </CardDescription>
            </div>
          </div>
          {hasApplied && (
            <Badge className={`${status.color}`}>
              {status.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Status Alert */}
        {hasApplied && currentStatus === 'pending' && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Your application is under review by our admin team. You'll be notified once a decision is made.
            </AlertDescription>
          </Alert>
        )}

        {hasApplied && currentStatus === 'approved' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your editor profile is active. Journals can now see your profile and contact you.
            </AlertDescription>
          </Alert>
        )}

        {hasApplied && currentStatus === 'rejected' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Your application was not approved. You can update your profile and resubmit.
            </AlertDescription>
          </Alert>
        )}

        {/* View/Edit Mode */}
        {!isEditing && hasApplied ? (
          <div className="space-y-4">
            {/* Photo */}
            {photoPreview && (
              <div className="flex justify-center">
                <img
                  src={photoPreview}
                  alt="Editor profile"
                  className="w-32 h-32 rounded-lg object-cover border-4 border-purple-200"
                />
              </div>
            )}

            {/* Bio */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Professional Bio</p>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">{formData.editor_bio}</p>
            </div>

            {/* Credentials */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Credentials</p>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-lg whitespace-pre-wrap">{formData.editor_credentials}</p>
            </div>

            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="w-full"
            >
              Edit Profile
            </Button>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* Photo Upload */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                Professional Photo
              </label>
              <div className="flex items-center gap-4">
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-lg object-cover border-2 border-purple-200"
                  />
                )}
                <label className="relative">
                  <Button type="button" variant="outline" className="cursor-pointer">
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">JPG, PNG up to 5MB. 200x200px recommended.</p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="editor_bio" className="text-sm font-semibold text-slate-700 mb-2 block">
                Professional Bio
              </label>
              <Textarea
                id="editor_bio"
                name="editor_bio"
                value={formData.editor_bio}
                onChange={handleInputChange}
                placeholder="Write a brief professional bio highlighting your expertise and interest in editorial roles..."
                rows={4}
                required
              />
              <p className="text-xs text-slate-500 mt-1">250-500 characters recommended</p>
            </div>

            {/* Credentials */}
            <div>
              <label htmlFor="editor_credentials" className="text-sm font-semibold text-slate-700 mb-2 block">
                Academic Credentials & Qualifications
              </label>
              <Textarea
                id="editor_credentials"
                name="editor_credentials"
                value={formData.editor_credentials}
                onChange={handleInputChange}
                placeholder="List your degrees, certifications, awards, and professional achievements..."
                rows={4}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Include your highest degree, professional titles, and relevant achievements</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Approval'
                )}
              </Button>
              {hasApplied && (
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}

        {/* CTA for New Users */}
        {!hasApplied && !isEditing && (
          <div className="text-center py-6 border-t">
            <p className="text-slate-600 mb-4">
              Join our editorial team and help shape the future of African scientific research
            </p>
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Express Interest
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}