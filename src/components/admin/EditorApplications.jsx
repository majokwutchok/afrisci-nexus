import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, X, AlertCircle, Mail } from 'lucide-react';

export default function EditorApplications() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const allUsers = await base44.entities.User.list();
      const applicants = allUsers.filter(u => u.editor_interest);
      setUsers(applicants);
    } catch (err) {
      setError('Failed to load editor applications');
      console.error('Error:', err);
    }
    setIsLoading(false);
  };

  const handleApprove = async (userId) => {
    setProcessingId(userId);
    try {
      const user = users.find(u => u.id === userId);
      await base44.asServiceRole.entities.User.update(userId, { editor_status: 'approved' });

      // Send approval email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'You have been approved as an Editor - AfriSci Nexus',
        body: `Dear ${user.full_name},\n\nCongratulations! Your editor application has been approved. Your profile is now visible to journal editors who may invite you to serve on their editorial boards.\n\nBest regards,\nAfriSci Nexus Team`
      });

      setUsers(users.map(u => u.id === userId ? { ...u, editor_status: 'approved' } : u));
    } catch (err) {
      setError('Failed to approve application');
      console.error('Error:', err);
    }
    setProcessingId(null);
  };

  const handleReject = async (userId) => {
    setProcessingId(userId);
    try {
      const user = users.find(u => u.id === userId);
      await base44.asServiceRole.entities.User.update(userId, { editor_status: 'rejected' });

      // Send rejection email
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Editor Application Status - AfriSci Nexus',
        body: `Dear ${user.full_name},\n\nThank you for your interest in becoming an editor at AfriSci Nexus. After careful review, we are unable to approve your application at this time.\n\nYou are welcome to update your profile and reapply in the future.\n\nBest regards,\nAfriSci Nexus Team`
      });

      setUsers(users.map(u => u.id === userId ? { ...u, editor_status: 'rejected' } : u));
    } catch (err) {
      setError('Failed to reject application');
      console.error('Error:', err);
    }
    setProcessingId(null);
  };

  const pendingApplications = users.filter(u => u.editor_status === 'pending');
  const approvedEditors = users.filter(u => u.editor_status === 'approved');
  const rejectedApplications = users.filter(u => u.editor_status === 'rejected');

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
        <CardTitle>Editor Applications Management</CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {error && (
          <Alert className="bg-red-50 border-red-200 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedEditors.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedApplications.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Applications */}
          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length > 0 ? (
              pendingApplications.map(user => (
                <ApplicationCard
                  key={user.id}
                  user={user}
                  isProcessing={processingId === user.id}
                  onApprove={() => handleApprove(user.id)}
                  onReject={() => handleReject(user.id)}
                  onSelect={setSelectedUser}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No pending applications</p>
              </div>
            )}
          </TabsContent>

          {/* Approved Editors */}
          <TabsContent value="approved" className="space-y-4">
            {approvedEditors.length > 0 ? (
              approvedEditors.map(user => (
                <div key={user.id} className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  {user.editor_photo_url && (
                    <img
                      src={user.editor_photo_url}
                      alt={user.full_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{user.full_name}</h4>
                    <p className="text-sm text-slate-600">{user.academic_title} at {user.affiliation}</p>
                    <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                    <Badge className="bg-green-100 text-green-800 mt-2">Approved</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No approved editors yet</p>
              </div>
            )}
          </TabsContent>

          {/* Rejected Applications */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedApplications.length > 0 ? (
              rejectedApplications.map(user => (
                <div key={user.id} className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  {user.editor_photo_url && (
                    <img
                      src={user.editor_photo_url}
                      alt={user.full_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{user.full_name}</h4>
                    <p className="text-sm text-slate-600">{user.academic_title} at {user.affiliation}</p>
                    <Badge className="bg-red-100 text-red-800 mt-2">Not Approved</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No rejected applications</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ApplicationCard({ user, isProcessing, onApprove, onReject, onSelect }) {
  return (
    <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      {/* Photo */}
      {user.editor_photo_url && (
        <img
          src={user.editor_photo_url}
          alt={user.full_name}
          className="w-16 h-16 rounded-lg object-cover"
        />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-900 truncate">{user.full_name}</h4>
        <p className="text-sm text-slate-600">{user.academic_title}</p>
        <p className="text-sm text-slate-600">{user.affiliation}</p>
        <p className="text-xs text-slate-500 mt-1">{user.email}</p>

        {/* Bio Preview */}
        {user.editor_bio && (
          <p className="text-sm text-slate-700 mt-2 line-clamp-2 italic">"{user.editor_bio}"</p>
        )}

        {/* Research Interests */}
        {user.research_interests?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.research_interests.slice(0, 3).map(interest => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
            {user.research_interests.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{user.research_interests.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={onApprove}
          disabled={isProcessing}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Approve
            </>
          )}
        </Button>
        <Button
          onClick={onReject}
          disabled={isProcessing}
          size="sm"
          variant="destructive"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <X className="w-4 h-4 mr-1" />
              Reject
            </>
          )}
        </Button>
      </div>
    </div>
  );
}