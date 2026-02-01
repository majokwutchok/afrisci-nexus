import React, { useState, useEffect } from "react";
import { AutomatedReminder } from "@/entities/AutomatedReminder";
import { Manuscript } from "@/entities/Manuscript";
import { User } from "@/entities/User";
import { SendEmail } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Clock,
  Mail,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { format, addDays, isBefore } from "date-fns";

const reminderTemplates = {
  initial_invitation: {
    subject: "Invitation to Review: {manuscriptTitle}",
    body: `Dear {reviewerName},

You have been invited to review the following manuscript:

Title: {manuscriptTitle}
Authors: {authors}
Abstract: {abstract}

Please respond within 3 days to accept or decline this review invitation.

Best regards,
Editorial Team`
  },
  first_reminder: {
    subject: "Reminder: Review Invitation - {manuscriptTitle}",
    body: `Dear {reviewerName},

This is a friendly reminder about your pending review invitation for:

Title: {manuscriptTitle}

Please confirm your availability to review this manuscript.

Best regards,
Editorial Team`
  },
  second_reminder: {
    subject: "Final Reminder: Review Due - {manuscriptTitle}",
    body: `Dear {reviewerName},

Your review for the following manuscript is now overdue:

Title: {manuscriptTitle}
Original Due Date: {dueDate}

Please submit your review as soon as possible.

Best regards,
Editorial Team`
  },
  editor_alert: {
    subject: "Editor Alert: Overdue Review - {manuscriptTitle}",
    body: `Dear Editor,

The following manuscript has an overdue review:

Title: {manuscriptTitle}
Reviewer: {reviewerName}
Days Overdue: {daysOverdue}

Please consider reassigning this review.

Best regards,
Automated System`
  }
};

export default function AutomatedReminderSystem() {
  const [reminders, setReminders] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reminderData, manuscriptData, userData] = await Promise.all([
        AutomatedReminder.list(),
        Manuscript.list(),
        User.list()
      ]);
      setReminders(reminderData);
      setManuscripts(manuscriptData);
      setUsers(userData);
    } catch (error) {
      console.error("Error loading reminder data:", error);
    }
  };

  const scheduleReminders = async (manuscriptId, reviewerId, invitationDate) => {
    const reminderSchedule = [
      { type: 'first_reminder', days: 3 },
      { type: 'second_reminder', days: 10 },
      { type: 'editor_alert', days: 14 }
    ];

    for (const schedule of reminderSchedule) {
      await AutomatedReminder.create({
        manuscript_id: manuscriptId,
        reviewer_id: reviewerId,
        reminder_type: schedule.type,
        scheduled_date: addDays(new Date(invitationDate), schedule.days).toISOString().split('T')[0]
      });
    }
  };

  const processOverdueReminders = async () => {
    setIsProcessing(true);
    try {
      const overdueReminders = reminders.filter(r => 
        !r.sent && isBefore(new Date(r.scheduled_date), new Date())
      );

      for (const reminder of overdueReminders) {
        const manuscript = manuscripts.find(m => m.id === reminder.manuscript_id);
        const reviewer = users.find(u => u.id === reminder.reviewer_id);
        
        if (!manuscript || !reviewer) continue;

        const template = reminderTemplates[reminder.reminder_type];
        const emailBody = template.body
          .replace('{reviewerName}', reviewer.full_name)
          .replace('{manuscriptTitle}', manuscript.title)
          .replace('{authors}', manuscript.authors.map(a => a.name).join(', '))
          .replace('{abstract}', manuscript.abstract?.substring(0, 300) + '...')
          .replace('{dueDate}', reminder.scheduled_date);

        // Send email
        await SendEmail({
          to: reviewer.email,
          subject: template.subject.replace('{manuscriptTitle}', manuscript.title),
          body: emailBody
        });

        // Mark as sent
        await AutomatedReminder.update(reminder.id, {
          sent: true,
          sent_date: new Date().toISOString().split('T')[0]
        });

        // Update manuscript review history
        const updatedHistory = manuscript.review_history.map(r => 
          r.reviewer_id === reviewer.id 
            ? { ...r, reminder_count: (r.reminder_count || 0) + 1 }
            : r
        );
        await Manuscript.update(manuscript.id, { review_history: updatedHistory });
      }

      loadData();
    } catch (error) {
      console.error("Error processing reminders:", error);
    }
    setIsProcessing(false);
  };

  const pendingReminders = reminders.filter(r => !r.sent && isBefore(new Date(r.scheduled_date), new Date()));
  const sentReminders = reminders.filter(r => r.sent);

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Automated Reminder System
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-reminders"
                checked={isAutoEnabled}
                onCheckedChange={setIsAutoEnabled}
              />
              <Label htmlFor="auto-reminders">Auto-send reminders</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{pendingReminders.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Sent Today</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {sentReminders.filter(r => r.sent_date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Total Sent</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{sentReminders.length}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={processOverdueReminders}
              disabled={isProcessing || pendingReminders.length === 0}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {isProcessing ? "Processing..." : `Send ${pendingReminders.length} Overdue Reminders`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reminders */}
      {pendingReminders.length > 0 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Pending Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReminders.map((reminder) => {
                const manuscript = manuscripts.find(m => m.id === reminder.manuscript_id);
                const reviewer = users.find(u => u.id === reminder.reviewer_id);
                
                return (
                  <div key={reminder.id} className="p-4 border rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">
                        {manuscript?.title || 'Unknown Manuscript'}
                      </h4>
                      <Badge variant="outline">
                        {reminder.reminder_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Reviewer: {reviewer?.full_name || 'Unknown'}</p>
                      <p>Scheduled: {format(new Date(reminder.scheduled_date), 'MMM d, yyyy')}</p>
                      <p>Days overdue: {Math.max(0, Math.floor((new Date() - new Date(reminder.scheduled_date)) / (1000 * 60 * 60 * 24)))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}