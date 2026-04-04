import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Download, BookOpen, Eye, TrendingUp, CheckCheck, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeConfig = {
  download_milestone: { icon: Download, color: 'bg-teal-100 text-teal-700', badge: 'bg-teal-100 text-teal-800' },
  citation_milestone: { icon: BookOpen, color: 'bg-purple-100 text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  view_milestone:     { icon: Eye,      color: 'bg-blue-100 text-blue-700',   badge: 'bg-blue-100 text-blue-800' },
  trending:           { icon: TrendingUp, color: 'bg-rose-100 text-rose-700', badge: 'bg-rose-100 text-rose-800' },
};

const typeLabel = {
  download_milestone: 'Downloads',
  citation_milestone: 'Citations',
  view_milestone:     'Views',
  trending:           'Trending',
};

export default function PerformanceNotifications({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    loadNotifications();
  }, [userEmail]);

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await base44.entities.PerformanceNotification.filter(
      { author_email: userEmail },
      '-created_date',
      50
    );
    setNotifications(data);
    setIsLoading(false);
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n =>
      base44.entities.PerformanceNotification.update(n.id, { is_read: true })
    ));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id) => {
    await base44.entities.PerformanceNotification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayed = showAll ? notifications : notifications.slice(0, 5);

  if (isLoading) return null;

  if (notifications.length === 0) {
    return (
      <Card className="border-0 bg-white/80 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-teal-600" />
            Performance Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications yet — milestones will appear here as your articles gain traction.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-teal-600" />
            Performance Notifications
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white text-xs px-2">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs gap-1 text-slate-500">
              <CheckCheck className="w-3 h-3" /> Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayed.map(notif => {
          const cfg = typeConfig[notif.type] || typeConfig.view_milestone;
          const Icon = cfg.icon;
          return (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markRead(notif.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                notif.is_read
                  ? 'bg-slate-50 border-slate-100 opacity-70'
                  : 'bg-white border-slate-200 shadow-sm hover:border-teal-200'
              }`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-semibold text-sm text-slate-900">{notif.title}</span>
                  <Badge className={`text-xs ${cfg.badge}`}>{typeLabel[notif.type]}</Badge>
                  {!notif.is_read && <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })}
                  </span>
                  <Link
                    to={createPageUrl(`ManuscriptDetail?id=${notif.manuscript_id}`)}
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-teal-600 hover:underline flex items-center gap-1"
                  >
                    View article <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {notifications.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-500 text-xs"
            onClick={() => setShowAll(s => !s)}
          >
            {showAll ? 'Show fewer' : `Show all ${notifications.length} notifications`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}