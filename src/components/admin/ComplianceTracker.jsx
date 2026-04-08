import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, Clock, Target, AlertTriangle, ExternalLink,
  Edit2, Save, X, DollarSign, FileText, Calendar
} from "lucide-react";

const STATUS_CONFIG = {
  done: { label: "Completed", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, dot: "bg-emerald-500" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock, dot: "bg-amber-500" },
  not_started: { label: "Not Started", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Target, dot: "bg-slate-400" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle, dot: "bg-red-500" },
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
};

const INITIAL_REGISTRATIONS = [
  { id: 1, name: "Legal Entity Registration", body: "ASIC (Australia) or African Company Registry", category: "Legal Foundation", priority: "critical", status: "not_started", cost: "~$576 AUD", deadline: "2026-06-01", url: "https://www.asic.gov.au/", documents: "ABN, registered address, company constitution", notes: "Everything else depends on this. Consider also registering in Kenya or South Africa for African credibility.", blocker: "" },
  { id: 2, name: "ISSN Registration", body: "ISSN International Centre", category: "Journal Identity", priority: "critical", status: "not_started", cost: "Free", deadline: "2026-06-15", url: "https://www.issn.org/", documents: "Journal title, publisher name & address, website URL, first issue", notes: "Apply per journal. Also apply for e-ISSN (online version). Required by CrossRef and DOAJ.", blocker: "Needs legal entity first" },
  { id: 3, name: "CrossRef Membership & DOI Registration", body: "CrossRef", category: "DOI & Metadata", priority: "critical", status: "not_started", cost: "$275 USD/yr + $1/DOI", deadline: "2026-07-01", url: "https://www.crossref.org/", documents: "Legal entity details, ISSN per journal, payment method", notes: "DOIs make articles permanently citable. Required before applying to Scopus or WoS.", blocker: "Needs legal entity + ISSN" },
  { id: 4, name: "COPE Membership", body: "Committee on Publication Ethics", category: "Ethics", priority: "critical", status: "not_started", cost: "£105 GBP/yr", deadline: "2026-07-01", url: "https://publicationethics.org/", documents: "Publisher details, ethics policy URL, peer review policy", notes: "Required for DOAJ and strongly preferred by Scopus. Provides framework for handling misconduct.", blocker: "Needs legal entity" },
  { id: 5, name: "DOAJ Application", body: "Directory of Open Access Journals", category: "Open Access", priority: "high", status: "not_started", cost: "Free", deadline: "2026-10-01", url: "https://doaj.org/apply/guide/", documents: "ISSN, COPE membership, 10+ published OA articles, ethics policy, author copyright policy", notes: "Takes 3–6 months to process. Need at least 10 published articles.", blocker: "Needs ISSN, COPE, 10+ articles" },
  { id: 6, name: "AJOL Listing", body: "African Journals OnLine", category: "Open Access", priority: "high", status: "not_started", cost: "Free", deadline: "2026-08-01", url: "https://www.ajol.info/", documents: "Journal details, ISSN, scope, editorial board, published articles", notes: "World's largest platform for African-published research.", blocker: "Needs ISSN + published articles" },
  { id: 7, name: "Google Scholar Indexing", body: "Google Scholar (Automated)", category: "Search Indexing", priority: "high", status: "in_progress", cost: "Free", deadline: "", url: "https://scholar.google.com/intl/en/scholar/inclusion.html", documents: "Scholar meta tags on article pages, DOIs, structured HTML", notes: "Already partially implemented via ScholarMetaTags component. Confirm all article pages have correct citation meta tags.", blocker: "" },
  { id: 8, name: "ORCID Integration", body: "ORCID", category: "Author Identity", priority: "high", status: "done", cost: "Free", deadline: "", url: "https://orcid.org/", documents: "ORCID fields in author submission form", notes: "Already implemented in submission system.", blocker: "" },
  { id: 9, name: "OpenAIRE Registration", body: "OpenAIRE", category: "Open Access", priority: "medium", status: "not_started", cost: "Free", deadline: "2027-01-01", url: "https://www.openaire.eu/", documents: "OAI-PMH metadata endpoint, DOAJ listing (preferred)", notes: "Exposes journals to EU Horizon-funded researchers. Requires OAI-PMH endpoint.", blocker: "Needs DOAJ first (preferred)" },
  { id: 10, name: "Scopus Application", body: "Elsevier / Scopus CSAB", category: "Prestige Indexing", priority: "high", status: "not_started", cost: "Free to apply", deadline: "2027-06-01", url: "https://www.elsevier.com/solutions/scopus", documents: "3+ years publishing history, COPE membership, DOAJ listing, peer review policy, ISSN, CrossRef DOIs", notes: "Takes 12–18 months. Major institutional KPI — universities measure research output by Scopus records.", blocker: "Needs 3yr history, DOAJ, COPE" },
  { id: 11, name: "Web of Science Application", body: "Clarivate", category: "Prestige Indexing", priority: "high", status: "not_started", cost: "Free to apply", deadline: "2028-01-01", url: "https://clarivate.com/web-of-science/", documents: "Sustained publishing record, citation evidence, COPE, ISSN", notes: "Highest prestige. Impact Factor calculated from WoS. Long-term goal.", blocker: "Needs Scopus listing first" },
  { id: 12, name: "WHO African Index Medicus", body: "WHO AFRO", category: "African Recognition", priority: "medium", status: "not_started", cost: "Free", deadline: "2027-03-01", url: "https://indexmedicus.afro.who.int/", documents: "Health/biomedical journal details, ISSN, peer review policy", notes: "Critical for health, medicine and public health journals.", blocker: "Needs ISSN + health journals published" },
  { id: 13, name: "Sherpa Romeo Listing", body: "Sherpa Romeo (Jisc)", category: "Author Rights", priority: "medium", status: "not_started", cost: "Free", deadline: "2026-09-01", url: "https://v2.sherpa.ac.uk/romeo/", documents: "Journal OA & self-archiving policy, ISSN", notes: "Authors check Sherpa Romeo before every submission.", blocker: "Needs ISSN" },
  { id: 14, name: "ROR Affiliation Registration", body: "Research Organization Registry", category: "Author Identity", priority: "medium", status: "not_started", cost: "Free", deadline: "2026-10-01", url: "https://ror.org/", documents: "Organization details, website, legal entity proof", notes: "Ensures correct institutional affiliation metadata in CrossRef, Scopus & OpenAIRE.", blocker: "Needs legal entity" },
];

export default function ComplianceTracker() {
  const [registrations, setRegistrations] = useState(INITIAL_REGISTRATIONS);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filter, setFilter] = useState("all");

  const categories = [...new Set(INITIAL_REGISTRATIONS.map(r => r.category))];

  const summary = {
    done: registrations.filter(r => r.status === "done").length,
    in_progress: registrations.filter(r => r.status === "in_progress").length,
    not_started: registrations.filter(r => r.status === "not_started").length,
    blocked: registrations.filter(r => r.status === "blocked").length,
  };

  const filtered = filter === "all" ? registrations :
    ["done", "in_progress", "not_started", "blocked"].includes(filter)
      ? registrations.filter(r => r.status === filter)
      : registrations.filter(r => r.category === filter);

  const startEdit = (reg) => { setEditingId(reg.id); setEditForm({ ...reg }); };
  const saveEdit = () => {
    setRegistrations(prev => prev.map(r => r.id === editingId ? { ...editForm } : r));
    setEditingId(null);
  };
  const cycleStatus = (id) => {
    const order = ["not_started", "in_progress", "done", "blocked"];
    setRegistrations(prev => prev.map(r => {
      if (r.id !== id) return r;
      return { ...r, status: order[(order.indexOf(r.status) + 1) % order.length] };
    }));
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).map(([key, val]) => {
            const s = STATUS_CONFIG[key];
            return (
              <button key={key} onClick={() => setFilter(filter === key ? "all" : key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${filter === key ? "ring-2 ring-blue-400" : ""} ${s.color}`}>
                <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>
                {s.label}: <strong>{val}</strong>
              </button>
            );
          })}
        </div>
        <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border">
          <DollarSign className="w-4 h-4 inline text-slate-400 mr-1" />
          Total remaining: <strong>~$350+ USD/yr est.</strong>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "all" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          All ({registrations.length})
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === cat ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {cat} ({registrations.filter(r => r.category === cat).length})
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(reg => {
          const s = STATUS_CONFIG[reg.status];
          const p = PRIORITY_CONFIG[reg.priority];
          const isEditing = editingId === reg.id;

          return (
            <Card key={reg.id} className={`border-0 shadow-sm ${reg.status === "done" ? "opacity-70" : ""}`}>
              <CardContent className="p-5">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">{reg.name}</h3>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="bg-teal-600 hover:bg-teal-700 text-white gap-1"><Save className="w-3.5 h-3.5" /> Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="gap-1"><X className="w-3.5 h-3.5" /> Cancel</Button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
                        <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background">
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Deadline</label>
                        <Input type="date" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Notes / Progress</label>
                      <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Blocker / Dependency</label>
                      <Input value={editForm.blocker} onChange={e => setEditForm(f => ({ ...f, blocker: e.target.value }))} placeholder="e.g. Needs legal entity first" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{reg.name}</h3>
                          <Badge className={`border text-xs ${p.color}`}>{p.label}</Badge>
                          <Badge className={`border text-xs ${s.color}`}><s.icon className="w-3 h-3 mr-1" />{s.label}</Badge>
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{reg.category}</span>
                        </div>
                        <p className="text-sm text-slate-500">{reg.body}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => startEdit(reg)} className="gap-1 text-xs"><Edit2 className="w-3.5 h-3.5" /> Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => cycleStatus(reg.id)} className={`text-xs border ${s.color}`}>
                          <span className={`w-2 h-2 rounded-full ${s.dot} mr-1.5`}></span>Cycle
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{reg.notes}</p>
                    <div className="grid sm:grid-cols-3 gap-2 text-xs mb-3">
                      <div className="bg-slate-50 rounded-lg p-2.5 border">
                        <p className="text-slate-400 font-medium mb-0.5 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Cost</p>
                        <p className="text-slate-800 font-semibold">{reg.cost}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 border">
                        <p className="text-slate-400 font-medium mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Target</p>
                        <p className="text-slate-800 font-semibold">{reg.deadline ? new Date(reg.deadline).toLocaleDateString("en-AU", { month: "short", year: "numeric", day: "numeric" }) : "Ongoing"}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 border overflow-hidden">
                        <p className="text-slate-400 font-medium mb-0.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Documents</p>
                        <p className="text-slate-700 truncate" title={reg.documents}>{reg.documents}</p>
                      </div>
                    </div>
                    {reg.blocker && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span><strong>Dependency:</strong> {reg.blocker}</span>
                      </div>
                    )}
                    <a href={reg.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium w-fit">
                      Official registration page <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}