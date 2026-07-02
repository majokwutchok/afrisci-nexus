import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fetchProspectEmails } from "@/functions/fetchProspectEmails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Globe, Mail, Download, Search, Trash2, RefreshCw, Copy, CheckCircle, AlertCircle, Loader2
} from "lucide-react";

const AFRICAN_COUNTRIES = [
  "Nigeria","Kenya","South Africa","Ghana","Ethiopia","Tanzania","Uganda","Rwanda","Senegal",
  "Cameroon","Ivory Coast","Zambia","Zimbabwe","Mozambique","Angola","Sudan","Egypt","Morocco",
  "Algeria","Tunisia","Libya","Botswana","Namibia","Malawi","Lesotho","Eswatini","Sierra Leone",
  "Liberia","Guinea","Mali","Burkina Faso","Niger","Chad","Central African Republic","Congo",
  "DR Congo","Gabon","Equatorial Guinea","Djibouti","Somalia","Eritrea","South Sudan",
  "Burundi","Comoros","Mauritius","Madagascar","Cape Verde","Sao Tome and Principe",
  "Seychelles","Gambia","Benin","Togo"
].sort();

const INSTITUTION_TYPES = [
  { value: "university", label: "Universities & Colleges" },
  { value: "hospital", label: "Hospitals & Medical Schools" },
  { value: "school", label: "Secondary Schools" },
  { value: "research_institute", label: "Research Institutes" },
  { value: "ngo", label: "NGOs & Development Orgs" },
  { value: "government", label: "Government Ministries" },
  { value: "professional_association", label: "Professional Associations" },
];

// Free web-fetch discovery currently only covers these types (no AI/credits used)
const FETCHABLE_INSTITUTION_TYPES = [
  { value: "university", label: "Universities & Colleges" },
  { value: "hospital", label: "Hospitals & Medical Schools" },
  { value: "research_institute", label: "Research Institutes" },
];

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-800",
  emailed: "bg-amber-100 text-amber-800",
  responded: "bg-green-100 text-green-800",
  unsubscribed: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 50;

export default function EmailProspector() {
  const [country, setCountry] = useState("Nigeria");
  const [institutionType, setInstitutionType] = useState(FETCHABLE_INSTITUTION_TYPES[0].value);
  const [fetchPage, setFetchPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const [storedEmails, setStoredEmails] = useState([]);
  const [isLoadingStored, setIsLoadingStored] = useState(false);
  const [viewCountry, setViewCountry] = useState("Nigeria");
  const [viewType, setViewType] = useState("");
  const [viewPage, setViewPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("fetch");

  const loadStoredEmails = async () => {
    setIsLoadingStored(true);
    const filter = { country: viewCountry };
    if (viewType) filter.institution_type = viewType;
    const data = await base44.entities.ProspectEmail.filter(filter, '-created_date', 2000);
    setStoredEmails(data);
    setViewPage(1);
    setIsLoadingStored(false);
  };

  useEffect(() => { loadStoredEmails(); }, [viewCountry, viewType]);

  const handleFetch = async () => {
    setIsFetching(true);
    setFetchResult(null);
    setFetchError(null);
    const res = await fetchProspectEmails({ country, institution_type: institutionType, page: fetchPage }).catch(e => ({ error: e.message }));
    if (res.error) {
      setFetchError(res.error);
    } else {
      setFetchResult(res);
      if (viewCountry === country) loadStoredEmails();
    }
    setIsFetching(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.ProspectEmail.delete(id);
    setStoredEmails(prev => prev.filter(e => e.id !== id));
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.ProspectEmail.update(id, { campaign_status: status });
    setStoredEmails(prev => prev.map(e => e.id === id ? { ...e, campaign_status: status } : e));
  };

  const exportCSV = () => {
    const pagedData = storedEmails.slice((viewPage - 1) * PAGE_SIZE, viewPage * PAGE_SIZE);
    const rows = ["Email,Name,Institution,Department,Type,Country,Status,Source"]
      .concat(pagedData.map(e =>
        [e.email, e.contact_name || "", e.institution || "", e.department || "",
         e.institution_type || "", e.country, e.campaign_status, e.source_url || ""]
          .map(v => `"${v.replace(/"/g, '""')}"`)
          .join(",")
      ));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `afrisci_prospects_${viewCountry}_page${viewPage}.csv`; a.click();
  };

  const copyEmails = () => {
    const pagedData = storedEmails.slice((viewPage - 1) * PAGE_SIZE, viewPage * PAGE_SIZE);
    navigator.clipboard.writeText(pagedData.map(e => e.email).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPages = Math.ceil(storedEmails.length / PAGE_SIZE);
  const pagedEmails = storedEmails.slice((viewPage - 1) * PAGE_SIZE, viewPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-7 h-7 text-teal-600" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Email Prospector</h2>
          <p className="text-sm text-slate-500">Credit-free contact discovery from African institutions for partnership outreach</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className="bg-teal-100 text-teal-800">{storedEmails.length} stored</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[["fetch","🔍 Fetch New Emails"],["manage","📋 Manage Contacts"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "fetch" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600" /> Fetch Email Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                  {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Institution Type</label>
                <select value={institutionType} onChange={e => setInstitutionType(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                  {FETCHABLE_INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Page (batch of institutions)</label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setFetchPage(p => Math.max(1, p - 1))} disabled={fetchPage === 1}>-</Button>
                  <span className="text-sm font-semibold w-8 text-center">{fetchPage}</span>
                  <Button variant="outline" size="sm" onClick={() => setFetchPage(p => p + 1)}>+</Button>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-sm text-teal-800">
              <strong>✅ Credit-free:</strong> No AI is used. Each fetch reads Wikipedia's public directory of institutions, visits each institution's real website, and extracts published contact emails directly — completely free.
            </div>

            <Button onClick={handleFetch} disabled={isFetching} className="bg-teal-600 hover:bg-teal-700 text-white px-8">
              {isFetching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching institutions...</> : <><Search className="w-4 h-4 mr-2" /> Fetch Emails</>}
            </Button>

            {isFetching && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Visiting institutional websites in {country} and reading their public contact pages... This may take up to 15 seconds.
              </div>
            )}

            {fetchResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-800 font-semibold">
                  <CheckCircle className="w-5 h-5" /> Fetch Complete
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-700">{fetchResult.saved_count}</p>
                    <p className="text-green-600">New emails saved</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{fetchResult.duplicates_skipped}</p>
                    <p className="text-amber-600">Duplicates skipped</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{fetchResult.invalid_skipped}</p>
                    <p className="text-red-600">Invalid skipped</p>
                  </div>
                </div>
                <p className="text-sm text-green-700">Switch to "Manage Contacts" to view and export the results.</p>
              </div>
            )}

            {fetchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div><strong>Error:</strong> {fetchError}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "manage" && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" />
                Contact Database
                <Badge className="bg-slate-100 text-slate-700 ml-1">{storedEmails.length} total</Badge>
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={viewCountry} onChange={e => setViewCountry(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                  {AFRICAN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={viewType} onChange={e => setViewType(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                  <option value="">All Types</option>
                  {INSTITUTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={loadStoredEmails}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={copyEmails} disabled={pagedEmails.length === 0}>
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Emails"}
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV} disabled={pagedEmails.length === 0}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingStored ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading contacts...
              </div>
            ) : pagedEmails.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No contacts found for {viewCountry}</p>
                <p className="text-sm mt-1">Switch to "Fetch New Emails" to start collecting contacts.</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-500 mb-3">
                  Showing {(viewPage - 1) * PAGE_SIZE + 1}–{Math.min(viewPage * PAGE_SIZE, storedEmails.length)} of {storedEmails.length} contacts
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedEmails.map(email => (
                        <TableRow key={email.id}>
                          <TableCell className="font-mono text-sm text-blue-700">{email.email}</TableCell>
                          <TableCell className="text-sm">{email.contact_name || "—"}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate" title={email.institution}>{email.institution || "—"}</TableCell>
                          <TableCell>
                            <Badge className="text-xs bg-slate-100 text-slate-700">
                              {email.institution_type?.replace("_", " ") || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <select
                              value={email.campaign_status}
                              onChange={e => handleStatusChange(email.id, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[email.campaign_status]}`}
                            >
                              <option value="new">New</option>
                              <option value="emailed">Emailed</option>
                              <option value="responded">Responded</option>
                              <option value="unsubscribed">Unsubscribed</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {email.source_url && (
                                <a href={email.source_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600">
                                    <Globe className="w-3.5 h-3.5" />
                                  </Button>
                                </a>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                                onClick={() => handleDelete(email.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500">Page {viewPage} of {totalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewPage(p => Math.max(1, p - 1))} disabled={viewPage === 1}>← Prev</Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(totalPages - 4, viewPage - 2)) + i;
                        return (
                          <Button key={p} variant={p === viewPage ? "default" : "outline"} size="sm" className="w-9"
                            onClick={() => setViewPage(p)}>{p}</Button>
                        );
                      })}
                      <Button variant="outline" size="sm" onClick={() => setViewPage(p => Math.min(totalPages, p + 1))} disabled={viewPage === totalPages}>Next →</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}