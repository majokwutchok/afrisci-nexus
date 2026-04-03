import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Download, Link2, FileJson, FileCode2, ExternalLink } from "lucide-react";
import { assignDOI } from "@/functions/assignDOI";

function buildJSONMetadata(manuscript, journal) {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "doi": manuscript.doi,
    "url": manuscript.doi ? `https://doi.org/${manuscript.doi}` : window.location.href,
    "name": manuscript.title,
    "headline": manuscript.title,
    "description": manuscript.abstract,
    "keywords": manuscript.keywords?.join(", "),
    "inLanguage": manuscript.language || "en",
    "datePublished": manuscript.publication_date,
    "dateSubmitted": manuscript.submission_date,
    "accessMode": manuscript.access_type === "open_access" ? "textual" : "restricted",
    "isAccessibleForFree": manuscript.access_type === "open_access",
    "author": (manuscript.authors || []).map(a => ({
      "@type": "Person",
      "name": a.name,
      "email": a.email,
      "affiliation": { "@type": "Organization", "name": a.affiliation },
      "identifier": a.orcid ? { "@type": "PropertyValue", "propertyID": "ORCID", "value": a.orcid } : undefined
    })),
    "isPartOf": journal ? {
      "@type": "Periodical",
      "name": journal.title,
      "issn": journal.issn,
      "publisher": { "@type": "Organization", "name": "AfriSci Nexus" }
    } : undefined,
    "citation_count": manuscript.citation_count,
    "download_count": manuscript.download_count,
  };
}

function buildXMLMetadata(manuscript, journal) {
  const authors = (manuscript.authors || []).map(a => `
    <author>
      <name>${escXml(a.name)}</name>
      <email>${escXml(a.email || '')}</email>
      <affiliation>${escXml(a.affiliation || '')}</affiliation>
      ${a.orcid ? `<orcid>${escXml(a.orcid)}</orcid>` : ''}
      <is_corresponding>${a.is_corresponding ? 'true' : 'false'}</is_corresponding>
    </author>`).join('\n');

  const keywords = (manuscript.keywords || []).map(k => `    <keyword>${escXml(k)}</keyword>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<article xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <doi>${escXml(manuscript.doi || '')}</doi>
    <doi_url>${manuscript.doi ? `https://doi.org/${escXml(manuscript.doi)}` : ''}</doi_url>
    <title>${escXml(manuscript.title)}</title>
    <abstract>${escXml(manuscript.abstract || '')}</abstract>
    <language>${escXml(manuscript.language || 'english')}</language>
    <status>${escXml(manuscript.status)}</status>
    <access_type>${escXml(manuscript.access_type || 'open_access')}</access_type>
    <submission_date>${escXml(manuscript.submission_date || '')}</submission_date>
    <publication_date>${escXml(manuscript.publication_date || '')}</publication_date>
    <review_type>${escXml(manuscript.review_type || '')}</review_type>
    <keywords>
${keywords}
    </keywords>
    <authors>
${authors}
    </authors>
    ${journal ? `<journal>
      <title>${escXml(journal.title)}</title>
      <issn>${escXml(journal.issn || '')}</issn>
      <category>${escXml(journal.category || '')}</category>
      <publisher>AfriSci Nexus</publisher>
    </journal>` : ''}
    <metrics>
      <citation_count>${manuscript.citation_count || 0}</citation_count>
      <download_count>${manuscript.download_count || 0}</download_count>
      <view_count>${manuscript.view_count || 0}</view_count>
    </metrics>
  </metadata>
</article>`;
}

function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DOIPanel({ manuscript, journal, onDOIAssigned }) {
  const [copied, setCopied] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const copyDOI = () => {
    navigator.clipboard.writeText(`https://doi.org/${manuscript.doi}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssignDOI = async () => {
    setAssigning(true);
    try {
      const res = await assignDOI({ manuscript_id: manuscript.id });
      if (res.data?.doi && onDOIAssigned) onDOIAssigned(res.data.doi);
    } catch (e) {
      console.error(e);
    }
    setAssigning(false);
  };

  const exportJSON = () => {
    const data = buildJSONMetadata(manuscript, journal);
    const slug = manuscript.title?.slice(0, 30).replace(/\s+/g, '-').toLowerCase() || manuscript.id;
    downloadFile(JSON.stringify(data, null, 2), `${slug}-metadata.json`, 'application/json');
  };

  const exportXML = () => {
    const data = buildXMLMetadata(manuscript, journal);
    const slug = manuscript.title?.slice(0, 30).replace(/\s+/g, '-').toLowerCase() || manuscript.id;
    downloadFile(data, `${slug}-metadata.xml`, 'application/xml');
  };

  const isPublished = manuscript.status === 'published' || manuscript.status === 'online_first';

  return (
    <Card className="bg-white shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-4 h-4 text-teal-600" />
          DOI & Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DOI Display */}
        {manuscript.doi ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Digital Object Identifier</p>
            <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <code className="text-sm font-mono text-teal-800 flex-1 break-all">{manuscript.doi}</code>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={copyDOI}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              </Button>
            </div>
            <a
              href={`https://doi.org/${manuscript.doi}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              https://doi.org/{manuscript.doi}
            </a>
          </div>
        ) : isPublished ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">No DOI assigned yet.</p>
            <Button
              size="sm"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleAssignDOI}
              disabled={assigning}
            >
              {assigning ? 'Assigning…' : 'Assign DOI Now'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <Badge variant="outline" className="text-slate-500 text-xs">DOI assigned upon publication</Badge>
          </div>
        )}

        {/* DOI registered date */}
        {manuscript.doi_registered_date && (
          <p className="text-xs text-slate-400">Registered: {manuscript.doi_registered_date}</p>
        )}

        <Separator />

        {/* Metadata Export */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Export Metadata</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
              onClick={exportJSON}
            >
              <FileJson className="w-3.5 h-3.5" />
              JSON-LD
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={exportXML}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              XML
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Schema.org JSON-LD and Dublin Core XML for indexing by Google Scholar, Crossref, PubMed & others.
          </p>
        </div>

        {/* Indexing badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Google Scholar", "Crossref", "DOAJ", "PubMed"].map(idx => (
            <Badge key={idx} className="bg-slate-100 text-slate-600 text-xs font-normal">{idx}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}