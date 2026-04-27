import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail,
  MessageCircle,
  Copy,
  ExternalLink,
  Users,
  Globe,
  CheckCircle
} from "lucide-react";

const SocialMediaShare = ({ manuscript, journal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const articleUrl = `https://afriscinexus.com/ManuscriptDetail?id=${manuscript.id}`;
  const encodedUrl = encodeURIComponent(articleUrl);
  
  const defaultShareText = `New African Research Published! 

"${manuscript.title}"

Authors: ${manuscript.authors?.map(a => a.name).join(', ')}
Journal: ${journal?.title}

${manuscript.abstract?.substring(0, 150)}...

#AfricanScience #Research #OpenAccess`;

  const shareText = customMessage || defaultShareText;
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(manuscript.title);

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodeURIComponent(manuscript.abstract?.substring(0, 200) || '')}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`
  };

  const handleSocialShare = (platform) => {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    console.log(`Shared on ${platform}:`, manuscript.title);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${articleUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = `${shareText}\n\n${articleUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const useNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manuscript.title,
          text: shareText,
          url: articleUrl,
        });
      } catch (error) {
        console.log('Native sharing cancelled or failed');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <Share2 className="w-3 h-3 mr-1" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Share African Research
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Help amplify African science by sharing this research across your networks
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">
              {manuscript.title}
            </h4>
            <p className="text-sm text-slate-600 mb-2">
              by {manuscript.authors?.map(a => a.name).join(', ')}
            </p>
            <div className="flex gap-2 mb-3">
              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                {journal?.title}
              </Badge>
              {manuscript.access_type === 'open_access' && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  Open Access
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {manuscript.abstract}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Customize your share message (optional)
            </label>
            <Textarea
              placeholder={defaultShareText}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="text-sm"
            />
            <p className="text-xs text-slate-500">
              Leave empty to use the default research-focused message
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Share on Social Media</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                onClick={() => handleSocialShare('twitter')}
              >
                <Twitter className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Twitter</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                onClick={() => handleSocialShare('facebook')}
              >
                <Facebook className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Facebook</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
                onClick={() => handleSocialShare('linkedin')}
              >
                <Linkedin className="w-4 h-4 text-blue-700" />
                <span className="text-sm">LinkedIn</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100"
                onClick={() => handleSocialShare('whatsapp')}
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">WhatsApp</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-slate-100"
                onClick={() => handleSocialShare('telegram')}
              >
                <ExternalLink className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Telegram</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-slate-100"
                onClick={() => handleSocialShare('reddit')}
              >
                <ExternalLink className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Reddit</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-slate-100"
                onClick={() => handleSocialShare('email')}
              >
                <Mail className="w-4 h-4 text-slate-600" />
                <span className="text-sm">Email</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-slate-900">Quick Actions</h4>
            <div className="flex gap-3">
              {navigator.share && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={useNativeShare}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Native Share</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                className={`flex items-center gap-2 ${copied ? 'bg-green-50 border-green-200' : ''}`}
                onClick={copyToClipboard}
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {copied ? 'Copied!' : 'Copy Text'}
                </span>
              </Button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <Users className="w-4 h-4" />
              <span className="font-medium">Impact Amplification</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Sharing African research helps increase visibility, citations, and global collaboration opportunities
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialMediaShare;