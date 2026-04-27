import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ArticleBodyEditor from "@/components/submission/ArticleBodyEditor";
import ManuscriptPreviewModal from "@/components/submission/ManuscriptPreviewModal";
import {
  BookOpen, Upload, ChevronRight, ChevronLeft, Check,
  Eye, FileText, Users, Globe, Loader2, AlertCircle, ExternalLink, Plus, X, Trash2
} from "lucide-react";
import { jsPDF } from "jspdf";
import { stampAfriSciNexus } from "@/utils/pdfStamp";

const SPRINGER_JOURNALS = [
  { id: "nature", title: "Nature", scope: "Multidisciplinary science" },
  { id: "nature_comms", title: "Nature Communications", scope: "All natural sciences" },
  { id: "scientific_reports", title: "Scientific Reports", scope: "Broad science & medicine" },
  { id: "nature_medicine", title: "Nature Medicine", scope: "Clinical & biomedical research" },
  { id: "nature_climate", title: "Nature Climate Change", scope: "Climate change research" },
  { id: "springer_nature_africa", title: "Springer Nature – Africa Focus", scope: "Pan-African research" },
  { id: "bmc_bioinformatics", title: "BMC Bioinformatics", scope: "Computational biology" },
  { id: "bmc_medicine", title: "BMC Medicine", scope: "Clinical medicine" },
];

const STEPS = [
  { id: 1, label: "Journal", icon: BookOpen, description: "Select target Springer Nature journal" },
  { id: 2, label: "Metadata", icon: FileText, description: "Title, abstract & keywords" },
  { id: 3, label: "Body", icon: FileText, description: "Full article body" },
  { id: 4, label: "Authors", icon: Users, description: "Author details & affiliations" },
  { id: 5, label: "Review", icon: Check, description: "Preview & submit" },
];

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center min-w-[72px]">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all
                ${done ? "bg-emerald-500 border-emerald-500 text-white" : active ? "bg-orange-600 border-orange-600 text-white" : "border-slate-200 text-slate-400 bg-white"}`}>
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? "text-orange-700" : done ? "text-emerald-600" : "text-slate-400"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const emptyAuthor = { name: "", email: "", affiliation: "", orcid: "", country: "", is_corresponding: false };

export default function SpringerNatureSubmission() {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [keywordInput, setKeywordInput] = useState("");

  const [form, setForm] = useState({
    journal_id: "",
    title: "",
    abstract: "",
    body: "",
    keywords: [],
    review_type: "double_blind",
    language: "english",
    manuscript_file_url: "",
    supplementary_files: [],
    authors: [{ ...emptyAuthor, is_corresponding: true }],
    cover_letter: "",
  });

  const [uploading, setUploading] = useState(false);

  const set = (field, value) => { setForm(p => ({ ...p, [field]: value })); setValidationError(null); };

  const selectedJournal = SPRINGER_JOURNALS.find(j => j.id === form.journal_id) || null;

  const addKeyword = () => {
    if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
      set("keywords", [...form.keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };
  const removeKeyword = (k) => set("keywords", form.keywords.filter(x => x !== k));

  const addAuthor = () => set("authors", [...form.authors, { ...emptyAuthor }]);
  const removeAuthor = (i) => set("authors", form.authors.filter((_, idx) => idx !== i));
  const updateAuthor = (i, f, v) => {
    const next = [...form.authors];
    next[i] = { ...next[i], [f]: v };
    set("authors", next);
  };
  const setCorresponding = (i) => set("authors", form.authors.map((a, idx) => ({ ...a, is_corresponding: idx === i })));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("manuscript_file_url", file_url);
    setUploading(false);
  };

  const validate = () => {
    if (step === 1 && !form.journal_id) return "Please select a journal.";
    if (step === 2) {
      if (!form.title.trim()) return "Please enter a title.";
      if (!form.abstract.trim()) return "Please provide an abstract.";
      if (form.keywords.length < 3) return "Please add at least 3 keywords.";
    }
    if (step === 4) {
      for (const a of form.authors) {
        if (!a.name.trim() || !a.email.trim() || !a.affiliation.trim()) return "Please complete all required author fields.";
      }
    }
    return null;
  };

  const next = () => {
    const err = validate();
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    setStep(s => Math.min(s + 1, STEPS.length));
  };
  const back = () => { setValidationError(null); setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Save as manuscript in our system (cross-submitted)
    await base44.entities.Manuscript.create({
      title: form.title,
      abstract: form.abstract,
      formatted_body: form.body,
      keywords: form.keywords,
      authors: form.authors,
      manuscript_file_url: form.manuscript_file_url,
      supplementary_files: form.supplementary_files,
      language: form.language,
      review_type: form.review_type,
      status: "submitted",
      submission_date: new Date().toISOString().split("T")[0],
      timeline: [{ status: "submitted", date: new Date().toISOString().split("T")[0], actor: "Author", comment: `Submitted to Springer Nature — ${selectedJournal?.title}` }],
    }).catch(() => {});
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center border-0 shadow-2xl">
          <CardContent className="p-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Prepared!</h2>
            <p className="text-slate-600 mb-2">Your manuscript has been saved to AfriSci Nexus.</p>
            <p className="text-sm text-slate-500 mb-6">
              To complete Springer Nature submission, visit{" "}
              <a href="https://www.springer.com/authors/manuscript+guidelines" target="_blank" rel="noreferrer" className="text-orange-600 underline">
                Springer Nature's portal <ExternalLink className="w-3 h-3 inline" />
              </a>{" "}
              and upload your prepared document.
            </p>
            <Link to={createPageUrl("MyManuscripts")}>
              <Button className="bg-orange-600 hover:bg-orange-700 w-full">View My Manuscripts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-slate-50 to-slate-100 p-6">
      {showPreview && (
        <ManuscriptPreviewModal
          manuscript={{ ...form, formatted_body: form.body }}
          journal={selectedJournal ? { title: `Springer Nature — ${selectedJournal.title}` } : null}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Submit to Springer Nature</h1>
            <p className="text-slate-500 text-sm">Prepare and track your Springer Nature submission</p>
          </div>
          <div className="ml-auto">
            <Badge className="bg-orange-100 text-orange-800 border border-orange-200">
              <ExternalLink className="w-3 h-3 mr-1" /> Springer Nature Portal
            </Badge>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            This tool helps you prepare your manuscript for Springer Nature and saves a copy in AfriSci Nexus.
            Final submission must be completed via{" "}
            <a href="https://www.springer.com/gp/authors-editors/journal-author/journal-submission-guidelines/791" target="_blank" rel="noreferrer" className="underline font-medium">Springer Nature's official portal</a>.
          </div>
        </div>

        <Card className="border border-slate-200 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <StepDots current={step} />

            {/* Step 1: Journal selection */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Select Springer Nature Journal</h2>
                <div className="grid gap-3">
                  {SPRINGER_JOURNALS.map(j => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => set("journal_id", j.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${form.journal_id === j.id ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{j.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{j.scope}</p>
                        </div>
                        {form.journal_id === j.id && <Check className="w-5 h-5 text-orange-600 flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Metadata */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-slate-900">Manuscript Details</h2>
                <div>
                  <Label>Title *</Label>
                  <Input className="mt-1" placeholder="Manuscript title" value={form.title} onChange={e => set("title", e.target.value)} />
                </div>
                <div>
                  <Label>Abstract * (200–400 words)</Label>
                  <Textarea className="mt-1" rows={7} placeholder="Structured abstract: Background, Methods, Results, Conclusions" value={form.abstract} onChange={e => set("abstract", e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">{form.abstract.split(" ").filter(Boolean).length} words</p>
                </div>
                <div>
                  <Label>Keywords * (min 3)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input placeholder="Add keyword, press Enter" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword())} />
                    <Button variant="outline" onClick={addKeyword}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.keywords.map(k => (
                      <Badge key={k} variant="secondary" className="flex items-center gap-1">
                        {k} <X className="w-3 h-3 cursor-pointer" onClick={() => removeKeyword(k)} />
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Review Type</Label>
                    <Select value={form.review_type} onValueChange={v => set("review_type", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="double_blind">Double-Blind</SelectItem>
                        <SelectItem value="single_blind">Single-Blind</SelectItem>
                        <SelectItem value="open_review">Open Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select value={form.language} onValueChange={v => set("language", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                        <SelectItem value="portuguese">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Cover Letter (recommended for Springer Nature)</Label>
                  <Textarea className="mt-1" rows={4} placeholder="Briefly explain why your work is suitable for this journal..." value={form.cover_letter} onChange={e => set("cover_letter", e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 3: Body */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Article Body</h2>
                  <p className="text-sm text-slate-500 mt-1 mb-3">Write your full article or paste it here. Alternatively, upload a file below.</p>
                  <ArticleBodyEditor value={form.body} onChange={v => set("body", v)} />
                </div>
                <div>
                  <Label>Or upload a manuscript file (.pdf, .docx)</Label>
                  <div className={`mt-2 border-2 border-dashed rounded-xl p-5 text-center transition-colors ${form.manuscript_file_url ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-orange-400"}`}>
                    {form.manuscript_file_url ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700">
                        <Check className="w-5 h-5" />
                        <span className="text-sm font-medium">File uploaded</span>
                        <button onClick={() => set("manuscript_file_url", "")} className="ml-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin text-orange-600 mx-auto" /> : (
                          <>
                            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                            <p className="text-sm text-slate-600">Click to upload</p>
                          </>
                        )}
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Authors */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Authors</h2>
                {form.authors.map((a, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Author {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer text-xs text-blue-700 font-medium">
                          <input type="radio" checked={a.is_corresponding} onChange={() => setCorresponding(i)} className="accent-blue-600" />
                          Corresponding
                        </label>
                        {form.authors.length > 1 && (
                          <button onClick={() => removeAuthor(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Full name *" value={a.name} onChange={e => updateAuthor(i, "name", e.target.value)} />
                      <Input placeholder="Email *" value={a.email} onChange={e => updateAuthor(i, "email", e.target.value)} />
                      <Input placeholder="Affiliation / Institution *" className="sm:col-span-2" value={a.affiliation} onChange={e => updateAuthor(i, "affiliation", e.target.value)} />
                      <Input placeholder="ORCID (optional)" value={a.orcid} onChange={e => updateAuthor(i, "orcid", e.target.value)} />
                      <Input placeholder="Country" value={a.country} onChange={e => updateAuthor(i, "country", e.target.value)} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addAuthor} className="w-full border-dashed">
                  <Plus className="w-4 h-4 mr-2" /> Add Author
                </Button>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-slate-900">Review & Submit</h2>
                <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 w-full">
                  <Eye className="w-4 h-4" /> Preview Full Document
                </Button>
                <div className="space-y-3 text-sm">
                  {[
                    ["Journal", selectedJournal?.title],
                    ["Title", form.title],
                    ["Abstract", `${form.abstract.split(" ").filter(Boolean).length} words`],
                    ["Body", form.body ? `${form.body.split(" ").filter(Boolean).length} words` : "Not provided"],
                    ["Keywords", form.keywords.join(", ")],
                    ["Authors", form.authors.map(a => a.name).filter(Boolean).join(", ")],
                    ["Language", form.language],
                    ["Review Type", form.review_type.replace(/_/g, " ")],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-3 border-b border-slate-100 pb-2">
                      <span className="font-semibold text-slate-600 w-28 flex-shrink-0">{label}</span>
                      <span className="text-slate-800">{val || <span className="text-slate-400 italic">—</span>}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
                  <p className="font-semibold mb-1">Next step after submission:</p>
                  <p>Visit <a href="https://www.springer.com" target="_blank" rel="noreferrer" className="underline">springer.com</a> to upload your manuscript to the official Springer Nature submission system. This form records your draft in AfriSci Nexus.</p>
                </div>
              </div>
            )}

            {/* Validation error */}
            {validationError && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {validationError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <Button variant="outline" onClick={back} disabled={step === 1} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <span className="text-xs text-slate-400">Step {step} of {STEPS.length}</span>
              {step < STEPS.length ? (
                <Button onClick={next} className="bg-orange-600 hover:bg-orange-700 text-white gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSubmitting ? "Saving..." : "Save & Prepare Submission"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}