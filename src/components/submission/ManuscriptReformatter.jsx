import React, { useState } from 'react';
import { reformatManuscript } from '@/functions/reformatManuscript';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, Sparkles, CheckCircle, AlertCircle, FileText, BookOpen } from 'lucide-react';

const CITATION_STYLES = {
  stem: 'APA 7th Edition',
  medicine_health: 'Vancouver (NLM)',
  agriculture_environment: 'APA 7th Edition',
  social_sciences: 'APA 7th Edition',
  law_policy: 'Chicago 17th Edition',
  arts_humanities: 'MLA 9th Edition',
  business_economics: 'APA 7th Edition',
  education_pedagogy: 'APA 7th Edition',
  interdisciplinary: 'APA 7th Edition',
};

const LAYOUT_INFO = [
  { label: 'Font', value: '12pt Times New Roman' },
  { label: 'Spacing', value: 'Double-spaced' },
  { label: 'Margins', value: '1 inch (2.54cm)' },
  { label: 'Abstract', value: '250 words max' },
];

export default function ManuscriptReformatter({ manuscript, journal, open, onClose }) {
  const [isFormatting, setIsFormatting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);

  const citationStyle = CITATION_STYLES[journal?.category] || 'APA 7th Edition';

  const handleReformat = async () => {
    setIsFormatting(true);
    setError('');
    setIsReady(false);
    setPdfBlob(null);

    try {
      const response = await reformatManuscript({ manuscript, journal });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setPdfBlob(blob);
      setIsReady(true);
    } catch (err) {
      setError('Failed to reformat manuscript. Please try again.');
      console.error('Reformat error:', err);
    }
    setIsFormatting(false);
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reformatted_${manuscript?.title?.slice(0, 40).replace(/\s+/g, '_') || 'manuscript'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setIsReady(false);
    setPdfBlob(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-teal-100">
              <Sparkles className="w-5 h-5 text-teal-600" />
            </div>
            Auto-Reformat Manuscript
          </DialogTitle>
          <DialogDescription>
            Reformat your manuscript to match <strong>{journal?.title || 'the target journal'}</strong>'s submission guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Manuscript info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 line-clamp-2 text-sm">{manuscript?.title}</p>
                <p className="text-xs text-slate-500 mt-1">{manuscript?.authors?.length || 0} author(s)</p>
              </div>
            </div>
          </div>

          {/* Formatting spec */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              Applied Formatting Rules
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 col-span-2">
                <p className="text-xs text-teal-700 font-medium">Citation Style</p>
                <p className="text-sm font-bold text-teal-900 mt-0.5">{citationStyle}</p>
              </div>
              {LAYOUT_INFO.map(info => (
                <div key={info.label} className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{info.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{info.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What gets reformatted */}
          <div className="space-y-1.5">
            {[
              'Title page with authors & affiliations',
              'Structured abstract with section headings',
              'Keywords section (6-8 terms)',
              'Document structure & section headings',
              'Reference list template in correct style',
              'Author contributions & CoI statements',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {isReady && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Reformatted PDF is ready. Click download below.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!isReady ? (
              <Button
                onClick={handleReformat}
                disabled={isFormatting}
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                {isFormatting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reformatting…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Reformat Manuscript
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleDownload}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={handleReformat} disabled={isFormatting}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}