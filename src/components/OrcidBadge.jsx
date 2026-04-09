import React from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';
import { isValidOrcid, getOrcidUrl } from '@/utils/orcidValidator';

export default function OrcidBadge({ orcid, showVerified = true, size = 'sm' }) {
  if (!orcid) return null;

  const isValid = isValidOrcid(orcid);
  const url = getOrcidUrl(orcid);

  if (!isValid) return null;

  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1'
  };

  const content = (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-colors`}>
      {showVerified && <CheckCircle className="w-3 h-3" />}
      <span className="font-medium">ORCID</span>
      <ExternalLink className="w-3 h-3 opacity-70" />
    </span>
  );

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}