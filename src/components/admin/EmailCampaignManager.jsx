import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { sendEmailCampaign } from "@/functions/sendEmailCampaign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Plus, Send, Eye, MousePointer, BarChart3, Trash2,
  FileText, Clock, CheckCircle, Loader2, ChevronRight, X, Copy, Edit3
} from "lucide-react";

const AFRICAN_COUNTRIES = [
  "Nigeria","Kenya","South Africa","Ghana","Ethiopia","Tanzania","Uganda","Rwanda","Senegal",
  "Cameroon","Ivory Coast","Zambia","Zimbabwe","Mozambique","Angola","Sudan","Egypt","Morocco",
  "Algeria","Tunisia","Libya","Botswana","Namibia","Malawi","Lesotho","Eswatini","Sierra Leone",
  "Liberia","Guinea","Mali","Burkina Faso","Niger","Chad","Central African Republic","Congo",
  "DR Congo","Gabon","Djibouti","Somalia","Eritrea","South Sudan","Burundi","Comoros",
  "Mauritius","Madagascar","Cape Verde","Seychelles","Gambia","Benin","Togo"
].sort();

const INSTITUTION_TYPES = [
  { value: "", label: "All Types" },
  { value: "university", label: "Universities & Colleges" },
  { value: "hospital", label: "Hospitals & Medical Schools" },
  { value: "school", label: "Secondary Schools" },
  { value: "research_institute", label: "Research Institutes" },
  { value: "ngo", label: "NGOs & Development Orgs" },
  { value: "government", label: "Government Ministries" },
  { value: "professional_association", label: "Professional Associations" },
];

const TEMPLATES = [
  {
    name: "Partnership Proposal — Universities",
    subject: "Partnership Opportunity: AfriSci Nexus Open Access Publishing",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
<div style="background:linear-gradient(135deg,#1e3a8a,#0d9488);padding:32px;border-radius:12px 12px 0 0;text-align:center">
  <h1 style="color:white;margin:0;font-size:24px">AfriSci Nexus</h1>
  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Africa's Premier Open Access Research Platform</p>
</div>
<div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
  <p>Dear {{name}},</p>
  <p>We are reaching out to explore a <strong>publishing partnership</strong> between AfriSci Nexus and <strong>{{institution}}</strong>.</p>
  <p>AfriSci Nexus is a rapidly growing open-access academic publishing platform dedicated to amplifying African research globally. We publish peer-reviewed journals across 9 disciplines and are actively seeking partnerships with leading institutions in <strong>{{country}}</strong>.</p>
  <h3 style="color:#0d9488">Why Partner With Us?</h3>
  <ul>
    <li>🌍 <strong>Global Visibility</strong> — Your researchers' work reaches 190+ countries</li>
    <li>⚡ <strong>Fast Publication</strong> — 4–6 week review cycle with AI assistance</li>
    <li>💰 <strong>Fee Waivers</strong> — Available for authors from eligible institutions</li>
    <li>📊 <strong>Impact Tracking</strong> — Real-time citation and download analytics</li>
    <li>🏆 <strong>Indexed</strong> — Google Scholar, CrossRef, DOAJ, and African Journals Online</li>
  </ul>
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:24px 0">
    <strong>Institutional Partnership Benefits Include:</strong><br>
    Discounted publication fees, co-branding opportunities, dedicated editorial support, and a customized onboarding session for your faculty.
  </div>
  <p>We would love to schedule a brief call to discuss how this partnership can benefit your faculty and students. Please reply to this email or visit <a href="https://afriscinexus.com/InstitutionalPartnership" style="color:#0d9488">our partnership page</a> to learn more.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="https://afriscinexus.com/InstitutionalPartnership" style="background:#0d9488;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Apply for Partnership →</a>
  </div>
  <p>Warm regards,<br><strong>The AfriSci Nexus Editorial Team</strong><br>editorial@afriscinexus.com</p>
</div>
<div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e2e8f0;border-top:none">
  AfriSci Nexus · Advancing African Research Globally · <a href="https://afriscinexus.com" style="color:#0d9488">afriscinexus.com</a>
</div>
</div>`
  },
  {
    name: "Call for Submissions — Researchers",
    subject: "Publish Your Research in AfriSci Nexus — Open Access, Peer-Reviewed",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
<div style="background:linear-gradient(135deg,#1e3a8a,#0d9488);padding:32px;border-radius:12px 12px 0 0;text-align:center">
  <h1 style="color:white;margin:0;font-size:24px">AfriSci Nexus</h1>
  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Call for Research Submissions</p>
</div>
<div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
  <p>Dear {{name}},</p>
  <p>We invite you and your colleagues at <strong>{{institution}}</strong> to submit your research to <strong>AfriSci Nexus</strong> — Africa's fastest-growing open-access academic publishing platform.</p>
  <h3 style="color:#0d9488">We Publish Across 9 Disciplines:</h3>
  <p>STEM · Medicine & Health · Agriculture · Social Sciences · Law & Policy · Arts & Humanities · Business · Education · Interdisciplinary</p>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:24px 0">
    <strong>🎯 Why Publish With AfriSci Nexus?</strong><br><br>
    ✅ Double-blind peer review by international experts<br>
    ✅ Average 4–6 weeks from submission to decision<br>
    ✅ Free for eligible authors from low-income countries<br>
    ✅ DOI assigned to every published article<br>
    ✅ Indexed in Google Scholar, CrossRef & DOAJ
  </div>
  <div style="text-align:center;margin:32px 0">
    <a href="https://afriscinexus.com/Submit" style="background:#0d9488;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Submit Your Manuscript →</a>
  </div>
  <p>Questions? Contact us at <a href="mailto:editorial@afriscinexus.com" style="color:#0d9488">editorial@afriscinexus.com</a></p>
  <p>Best regards,<br><strong>AfriSci Nexus Editorial Team</strong></p>
</div>
<div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e2e8f0;border-top:none">
  AfriSci Nexus · <a href="https://afriscinexus.com" style="color:#0d9488">afriscinexus.com</a> · info@afriscinexus.com
</div>
</div>`
  },
  {
    name: "Reviewer Recruitment",
    subject: "Become a Peer Reviewer — AfriSci Nexus Academic Journals",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
<div style="background:linear-gradient(135deg,#7c3aed,#0d9488);padding:32px;border-radius:12px 12px 0 0;text-align:center">
  <h1 style="color:white;margin:0;font-size:24px">AfriSci Nexus</h1>
  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">Join Our Expert Reviewer Network</p>
</div>
<div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
  <p>Dear {{name}},</p>
  <p>As a distinguished professional at <strong>{{institution}}</strong>, we believe your expertise would be a tremendous asset to the AfriSci Nexus peer review network.</p>
  <p>We are actively recruiting expert reviewers across all disciplines to help maintain the highest standards of African academic publishing.</p>
  <h3 style="color:#7c3aed">Benefits of Joining Our Reviewer Network:</h3>
  <ul>
    <li>🏆 <strong>Recognition</strong> — Certificates and awards for outstanding reviewers</li>
    <li>📖 <strong>Free Access</strong> — Complimentary access to all AfriSci Nexus publications</li>
    <li>🌐 <strong>Global Network</strong> — Connect with 500+ researchers across Africa</li>
    <li>⚡ <strong>Flexible</strong> — Review at your own pace, set your availability</li>
  </ul>
  <div style="text-align:center;margin:32px 0">
    <a href="https://afriscinexus.com/Apply?role=reviewer" style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Apply as Reviewer →</a>
  </div>
  <p>Best regards,<br><strong>AfriSci Nexus Editorial Team</strong></p>
</div>
<div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:12px;color:#94a3b8;border:1px solid #e2e8f0;border-top:none">
  AfriSci Nexus · <a href="https://afriscinexus.com" style="color:#0d9488">afriscinexus.com</a>
</div>
</div>`
  }
];

const STATUS_CONFIG = {
  draft: { color: "bg-slate-100 text-slate-700", label: "Draft" },
  scheduled: { color: "bg-blue-100 text-blue-700", label: "Scheduled" },
  sending: { color: "bg-amber-100 text-amber-700", label: "Sending..." },
  sent: { color: "bg-green-100 text-green-700", label: "Sent" },
  paused: { color: "bg-red-100 text-red-700", label: "Paused" },
};

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
      <Icon className="w-4 h-4" />
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs opacity-70">{label}</p>
      </div>
    </div>
  );
}

export default function EmailCampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [view, setView] = useState("list"); // list | create | edit | preview
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sending, setSending] = useState(null); // campaign_id being sent
  const [prospectCounts, setProspectCounts] = useState({});

  // Form state
  const [form, setForm] = useState({
    name: "", subject: "", body_html: "", country: "Nigeria",
    institution_type: "", from_name: "AfriSci Nexus Editorial Team",
    scheduled_at: ""
  });
  const [previewHtml, setPreviewHtml] = useState("");

  const loadCampaigns = async () => {
    setIsLoading(true);
    const data = await base44.entities.EmailCampaign.list('-created_date', 200);
    setCampaigns(data);
    setIsLoading(false);
  };

  useEffect(() => { loadCampaigns(); }, []);

  const loadProspectCount = async (country, type) => {
    const filter = { country, campaign_status: "new" };
    if (type) filter.institution_type = type;
    const data = await base44.entities.ProspectEmail.filter(filter);
    return data.length;
  };

  const handleFormChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const applyTemplate = (template) => {
    setForm(f => ({ ...f, name: template.name, subject: template.subject, body_html: template.body }));
  };

  const handleSaveCampaign = async () => {
    const count = await loadProspectCount(form.country, form.institution_type);
    const data = {
      ...form,
      status: form.scheduled_at ? "scheduled" : "draft",
      total_recipients: count
    };
    if (selectedCampaign) {
      await base44.entities.EmailCampaign.update(selectedCampaign.id, data);
    } else {
      await base44.entities.EmailCampaign.create(data);
    }
    setView("list");
    setSelectedCampaign(null);
    loadCampaigns();
  };

  const handleSend = async (campaign) => {
    if (!confirm(`Send to all NEW prospects in ${campaign.country}? This cannot be undone.`)) return;
    setSending(campaign.id);
    const res = await sendEmailCampaign({ campaign_id: campaign.id }).catch(e => ({ error: e.message }));
    setSending(null);
    if (res.error) alert("Error: " + res.error);
    else alert(`✅ Sent to ${res.sent} recipients. ${res.errors} errors.`);
    loadCampaigns();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    await base44.entities.EmailCampaign.delete(id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const startCreate = () => {
    setForm({ name: "", subject: "", body_html: "", country: "Nigeria", institution_type: "", from_name: "AfriSci Nexus Editorial Team", scheduled_at: "" });
    setSelectedCampaign(null);
    setView("create");
  };

  const startEdit = (campaign) => {
    setForm({ name: campaign.name, subject: campaign.subject, body_html: campaign.body_html || "", country: campaign.country || "Nigeria", institution_type: campaign.institution_type || "", from_name: campaign.from_name || "AfriSci Nexus Editorial Team", scheduled_at: campaign.scheduled_at || "" });
    setSelectedCampaign(campaign);
    setView("edit");
  };

  const totalSent = campaigns.reduce((a, c) => a + (c.sent_count || 0), 0);
  const totalOpens = campaigns.reduce((a, c) => a + (c.open_count || 0), 0);
  const totalClicks = campaigns.reduce((a, c) => a + (c.click_count || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;

  if (view === "create" || view === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>← Back</Button>
          <h2 className="text-xl font-bold text-slate-900">{view === "create" ? "New Campaign" : "Edit Campaign"}</h2>
        </div>

        {/* Template Picker */}
        <Card>
          <CardHeader><CardTitle className="text-base">📋 Start from a Template</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3">
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => applyTemplate(t)}
                  className="text-left p-4 rounded-xl border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50 transition-all">
                  <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.subject}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Form */}
        <Card>
          <CardHeader><CardTitle className="text-base">✏️ Campaign Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name *</label>
                <input value={form.name} onChange={e => handleFormChange("name", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="e.g. Nigeria Universities Outreach Q2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Name</label>
                <input value={form.from_name} onChange={e => handleFormChange("from_name", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject *</label>
              <input value={form.subject} onChange={e => handleFormChange("subject", e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                placeholder="Your email subject line" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Country</label>
                <select value={form.country} onChange={e => handleFormChange("country", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                  {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Institution Type</label>
                <select value={form.institution_type} onChange={e => handleFormChange("institution_type", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                  {INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Schedule (optional)</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => handleFormChange("scheduled_at", e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Email Body (HTML) *</label>
                <Button variant="outline" size="sm" onClick={() => { setPreviewHtml(form.body_html); setView("preview"); }}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                </Button>
              </div>
              <div className="text-xs text-slate-500 mb-2">Use <code className="bg-slate-100 px-1 rounded">{"{{name}}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{{institution}}"}</code>, <code className="bg-slate-100 px-1 rounded">{"{{country}}"}</code> for personalization.</div>
              <textarea value={form.body_html} onChange={e => handleFormChange("body_html", e.target.value)} rows={16}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-300"
                placeholder="Paste your HTML email body here..." />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveCampaign} disabled={!form.name || !form.subject || !form.body_html}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8">
                <CheckCircle className="w-4 h-4 mr-2" /> Save Campaign
              </Button>
              <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "preview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView(selectedCampaign ? "edit" : "create")}>← Back to Editor</Button>
          <h2 className="text-xl font-bold text-slate-900">Email Preview</h2>
        </div>
        <div className="bg-slate-100 p-4 rounded-xl">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-200 px-4 py-2 flex items-center gap-2 text-xs text-slate-600">
              <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-amber-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
              <span>Email Preview</span>
            </div>
            <div className="p-2" dangerouslySetInnerHTML={{ __html: previewHtml.replace(/\{\{name\}\}/g, "Dr. Sample Contact").replace(/\{\{institution\}\}/g, "University of Example").replace(/\{\{country\}\}/g, form.country) }} />
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Send className="w-7 h-7 text-teal-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Email Campaign Manager</h2>
            <p className="text-sm text-slate-500">Build, schedule and track bulk outreach campaigns across Africa</p>
          </div>
        </div>
        <Button onClick={startCreate} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatPill icon={Send} value={campaigns.length} label="Campaigns" color="bg-blue-50 text-blue-800" />
        <StatPill icon={Mail} value={totalSent.toLocaleString()} label="Emails Sent" color="bg-teal-50 text-teal-800" />
        <StatPill icon={Eye} value={`${avgOpenRate}%`} label="Avg Open Rate" color="bg-amber-50 text-amber-800" />
        <StatPill icon={MousePointer} value={totalClicks.toLocaleString()} label="Total Clicks" color="bg-purple-50 text-purple-800" />
      </div>

      {/* Templates Quick Access */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-teal-600" /> Partnership Email Templates</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            {TEMPLATES.map(t => (
              <div key={t.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                <p className="font-semibold text-sm text-slate-900 mb-1">{t.name}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.subject}</p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={startCreate}>
                  Use Template <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <Card>
        <CardHeader><CardTitle className="text-base">All Campaigns</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Send className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No campaigns yet</p>
              <p className="text-sm mt-1">Click "New Campaign" to create your first outreach.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(campaign => {
                const openRate = campaign.sent_count > 0 ? Math.round((campaign.open_count / campaign.sent_count) * 100) : 0;
                const clickRate = campaign.sent_count > 0 ? Math.round((campaign.click_count / campaign.sent_count) * 100) : 0;
                return (
                  <div key={campaign.id} className="p-5 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{campaign.name}</h3>
                          <Badge className={`text-xs ${STATUS_CONFIG[campaign.status]?.color}`}>
                            {STATUS_CONFIG[campaign.status]?.label}
                          </Badge>
                          {campaign.country && <Badge className="text-xs bg-slate-100 text-slate-600">{campaign.country}</Badge>}
                          {campaign.institution_type && <Badge className="text-xs bg-slate-100 text-slate-600">{campaign.institution_type.replace("_", " ")}</Badge>}
                        </div>
                        <p className="text-sm text-slate-500 truncate mb-3">{campaign.subject}</p>
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                          <span className="flex items-center gap-1 text-slate-600"><Send className="w-3.5 h-3.5" /> {campaign.sent_count || 0} sent</span>
                          <span className="flex items-center gap-1 text-amber-600"><Eye className="w-3.5 h-3.5" /> {campaign.open_count || 0} opens ({openRate}%)</span>
                          <span className="flex items-center gap-1 text-purple-600"><MousePointer className="w-3.5 h-3.5" /> {campaign.click_count || 0} clicks ({clickRate}%)</span>
                          {campaign.scheduled_at && <span className="flex items-center gap-1 text-blue-600"><Clock className="w-3.5 h-3.5" /> {new Date(campaign.scheduled_at).toLocaleString()}</span>}
                        </div>
                        {/* Open rate bar */}
                        {campaign.sent_count > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.min(openRate, 100)}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-16">{openRate}% open</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEdit(campaign)}>
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white"
                              disabled={sending === campaign.id}
                              onClick={() => handleSend(campaign)}>
                              {sending === campaign.id
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Sending...</>
                                : <><Send className="w-3.5 h-3.5 mr-1" /> Send Now</>}
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(campaign.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}