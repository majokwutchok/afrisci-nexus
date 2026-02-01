import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ExternalLink, 
  CheckCircle, 
  Clock,
  Globe
} from "lucide-react";

// Mock DOI assignment function - in real app this would integrate with Crossref
const assignDOI = async (manuscriptData) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate a mock DOI
  const timestamp = Date.now();
  const journalPrefix = "10.1234"; // In real app, this would be journal-specific
  const articleId = `afrijour.${timestamp}`;
  
  return {
    doi: `${journalPrefix}/${articleId}`,
    url: `https://doi.org/${journalPrefix}/${articleId}`,
    status: 'active'
  };
};

const PublicationProcessor = ({ manuscript, onPublish }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [doi, setDoi] = useState(manuscript.doi || "");
  const [publishStatus, setPublishStatus] = useState(manuscript.status);

  const handleOnlineFirstPublication = async () => {
    setIsProcessing(true);
    try {
      // Assign DOI if not already assigned
      let assignedDOI = doi;
      if (!doi) {
        const doiResult = await assignDOI(manuscript);
        assignedDOI = doiResult.doi;
        setDoi(assignedDOI);
      }

      // Update manuscript status to online-first
      const updateData = {
        status: 'online_first',
        doi: assignedDOI,
        online_first_date: new Date().toISOString().split('T')[0],
        access_type: manuscript.access_type || 'open_access',
        export_formats: ['pdf', 'html', 'epub', 'bibtex', 'ris']
      };

      await onPublish(updateData);
      setPublishStatus('online_first');

    } catch (error) {
      console.error("Error publishing online-first:", error);
    }
    setIsProcessing(false);
  };

  const handleFinalPublication = async () => {
    setIsProcessing(true);
    try {
      const updateData = {
        status: 'published',
        publication_date: new Date().toISOString().split('T')[0]
      };

      await onPublish(updateData);
      setPublishStatus('published');

    } catch (error) {
      console.error("Error publishing final version:", error);
    }
    setIsProcessing(false);
  };

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          Publication & DOI Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DOI Information */}
        <div className="space-y-3">
          <Label>Digital Object Identifier (DOI)</Label>
          {doi ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-mono text-sm text-emerald-800">{doi}</span>
              <a 
                href={`https://doi.org/${doi}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Button size="sm" variant="outline" className="h-8">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
              </a>
            </div>
          ) : (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                DOI will be automatically assigned upon online-first publication
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Publication Status */}
        <div className="space-y-3">
          <Label>Publication Status</Label>
          <div className="flex items-center gap-2">
            <Badge 
              className={
                publishStatus === 'published' 
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : publishStatus === 'online_first'
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }
            >
              {publishStatus === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
              {publishStatus === 'online_first' && <Globe className="w-3 h-3 mr-1" />}
              {publishStatus === 'accepted' && <Clock className="w-3 h-3 mr-1" />}
              {publishStatus.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Access Model */}
        <div className="space-y-3">
          <Label>Access Model</Label>
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Open Access by Default
          </Badge>
          <p className="text-xs text-slate-500">
            All articles are published under Creative Commons license for maximum accessibility
          </p>
        </div>

        {/* Publication Actions */}
        <div className="space-y-3 pt-4 border-t">
          {publishStatus === 'accepted' && (
            <Button 
              onClick={handleOnlineFirstPublication}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Online-First Publication...
                </div>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Publish Online-First
                </>
              )}
            </Button>
          )}

          {publishStatus === 'online_first' && (
            <Button 
              onClick={handleFinalPublication}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publishing Final Version...
                </div>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publish Final Version
                </>
              )}
            </Button>
          )}

          {publishStatus === 'published' && (
            <Alert className="bg-emerald-50 border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Article successfully published and archived with permanent DOI
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Export Formats */}
        {(publishStatus === 'online_first' || publishStatus === 'published') && (
          <div className="space-y-3 pt-4 border-t">
            <Label>Available Export Formats</Label>
            <div className="flex flex-wrap gap-2">
              {(manuscript.export_formats || ['pdf', 'html']).map((format) => (
                <Badge key={format} variant="outline" className="capitalize">
                  {format}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PublicationProcessor;