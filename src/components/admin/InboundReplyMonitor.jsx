import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MailOpen, RefreshCw, CheckCircle, Loader2, MessageSquare,
  ThumbsUp, ThumbsDown, Clock, BellOff, UserMinus, Sparkles,
  AlertCircle, User, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";

const SENTIMENT_CONFIG = {
  interested: {
    label: "Interested",
    color: "bg-green-100 text-green-800 border-green-200",
    headerColor: "border-l-green-500",
    icon: ThumbsUp,
    iconColor: "text-green-600",
    dot: "bg-green-500"
  },
  not_interested: {
    label: "Not Interested",
    color: "bg-red-100 text-red-700 border-red-200",
    headerColor: "border-l-red-400",
    icon: ThumbsDown,
    iconColor: "text-red-500",
    dot: "bg-red-400"
  },
  needs_follow_up: {
    label: "Needs Follow-up",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    headerColor: "border-l-amber-400",
    icon: Clock,
    iconColor: "text-amber-500",
    dot: "bg-amber-400"
  },
  auto_reply: {
    label: "Auto-Reply",
    color: "bg-slate-100 text-slate-500 border-slate-200",
    headerColor: "border-l-slate-300",
    icon: BellOff,
    iconColor: "text-slate-400",
    dot: "bg-slate-400"
  },
  unsubscribe_request: {
    label: "Unsubscribe",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    headerColor: "border-l-orange-400",
    icon: UserMinus,
    iconColor: "text-orange-500",
    dot: "bg-orange-400"
  }
};

function ReplyCard({ reply, onMarkActioned }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SENTIMENT_CONFIG[reply.sentiment] || SENTIMENT_CONFIG.needs_follow_up;
  const SentimentIcon = cfg.icon;

  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${cfg.headerColor} rounded-xl overflow-hidden transition-all hover:shadow-sm ${reply.is_actioned ? "opacity-60" : ""}`}>
      <div className="p-5">
        <div className="flex items-start gap-4 justify-between flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(reply.sender_name || reply.sender_email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{reply.sender_name || reply.sender_email}</p>
                <p className="text-xs text-slate-500">{reply.sender_email}</p>
              </div>
              <Badge className={`text-xs border ${cfg.color} flex items-center gap-1`}>
                <SentimentIcon className="w-3 h-3" /> {cfg.label}
              </Badge>
              {reply.is_actioned && <Badge className="text-xs bg-slate-100 text-slate-500">✓ Actioned</Badge>}
              {!reply.is_actioned && reply.sentiment !== 'auto_reply' && (
                <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
              )}
            </div>

            <p className="text-sm text-slate-700 font-medium mb-1">📧 Re: {reply.subject}</p>

            {/* AI summary */}
            {reply.summary && (
              <p className="text-sm text-slate-600 flex items-start gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
                {reply.summary}
              </p>
            )}

            {/* Key quote */}
            {reply.key_quote && (
              <blockquote className="border-l-2 border-slate-300 pl-3 text-xs text-slate-500 italic mb-2">
                "{reply.key_quote}"
              </blockquote>
            )}

            {/* Suggested action */}
            {reply.suggested_action && (
              <div className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5 text-xs text-violet-700">
                <AlertCircle className="w-3 h-3" /> <strong>Next:</strong> {reply.suggested_action}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <><ChevronDown className="w-3.5 h-3.5 mr-1" /> Preview</>}
            </Button>
            {!reply.is_actioned && reply.sentiment !== 'auto_reply' && (
              <Button size="sm" className="h-8 text-xs bg-slate-700 hover:bg-slate-800 text-white" onClick={() => onMarkActioned(reply.id)}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Done
              </Button>
            )}
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {new Date(reply.created_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Body preview */}
      {expanded && reply.body_preview && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Email body preview</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{reply.body_preview}</p>
        </div>
      )}
    </div>
  );
}

export default function InboundReplyMonitor() {
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [hideActioned, setHideActioned] = useState(true);

  const loadReplies = useCallback(async () => {
    setIsLoading(true);
    const data = await base44.entities.InboundReply.list('-created_date', 200);
    setReplies(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadReplies(); }, [loadReplies]);

  const handleMarkActioned = async (id) => {
    await base44.entities.InboundReply.update(id, { is_actioned: true });
    setReplies(prev => prev.map(r => r.id === id ? { ...r, is_actioned: true } : r));
  };

  const handleMarkAllActioned = async () => {
    const unactioned = filtered.filter(r => !r.is_actioned);
    await Promise.all(unactioned.map(r => base44.entities.InboundReply.update(r.id, { is_actioned: true })));
    setReplies(prev => prev.map(r => ({ ...r, is_actioned: true })));
  };

  const counts = {
    all: replies.length,
    interested: replies.filter(r => r.sentiment === 'interested').length,
    needs_follow_up: replies.filter(r => r.sentiment === 'needs_follow_up').length,
    not_interested: replies.filter(r => r.sentiment === 'not_interested').length,
    auto_reply: replies.filter(r => r.sentiment === 'auto_reply').length,
    unsubscribe_request: replies.filter(r => r.sentiment === 'unsubscribe_request').length,
  };

  const unactionedCount = replies.filter(r => !r.is_actioned && r.sentiment !== 'auto_reply').length;

  let filtered = replies.filter(r =>
    (sentimentFilter === "all" || r.sentiment === sentimentFilter) &&
    (!hideActioned || !r.is_actioned)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center">
              <MailOpen className="w-6 h-6 text-white" />
            </div>
            {unactionedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unactionedCount > 9 ? "9+" : unactionedCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inbound Reply Monitor</h2>
            <p className="text-sm text-slate-500">Gmail replies auto-categorized by AI sentiment in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReplies}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        </div>
      </div>

      {/* Gmail automation status banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800 flex items-start gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
        <div>
          <strong>Live Gmail monitoring active</strong> — New replies to your outreach emails are automatically detected, classified by sentiment, and prospect statuses updated in real-time via Gmail webhook.
        </div>
      </div>

      {/* Sentiment summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: "interested", label: "Interested", color: "bg-green-50 border-green-200 text-green-800", dot: "bg-green-500" },
          { key: "needs_follow_up", label: "Follow-up", color: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-400" },
          { key: "not_interested", label: "Not Interested", color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-400" },
          { key: "unsubscribe_request", label: "Unsubscribe", color: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-400" },
          { key: "auto_reply", label: "Auto-Reply", color: "bg-slate-50 border-slate-200 text-slate-500", dot: "bg-slate-400" },
        ].map(s => (
          <button key={s.key} onClick={() => setSentimentFilter(sentimentFilter === s.key ? "all" : s.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${sentimentFilter === s.key ? s.color + " border-opacity-100 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs font-medium text-slate-600">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{counts[s.key]}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setHideActioned(!hideActioned)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${hideActioned ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
            <CheckCircle className="w-3.5 h-3.5" /> {hideActioned ? "Showing unactioned" : "Showing all"}
          </button>
          <span className="text-sm text-slate-500">{filtered.length} replies</span>
        </div>
        {unactionedCount > 0 && (
          <Button size="sm" variant="outline" className="text-xs" onClick={handleMarkAllActioned}>
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark All Done ({unactionedCount})
          </Button>
        )}
      </div>

      {/* Reply list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading replies...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <MailOpen className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No replies here yet</p>
          <p className="text-sm mt-1">
            {replies.length > 0 ? "All replies have been actioned." : "Gmail is being monitored — replies will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(reply => (
            <ReplyCard key={reply.id} reply={reply} onMarkActioned={handleMarkActioned} />
          ))}
        </div>
      )}
    </div>
  );
}