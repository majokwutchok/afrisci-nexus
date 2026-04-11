import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { sendPersonalizedEmail } from "@/functions/sendPersonalizedEmail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Send, Eye, CheckCircle, Loader2, ChevronDown, ChevronUp,
  Linkedin, BookOpen, Edit3, Trash2, RefreshCw, MailCheck, MailOpen,
  AlertCircle, User, Building2, Globe, Filter, Zap, Brain
} from "lucide-react";

const GOALS = [
  { value: "partnership_proposal", label: "Partnership Proposal", color: "bg-teal-100 text-teal-800", icon: "🤝" },
  { value: "call_for_submissions", label: "Call for Submissions", color: "bg-blue-100 text-blue-800", icon: "📄" },
  { value: "reviewer_recruitment", label: "Reviewer Recruitment", color: "bg-purple-100 text-purple-800", icon: "🔍" },
  { value: "general_outreach", label: "General Outreach", color: "bg-slate-100 text-slate-700", icon: "💬" },
];

const STATUS_CONFIG = {
  draft:    { color: "bg-slate-100 text-slate-600",   label: "Draft",    icon: Edit3 },
  approved: { color: "bg-amber-100 text-amber-700",   label: "Approved", icon: CheckCircle },
  sent:     { color: "bg-green-100 text-green-700",   label: "Sent",     icon: MailCheck },
  bounced:  { color: "bg-red-100 text-red-700",       label: "Bounced",  icon: AlertCircle },
  replied:  { color: "bg-indigo-100 text-indigo-700", label: "Replied",  icon: MailOpen },
};

const AFRICAN_COUNTRIES = [
  "","Nigeria","Kenya","South Africa","Ghana","Ethiopia","Tanzania","Uganda","Rwanda",
  "Senegal","Cameroon","Ivory Coast","Zambia","Zimbabwe","Mozambique","Angola","Sudan",
  "Egypt","Morocco","Algeria","Tunisia","Botswana","Namibia","Malawi"
].sort();

const INSTITUTION_TYPES = [
  { value: "", label: "All Types" },
  { value: "university", label: "Universities" },
  { value: "hospital", label: "Hospitals" },
  { value: "research_institute", label: "Research Institutes" },
  { value: "ngo", label: "NGOs" },
  { value: "government", label: "Government" },
  { value: "professional_association", label: "Associations" },
];

function OutreachCard({ outreach, onApprove, onSend, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[outreach.status] || STATUS_CONFIG.draft;
  const goal = GOALS.find(g => g.value === outreach.campaign_goal) || GOALS[0];

  return (
    <div className="border border-slate-200 rounded-xl bg-white hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Prospect info */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(outreach.prospect_name || outreach.prospect_email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-tight">{outreach.prospect_name || "—"}</p>
                <p className="text-xs text-slate-500">{outreach.institution}</p>
              </div>
              <Badge className={`text-xs ${goal.color}`}>{goal.icon} {goal.label}</Badge>
              <Badge className={`text-xs ${statusCfg.color}`}>{outreach.status}</Badge>
              {outreach.linkedin_url && <Badge className="text-xs bg-blue-100 text-blue-700">🔗 LinkedIn</Badge>}
            </div>

            {/* Subject line */}
            <p className="text-sm font-medium text-slate-800 mt-2 mb-1">📧 {outreach.subject}</p>

            {/* Personalization signals */}
            {outreach.personalization_signals?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {outreach.personalization_signals.map((sig, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-2 py-0.5 text-xs">
                    <Sparkles className="w-2.5 h-2.5" /> {sig}
                  </span>
                ))}
              </div>
            )}

            {/* AI reasoning */}
            {outreach.ai_reasoning && (
              <p className="text-xs text-slate-500 mt-2 italic flex items-start gap-1">
                <Brain className="w-3 h-3 mt-0.5 flex-shrink-0 text-violet-400" /> {outreach.ai_reasoning}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
              {expanded ? "" : "Preview"}
            </Button>
            {outreach.status === "draft" && (
              <>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onEdit(outreach)}>
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={() => onApprove(outreach.id)}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
              </>
            )}
            {outreach.status === "approved" && (
              <Button size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white" onClick={() => onSend(outreach.id)}>
                <Send className="w-3.5 h-3.5 mr-1" /> Send
              </Button>
            )}
            {outreach.linkedin_url && (
              <a href={outreach.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-8 text-xs text-blue-700">
                  <Linkedin className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
            <Button size="sm" variant="ghost" className="h-8 text-red-400 hover:text-red-600" onClick={() => onDelete(outreach.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Email preview panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 rounded-b-xl overflow-hidden">
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 text-xs text-slate-500">
            <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-amber-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
            To: {outreach.prospect_email} · Subject: {outreach.subject}
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: outreach.body_html }} />
          </div>
        </div>
      )}
    </div>
  );
}

function EditModal({ outreach, onSave, onClose }) {
  const [subject, setSubject] = useState(outreach.subject);
  const [bodyHtml, setBodyHtml] = useState(outreach.body_html);

  const save = async () => {
    await base44.entities.PersonalizedOutreach.update(outreach.id, { subject, body_html: bodyHtml });
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Edit Personalized Email — {outreach.prospect_name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject Line</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Body (HTML)</label>
            <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)} rows={18}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-300" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-200">
          <Button onClick={save} className="bg-teal-600 hover:bg-teal-700 text-white px-8">Save Changes</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

export default function PersonalizedOutreachEngine() {
  const [activeTab, setActiveTab] = useState("generate");
  const [outreaches, setOutreaches] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [isLoadingOutreaches, setIsLoadingOutreaches] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editingOutreach, setEditingOutreach] = useState(null);

  // Filters
  const [filterCountry, setFilterCountry] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("partnership_proposal");
  const [selectedProspects, setSelectedProspects] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadProspects = useCallback(async () => {
    setIsLoadingProspects(true);
    const filter = { campaign_status: "new" };
    if (filterCountry) filter.country = filterCountry;
    if (filterType) filter.institution_type = filterType;
    const data = await base44.entities.ProspectEmail.filter(filter, '-created_date', 200);
    // Prioritise prospects with LinkedIn profiles
    const sorted = [...data.filter(p => p.linkedin_url && p.contact_name), ...data.filter(p => !p.linkedin_url || !p.contact_name)];
    setProspects(sorted);
    setSelectedProspects([]);
    setIsLoadingProspects(false);
  }, [filterCountry, filterType]);

  const loadOutreaches = useCallback(async () => {
    setIsLoadingOutreaches(true);
    const data = await base44.entities.PersonalizedOutreach.list('-created_date', 200);
    setOutreaches(data);
    setIsLoadingOutreaches(false);
  }, []);

  useEffect(() => { loadProspects(); }, [loadProspects]);
  useEffect(() => { if (activeTab === "review") loadOutreaches(); }, [activeTab, loadOutreaches]);

  const toggleProspect = (id) => setSelectedProspects(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleGenerate = async () => {
    if (!selectedProspects.length) return;
    setIsGenerating(true);
    setResult(null);
    setError(null);
    const res = await sendPersonalizedEmail({ action: "generate", prospect_ids: selectedProspects, goal: selectedGoal })
      .catch(e => ({ error: e.message }));
    if (res.error) setError(res.error);
    else { setResult(res); setActiveTab("review"); loadOutreaches(); }
    setIsGenerating(false);
  };

  const handleApprove = async (id) => {
    await base44.entities.PersonalizedOutreach.update(id, { status: "approved" });
    setOutreaches(prev => prev.map(o => o.id === id ? { ...o, status: "approved" } : o));
  };

  const handleApproveAll = async () => {
    const drafts = outreaches.filter(o => o.status === "draft");
    await Promise.all(drafts.map(o => base44.entities.PersonalizedOutreach.update(o.id, { status: "approved" })));
    setOutreaches(prev => prev.map(o => o.status === "draft" ? { ...o, status: "approved" } : o));
  };

  const handleSend = async (id) => {
    setSendingId(id);
    const res = await sendPersonalizedEmail({ action: "send", outreach_id: id }).catch(e => ({ error: e.message }));
    setSendingId(null);
    if (res.error) alert("Error: " + res.error);
    else setOutreaches(prev => prev.map(o => o.id === id ? { ...o, status: "sent" } : o));
  };

  const handleSendAllApproved = async () => {
    setIsSendingAll(true);
    const res = await sendPersonalizedEmail({ action: "send_all_approved" }).catch(e => ({ error: e.message }));
    setIsSendingAll(false);
    if (res.error) alert("Error: " + res.error);
    else { alert(`✅ Sent ${res.sent} emails. ${res.errors} errors.`); loadOutreaches(); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this outreach draft?")) return;
    await base44.entities.PersonalizedOutreach.delete(id);
    setOutreaches(prev => prev.filter(o => o.id !== id));
  };

  const filteredOutreaches = outreaches.filter(o => statusFilter === "all" || o.status === statusFilter);
  const draftCount = outreaches.filter(o => o.status === "draft").length;
  const approvedCount = outreaches.filter(o => o.status === "approved").length;
  const sentCount = outreaches.filter(o => o.status === "sent").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-teal-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Personalized Outreach Engine</h2>
            <p className="text-sm text-slate-500">AI drafts hyper-personalized emails using LinkedIn data, research areas & department signals</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600">{draftCount} drafts</span>
          <span className="px-3 py-1.5 bg-amber-100 rounded-lg text-amber-700">{approvedCount} approved</span>
          <span className="px-3 py-1.5 bg-green-100 rounded-lg text-green-700">{sentCount} sent</span>
        </div>
      </div>

      {/* How it works banner */}
      <div className="bg-gradient-to-r from-violet-50 to-teal-50 border border-violet-200 rounded-xl p-4 text-sm text-slate-700">
        <strong className="text-violet-800">🧠 How the AI personalizes:</strong> For each prospect, the engine searches for their recent publications and research context, then uses Claude Sonnet to write an email referencing their specific <em>department, LinkedIn headline, institution, country,</em> and <em>research interests</em> — no two emails are alike.
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[["generate","✨ Generate Drafts"],["review","📬 Review & Send"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {label}
            {key === "review" && outreaches.length > 0 && <span className="ml-2 bg-violet-100 text-violet-700 text-xs px-1.5 py-0.5 rounded-full">{outreaches.length}</span>}
          </button>
        ))}
      </div>

      {/* ── GENERATE TAB ── */}
      {activeTab === "generate" && (
        <div className="space-y-5">
          {/* Goal + Filters */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-5 h-5 text-violet-600" /> Campaign Goal & Filters</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Outreach Goal</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {GOALS.map(g => (
                    <button key={g.value} onClick={() => setSelectedGoal(g.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${selectedGoal === g.value ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300"}`}>
                      <p className="text-lg mb-1">{g.icon}</p>
                      <p className="text-xs font-semibold text-slate-800">{g.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Country</label>
                  <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c || "All Countries"}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Institution Type</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    {INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadProspects}>
                <RefreshCw className="w-4 h-4 mr-1" /> Load Prospects
              </Button>
            </CardContent>
          </Card>

          {/* Prospect selector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-slate-600" />
                  Select Prospects to Draft For
                  <Badge className="bg-slate-100 text-slate-600">{prospects.length} available</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedProspects(prospects.slice(0, 10).map(p => p.id))}>
                    Select Top 10
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedProspects([])}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProspects ? (
                <div className="flex items-center justify-center py-8 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading...</div>
              ) : prospects.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No new prospects found for these filters.</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {prospects.map(p => (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedProspects.includes(p.id) ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-violet-200"}`}>
                      <input type="checkbox" checked={selectedProspects.includes(p.id)} onChange={() => toggleProspect(p.id)} className="accent-violet-600 w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-slate-900">{p.contact_name || "Unnamed"}</span>
                          <span className="text-xs text-slate-500">{p.email}</span>
                          {p.linkedin_url && <Badge className="text-xs bg-blue-100 text-blue-700">🔗 LinkedIn</Badge>}
                          {p.google_scholar_url && <Badge className="text-xs bg-amber-100 text-amber-700">📚 Scholar</Badge>}
                        </div>
                        {p.linkedin_headline && <p className="text-xs text-slate-500 mt-0.5 truncate">{p.linkedin_headline}</p>}
                        <p className="text-xs text-slate-400 truncate">{p.institution} {p.department ? `· ${p.department}` : ""} · {p.country}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedProspects.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="text-sm text-slate-600">
                      <strong>{selectedProspects.length}</strong> prospect{selectedProspects.length > 1 ? "s" : ""} selected ·
                      <span className="text-violet-600 ml-1">Claude Sonnet + live web research per email</span>
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating}
                      className="bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-700 text-white px-8">
                      {isGenerating
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating {selectedProspects.length} emails...</>
                        : <><Sparkles className="w-4 h-4 mr-2" /> Generate {selectedProspects.length} Personalized Draft{selectedProspects.length > 1 ? "s" : ""}</>}
                    </Button>
                  </div>
                  {isGenerating && (
                    <p className="text-xs text-slate-500 mt-2">⏳ AI is researching each prospect and crafting unique emails. Allow ~20–40 seconds per person...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-800">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <CheckCircle className="w-5 h-5" /> {result.generated} personalized drafts generated!
              </div>
              <p>Switch to the "Review & Send" tab to preview, approve, and send each email.</p>
            </div>
          )}
        </div>
      )}

      {/* ── REVIEW TAB ── */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {["all","draft","approved","sent","replied"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="ml-1 opacity-70">{s === "all" ? outreaches.length : outreaches.filter(o => o.status === s).length}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {draftCount > 0 && (
                <Button size="sm" variant="outline" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50" onClick={handleApproveAll}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve All Drafts ({draftCount})
                </Button>
              )}
              {approvedCount > 0 && (
                <Button size="sm" className="text-xs bg-teal-600 hover:bg-teal-700 text-white" disabled={isSendingAll} onClick={handleSendAllApproved}>
                  {isSendingAll ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Sending...</> : <><Send className="w-3.5 h-3.5 mr-1" /> Send All Approved ({approvedCount})</>}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={loadOutreaches}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>

          {isLoadingOutreaches ? (
            <div className="flex items-center justify-center py-16 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
          ) : filteredOutreaches.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="font-medium">No outreach emails here yet</p>
              <p className="text-sm mt-1">Go to "Generate Drafts" to create personalized emails.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOutreaches.map(outreach => (
                <OutreachCard
                  key={outreach.id}
                  outreach={outreach}
                  onApprove={handleApprove}
                  onSend={handleSend}
                  onDelete={handleDelete}
                  onEdit={o => setEditingOutreach(o)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingOutreach && (
        <EditModal
          outreach={editingOutreach}
          onSave={() => { setEditingOutreach(null); loadOutreaches(); }}
          onClose={() => setEditingOutreach(null)}
        />
      )}
    </div>
  );
}