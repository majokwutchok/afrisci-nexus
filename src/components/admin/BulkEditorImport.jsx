import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2, CheckCircle, Download, AlertTriangle } from 'lucide-react';

const TEMPLATE_HEADERS = [
  'full_name', 'applicant_email', 'academic_title', 'affiliation', 'country',
  'orcid', 'google_scholar_url', 'facebook_url', 'linkedin_url', 'x_url', 'research_interests'
];

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(v => v !== '')) rows.push(row);
        row = [];
      } else { field += c; }
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(v => v.trim() !== ''));
}

function downloadTemplate() {
  const csv = TEMPLATE_HEADERS.join(',') + '\n' +
    'Dr. Jane Doe,jane.doe@example.com,Professor,University of Nairobi,Kenya,0000-0001-2345-6789,https://scholar.google.com/...,,https://linkedin.com/in/janedoe,,"Public Health, Genomics"\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'editor_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkEditorImport({ onImported }) {
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rows = parseCSV(evt.target.result);
      if (rows.length < 2) {
        setError('The file has no data rows. Please use the template.');
        setPreview([]);
        return;
      }
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const dataRows = rows.slice(1).map(r => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
        return obj;
      }).filter(r => r.full_name && r.applicant_email);
      setPreview(dataRows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    setError('');
    try {
      const records = preview.map(r => ({
        role: 'editor',
        status: 'approved',
        applicant_email: r.applicant_email,
        full_name: r.full_name,
        academic_title: r.academic_title || '',
        affiliation: r.affiliation || '',
        country: r.country || '',
        orcid: r.orcid || '',
        google_scholar_url: r.google_scholar_url || '',
        facebook_url: r.facebook_url || '',
        linkedin_url: r.linkedin_url || '',
        x_url: r.x_url || '',
        research_interests: (r.research_interests || '').split(',').map(s => s.trim()).filter(Boolean),
        reviewed_date: new Date().toISOString().split('T')[0],
      }));
      await base44.entities.RoleApplication.bulkCreate(records);
      setResult(records.length);
      setPreview([]);
      setFileName('');
      onImported?.();
    } catch (err) {
      setError(err.message || 'Import failed. Please check your file and try again.');
    }
    setImporting(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-amber-600" />
          Bulk Import Editors
        </CardTitle>
        <p className="text-sm text-slate-500">
          Upload a CSV spreadsheet to add many editors at once. They'll appear instantly on the public Editorial Board.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
          <Download className="w-4 h-4" /> Download CSV Template
        </Button>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Upload CSV file</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:font-medium hover:file:bg-amber-100"
          />
          {fileName && <p className="text-xs text-slate-500 mt-1">Selected: {fileName}</p>}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {preview.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              {preview.length} editor{preview.length !== 1 ? 's' : ''} ready to import
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-600 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Affiliation</th>
                    <th className="text-left px-3 py-2">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2">{r.full_name}</td>
                      <td className="px-3 py-2">{r.applicant_email}</td>
                      <td className="px-3 py-2">{r.affiliation}</td>
                      <td className="px-3 py-2">{r.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {importing
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
              : <><UploadCloud className="w-4 h-4 mr-2" />Import {preview.length > 0 ? preview.length : ''} Editors</>}
          </Button>
          {result !== null && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
              <CheckCircle className="w-4 h-4" /> {result} editors imported successfully
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}