import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Quote, Copy, Check, Plus, ExternalLink, BookMarked } from "lucide-react";

function formatAPA(ms, journal) {
  const authors = (ms.authors || []);
  const authorStr = authors.length === 0
    ? "Unknown Author"
    : authors.length === 1
      ? `${authors[0].name}`
      : authors.length <= 6
        ? authors.slice(0, -1).map(a => a.name).join(", ") + ", & " + authors[authors.length - 1].name
        : authors.slice(0, 6).map(a => a.name).join(", ") + ", ... " + authors[authors.length - 1].name;

  const year = ms.publication_date ? new Date(ms.publication_date).getFullYear() : "n.d.";
  const journalName = journal?.title ? `*${journal.title}*` : "";
  const doi = ms.doi ? ` https://doi.org/${ms.doi}` : "";

  return `${authorStr} (${year}). ${ms.title}. ${journalName}. ${doi}`.trim();
}

function formatMLA(ms, journal) {
  const authors = (ms.authors || []);
  let authorStr = "Unknown Author";
  if (authors.length === 1) {
    authorStr = authors[0].name;
  } else if (authors.length === 2) {
    authorStr = `${authors[0].name}, and ${authors[1].name}`;
  } else if (authors.length > 2) {
    authorStr = `${authors[0].name}, et al`;
  }

  const year = ms.publication_date ? new Date(ms.publication_date).getFullYear() : "";
  const journalName = journal?.title ? `*${journal.title}*` : "";
  const doi = ms.doi ? ` https://doi.org/${ms.doi}` : "";

  return `${authorStr}. "${ms.title}." ${journalName}, ${year}.${doi}`;
}

function formatChicago(ms, journal) {
  const authors = (ms.authors || []);
  let authorStr = "Unknown Author";
  if (authors.length === 1) {
    authorStr = authors[0].name;
  } else if (authors.length > 1) {
    authorStr = authors.map(a => a.name).join(", ");
  }

  const year = ms.publication_date ? new Date(ms.publication_date).getFullYear() : "n.d.";
  const journalName = journal?.title ? `*${journal.title}*` : "";
  const doi = ms.doi ? ` https://doi.org/${ms.doi}` : "";

  return `${authorStr}. "${ms.title}." ${journalName} (${year}).${doi}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCopy}>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
    </Button>
  );
}

export default function CitationTracker({ manuscript, journal, onCitationAdded }) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const apa = formatAPA(manuscript, journal);
  const mla = formatMLA(manuscript, journal);
  const chicago = formatChicago(manuscript, journal);

  const handleReportCitation = async () => {
    if (!sourceTitle.trim()) return;
    setSubmitting(true);
    const newCount = (manuscript.citation_count || 0) + 1;
    await base44.entities.Manuscript.update(manuscript.id, {
      citation_count: newCount
    });
    setSubmitted(true);
    setShowReportForm(false);
    setSourceUrl("");
    setSourceTitle("");
    if (onCitationAdded) onCitationAdded(newCount);
    setSubmitting(false);
  };

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-teal-600" />
            Citations
          </span>
          <Badge className="bg-teal-100 text-teal-800 font-bold text-sm px-2">
            {manuscript.citation_count || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Report a citation */}
        {submitted && (
          <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            <Check className="w-4 h-4" /> Citation reported — thank you!
          </div>
        )}

        {!showReportForm ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700"
            onClick={() => setShowReportForm(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Report a Citation
          </Button>
        ) : (
          <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-600">Report where this article was cited</p>
            <Input
              placeholder="Citing article title *"
              value={sourceTitle}
              onChange={e => setSourceTitle(e.target.value)}
              className="text-sm h-8"
            />
            <Input
              placeholder="URL or DOI (optional)"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              className="text-sm h-8"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs"
                onClick={handleReportCitation}
                disabled={submitting || !sourceTitle.trim()}
              >
                {submitting ? "Saving…" : "Submit"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setShowReportForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Cite this article */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Quote className="w-3.5 h-3.5" /> Cite this Article
          </p>
          <Tabs defaultValue="apa">
            <TabsList className="grid grid-cols-3 h-7 mb-3">
              <TabsTrigger value="apa" className="text-xs">APA</TabsTrigger>
              <TabsTrigger value="mla" className="text-xs">MLA</TabsTrigger>
              <TabsTrigger value="chicago" className="text-xs">Chicago</TabsTrigger>
            </TabsList>

            {[
              { value: "apa", text: apa },
              { value: "mla", text: mla },
              { value: "chicago", text: chicago },
            ].map(({ value, text }) => (
              <TabsContent key={value} value={value}>
                <div className="relative bg-slate-50 border border-slate-200 rounded-lg p-3 pr-8 text-xs text-slate-700 leading-relaxed font-serif">
                  {text}
                  <div className="absolute top-2 right-2">
                    <CopyButton text={text} />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* DOI link */}
        {manuscript.doi && (
          <a
            href={`https://doi.org/${manuscript.doi}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            https://doi.org/{manuscript.doi}
          </a>
        )}
      </CardContent>
    </Card>
  );
}