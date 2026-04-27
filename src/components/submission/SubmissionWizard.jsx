import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Upload, Users, ShieldAlert, ChevronRight, ChevronLeft,
  Check, Plus, Trash2, Loader2, Eye, Edit3
} from "lucide-react";
import ArticleBodyEditor from "./ArticleBodyEditor";
import ManuscriptPreviewModal from "./ManuscriptPreviewModal";

const STORAGE_KEY = "afrisci_submission_draft";

const STEPS = [
  { id: 1, label: "Metadata", icon: FileText, description: "Title, abstract & keywords" },
  { id: 2, label: "Body", icon: Edit3, description: "Article body content" },
  { id: 3, label: "Files", icon: Upload, description: "Manuscript & supplementary files" },
  { id: 4, label: "Authors", icon: Users, description: "Author attribution" },
  { id: 5, label: "Disclosures", icon: ShieldAlert, description: "Conflict of interest" },
];

const emptyAuthor = { name: "", email: "", affiliation: "", orcid: "", is_corresponding: false };

const defaultFormData = {
  title: "",
  abstract: "",
  keywords: "",
  body: "",
  journal_id: "",
  language: "english",
  review_type: "double_blind",
  manuscript_file_url: "",
  supplementary_files: [],
  authors: [{ ...emptyAuthor, is_corresponding: true }],
  conflict_of_interest: "none",
  conflict_details: "",
  funding_statement: "",
  data_availability: "",
};

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[80px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? "bg-emerald-500 border-emerald-500 text-white" :
                  active ? "bg-blue-900 border-blue-900 text-white" :
                  "bg-white border-slate-300 text-slate-400"}`}>
                {done ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? "text-blue-900" : done ? "text-emerald-600" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 transition-all ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Step1Metadata({ data, onChange, journals }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Manuscript Title *</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your manuscript title"
          value={data.title}
          onChange={e => onChange("title", e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Abstract *</label>
        <textarea
          rows={5}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provide a structured abstract (background, methods, results, conclusions)"
          value={data.abstract}
          onChange={e => onChange("abstract", e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Keywords *</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Separate keywords with commas (e.g. malaria, public health, Africa)"
          value={data.keywords}
          onChange={e => onChange("keywords", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Target Journal</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data.journal_id}
            onChange={e => onChange("journal_id", e.target.value)}
          >
            <option value="">— Select a journal —</option>
            {journals.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Language</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data.language}
            onChange={e => onChange("language", e.target.value)}
          >
            <option value="english">English</option>
            <option value="french">French</option>
            <option value="portuguese">Portuguese</option>
            <option value="arabic">Arabic</option>
            <option value="swahili">Swahili</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Review Type</label>
        <div className="flex gap-3 flex-wrap">
          {["double_blind", "single_blind", "open_review"].map(rt => (
            <label key={rt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
              ${data.review_type === rt ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" className="accent-blue-600" checked={data.review_type === rt} onChange={() => onChange("review_type", rt)} />
              <span className="text-sm capitalize">{rt.replace(/_/g, " ")}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Files({ data, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [suppUploading, setSuppUploading] = useState(false);

  const handleManuscriptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange("manuscript_file_url", file_url);
    setUploading(false);
  };

  const handleSuppUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSuppUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange("supplementary_files", [...data.supplementary_files, file_url]);
    setSuppUploading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Manuscript File * (PDF, DOCX)</label>
        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${data.manuscript_file_url ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-blue-400"}`}>
          {data.manuscript_file_url ? (
            <div className="flex items-center justify-center gap-2 text-emerald-700">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Manuscript uploaded successfully</span>
              <button onClick={() => onChange("manuscript_file_url", "")} className="ml-2 text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX up to 50MB</p>
                </>
              )}
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleManuscriptUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Supplementary Files (optional)</label>
        <div className="space-y-2 mb-3">
          {data.supplementary_files.map((url, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-600 truncate flex-1">Supplementary file {i + 1}</span>
              <button onClick={() => onChange("supplementary_files", data.supplementary_files.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <label className={`flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors w-fit ${suppUploading ? "opacity-60 pointer-events-none" : ""}`}>
          {suppUploading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Plus className="w-4 h-4 text-slate-500" />}
          <span className="text-sm text-slate-600">{suppUploading ? "Uploading..." : "Add supplementary file"}</span>
          <input type="file" className="hidden" onChange={handleSuppUpload} disabled={suppUploading} />
        </label>
      </div>
    </div>
  );
}

function Step3Authors({ data, onChange }) {
  const updateAuthor = (i, field, value) => {
    const updated = data.authors.map((a, idx) => idx === i ? { ...a, [field]: value } : a);
    onChange("authors", updated);
  };
  const addAuthor = () => onChange("authors", [...data.authors, { ...emptyAuthor }]);
  const removeAuthor = (i) => onChange("authors", data.authors.filter((_, idx) => idx !== i));
  const setCorresponding = (i) => onChange("authors", data.authors.map((a, idx) => ({ ...a, is_corresponding: idx === i })));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">List all authors in order of contribution. Mark the corresponding author.</p>
      {data.authors.map((author, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Author {i + 1}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={author.is_corresponding} onChange={() => setCorresponding(i)} className="accent-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Corresponding</span>
              </label>
              {data.authors.length > 1 && (
                <button onClick={() => removeAuthor(i)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full name *" value={author.name} onChange={e => updateAuthor(i, "name", e.target.value)} />
            <input className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email *" value={author.email} onChange={e => updateAuthor(i, "email", e.target.value)} />
            <input className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2"
              placeholder="Affiliation / Institution *" value={author.affiliation} onChange={e => updateAuthor(i, "affiliation", e.target.value)} />
            <input className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ORCID (optional)" value={author.orcid} onChange={e => updateAuthor(i, "orcid", e.target.value)} />
          </div>
          {author.is_corresponding && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">Corresponding Author</Badge>
          )}
        </div>
      ))}
      <Button variant="outline" onClick={addAuthor} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Add Another Author
      </Button>
    </div>
  );
}

function Step4Disclosures({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Conflict of Interest *</label>
        <div className="space-y-2">
          {[
            { value: "none", label: "No conflict of interest to declare" },
            { value: "financial", label: "Financial conflict (employment, consultancy, stocks, honoraria, patents)" },
            { value: "personal", label: "Personal conflict (personal relationships, academic competition)" },
            { value: "other", label: "Other conflict" },
          ].map(opt => (
            <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${data.conflict_of_interest === opt.value ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <input type="radio" className="mt-0.5 accent-blue-600" checked={data.conflict_of_interest === opt.value}
                onChange={() => onChange("conflict_of_interest", opt.value)} />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
        {data.conflict_of_interest !== "none" && (
          <textarea rows={3} className="mt-3 w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Please describe the conflict in detail..."
            value={data.conflict_details} onChange={e => onChange("conflict_details", e.target.value)} />
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Funding Statement</label>
        <textarea rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe any funding sources, grants, or institutional support (or state 'No funding received')"
          value={data.funding_statement} onChange={e => onChange("funding_statement", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Data Availability Statement</label>
        <textarea rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Where can readers access the data supporting this research? (e.g. repository URL, 'available on request')"
          value={data.data_availability} onChange={e => onChange("data_availability", e.target.value)} />
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-800 font-medium mb-1">Declaration</p>
        <p className="text-xs text-amber-700">
          By submitting, you confirm that all authors have approved this manuscript, the work is original and has not been published elsewhere, 
          and all declarations above are accurate and complete.
        </p>
      </div>
    </div>
  );
}

function Step2Body({ data, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Write or paste your full article body here. You can use section headings (## Introduction, ## Methods, etc.). 
        This content will be combined with your abstract in the final document.
      </p>
      <ArticleBodyEditor
        value={data.body}
        onChange={val => onChange("body", val)}
        compact
      />
      <p className="text-xs text-slate-400 italic">Optional — you can also upload a manuscript file in the next step.</p>
    </div>
  );
}

function validate(step, data) {
  if (step === 1) {
    if (!data.title.trim()) return "Please enter a manuscript title.";
    if (!data.abstract.trim()) return "Please provide an abstract.";
    if (!data.keywords.trim()) return "Please enter at least one keyword.";
  }
  // step 2 (body) is optional
  if (step === 3) {
    if (!data.manuscript_file_url && !data.body?.trim()) return "Please upload a manuscript file or enter article body content.";
  }
  if (step === 4) {
    for (const a of data.authors) {
      if (!a.name.trim() || !a.email.trim() || !a.affiliation.trim()) return "Please complete all required author fields (name, email, affiliation).";
    }
    if (!data.authors.some(a => a.is_corresponding)) return "Please designate a corresponding author.";
  }
  if (step === 5) {
    if (!data.conflict_of_interest) return "Please select a conflict of interest option.";
  }
  return null;
}

export default function SubmissionWizard({ journals, onSubmit, isLoading }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultFormData;
    } catch { return defaultFormData; }
  });
  const [validationError, setValidationError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const next = () => {
    const err = validate(step, formData);
    if (err) { setValidationError(err); return; }
    setValidationError(null);
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  const back = () => { setValidationError(null); setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = () => {
    const err = validate(step, formData);
    if (err) { setValidationError(err); return; }
    const payload = {
      ...formData,
      keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
    };
    localStorage.removeItem(STORAGE_KEY);
    onSubmit(payload);
  };

  const stepComponent = {
    1: <Step1Metadata data={formData} onChange={handleChange} journals={journals} />,
    2: <Step2Body data={formData} onChange={handleChange} />,
    3: <Step2Files data={formData} onChange={handleChange} />,
    4: <Step3Authors data={formData} onChange={handleChange} />,
    5: <Step4Disclosures data={formData} onChange={handleChange} />,
  };

  return (
    <>
    {showPreview && (
      <ManuscriptPreviewModal
        manuscript={{
          ...formData,
          keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
        }}
        journal={journals.find(j => j.id === formData.journal_id) || null}
        onClose={() => setShowPreview(false)}
      />
    )}
    <Card className="border border-slate-200 shadow-lg">
      <CardContent className="p-6 sm:p-8">
        <StepIndicator currentStep={step} />

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">{STEPS[step - 1].label}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{STEPS[step - 1].description}</p>
        </div>

        {stepComponent[step]}

        {validationError && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {validationError}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <Button variant="outline" onClick={back} disabled={step === 1} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Step {step} of {STEPS.length}</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              onClick={() => setShowPreview(true)}
              disabled={!formData.title && !formData.abstract}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>
          </div>
          {step < STEPS.length ? (
            <Button onClick={next} className="bg-blue-900 hover:bg-blue-800 gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isLoading ? "Submitting..." : "Submit Manuscript"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}