import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Eye, Edit, Upload, CheckCircle, Loader2,
  ArrowRight, User as UserIcon, BookOpen, Globe, Award,
  ChevronLeft, AlertCircle
} from "lucide-react";

const ROLES = [
  {
    id: "author",
    label: "Author",
    icon: FileText,
    color: "teal",
    headline: "Publish Your Research",
    description: "Submit manuscripts for peer review, track your submissions, and share your research with the African academic community.",
    benefits: [
      "AI-assisted manuscript assessment",
      "Smart journal matching",
      "Real-time submission tracking",
      "Open access publishing"
    ],
    dashboardUrl: "Dashboard"
  },
  {
    id: "reviewer",
    label: "Peer Reviewer",
    icon: Eye,
    color: "blue",
    headline: "Shape African Science",
    description: "Join our expert reviewer community. Evaluate manuscripts, provide constructive feedback, and maintain the quality of African research.",
    benefits: [
      "Access to cutting-edge research",
      "Flexible review scheduling",
      "Recognition & reviewer certificates",
      "Build your academic network"
    ],
    dashboardUrl: "ReviewerDashboard"
  },
  {
    id: "editor",
    label: "Editor",
    icon: Edit,
    color: "purple",
    headline: "Lead Editorial Excellence",
    description: "Manage journal sections, coordinate peer review, and guide authors to publish high-quality research in your field.",
    benefits: [
      "Manage journal sections",
      "Coordinate peer review process",
      "Shape journal scope & quality",
      "Editorial board recognition"
    ],
    dashboardUrl: "EditorDashboard"
  }
];

const colorMap = {
  teal: {
    bg: "bg-teal-50", border: "border-teal-300", icon: "bg-teal-100 text-teal-700",
    badge: "bg-teal-100 text-teal-800", btn: "bg-teal-600 hover:bg-teal-700",
    ring: "ring-teal-400", heading: "text-teal-700"
  },
  blue: {
    bg: "bg-blue-50", border: "border-blue-300", icon: "bg-blue-100 text-blue-700",
    badge: "bg-blue-100 text-blue-800", btn: "bg-blue-600 hover:bg-blue-700",
    ring: "ring-blue-400", heading: "text-blue-700"
  },
  purple: {
    bg: "bg-purple-50", border: "border-purple-300", icon: "bg-purple-100 text-purple-700",
    badge: "bg-purple-100 text-purple-800", btn: "bg-purple-600 hover:bg-purple-700",
    ring: "ring-purple-400", heading: "text-purple-700"
  }
};

export default function Apply() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedRole = urlParams.get("role");

  const [step, setStep] = useState(preselectedRole ? "form" : "select");
  const [selectedRole, setSelectedRole] = useState(preselectedRole || null);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [uploading, setUploading] = useState({ cv: false, creds: false });

  const [form, setForm] = useState({
    full_name: "", affiliation: "", country: "", academic_title: "",
    orcid: "", google_scholar_url: "", motivation: "",
    research_interests: "", cv_url: "", credentials_url: ""
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setUser(u);
        setForm(f => ({
          ...f,
          full_name: u.full_name || "",
          affiliation: u.affiliation || "",
          country: u.country || "",
          academic_title: u.academic_title || "",
          orcid: u.orcid || "",
          google_scholar_url: u.google_scholar_url || "",
          research_interests: (u.research_interests || []).join(", ")
        }));
      }
      setIsLoadingUser(false);
    }).catch(() => setIsLoadingUser(false));
  }, []);

  // Check for existing application when role is selected
  useEffect(() => {
    if (!selectedRole || !user) return;
    base44.entities.RoleApplication.filter({
      applicant_email: user.email,
      role: selectedRole
    }).then(apps => {
      if (apps.length > 0) setExistingApp(apps[0]);
      else setExistingApp(null);
    }).catch(() => {});
  }, [selectedRole, user]);

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setStep("form");
  };

  const handleFileUpload = async (field, file) => {
    setUploading(u => ({ ...u, [field]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, [field === "cv" ? "cv_url" : "credentials_url"]: file_url }));
    setUploading(u => ({ ...u, [field]: false }));
  };

  const handleSubmit = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setSubmitting(true);
    const roleData = ROLES.find(r => r.id === selectedRole);

    const appData = {
      role: selectedRole,
      applicant_email: user.email,
      full_name: form.full_name,
      affiliation: form.affiliation,
      country: form.country,
      academic_title: form.academic_title,
      orcid: form.orcid,
      google_scholar_url: form.google_scholar_url,
      motivation: form.motivation,
      cv_url: form.cv_url,
      credentials_url: form.credentials_url,
      research_interests: form.research_interests.split(",").map(s => s.trim()).filter(Boolean),
      status: "pending"
    };

    await base44.entities.RoleApplication.create(appData);

    // Update user profile flags
    const updates = { affiliation: form.affiliation, country: form.country, academic_title: form.academic_title };
    if (selectedRole === "author") updates.author_application_status = "pending";
    if (selectedRole === "reviewer") { updates.reviewer_status = "pending"; updates.reviewer_application_status = "pending"; }
    if (selectedRole === "editor") { updates.editor_interest = true; updates.editor_application_date = new Date().toISOString().split("T")[0]; }
    await base44.auth.updateMe(updates);

    setSubmitted(true);
    setSubmitting(false);
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // SUCCESS screen
  if (submitted) {
    const role = ROLES.find(r => r.id === selectedRole);
    const c = colorMap[role.color];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full text-center border-0 shadow-2xl">
          <CardContent className="p-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${c.icon}`}>
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
            <p className="text-slate-600 mb-6">
              Your <strong>{role.label}</strong> application has been received. Our team will review it and you'll be notified by email. Track your status from your dashboard.
            </p>
            <div className="flex flex-col gap-3">
              <Link to={createPageUrl(role.dashboardUrl)}>
                <Button className={`w-full ${c.btn} text-white`}>
                  Go to {role.label} Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to={createPageUrl("Home")}>
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ROLE SELECT screen
  if (step === "select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Badge className="bg-teal-500/90 text-white mb-4">Join AfriSci Nexus</Badge>
            <h1 className="text-4xl font-bold mb-4">Join the African Research Community</h1>
            <p className="text-xl text-sky-200 max-w-2xl mx-auto">
              Choose your role and become part of Africa's leading academic publishing platform.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {ROLES.map(role => {
              const c = colorMap[role.color];
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className={`border-2 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 ${c.border} ${c.bg}`}
                  onClick={() => handleSelectRole(role.id)}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${c.icon}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className={`text-xl font-bold mb-1 ${c.heading}`}>{role.label}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-4">{role.headline}</p>
                    <p className="text-sm text-slate-600 mb-6">{role.description}</p>
                    <ul className="text-left space-y-2 mb-6">
                      {role.benefits.map(b => (
                        <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.heading}`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full ${c.btn} text-white`}>
                      Apply as {role.label} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {user && (
            <p className="text-center text-sm text-slate-500 mt-8">
              Signed in as <strong>{user.email}</strong> · <Link to={createPageUrl("Dashboard")} className="text-teal-600 hover:underline">Go to Dashboard</Link>
            </p>
          )}
          {!user && (
            <p className="text-center text-sm text-slate-500 mt-8">
              Already a member?{" "}
              <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="text-teal-600 hover:underline font-medium">
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  // FORM screen
  const role = ROLES.find(r => r.id === selectedRole);
  const c = colorMap[role.color];
  const Icon = role.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className={`bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-12`}>
        <div className="max-w-3xl mx-auto px-6">
          <button onClick={() => setStep("select")} className="flex items-center gap-2 text-sky-300 hover:text-white mb-4 text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to role selection
          </button>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{role.label} Application</h1>
              <p className="text-sky-200 text-sm">{role.headline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Existing application notice */}
        {existingApp && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            existingApp.status === "approved" ? "bg-emerald-50 border-emerald-200" :
            existingApp.status === "rejected" ? "bg-red-50 border-red-200" :
            "bg-amber-50 border-amber-200"
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold text-slate-800">You already applied for this role</p>
              <p className="text-sm text-slate-600 mt-0.5">
                Status: <Badge className={
                  existingApp.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                  existingApp.status === "rejected" ? "bg-red-100 text-red-800" :
                  "bg-amber-100 text-amber-800"
                }>{existingApp.status}</Badge>
                {" "} · Applied {new Date(existingApp.created_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Auth gate */}
        {!user && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-5 flex items-center gap-4">
              <UserIcon className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Sign in to submit your application</p>
                <p className="text-sm text-slate-600">You'll need an account to track your application status.</p>
              </div>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
                Sign In / Register
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-900">Personal & Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Full Name *</label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Dr. Jane Okafor" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Academic Title *</label>
                <Input value={form.academic_title} onChange={e => setForm(f => ({ ...f, academic_title: e.target.value }))} placeholder="Professor, Dr., Research Fellow..." />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Institution / Affiliation *</label>
              <Input value={form.affiliation} onChange={e => setForm(f => ({ ...f, affiliation: e.target.value }))} placeholder="University of Nairobi" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Country *</label>
                <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Kenya" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">ORCID</label>
                <Input value={form.orcid} onChange={e => setForm(f => ({ ...f, orcid: e.target.value }))} placeholder="0000-0000-0000-0000" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Google Scholar URL</label>
              <Input value={form.google_scholar_url} onChange={e => setForm(f => ({ ...f, google_scholar_url: e.target.value }))} placeholder="https://scholar.google.com/..." />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Research Interests (comma-separated)</label>
              <Input value={form.research_interests} onChange={e => setForm(f => ({ ...f, research_interests: e.target.value }))} placeholder="Climate change, Public health, Machine learning..." />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">
                Why do you want to be a {role.label}? *
              </label>
              <textarea
                value={form.motivation}
                onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
                placeholder={`Tell us about your experience and why you want to join as a ${role.label.toLowerCase()}...`}
                rows={4}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <Separator />

            {/* Document uploads */}
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Supporting Documents</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* CV */}
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${form.cv_url ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:border-slate-300"}`}>
                  {form.cv_url ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-6 h-6 text-teal-600 mx-auto" />
                      <p className="text-xs text-teal-700 font-medium">CV uploaded</p>
                      <button onClick={() => setForm(f => ({ ...f, cv_url: "" }))} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => e.target.files[0] && handleFileUpload("cv", e.target.files[0])} />
                      {uploading.cv ? <Loader2 className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-1" /> : <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />}
                      <p className="text-xs font-medium text-slate-600">Upload CV / Resume</p>
                      <p className="text-xs text-slate-400">PDF, DOC up to 10MB</p>
                    </label>
                  )}
                </div>

                {/* Credentials */}
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${form.credentials_url ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:border-slate-300"}`}>
                  {form.credentials_url ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-6 h-6 text-teal-600 mx-auto" />
                      <p className="text-xs text-teal-700 font-medium">Credentials uploaded</p>
                      <button onClick={() => setForm(f => ({ ...f, credentials_url: "" }))} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={e => e.target.files[0] && handleFileUpload("creds", e.target.files[0])} />
                      {uploading.creds ? <Loader2 className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-1" /> : <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />}
                      <p className="text-xs font-medium text-slate-600">Credentials / Certificates</p>
                      <p className="text-xs text-slate-400">PDF, image up to 10MB</p>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                className={`w-full ${c.btn} text-white font-semibold py-3`}
                onClick={handleSubmit}
                disabled={submitting || !form.full_name || !form.affiliation || !form.country || !form.motivation || !user}
              >
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : `Submit ${role.label} Application`}
              </Button>
              {!user && (
                <p className="text-center text-xs text-slate-500 mt-2">You must be signed in to submit.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}