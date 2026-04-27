import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Share2, 
  Copy, 
  Check,
  Twitter,
  Linkedin,
  Facebook,
  Mail
} from 'lucide-react';

/**
 * Comprehensive social sharing component with link copy, cover image, and social media buttons
 * Displays article with optimized thumbnail for social media previews
 */
export default function ArticleSocialSharing({ 
  manuscript, 
  journal,
  coverImage 
}) {
  const [copied, setCopied] = useState(false);

  // Generate shareable link using current domain
  const getShareableLink = () => {
    const baseUrl = window.location.origin;
    if (manuscript.doi) {
      return `${baseUrl}/ManuscriptDetail?id=${manuscript.id}&doi=${manuscript.doi}`;
    }
    return `${baseUrl}/ManuscriptDetail?id=${manuscript.id}`;
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    const link = getShareableLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share on Twitter
  const handleShareTwitter = () => {
    const text = `📚 "${manuscript.title}" by ${manuscript.authors?.[0]?.name || 'Authors'}
    
Published in ${journal?.title || 'AfriSci Nexus'}`;
    const url = getShareableLink();
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  // Share on LinkedIn
  const handleShareLinkedIn = () => {
    const url = getShareableLink();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  // Share on Facebook
  const handleShareFacebook = () => {
    const url = getShareableLink();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  // Share via Email
  const handleShareEmail = () => {
    const subject = `Read: ${manuscript.title}`;
    const body = `I found this interesting research article: "${manuscript.title}"

Authors: ${manuscript.authors?.map(a => a.name).join(', ') || 'N/A'}
Journal: ${journal?.title || 'AfriSci Nexus'}
Published: ${new Date(manuscript.publication_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}

Read it here: ${getShareableLink()}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Article Preview Card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 hover:shadow-lg transition-all">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cover Image */}
              <div className="aspect-video md:aspect-square bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center overflow-hidden">
                {coverImage ? (
                  <img 
                    src={coverImage} 
                    alt="Article cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-white text-3xl font-bold mb-2">
                      {journal?.title?.charAt(0) || 'A'}
                    </div>
                    <p className="text-white text-xs text-center line-clamp-2">
                      {journal?.title || 'AfriSci Nexus'}
                    </p>
                  </div>
                )}
              </div>

              {/* Article Info */}
              <div className="md:col-span-2 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2 mb-2">
                    {manuscript.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    {manuscript.authors?.map(a => a.name).join(', ') || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {journal?.title || 'AfriSci Nexus'} • {new Date(manuscript.publication_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                  </p>
                </div>
                
                {/* Key Metrics */}
                <div className="flex gap-4 text-xs">
                  {manuscript.citation_count > 0 && (
                    <span className="text-blue-600 font-medium">
                      {manuscript.citation_count} citation{manuscript.citation_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  {manuscript.download_count > 0 && (
                    <span className="text-emerald-600 font-medium">
                      {manuscript.download_count} download{manuscript.download_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share This Article
            </h4>

            {/* Shareable Link */}
            <div className="flex gap-2">
              <input
                type="text"
                value={getShareableLink()}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-mono text-blue-600 truncate"
              />
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={handleCopyLink}
                className={copied ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>

            {/* Social Media Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-sky-600 border-sky-300 hover:bg-sky-50"
                onClick={handleShareTwitter}
              >
                <Twitter className="w-4 h-4 mr-1.5" />
                Twitter
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-blue-700 border-blue-300 hover:bg-blue-50"
                onClick={handleShareLinkedIn}
              >
                <Linkedin className="w-4 h-4 mr-1.5" />
                LinkedIn
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                onClick={handleShareFacebook}
              >
                <Facebook className="w-4 h-4 mr-1.5" />
                Facebook
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={handleShareEmail}
              >
                <Mail className="w-4 h-4 mr-1.5" />
                Email
              </Button>
            </div>
          </div>

          {/* SEO Metadata Info */}
          <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1">
            <p>
              <strong>DOI:</strong> {manuscript.doi || 'Not assigned'}
            </p>
            <p>
              <strong>Published:</strong> {new Date(manuscript.publication_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {manuscript.keywords?.length > 0 && (
              <p>
                <strong>Keywords:</strong> {manuscript.keywords.slice(0, 3).join(', ')}
                {manuscript.keywords.length > 3 ? '...' : ''}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}