import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  History,
  Upload,
  ExternalLink,
  RotateCcw,
  FileText,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const statusLabels = {
  draft: "Draft",
  submitted: "Submitted",
  editor_assigned: "Editor Assigned",
  under_review: "Under Review",
  revision_requested: "Revision Requested",
  revised: "Revised",
  accepted: "Accepted",
  rejected: "Rejected",
  published: "Published",
  online_first: "Online First",
};

const statusColors = {
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  revision_requested: "bg-orange-100 text-orange-700",
  revised: "bg-purple-100 text-purple-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  published: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-700",
};

function VersionCard({ version, isCurrent, onRestore, canRestore, restoring }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border ${isCurrent ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"} p-4 space-y-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`}>
            v{version.version}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">{version.label}</p>
            <p className="text-xs text-slate-500">
              {version.uploaded_at
                ? format(parseISO(version.uploaded_at), "d MMM yyyy, HH:mm")
                : "Date unknown"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isCurrent && <Badge className="bg-teal-600 text-white text-xs">Current</Badge>}
          {version.status_at_upload && (
            <Badge className={`text-xs ${statusColors[version.status_at_upload] || "bg-slate-100 text-slate-600"}`}>
              {statusLabels[version.status_at_upload] || version.status_at_upload}
            </Badge>
          )}
        </div>
      </div>

      {version.uploaded_by_name && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <UserIcon className="w-3 h-3" />
          <span>{version.uploaded_by_name}</span>
        </div>
      )}

      {version.change_summary && (
        <div>
          <button
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Change summary
          </button>
          {expanded && (
            <p className="mt-1 text-sm text-slate-700 bg-slate-50 rounded p-2 border border-slate-200 whitespace-pre-wrap">
              {version.change_summary}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {version.file_url && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => window.open(version.file_url, "_blank")}
          >
            <ExternalLink className="w-3 h-3 mr-1" /> View File
          </Button>
        )}
        {canRestore && !isCurrent && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 text-orange-600 border-orange-300 hover:bg-orange-50"
            onClick={() => onRestore(version)}
            disabled={restoring}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {restoring ? "Restoring…" : "Restore as Current"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function VersionHistoryPanel({ manuscript, open, onClose, onRefresh, canUpload = true }) {
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const versions = [...(manuscript?.version_history || [])].sort((a, b) => b.version - a.version);
  const currentVersion = versions.find(v => v.is_current) || versions[0];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const user = await base44.auth.me();

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      const existingVersions = manuscript.version_history || [];
      const nextVersion = existingVersions.length > 0
        ? Math.max(...existingVersions.map(v => v.version || 0)) + 1
        : 1;

      const isFirst = existingVersions.length === 0;
      const label = isFirst
        ? "Initial Submission"
        : `Revision ${nextVersion - 1}`;

      // Mark all previous as not current
      const updatedHistory = existingVersions.map(v => ({ ...v, is_current: false }));

      updatedHistory.push({
        version: nextVersion,
        label,
        file_url,
        uploaded_by: user.email,
        uploaded_by_name: user.full_name,
        uploaded_at: new Date().toISOString(),
        status_at_upload: manuscript.status,
        change_summary: changeSummary.trim() || null,
        is_current: true,
      });

      await base44.entities.Manuscript.update(manuscript.id, {
        manuscript_file_url: file_url,
        version_history: updatedHistory,
      });

      setSelectedFile(null);
      setChangeSummary("");
      if (onRefresh) onRefresh();
    } catch {
      setUploadError("Upload failed. Integration credits may be exhausted (resets 2026-05-25).");
    }
    setUploading(false);
  };

  const handleRestore = async (version) => {
    setRestoring(true);
    try {
      const updatedHistory = (manuscript.version_history || []).map(v => ({
        ...v,
        is_current: v.version === version.version,
      }));

      await base44.entities.Manuscript.update(manuscript.id, {
        manuscript_file_url: version.file_url,
        version_history: updatedHistory,
      });

      if (onRefresh) onRefresh();
    } catch {
      // ignore
    }
    setRestoring(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <History className="w-5 h-5 text-teal-600" />
            Version History
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{manuscript?.title}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload new version */}
          {canUpload && (
            <div className="rounded-lg border border-dashed border-teal-300 bg-teal-50/50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600" /> Upload New Version
              </p>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Select file (PDF, DOCX, etc.)</Label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.odt,.tex"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-slate-300 file:text-xs file:bg-white file:text-slate-700 hover:file:bg-slate-50"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Summary of changes (optional)</Label>
                <Textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Briefly describe what changed in this version..."
                  rows={3}
                  className="text-sm bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              {uploadError && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  {uploadError}
                </div>
              )}
              <Button
                size="sm"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {uploading ? (
                  <><Clock className="w-3 h-3 mr-1 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="w-3 h-3 mr-1" /> Upload Version</>
                )}
              </Button>
            </div>
          )}

          {/* Version list */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {versions.length} version{versions.length !== 1 ? "s" : ""} on record
            </p>
            {versions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No versions recorded yet.</p>
                {canUpload && <p className="text-xs mt-1">Upload the first version above.</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map(v => (
                  <VersionCard
                    key={v.version}
                    version={v}
                    isCurrent={v.is_current || v.version === currentVersion?.version}
                    onRestore={handleRestore}
                    canRestore={canUpload}
                    restoring={restoring}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Diff notice */}
          {versions.length >= 2 && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2 text-xs text-slate-500">
              <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
              <span>
                To compare two versions, open both files in separate tabs. Full diff view requires an external PDF comparison tool.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}