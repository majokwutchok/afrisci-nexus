import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { convertToAfriSciURL } from '@/utils/afrisciLinks';

/**
 * Reusable component for article download/read buttons with AfriSci Nexus branding
 */
export default function ArticleDownloadButtons({ 
  manuscript, 
  journal, 
  onDownloadAbstract,
  onDownloadFull,
  showAbstractPDF = true,
  showFullArticle = true,
  showDownloadFull = true,
  size = "sm",
  variant = "outline"
}) {
  const handleOpenFullArticle = (e) => {
    if (e) e.preventDefault();
    if (manuscript?.manuscript_file_url) {
      const afrisciUrl = convertToAfriSciURL(manuscript.manuscript_file_url);
      window.open(afrisciUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {showAbstractPDF && (
        <Button
          size={size}
          variant={variant}
          className="text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
          onClick={onDownloadAbstract}
        >
          <Download className="w-3 h-3 mr-1" />
          Abstract PDF
        </Button>
      )}
      {showFullArticle && manuscript?.manuscript_file_url && (
        <>
          <Button
            size={size}
            className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleOpenFullArticle}
          >
            <FileText className="w-3 h-3 mr-1" />
            Read Full
          </Button>
          {showDownloadFull && (
            <Button
              size={size}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onDownloadFull}
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          )}
        </>
      )}
    </div>
  );
}