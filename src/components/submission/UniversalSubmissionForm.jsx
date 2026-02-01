import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import AIManuscriptAssistant from "./AIManuscriptAssistant";
import { 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Users,
  FileText,
  Brain,
  Upload,
  Plus,
  X,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

const categoryLabels = {
  stem: "STEM",
  medicine_health: "Medicine & Health",
  agriculture_environment: "Agriculture & Environment",
  social_sciences: "Social Sciences",
  law_policy: "Law & Policy",
  arts_humanities: "Arts & Humanities",
  business_economics: "Business & Economics",
  education_pedagogy: "Education & Pedagogy",
  interdisciplinary: "Interdisciplinary"
};

export default function UniversalSubmissionForm({ onSubmit, initialData, journals, isLoading, setError }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [manuscript, setManuscript] = useState({
    title: "",
    abstract: "",
    keywords: [],
    journal_id: "",
    authors: [{ name: "", email: "", affiliation: "", orcid: "", is_corresponding: true }],
    manuscript_file_url: "",
    supplementary_files: [],
    language: "english",
    reviewer_suggestions: [],
    review_type: "double_blind",
    conflict_of_interest: false,
    conflict_statement: "",
    ethics_approval: false,
    ethics_statement: "",
    funding_sources: "",
    ...initialData
  });

  React.useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Pre-fill first author with user's profile data if no initial data
      if (!initialData && user) {
        setManuscript(prev => ({
          ...prev,
          authors: [{
            name: user.full_name || "",
            email: user.email || "",
            affiliation: user.affiliation || "",
            orcid: user.orcid || "",
            is_corresponding: true
          }]
        }));
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const [suggestedJournals, setSuggestedJournals] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestedReviewers, setAiSuggestedReviewers] = useState([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const steps = [
    { number: 1, title: "Journal Selection", icon: FileText },
    { number: 2, title: "Manuscript Details", icon: FileText },
    { number: 3, title: "File Upload", icon: Upload },
    { number: 4, title: "Authors", icon: Users },
    { number: 5, title: "Declarations", icon: CheckCircle },
    { number: 6, title: "Review", icon: CheckCircle }
  ];

  const canProceed = () => {
    switch(currentStep) {
      case 1: return manuscript.journal_id;
      case 2: return manuscript.title && manuscript.abstract && manuscript.keywords.length >= 3;
      case 3: return manuscript.manuscript_file_url;
      case 4: return manuscript.authors.length > 0 && manuscript.authors[0].name && manuscript.authors[0].email;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  const handleFileUpload = async (file, type = 'main') => {
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (type === 'main') {
        handleInputChange('manuscript_file_url', file_url);
      } else {
        handleInputChange('supplementary_files', [...manuscript.supplementary_files, file_url]);
      }
    } catch (error) {
      console.error("File upload error:", error);
      setError?.("Failed to upload file. Please try again.");
    }
    setUploading(false);
  };

  const addAuthor = () => {
    handleInputChange('authors', [...manuscript.authors, { 
      name: "", email: "", affiliation: "", orcid: "", is_corresponding: false 
    }]);
  };

  const removeAuthor = (index) => {
    const newAuthors = manuscript.authors.filter((_, i) => i !== index);
    handleInputChange('authors', newAuthors);
  };

  const updateAuthor = (index, field, value) => {
    const newAuthors = [...manuscript.authors];
    newAuthors[index] = { ...newAuthors[index], [field]: value };
    handleInputChange('authors', newAuthors);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !manuscript.keywords.includes(keywordInput.trim())) {
      handleInputChange('keywords', [...manuscript.keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword) => {
    handleInputChange('keywords', manuscript.keywords.filter(k => k !== keyword));
  };

  const handleAIKeywordsSuggested = (keywords) => {
    const newKeywords = keywords.filter(k => !manuscript.keywords.includes(k));
    handleInputChange('keywords', [...manuscript.keywords, ...newKeywords]);
  };

  const analyzeAndSuggestJournal = async () => {
    if (!manuscript.title || !manuscript.abstract) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this research paper and suggest the most appropriate journal category:

Title: ${manuscript.title}
Abstract: ${manuscript.abstract}
Keywords: ${manuscript.keywords.join(', ')}

Available categories: ${Object.keys(categoryLabels).join(', ')}

Return the analysis as a JSON object with:
- suggested_category: the best fitting category
- confidence: confidence score (0-100)
- reasoning: brief explanation
- alternative_categories: array of other possible categories`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_category: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            alternative_categories: { 
              type: "array", 
              items: { type: "string" } 
            }
          }
        }
      });

      const matchingJournals = journals.filter(j => 
        j.category === response.suggested_category || 
        response.alternative_categories?.includes(j.category)
      );

      setSuggestedJournals(matchingJournals.map(j => ({
        ...j,
        confidence: j.category === response.suggested_category ? response.confidence : response.confidence - 20,
        reasoning: response.reasoning
      })));

      // Auto-select the highest confidence journal
      if (matchingJournals.length > 0) {
        const bestMatch = matchingJournals.find(j => j.category === response.suggested_category);
        if (bestMatch) {
          setManuscript(prev => ({ ...prev, journal_id: bestMatch.id }));
        }
      }
    } catch (error) {
      console.error("Error analyzing manuscript:", error);
    }
    setIsAnalyzing(false);
  };

  const suggestReviewers = async () => {
    if (!manuscript.abstract || !manuscript.keywords.length) return;

    setIsLoadingReviewers(true);
    try {
      const allUsers = await base44.entities.User.list();
      const potentialReviewers = allUsers.filter(user => 
        user.reviewer_status === 'active' &&
        user.research_interests?.length > 0 &&
        user.id !== manuscript.created_by
      );

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this manuscript, rank the most suitable reviewers from the available pool:

Manuscript Title: ${manuscript.title}
Abstract: ${manuscript.abstract}
Keywords: ${manuscript.keywords.join(', ')}

Available Reviewers:
${potentialReviewers.map(r => `
Name: ${r.full_name}
Email: ${r.email}
Research Interests: ${r.research_interests?.join(', ')}
Academic Title: ${r.academic_title || 'N/A'}
Country: ${r.country || 'N/A'}
`).join('\n')}

Rank the top 5 most suitable reviewers based on expertise match. Return as JSON array with:
- user_id, name, email, expertise_match (0-100), reason for selection`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_reviewers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  user_id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string" },
                  expertise_match: { type: "number" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAiSuggestedReviewers(response.suggested_reviewers || []);
      setManuscript(prev => ({
        ...prev,
        ai_suggested_reviewers: response.suggested_reviewers || []
      }));
    } catch (error) {
      console.error("Error suggesting reviewers:", error);
    }
    setIsLoadingReviewers(false);
  };

  const handleInputChange = (field, value) => {
    setManuscript(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep === step.number 
                      ? 'bg-teal-600 text-white' 
                      : currentStep > step.number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : step.number}
                  </div>
                  <span className="text-xs mt-1 text-center hidden md:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Step 1: Journal Selection */}
      {currentStep === 1 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Select Your Journal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Use AI to find the perfect journal for your manuscript, or browse our journals manually.
              </AlertDescription>
            </Alert>

            {manuscript.title && manuscript.abstract && (
              <Button
                variant="outline"
                onClick={analyzeAndSuggestJournal}
                disabled={isAnalyzing}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "AI Journal Matching"}
              </Button>
            )}

            {suggestedJournals.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">AI Suggestions:</h4>
                {suggestedJournals.map((journal) => (
                  <div
                    key={journal.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      manuscript.journal_id === journal.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleInputChange('journal_id', journal.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{journal.title}</h4>
                        <p className="text-sm text-slate-600">{categoryLabels[journal.category]}</p>
                        {journal.reasoning && (
                          <p className="text-xs text-slate-500 mt-1">{journal.reasoning}</p>
                        )}
                      </div>
                      <Badge variant={journal.confidence >= 80 ? "default" : "secondary"}>
                        {journal.confidence}% match
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <Label>Select Journal *</Label>
              <Select 
                value={manuscript.journal_id} 
                onValueChange={(value) => handleInputChange('journal_id', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a journal" />
                </SelectTrigger>
                <SelectContent>
                  {journals.map((journal) => (
                    <SelectItem key={journal.id} value={journal.id}>
                      {journal.title} • {categoryLabels[journal.category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Manuscript Details */}
      {currentStep === 2 && (
        <>
          {/* AI Assistant */}
          {manuscript.title && manuscript.abstract && (
            <AIManuscriptAssistant
              manuscriptTitle={manuscript.title}
              manuscriptAbstract={manuscript.abstract}
              journalTitle={journals.find(j => j.id === manuscript.journal_id)?.title}
              authors={manuscript.authors}
              onKeywordsSuggested={handleAIKeywordsSuggested}
            />
          )}

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Manuscript Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={manuscript.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter your manuscript title"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="abstract">Abstract * (200-300 words)</Label>
              <Textarea
                id="abstract"
                value={manuscript.abstract}
                onChange={(e) => handleInputChange('abstract', e.target.value)}
                placeholder="Provide a comprehensive abstract of your research..."
                rows={8}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                {manuscript.abstract.split(' ').filter(w => w).length} words
              </p>
            </div>

            <div>
              <Label>Keywords * (minimum 3)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="Enter keyword and press Enter"
                />
                <Button type="button" onClick={addKeyword}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {manuscript.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeKeyword(keyword)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Review Type</Label>
                <Select 
                  value={manuscript.review_type} 
                  onValueChange={(value) => handleInputChange('review_type', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="double_blind">Double-Blind Review</SelectItem>
                    <SelectItem value="single_blind">Single-Blind Review</SelectItem>
                    <SelectItem value="open_review">Open Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Select 
                  value={manuscript.language} 
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="portuguese">Portuguese</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="swahili">Swahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Step 3: File Upload */}
      {currentStep === 3 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Main Manuscript File * (.doc, .docx, or .pdf)</Label>
              <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
                {manuscript.manuscript_file_url ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <span className="font-medium">File uploaded successfully</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInputChange('manuscript_file_url', '')}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 mb-3">Drop your file here or click to browse</p>
                    <Input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'main')}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                    {uploading && <p className="text-sm text-teal-600 mt-2">Uploading...</p>}
                  </>
                )}
              </div>
            </div>

            <div>
              <Label>Supplementary Files (optional)</Label>
              <p className="text-sm text-slate-500 mb-2">Figures, tables, datasets, etc.</p>
              <Input
                type="file"
                multiple
                onChange={(e) => Array.from(e.target.files).forEach(f => handleFileUpload(f, 'supplementary'))}
                disabled={uploading}
                className="mt-2"
              />
              {manuscript.supplementary_files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {manuscript.supplementary_files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm">Supplementary file {idx + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFiles = manuscript.supplementary_files.filter((_, i) => i !== idx);
                          handleInputChange('supplementary_files', newFiles);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Authors */}
      {currentStep === 4 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Author Information
              </CardTitle>
              <Button onClick={addAuthor} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Author
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {manuscript.authors.map((author, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Author {index + 1}</h4>
                  {manuscript.authors.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAuthor(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={author.name}
                      onChange={(e) => updateAuthor(index, 'name', e.target.value)}
                      placeholder="Dr. Jane Smith"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={author.email}
                      onChange={(e) => updateAuthor(index, 'email', e.target.value)}
                      placeholder="jane.smith@university.edu"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Affiliation</Label>
                    <Input
                      value={author.affiliation}
                      onChange={(e) => updateAuthor(index, 'affiliation', e.target.value)}
                      placeholder="University of..."
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>ORCID iD (recommended)</Label>
                    <Input
                      value={author.orcid}
                      onChange={(e) => updateAuthor(index, 'orcid', e.target.value)}
                      placeholder="0000-0000-0000-0000"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`corresponding-${index}`}
                    checked={author.is_corresponding}
                    onCheckedChange={(checked) => updateAuthor(index, 'is_corresponding', checked)}
                  />
                  <Label htmlFor={`corresponding-${index}`} className="cursor-pointer">
                    Corresponding author
                  </Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Declarations & Reviewer Suggestions */}
      {currentStep === 5 && (
        <>
        {/* AI Reviewer Suggestions */}
        {manuscript.abstract && manuscript.keywords.length >= 3 && (
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg border-2 border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Reviewer Suggestions
                  <Badge className="bg-purple-600 text-white">AI-Powered</Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={suggestReviewers}
                  disabled={isLoadingReviewers}
                  className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 border-0"
                >
                  <Sparkles className="w-4 h-4" />
                  {isLoadingReviewers ? "Analyzing..." : "Find Reviewers"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingReviewers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="text-slate-600">Analyzing manuscript and matching with expert reviewers...</p>
                  </div>
                </div>
              ) : aiSuggestedReviewers.length > 0 ? (
                <div className="space-y-3">
                  <Alert className="bg-purple-50 border-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-900">
                      AI has identified {aiSuggestedReviewers.length} potential reviewers based on expertise matching. These suggestions will be sent to the editor.
                    </AlertDescription>
                  </Alert>
                  <div className="grid gap-3">
                    {aiSuggestedReviewers.map((reviewer, index) => (
                      <div
                        key={reviewer.user_id}
                        className="p-4 rounded-lg border-2 border-purple-200 bg-white hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                #{index + 1}
                              </div>
                              <div>
                                <h5 className="font-semibold text-slate-900">{reviewer.name}</h5>
                                <p className="text-sm text-slate-600">{reviewer.email}</p>
                              </div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg mt-2">
                              <p className="text-xs text-slate-500 font-medium mb-1">Match Reasoning:</p>
                              <p className="text-sm text-slate-700">{reviewer.reason}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge 
                              className={`text-base px-3 py-1 ${
                                reviewer.expertise_match >= 90 ? 'bg-emerald-500' :
                                reviewer.expertise_match >= 80 ? 'bg-blue-500' :
                                reviewer.expertise_match >= 70 ? 'bg-amber-500' :
                                'bg-slate-500'
                              } text-white`}
                            >
                              {reviewer.expertise_match}%
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {reviewer.expertise_match >= 90 ? 'Excellent Match' :
                               reviewer.expertise_match >= 80 ? 'Strong Match' :
                               reviewer.expertise_match >= 70 ? 'Good Match' :
                               'Fair Match'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto text-purple-300 mb-3" />
                  <p className="text-slate-600 mb-4">
                    Click "Find Reviewers" to get AI-powered expert reviewer suggestions based on your manuscript.
                  </p>
                  <p className="text-sm text-slate-500">
                    Our AI analyzes your abstract and keywords to match with the most qualified reviewers.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Declarations & Ethics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="conflict"
                  checked={manuscript.conflict_of_interest}
                  onCheckedChange={(checked) => handleInputChange('conflict_of_interest', checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="conflict" className="cursor-pointer font-semibold">
                    I declare a potential conflict of interest
                  </Label>
                  {manuscript.conflict_of_interest && (
                    <Textarea
                      value={manuscript.conflict_statement}
                      onChange={(e) => handleInputChange('conflict_statement', e.target.value)}
                      placeholder="Please describe any conflicts of interest..."
                      rows={3}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="ethics"
                  checked={manuscript.ethics_approval}
                  onCheckedChange={(checked) => handleInputChange('ethics_approval', checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="ethics" className="cursor-pointer font-semibold">
                    This research required ethics approval (human/animal subjects)
                  </Label>
                  {manuscript.ethics_approval && (
                    <Textarea
                      value={manuscript.ethics_statement}
                      onChange={(e) => handleInputChange('ethics_statement', e.target.value)}
                      placeholder="Please provide ethics approval details and reference numbers..."
                      rows={3}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label>Funding Sources (optional)</Label>
              <Textarea
                value={manuscript.funding_sources}
                onChange={(e) => handleInputChange('funding_sources', e.target.value)}
                placeholder="List any funding sources, grant numbers, or acknowledgments..."
                rows={4}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Step 6: Review & Submit */}
      {currentStep === 6 && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Review Your Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review all information carefully before submitting. You'll be able to track your submission status after submission.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-slate-600">Journal</h4>
                <p className="text-slate-900">{journals.find(j => j.id === manuscript.journal_id)?.title}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-600">Title</h4>
                <p className="text-slate-900">{manuscript.title}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-600">Authors</h4>
                <p className="text-slate-900">{manuscript.authors.map(a => a.name).join(', ')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-600">Keywords</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {manuscript.keywords.map(k => (
                    <Badge key={k} variant="secondary">{k}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-600">Files</h4>
                <p className="text-slate-900">
                  Main manuscript + {manuscript.supplementary_files.length} supplementary file(s)
                </p>
              </div>
              {aiSuggestedReviewers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-slate-600">AI Suggested Reviewers</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {aiSuggestedReviewers.slice(0, 3).map((reviewer) => (
                      <Badge key={reviewer.user_id} className="bg-purple-100 text-purple-800 border border-purple-200">
                        {reviewer.name} ({reviewer.expertise_match}% match)
                      </Badge>
                    ))}
                    {aiSuggestedReviewers.length > 3 && (
                      <Badge variant="outline">+{aiSuggestedReviewers.length - 3} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={() => onSubmit(manuscript)} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold py-3"
            >
              {isLoading ? "Submitting..." : "Submit Manuscript"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < 6 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Next Step
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : null}
      </div>


    </div>
  );
}