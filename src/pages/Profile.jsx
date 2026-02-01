
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Manuscript } from "@/entities/Manuscript"; // Import Manuscript entity
import { Link } from "react-router-dom"; // Import Link
import { createPageUrl } from "@/utils"; // Import createPageUrl
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User as UserIcon, 
  Globe, 
  Award,
  BookOpen,
  CheckCircle,
  Plus,
  X,
  ExternalLink,
  AlertCircle,
  TrendingUp, // For stats
  Star // For reviewer badges
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const countries = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", 
  "Cape Verde", "Central African Republic", "Chad", "Comoros", "Congo", "DR Congo",
  "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia",
  "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco",
  "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe",
  "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
  "Sudan", "Swaziland", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
];

const languages = [
  "English", "French", "Portuguese", "Arabic", "Swahili", "Amharic", "Hausa", 
  "Yoruba", "Igbo", "Zulu", "Afrikaans", "Berber", "Somali", "Oromo"
];

const careerStages = [
  { value: "undergraduate", label: "Undergraduate Student" },
  { value: "graduate", label: "Graduate Student" },
  { value: "postdoc", label: "Postdoctoral Researcher" },
  { value: "early_career", label: "Early Career Researcher" },
  { value: "mid_career", label: "Mid-Career Researcher" },
  { value: "senior", label: "Senior Researcher/Professor" }
];

const ReviewerBadges = ({ reviewCount }) => {
  let badge = null;

  if (reviewCount >= 10) {
    badge = { label: "Gold Reviewer", color: "bg-amber-400 text-amber-900", icon: <Star className="w-4 h-4" /> };
  } else if (reviewCount >= 5) {
    badge = { label: "Silver Reviewer", color: "bg-slate-300 text-slate-800", icon: <Star className="w-4 h-4" /> };
  } else if (reviewCount >= 1) {
    badge = { label: "Bronze Reviewer", color: "bg-orange-300 text-orange-900", icon: <Star className="w-4 h-4" /> };
  }

  if (!badge) return null;

  return (
    <Badge className={`${badge.color} border-none text-sm py-2 px-4 shadow-md`}>
      {badge.icon}
      <span className="ml-2 font-semibold">{badge.label}</span>
    </Badge>
  );
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [publishedManuscripts, setPublishedManuscripts] = useState([]); // State for publications
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser({
        orcid: "",
        affiliation: "",
        country: "",
        research_interests: [],
        academic_title: "",
        google_scholar_url: "",
        reviewer_status: "inactive",
        editor_roles: [],
        languages: ["English"],
        career_stage: "",
        total_reviews_completed: 0,
        manuscripts_published: 0,
        ...userData
      });

      // Fetch published manuscripts
      if (userData?.email) {
        const userManuscripts = await Manuscript.filter({
          created_by: userData.email,
          status: 'published'
        });
        setPublishedManuscripts(userManuscripts);
      }

    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    }
    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const addResearchInterest = () => {
    if (interestInput.trim() && !user.research_interests.includes(interestInput.trim())) {
      setUser(prev => ({
        ...prev,
        research_interests: [...prev.research_interests, interestInput.trim()]
      }));
      setInterestInput("");
    }
  };

  const removeResearchInterest = (interest) => {
    setUser(prev => ({
      ...prev,
      research_interests: prev.research_interests.filter(i => i !== interest)
    }));
  };

  const toggleLanguage = (language) => {
    const currentLanguages = user.languages || [];
    if (currentLanguages.includes(language)) {
      setUser(prev => ({
        ...prev,
        languages: currentLanguages.filter(l => l !== language)
      }));
    } else {
      setUser(prev => ({
        ...prev,
        languages: [...currentLanguages, language]
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await User.updateMyUserData({
        orcid: user.orcid,
        affiliation: user.affiliation,
        country: user.country,
        research_interests: user.research_interests,
        academic_title: user.academic_title,
        google_scholar_url: user.google_scholar_url,
        reviewer_status: user.reviewer_status,
        languages: user.languages,
        career_stage: user.career_stage
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError("Failed to update profile. Please try again.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid gap-8">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="border-0 bg-white/80">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          </div>
          <p className="text-lg text-slate-600">
            Complete your academic profile to enhance collaboration
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Profile updated successfully!</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-emerald-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={user.full_name || ""}
                  disabled
                  className="mt-2 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Name cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user.email || ""}
                  disabled
                  className="mt-2 bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="academic_title">Academic Title/Position</Label>
                <Input
                  id="academic_title"
                  value={user.academic_title || ""}
                  onChange={(e) => handleInputChange('academic_title', e.target.value)}
                  placeholder="e.g., Professor, Research Scientist, PhD Student"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="career_stage">Career Stage</Label>
                <Select 
                  value={user.career_stage || ""} 
                  onValueChange={(value) => handleInputChange('career_stage', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select career stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {careerStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="affiliation">Institutional Affiliation</Label>
              <Input
                id="affiliation"
                value={user.affiliation || ""}
                onChange={(e) => handleInputChange('affiliation', e.target.value)}
                placeholder="University or Institution name"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select 
                value={user.country || ""} 
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Research Profile */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Research Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Research Interests</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  placeholder="Add research area"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResearchInterest())}
                />
                <Button type="button" onClick={addResearchInterest} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(user.research_interests || []).map((interest) => (
                  <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                    {interest}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-600" 
                      onClick={() => removeResearchInterest(interest)} 
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="orcid">ORCID iD</Label>
                <Input
                  id="orcid"
                  value={user.orcid || ""}
                  onChange={(e) => handleInputChange('orcid', e.target.value)}
                  placeholder="0000-0000-0000-0000"
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  <ExternalLink className="w-3 h-3 inline mr-1" />
                  Get your ORCID at orcid.org
                </p>
              </div>
              <div>
                <Label htmlFor="google_scholar">Google Scholar Profile</Label>
                <Input
                  id="google_scholar"
                  value={user.google_scholar_url || ""}
                  onChange={(e) => handleInputChange('google_scholar_url', e.target.value)}
                  placeholder="https://scholar.google.com/citations?user=..."
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publication History & Impact Stats */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Impact & Publications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-900">Published</span>
                </div>
                <span className="text-3xl font-bold text-emerald-700">
                  {user.manuscripts_published || publishedManuscripts.length}
                </span>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Reviews Done</span>
                </div>
                <span className="text-3xl font-bold text-blue-700">
                  {user.total_reviews_completed || 0}
                </span>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex flex-col justify-center items-center">
                 <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Reviewer Rank</span>
                </div>
                <ReviewerBadges reviewCount={user.total_reviews_completed || 0} />
              </div>
            </div>
            
            <Separator />

            <div>
              <Label>Publication History</Label>
              {publishedManuscripts.length > 0 ? (
                <ul className="mt-2 space-y-3">
                  {publishedManuscripts.map(ms => (
                    <li key={ms.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <Link to={createPageUrl(`ManuscriptDetail?id=${ms.id}`)} className="font-medium text-emerald-800 hover:underline">
                        {ms.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-1">
                        Published on: {new Date(ms.updated_date).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No published manuscripts yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Languages & Reviewing */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Languages & Peer Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Languages for Reviewing/Editing</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {languages.map((language) => (
                  <Badge
                    key={language}
                    variant={user.languages?.includes(language) ? "default" : "outline"}
                    className={`cursor-pointer justify-center py-2 transition-all ${
                      user.languages?.includes(language) 
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200" 
                        : "hover:bg-slate-100"
                    }`}
                    onClick={() => toggleLanguage(language)}
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label>Peer Review Status</Label>
              <Select 
                value={user.reviewer_status || "inactive"} 
                onValueChange={(value) => handleInputChange('reviewer_status', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Not available for review</SelectItem>
                  <SelectItem value="pending">Interested in reviewing</SelectItem>
                  <SelectItem value="active">Active peer reviewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Help the scientific community by participating in peer review
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-900">Reviews Completed</span>
                </div>
                <span className="text-2xl font-bold text-emerald-700">
                  {user.total_reviews_completed || 0}
                </span>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Manuscripts Published</span>
                </div>
                <span className="text-2xl font-bold text-blue-700">
                  {user.manuscripts_published || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-48"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
