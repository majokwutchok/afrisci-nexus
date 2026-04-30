import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function QuickSubmit() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    keywords: [],
    author_name: "",
    author_email: "",
  });
  const [keywordInput, setKeywordInput] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u) {
        setUser(u);
        setForm((f) => ({
          ...f,
          author_name: u.full_name || "",
          author_email: u.email || "",
        }));
      }
    }).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be under 20 MB.");
      return;
    }
    setError(null);
    setPdfFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
      setError(null);
      setPdfFile(file);
    }
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !form.keywords.includes(kw)) {
      setForm((f) => ({ ...f, keywords: [...f.keywords, kw] }));
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw) => {
    setForm((f) => ({ ...f, keywords: f.keywords.filter((k) => k !== kw) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.abstract.trim()) { setError("Abstract is required."); return; }
    if (!form.author_email.trim()) { setError("Author email is required."); return; }
    if (!pdfFile) { setError("Please upload your manuscript PDF."); return; }

    setUploading(true);
    let pdf_url = "";
    try {
      const result = await base44.integrations.Core.UploadFile({ file: pdfFile });
      pdf_url = result.file_url;
    } catch (err) {
      setError("Failed to upload PDF. Please try again.");
      setUploading(false);
      return;
    }
    setUploading(false);

    setSubmitting(true);
    try {
      await base44.entities.Submission.create({
        ...form,
        pdf_url,
        status: "pending",
        submitted_date: new Date().toISOString().split("T")[0],
      });
      setSuccess(true);
    } catch (err) {
      setError("Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center shadow-2xl border-0">
          <CardContent className="p-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Received!</h2>
            <p className="text-slate-600 mb-6">
              Your manuscript has been submitted and is pending editorial review. You'll be contacted at <strong>{form.author_email}</strong>.
            </p>
            <Button onClick={() => { setSuccess(false); setForm({ title: "", abstract: "", keywords: [], author_name: user?.full_name || "", author_email: user?.email || "" }); setPdfFile(null); }}>
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit Your Manuscript</h1>
          <p className="text-slate-500">Upload your PDF and provide key metadata for editorial review.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PDF Upload */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" /> Manuscript PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !pdfFile && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  pdfFile
                    ? "border-teal-400 bg-teal-50"
                    : "border-slate-300 hover:border-teal-400 hover:bg-slate-50"
                }`}
              >
                {pdfFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-teal-600 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold text-slate-800 text-sm">{pdfFile.name}</p>
                      <p className="text-xs text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                      className="ml-2 p-1 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Drag & drop your PDF here</p>
                    <p className="text-slate-400 text-sm mt-1">or click to browse — max 20 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Manuscript Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="Full title of your manuscript"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="abstract">Abstract <span className="text-red-500">*</span></Label>
                <Textarea
                  id="abstract"
                  placeholder="Provide a concise summary of your research..."
                  value={form.abstract}
                  onChange={(e) => setForm((f) => ({ ...f, abstract: e.target.value }))}
                  className="min-h-[140px] resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a keyword and press Enter"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {form.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                        {kw}
                        <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Author Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="author_name">Full Name</Label>
                <Input
                  id="author_name"
                  placeholder="Your full name"
                  value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="author_email">Email Address <span className="text-red-500">*</span></Label>
                <Input
                  id="author_email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.author_email}
                  onChange={(e) => setForm((f) => ({ ...f, author_email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 text-base font-semibold"
            disabled={uploading || submitting}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading PDF...</>
            ) : submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Submit for Review</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}