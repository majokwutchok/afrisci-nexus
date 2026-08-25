import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { generateCertificatePDF } from "@/utils/generateCertificate";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Download, Search, Loader2 } from "lucide-react";

export default function VerifyCertificate() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code");
    if (c) { setCode(c); verify(c); }
  }, []);

  const verify = async (c) => {
    const codeToUse = (c || code).trim();
    if (!codeToUse) return;
    setStatus("loading"); setResult(null);
    try {
      const rows = await base44.entities.Certificate.filter({ certificate_code: codeToUse }, "-created_date", 5);
      const cert = (rows || [])[0];
      if (cert && cert.status === "active") { setResult(cert); setStatus("found"); }
      else setStatus("notfound");
    } catch { setStatus("notfound"); }
  };

  const download = () => {
    setDownloading(true);
    try {
      generateCertificatePDF({
        studentName: result.user_name, courseTitle: result.course_title,
        courseCode: result.course_code, certificateCode: result.certificate_code, issueDate: result.issue_date
      });
    } finally { setDownloading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Verify Certificate — AfriSci Nexus Discovery" description="Verify the authenticity of an AfriSci Nexus Discovery training certificate." canonicalPath="/VerifyCertificate" />
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-2"><ShieldCheck className="w-8 h-8" /> Certificate Verification</h1>
          <p className="text-blue-100">Verify the authenticity of any AfriSci Nexus Discovery training certificate.</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Enter certificate code (e.g. ASN-2026-...)" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Verify</Button>
        </form>

        {status === "loading" && <Skeleton className="h-48 rounded-xl" />}
        {status === "notfound" && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <ShieldCheck className="w-14 h-14 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-500 text-lg">Certificate not found</p>
            <p className="text-sm text-slate-400 mt-1">Check the code and try again. Only active certificates verify.</p>
          </div>
        )}
        {status === "found" && result && (
          <div className="bg-white rounded-2xl border border-teal-200 shadow-lg p-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-teal-100 text-teal-800"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</Badge>
              <span className="text-sm text-slate-500">AfriSci Nexus Discovery</span>
            </div>
            <p className="text-sm text-slate-500">This certifies that</p>
            <h2 className="text-2xl font-bold text-slate-900 my-1">{result.user_name}</h2>
            <p className="text-sm text-slate-500">has successfully completed</p>
            <h3 className="text-xl font-semibold text-teal-700 my-1">{result.course_title}</h3>
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <div><p className="text-slate-400">Course ID</p><p className="font-mono font-medium">{result.course_code}</p></div>
              <div><p className="text-slate-400">Issue date</p><p className="font-medium">{new Date(result.issue_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p></div>
              <div className="col-span-2"><p className="text-slate-400">Certificate code</p><p className="font-mono font-medium">{result.certificate_code}</p></div>
            </div>
            <Button onClick={download} disabled={downloading} className="bg-teal-600 hover:bg-teal-700 text-white mt-6">
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download certificate (PDF)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}