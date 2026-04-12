import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { sendEmailCampaign } from "@/functions/sendEmailCampaign";
import { sendProspectEmail } from "@/functions/sendProspectEmail";
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

const JOURNALS_LIST = `Our 12 peer-reviewed journals under AfriSci Nexus Discovery cover every major discipline:
• AfriSci STEM Journal • AfriSci Medicine &amp; Health Journal • AfriSci Agriculture &amp; Environment Journal
• AfriSci Social Sciences Journal • AfriSci Law &amp; Policy Journal • AfriSci Arts &amp; Humanities Journal
• AfriSci Business &amp; Economics Journal • AfriSci Education &amp; Pedagogy Journal
• AfriSci Interdisciplinary Research Journal • AfriSci Public Health &amp; Nutrition Journal
• AfriSci Engineering &amp; Innovation Journal • AfriSci Indigenous Knowledge &amp; Culture Journal`;

const BRAND_HEADER = (subtitle) => `
<div style="background:linear-gradient(135deg,#1e3a8a,#0d9488);padding:32px;border-radius:12px 12px 0 0;text-align:center">
  <h1 style="color:white;margin:0;font-size:26px;letter-spacing:-0.5px">AfriSci Nexus Discovery</h1>
  <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">12 Peer-Reviewed Journals · Africa's Premier Open-Access Platform</p>
  <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px">${subtitle}</p>
</div>`;

const BRAND_FOOTER = `
<div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center;font-size:11px;color:#94a3b8;border:1px solid #e2e8f0;border-top:none">
  AfriSci Nexus Discovery &nbsp;·&nbsp; 12 Peer-Reviewed Journals &nbsp;·&nbsp; <a href="https://afriscinexus.com" style="color:#0d9488">afriscinexus.com</a> &nbsp;·&nbsp; editorial@afriscinexus.com
  <br/><a href="#" style="color:#94a3b8;font-size:10px">Unsubscribe</a>
</div>`;

const SIGNATURE = `<p>Warm regards,<br><strong>Majok Wutchok</strong><br>Founder &amp; CEO, AfriSci Nexus Discovery<br><a href="mailto:editorial@afriscinexus.com" style="color:#0d9488">editorial@afriscinexus.com</a></p>`;

const TEMPLATES = [
  {
    name: "Partnership Proposal — Universities & Research Institutions",
    goal: "partnership_proposal",
    subject: "Publishing Partnership: AfriSci Nexus Discovery — 12 Open-Access Journals for {{institution}}",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
${BRAND_HEADER("Institutional Partnership Invitation")}
<div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
  <p>Dear {{name}},</p>
  <p>I am reaching out to explore a <strong>publishing partnership</strong> between <strong>AfriSci Nexus Discovery</strong> and <strong>{{institution}}</strong> in {{country}}.</p>
  <p>AfriSci Nexus Discovery is Africa's premier multidisciplinary open-access publishing platform, home to <strong>12 individual peer-reviewed journals</strong> covering every major academic discipline — from STEM and Medicine to Social Sciences, Law, Arts, and Indigenous Knowledge.</p>
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0;font-size:13px">
    <strong style="color:#166534">Our 12 Journals under AfriSci Nexus Discovery:</strong><br/><br/>
    ${JOURNALS_LIST}
  </div>
  <h3 style="color:#0d9488;font-size:15px">Why Partner With AfriSci Nexus Discovery?</h3>
  <ul style="line-height:1.8">
    <li>🌍 <strong>Global Visibility</strong> — Your researchers' work reaches 190+ countries via 12 indexed journals</li>
    <li>⚡ <strong>Fast Publication</strong> — 4–6 week AI-assisted peer review cycle</li>
    <li>💰 <strong>Fee Waivers</strong> — Available for institutions from eligible African nations</li>
    <li>📊 <strong>Real-Time Analytics</strong> — Citation, download and readership dashboards</li>
    <li>🏆 <strong>Indexed</strong> — Google Scholar, CrossRef, DOAJ, African Journals Online</li>
    <li>🤝 <strong>Co-Branding</strong> — Your institution's name featured on published articles</li>
  </ul>
  <div style="text-align:center;margin:28px 0">
    <a href="https://afriscinexus.com/InstitutionalPartnership" style="background:#0d9488;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Explore Partnership Options →</a>
  </div>
  <p style="font-style:italic;color:#64748b;font-size:13px">"AfriSci Nexus Discovery — 12 journals, one platform, amplifying African research globally."</p>
  ${SIGNATURE}
</div>
${BRAND_FOOTER}
</div>`
  },
  {
    name: "Call for Submissions — Researchers & Academics",
    goal: "call_for_submissions",
    subject: "Publish Your Research in AfriSci Nexus Discovery — 12 Open-Access Journals Await",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
${BRAND_HEADER("Call for Research Submissions — All Disciplines Welcome")}
<div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
  <p>Dear {{name}},</p>
  <p>We warmly invite you and your colleagues at <strong>{{institution}}</strong> to submit your research to <strong>AfriSci Nexus Discovery</strong> — Africa's fastest-growing multidisciplinary open-access platform.</p>
  <p>Whatever your discipline, we have a dedicated peer-reviewed journal for you:</p>
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;font-size:13px">
    <strong style="color:#1e3a8a">AfriSci Nexus Discovery — Our 12 Journals:</strong><br/><br/>
    ${JOURNALS_LIST}
  </div>
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0">
    <strong>🎯 Why Publish With Us?</strong><br/><br/>
    ✅ Double-blind peer review by international experts<br/>
    ✅ Average 4–6 weeks from submission to decision<br/>
    ✅ Free for eligible authors from low-income countries<br/>
    ✅ DOI assigned to every published article<br/>
    ✅ Indexed in Google Scholar, CrossRef, DOAJ &amp; African Journals Online<br/>
    ✅ AI-assisted manuscript formatting support
  </div>
  <div style="text-align:center;margin:28px 0">
    <a href="https://afriscinexus.com/Submit" style="background:#0d9488;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Submit Your Manuscript →</a>
    &nbsp;
    <a href="https://afriscinexus.com/Journals" style="background:#1e3a8a;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Browse Our 12 Journals →</a>
  </div>
  <p style="font-style:italic;color:#64748b;font-size:13px">"AfriSci Nexus Discovery — 12 journals, one platform, amplifying African research globally."</p>
  ${SIGNATURE}
</div>
${BRAND_FOOTER}
</div>`
  },
  {
    name: "Reviewer Recruitment — Subject Matter Experts",
    goal: "reviewer_recruitment",
    subject: "Join Our Expert Reviewer Network — AfriSci Nexus Discovery (12 Journals)",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
${BRAND_HEADER("Invitation to Join Our Peer Reviewer Network")}
<div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
  <p>Dear {{name}},</p>
  <p>As a distinguished professional at <strong>{{institution}}</strong> in {{country}}, we believe your expertise would be an outstanding asset to the <strong>AfriSci Nexus Discovery</strong> peer review network.</p>
  <p>We maintain <strong>12 individual peer-reviewed journals</strong> and are actively recruiting domain experts across every discipline to uphold our standards of excellence in African academic publishing.</p>
  <div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:16px;margin:20px 0;font-size:13px">
    <strong style="color:#6d28d9">Find your journal among our 12:</strong><br/><br/>
    ${JOURNALS_LIST}
  </div>
  <h3 style="color:#7c3aed;font-size:15px">Benefits of Joining Our Reviewer Network:</h3>
  <ul style="line-height:1.8">
    <li>🏆 <strong>Recognition</strong> — Certificates and annual awards for outstanding reviewers</li>
    <li>📖 <strong>Free Access</strong> — Complimentary access to all 12 AfriSci Nexus Discovery journals</li>
    <li>🌐 <strong>Global Network</strong> — Connect with 500+ researchers across Africa and beyond</li>
    <li>⚡ <strong>Flexible Workload</strong> — Review at your own pace, manage your availability</li>
    <li>📜 <strong>CV Credit</strong> — Formal reviewer credits for your academic record</li>
  </ul>
  <div style="text-align:center;margin:28px 0">
    <a href="https://afriscinexus.com/Apply?role=reviewer" style="background:#7c3aed;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Apply as Reviewer →</a>
  </div>
  <p style="font-style:italic;color:#64748b;font-size:13px">"AfriSci Nexus Discovery — 12 journals, one platform, amplifying African research globally."</p>
  ${SIGNATURE}
</div>
${BRAND_FOOTER}
</div>`
  },
  {
    name: "General Introduction — All Institutions",
    goal: "general_outreach",
    subject: "Introducing AfriSci Nexus Discovery — 12 Open-Access Journals for African Research",
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
${BRAND_HEADER("Advancing African Research Through Open Access Publishing")}
<div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none">
  <p>Dear {{name}},</p>
  <p>I hope this message finds you well. I am writing to introduce <strong>AfriSci Nexus Discovery</strong> — Africa's premier multidisciplinary open-access publishing platform, home to <strong>12 individual peer-reviewed journals</strong>.</p>
  <p>Our platform was purpose-built to amplify African research on the global stage, offering scholars at institutions like <strong>{{institution}}</strong> a high-quality, internationally indexed venue for their work — at no cost for eligible authors.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;font-size:13px">
    <strong>Our 12 Journals under AfriSci Nexus Discovery:</strong><br/><br/>
    ${JOURNALS_LIST}
  </div>
  <p>Whether your institution is engaged in medicine, engineering, social policy, education, or indigenous knowledge — we have a journal dedicated to your field.</p>
  <div style="text-align:center;margin:28px 0">
    <a href="https://afriscinexus.com/Journals" style="background:#0d9488;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Explore Our 12 Journals →</a>
  </div>
  <p style="font-style:italic;color:#64748b;font-size:13px">"AfriSci Nexus Discovery — 12 journals, one platform, amplifying African research globally."</p>
  ${SIGNATURE}
</div>
${BRAND_FOOTER}
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
  const [activeTab, setActiveTab] = useState("quick_send");
  const [view, setView] = useState("list"); // list | create | edit | preview
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [sending, setSending] = useState(null);
  const [prospectCounts, setProspectCounts] = useState({});

  // Quick Send state
  const [prospects, setProspects] = useState([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [selectedProspectIds, setSelectedProspectIds] = useState([]);
  const [quickSendFilter, setQuickSendFilter] = useState({ country: "", institution_type: "", engagement_level: "", sort_by: "created" });
  const [sendingQuick, setSendingQuick] = useState(false);
  const [quickPreview, setQuickPreview] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  // Per-prospect preview & edit
  const [previewProspect, setPreviewProspect] = useState(null); // prospect object to preview
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "", subject: "", body_html: "", country: "Nigeria",
    institution_type: "", from_name: "AfriSci Nexus Discovery Editorial Team",
    scheduled_at: ""
  });
  const [previewHtml, setPreviewHtml] = useState("");

  const loadCampaigns = async () => {
    setIsLoading(true);
    const data = await base44.entities.EmailCampaign.list('-created_date', 200);
    setCampaigns(data);
    setIsLoading(false);
  };

  const loadProspects = useCallback(async () => {
    setIsLoadingProspects(true);
    const filter = {};
    if (quickSendFilter.country) filter.country = quickSendFilter.country;
    if (quickSendFilter.institution_type) filter.institution_type = quickSendFilter.institution_type;
    if (quickSendFilter.engagement_level) filter.engagement_level = quickSendFilter.engagement_level;
    const sortMap = { created: '-created_date', score: '-lead_score', opened: '-last_opened_at', clicked: '-last_clicked_at' };
    const sort = sortMap[quickSendFilter.sort_by] || '-created_date';
    const data = await base44.entities.ProspectEmail.filter(filter, sort, 500);
    setProspects(data);
    setSelectedProspectIds([]);
    setIsLoadingProspects(false);
  }, [quickSendFilter]);

  useEffect(() => { loadCampaigns(); }, []);
  useEffect(() => { if (activeTab === "quick_send") loadProspects(); }, [activeTab, loadProspects]);

  // Sync custom subject/body when template changes
  useEffect(() => {
    setCustomSubject(TEMPLATES[selectedTemplate].subject);
    setCustomBody(TEMPLATES[selectedTemplate].body);
    setEditingTemplate(false);
  }, [selectedTemplate]);

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

  const resolveForProspect = (template, body, subject, prospect) => ({
    body: body
      .replace(/\{\{name\}\}/g, prospect.contact_name || "Colleague")
      .replace(/\{\{institution\}\}/g, prospect.institution || "your institution")
      .replace(/\{\{country\}\}/g, prospect.country || ""),
    subject: subject
      .replace(/\{\{name\}\}/g, prospect.contact_name || "Colleague")
      .replace(/\{\{institution\}\}/g, prospect.institution || "your institution")
      .replace(/\{\{country\}\}/g, prospect.country || "")
  });

  const handleQuickSend = async () => {
    if (!selectedProspectIds.length) return;
    if (!confirm(`Send ${selectedProspectIds.length} personalized emails? Each will be addressed individually. This cannot be undone.`)) return;
    setSendingQuick(true);
    setQuickResult(null);
    const sentIds = [];
    let sent = 0, errors = 0;
    for (const id of selectedProspectIds) {
      const prospect = prospects.find(p => p.id === id);
      if (!prospect) continue;
      const { body, subject } = resolveForProspect(null, customBody, customSubject, prospect);
      try {
        await sendProspectEmail({
          to: prospect.email,
          subject,
          body,
          from_name: "Majok Wutchok, AfriSci Nexus Discovery",
          prospect_id: id
        });
        sentIds.push(id);
        sent++;
      } catch (_) { errors++; }
    }
    // Delete sent prospects so the agent can find fresh contacts
    for (const id of sentIds) {
      await base44.entities.ProspectEmail.delete(id).catch(() => {});
    }
    setSendingQuick(false);
    setQuickResult({ sent, errors });
    setSelectedProspectIds([]);
    loadProspects();
  };

  const handleSend = async (campaign) => {
    if (!confirm(`Send to all NEW prospects in ${campaign.country}? This cannot be undone.`)) return;
    setSending(campaign.id);
    const res = await sendEmailCampaign({ campaign_id: campaign.id }).catch(e => ({ error: e.message }));
    setSending(null);
    if (res.error) { alert("Error: " + res.error); }
    else {
      // Delete sent prospects so the LinkedIn agent can fetch fresh contacts
      const filter = { campaign_status: 'emailed' };
      if (campaign.country) filter.country = campaign.country;
      if (campaign.institution_type) filter.institution_type = campaign.institution_type;
      const sent = await base44.entities.ProspectEmail.filter(filter, '-created_date', 1000).catch(() => []);
      for (const p of sent) { await base44.entities.ProspectEmail.delete(p.id).catch(() => {}); }
      alert(`✅ Sent to ${res.sent} recipients. ${res.errors} errors. ${sent.length} prospect records cleared.`);
    }
    loadCampaigns();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    await base44.entities.EmailCampaign.delete(id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const startCreate = () => {
    setForm({ name: "", subject: "", body_html: "", country: "Nigeria", institution_type: "", from_name: "AfriSci Nexus Discovery Editorial Team", scheduled_at: "" });
    setSelectedCampaign(null);
    setView("create");
  };

  const startEdit = (campaign) => {
    setForm({ name: campaign.name, subject: campaign.subject, body_html: campaign.body_html || "", country: campaign.country || "Nigeria", institution_type: campaign.institution_type || "", from_name: campaign.from_name || "AfriSci Nexus Discovery Editorial Team", scheduled_at: campaign.scheduled_at || "" });
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
            <p className="text-sm text-slate-500">AfriSci Nexus Discovery — 12 journals · Bulk outreach across Africa</p>
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[["quick_send","⚡ Quick Send"],["campaigns","📋 Campaigns"],["templates","📄 Templates"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── QUICK SEND TAB ── */}
      {activeTab === "quick_send" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
            <strong>⚡ Quick Send:</strong> Select a branded template, filter your fetched prospect list, select recipients, and send in one click. All templates feature AfriSci Nexus Discovery branding with all 12 journals.
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">1️⃣ Choose a Template</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {TEMPLATES.map((t, i) => (
                  <button key={t.name} onClick={() => { setSelectedTemplate(i); setQuickPreview(false); }}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${selectedTemplate === i ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-300"}`}>
                    <p className="font-semibold text-sm text-slate-900 mb-1">{t.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{t.subject.replace("{{institution}}", "Institution")}</p>
                    {selectedTemplate === i && <span className="inline-block mt-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">✓ Selected</span>}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => setQuickPreview(!quickPreview)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> {quickPreview ? "Hide Preview" : "Preview Template"}
                </Button>
              </div>
              {quickPreview && (
                <div className="mt-4 bg-slate-100 rounded-xl p-3">
                  <div className="max-w-2xl mx-auto bg-white rounded-xl overflow-hidden shadow">
                    <div className="bg-slate-200 px-4 py-2 flex items-center gap-2 text-xs text-slate-600">
                      <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-amber-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
                      Preview — Sample data substituted
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2" dangerouslySetInnerHTML={{ __html: TEMPLATES[selectedTemplate].body.replace(/\{\{name\}\}/g, "Dr. Amara Nwosu").replace(/\{\{institution\}\}/g, "University of Lagos").replace(/\{\{country\}\}/g, "Nigeria") }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base">2️⃣ Select Prospects
                  <span className="ml-2 text-sm font-normal text-slate-500">({prospects.length} new prospects loaded)</span>
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={quickSendFilter.country} onChange={e => setQuickSendFilter(f => ({ ...f, country: e.target.value }))}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300">
                    <option value="">All Countries</option>
                    {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={quickSendFilter.institution_type} onChange={e => setQuickSendFilter(f => ({ ...f, institution_type: e.target.value }))}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300">
                    {INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <select value={quickSendFilter.engagement_level} onChange={e => setQuickSendFilter(f => ({ ...f, engagement_level: e.target.value }))}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300">
                    <option value="">All Engagement</option>
                    <option value="hot">🔥 Hot</option>
                    <option value="warm">🌤 Warm</option>
                    <option value="cold">❄️ Cold</option>
                  </select>
                  <select value={quickSendFilter.sort_by} onChange={e => setQuickSendFilter(f => ({ ...f, sort_by: e.target.value }))}
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300">
                    <option value="created">Sort: Newest</option>
                    <option value="score">Sort: Lead Score ↓</option>
                    <option value="opened">Sort: Last Opened</option>
                    <option value="clicked">Sort: Last Clicked</option>
                  </select>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedProspectIds(prospects.map(p => p.id))}>Select All ({prospects.length})</Button>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedProspectIds([])}>Clear</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProspects ? (
                <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2"/> Loading...</div>
              ) : prospects.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No new prospects found. Use the Email Prospector tab to fetch contacts first.</div>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                  {prospects.map(p => (
                    <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${selectedProspectIds.includes(p.id) ? "border-teal-400 bg-teal-50" : "border-slate-200 hover:border-teal-200"}`}>
                      <input type="checkbox" checked={selectedProspectIds.includes(p.id)}
                        onChange={() => setSelectedProspectIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                        className="accent-teal-600 w-4 h-4 flex-shrink-0 cursor-pointer" />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedProspectIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-slate-900">{p.contact_name || "Unnamed"}</span>
                          <span className="text-xs text-slate-400">{p.email}</span>
                          {p.engagement_level === 'hot' && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">🔥 Hot</span>}
                          {p.engagement_level === 'warm' && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">🌤 Warm</span>}
                          {p.lead_score > 0 && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Score: {p.lead_score}</span>}
                          {p.email_open_count > 0 && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">👁 {p.email_open_count}</span>}
                          {p.email_click_count > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">🖱 {p.email_click_count}</span>}
                          {p.follow_up_count > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">↩ {p.follow_up_count} follow-up</span>}
                          {p.linkedin_url && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">LinkedIn</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{p.institution}{p.department ? ` · ${p.department}` : ""} · {p.country}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500 hover:text-teal-700 flex-shrink-0"
                        onClick={e => { e.stopPropagation(); setPreviewProspect(p); }}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {selectedProspectIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  {/* Edit template before send */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm text-slate-700"><strong>{selectedProspectIds.length}</strong> selected · Each email addressed personally by name</span>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingTemplate(!editingTemplate)}>
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> {editingTemplate ? "Hide Editor" : "✏️ Edit Before Send"}
                    </Button>
                  </div>
                  {editingTemplate && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <p className="text-xs text-slate-500 font-medium">Editing template — changes apply to all selected recipients. Use <code className="bg-slate-200 px-1 rounded">{"{{name}}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{{institution}}"}</code>, <code className="bg-slate-200 px-1 rounded">{"{{country}}"}</code> for personalization.</p>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Subject Line</label>
                        <input value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Email Body (HTML)</label>
                        <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} rows={10}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-300" />
                      </div>
                      <Button size="sm" variant="outline" className="text-xs"
                        onClick={() => { setCustomSubject(TEMPLATES[selectedTemplate].subject); setCustomBody(TEMPLATES[selectedTemplate].body); }}>
                        Reset to Template
                      </Button>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={handleQuickSend} disabled={sendingQuick}
                      className="bg-gradient-to-r from-teal-600 to-blue-700 hover:from-teal-700 hover:to-blue-800 text-white px-8">
                      {sendingQuick ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Sending...</> : <><Send className="w-4 h-4 mr-2"/> Send {selectedProspectIds.length} Personalized Emails</>}
                    </Button>
                  </div>
                </div>
              )}
              {quickResult && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Sent <strong>{quickResult.sent}</strong> emails successfully. {quickResult.errors > 0 && <span className="text-red-600">{quickResult.errors} errors.</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-prospect preview modal */}
      {previewProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewProspect(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Preview for {previewProspect.contact_name || previewProspect.email}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Subject: {resolveForProspect(null, customBody, customSubject, previewProspect).subject}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewProspect(null)}>✕</Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="bg-slate-100 p-3">
                <div className="bg-white rounded-xl overflow-hidden shadow">
                  <div className="bg-slate-200 px-4 py-2 flex items-center gap-2 text-xs text-slate-600">
                    <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-amber-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
                    To: {previewProspect.email}
                  </div>
                  <div className="p-2" dangerouslySetInnerHTML={{ __html: resolveForProspect(null, customBody, customSubject, previewProspect).body }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ── */}
      {activeTab === "templates" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-teal-600" /> AfriSci Nexus Discovery — 4 Branded Templates</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {TEMPLATES.map((t, i) => (
                <div key={t.name} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                  <p className="font-semibold text-sm text-slate-900 mb-1">{t.name}</p>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{t.subject.replace("{{institution}}", "Institution")}</p>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { setSelectedTemplate(i); setActiveTab("quick_send"); }}>
                    Use in Quick Send <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── CAMPAIGNS TAB ── */}
      {activeTab === "campaigns" && <Card>
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
      </Card>}
    </div>
  );
}