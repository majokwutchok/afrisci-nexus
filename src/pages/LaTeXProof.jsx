import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { convertLatex } from '@/functions/convertLatex';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText, Download, RefreshCw, AlertCircle, CheckCircle,
  Eye, ArrowLeft, BookOpen, Loader, Code2, Info
} from 'lucide-react';

const SAMPLE_LATEX = `\\section{Introduction}
This manuscript explores the intersection of computational linguistics and 
African language processing. Our study examines morphological patterns in 
Swahili, Amharic, and Yoruba using neural network architectures.

\\section{Methodology}
We employed a transformer-based model fine-tuned on a corpus of 
\\textbf{2.3 million tokens} collected from regional news sources.

\\begin{equation}
  P(w_t | w_{t-1}, \\ldots, w_1) = \\frac{\\exp(h_t^T e_{w_t})}{\\sum_{w'} \\exp(h_t^T e_{w'})}
\\end{equation}

\\section{Results}
Table~\\ref{tab:results} summarises performance across all three languages.

\\begin{table}[h]
\\centering
\\begin{tabular}{lccc}
\\toprule
\\textbf{Language} & \\textbf{Precision} & \\textbf{Recall} & \\textbf{F1} \\\\
\\midrule
Swahili   & 0.91 & 0.89 & 0.90 \\\\
Amharic   & 0.87 & 0.85 & 0.86 \\\\
Yoruba    & 0.83 & 0.82 & 0.83 \\\\
\\bottomrule
\\end{tabular}
\\caption{Model performance by language}
\\label{tab:results}
\\end{table}

\\section{Conclusion}
Our results demonstrate that multilingual transformer models can be 
effectively adapted for low-resource African languages with minimal 
task-specific fine-tuning.`;

export default function LaTeXProof() {
  const [searchParams] = useSearchParams();
  const manuscriptId = searchParams.get('id');

  const [manuscript, setManuscript] = useState(null);
  const [latexSource, setLatexSource] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState(null);
  const [errorLog, setErrorLog] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const pdfRef = useRef(null);

  useEffect(() => {
    if (manuscriptId) {
      base44.entities.Manuscript.filter({ id: manuscriptId }).then(data => {
        if (data && data.length > 0) setManuscript(data[0]);
      }).catch(() => {});
    }
  }, [manuscriptId]);

  const handleCompile = async () => {
    if (!latexSource.trim()) {
      setError('Please enter your LaTeX source code.');
      return;
    }
    setIsCompiling(true);
    setError(null);
    setErrorLog(null);
    setSuccess(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const res = await convertLatex({
        latex_source: latexSource,
        manuscript_title: manuscript?.title || 'Manuscript',
      });

      // Handle response (axios or raw)
      const responseData = res.data || res;
      
      if (responseData?.error) {
        setError(responseData.error);
        setErrorLog(responseData.log || responseData.details || null);
      } else if (responseData?.pdf_base64) {
        const binary = atob(responseData.pdf_base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setSuccess(true);
        setActiveTab('preview');
      } else {
        setError('No PDF generated. Please check your LaTeX syntax.');
      }
    } catch (err) {
      console.error('LaTeX compilation error:', err);
      setError(err.message || 'Compilation request failed. Please try again.');
    }
    setIsCompiling(false);
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${(manuscript?.title || 'manuscript').replace(/\s+/g, '_')}_proof.pdf`;
    a.click();
  };

  const handleLoadSample = () => {
    setLatexSource(SAMPLE_LATEX);
    setError(null);
    setPdfUrl(null);
    setSuccess(false);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {manuscriptId && (
              <Link to={createPageUrl(`ManuscriptDetail?id=${manuscriptId}`)}>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              </Link>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">LaTeX Proof Generator</h1>
                <Badge className="bg-teal-100 text-teal-800">Beta</Badge>
              </div>
              {manuscript && (
                <p className="text-sm text-slate-600 ml-10 truncate max-w-lg">{manuscript.title}</p>
              )}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1">
              <Code2 className="w-4 h-4" /> Load Sample
            </Button>
            {pdfUrl && (
              <Button size="sm" onClick={handleDownload} className="bg-teal-600 hover:bg-teal-700 gap-1">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Paste your LaTeX source below (body content only, or a full document) and click <strong>Compile to PDF</strong> to generate a formatted proof. 
            Review the output before submitting your final manuscript.
          </p>
        </div>

        {/* Errors */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{error}</strong>
              {errorLog && (
                <pre className="mt-2 text-xs bg-red-950 text-red-100 p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                  {errorLog}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              PDF compiled successfully! Scroll down to preview or download your proof.
            </AlertDescription>
          </Alert>
        )}

        {/* Tab toggle */}
        <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'editor' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-4 h-4" /> LaTeX Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            disabled={!pdfUrl}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'preview' ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" /> PDF Preview
          </button>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'editor' && (
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                    LaTeX Source
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1 text-xs">
                      <Code2 className="w-3 h-3" /> Sample
                    </Button>
                    <Button
                      onClick={handleCompile}
                      disabled={isCompiling || !latexSource.trim()}
                      className="bg-teal-600 hover:bg-teal-700 gap-1"
                      size="sm"
                    >
                      {isCompiling ? (
                        <><Loader className="w-4 h-4 animate-spin" /> Compiling...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4" /> Compile to PDF</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={latexSource}
                  onChange={e => setLatexSource(e.target.value)}
                  placeholder={`Paste your LaTeX source here...\n\nYou can paste body content only (\\section{}, \\begin{equation}…) or a full \\documentclass{…}…\\end{document} document.\n\nClick "Sample" above to load an example.`}
                  className="w-full h-[500px] font-mono text-sm bg-slate-950 text-emerald-300 p-4 rounded-xl border border-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-600"
                  spellCheck={false}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-500">
                    {latexSource.length.toLocaleString()} characters · Powered by LaTeX.Online
                  </p>
                  <Button
                    onClick={handleCompile}
                    disabled={isCompiling || !latexSource.trim()}
                    className="bg-teal-600 hover:bg-teal-700 gap-2"
                  >
                    {isCompiling ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Compiling (may take 20–30s)…</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> Compile to PDF</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preview' && pdfUrl && (
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="w-5 h-5 text-teal-600" />
                    PDF Proof Preview
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('editor')} className="gap-1 text-xs">
                      <Code2 className="w-3 h-3" /> Edit Source
                    </Button>
                    <Button size="sm" onClick={handleDownload} className="bg-teal-600 hover:bg-teal-700 gap-1">
                      <Download className="w-4 h-4" /> Download PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  ref={pdfRef}
                  src={pdfUrl}
                  className="w-full rounded-b-xl border-t border-slate-100"
                  style={{ height: '80vh' }}
                  title="PDF Proof Preview"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Workflow guide */}
        <Card className="border-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              How to Use This Tool
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Paste Source', desc: 'Paste your LaTeX manuscript body or full document into the editor.' },
                { step: '2', title: 'Compile', desc: 'Click "Compile to PDF". Compilation typically takes 20–30 seconds.' },
                { step: '3', title: 'Review Proof', desc: 'Inspect the formatted PDF for layout, equations, tables, and figures.' },
                { step: '4', title: 'Download & Submit', desc: 'Download the final proof and attach it to your submission.' },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}