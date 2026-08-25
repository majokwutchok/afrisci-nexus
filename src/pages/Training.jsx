import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createCourseEnrolmentCheckout } from "@/functions/createCourseEnrolmentCheckout";
import { issueCertificate } from "@/functions/issueCertificate";
import { generateCertificatePDF } from "@/utils/generateCertificate";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Clock, BarChart3, CheckCircle, Loader2, Award, BookOpen } from "lucide-react";

const CATEGORY_LABEL = {
  research_methods: "Research Methods",
  grant_writing: "Grant Writing",
  publication_ethics: "Publication Ethics",
  ai_ethics: "AI Ethics",
  technical_writing: "Technical Writing",
  peer_review: "Peer Review",
  data_management: "Data Management",
  project_management: "Project Management"
};
const LEVEL_LABEL = { foundational: "Foundational", intermediate: "Intermediate", advanced: "Advanced" };
const fmtMoney = (n, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n || 0);

export default function Training() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ user_name: "", user_email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successEnrolment, setSuccessEnrolment] = useState(null);
  const [certData, setCertData] = useState(null);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    base44.entities.Course.filter({ is_active: true }, "sort_order", 50)
      .then(setCourses).catch(() => setCourses([])).finally(() => setLoading(false));
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "success" && params.get("enrolment")) setSuccessEnrolment(params.get("enrolment"));
  }, []);

  const openEnrol = (course) => { setError(null); setSelected(course); };

  const handleEnrol = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (window.self !== window.top) { setError("Checkout works only from the published app. Please open the app in a new tab."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await createCourseEnrolmentCheckout({ course_id: selected.id, user_name: form.user_name, user_email: form.user_email });
      const data = res?.data || res;
      if (data?.url) window.location.href = data.url;
      else throw new Error("Could not start checkout.");
    } catch (err) { setError(err?.message || "Enrolment failed."); }
    setSubmitting(false);
  };

  const handleGenerateCert = async () => {
    if (!successEnrolment) return;
    setIssuing(true); setError(null);
    try {
      const res = await issueCertificate({ enrolment_id: successEnrolment });
      const data = res?.data || res;
      if (data?.certificate_code) {
        setCertData(data);
        generateCertificatePDF({
          studentName: data.user_name, courseTitle: data.course_title,
          courseCode: data.course_code, certificateCode: data.certificate_code, issueDate: data.issue_date
        });
      } else throw new Error(data?.error || "Could not issue certificate.");
    } catch (err) { setError(err?.message || "Could not issue certificate."); }
    setIssuing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Training & Certification — AfriSci Nexus Discovery" description="Paid courses and webinars on research methods, grant writing, publication ethics, AI ethics, technical writing and peer review — with verifiable certificates." canonicalPath="/Training" />
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Badge className="bg-teal-500/20 text-teal-100 border border-teal-400/30 mb-3">AfriSci Nexus Discovery</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Training & Certification</h1>
          <p className="text-blue-100 max-w-2xl">Professional courses for researchers and institutions — research methods, grant writing, publication ethics, AI ethics, technical writing and peer review. Complete a course and earn a verifiable, branded certificate.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {successEnrolment && (
          <div className="mb-8 bg-teal-50 border border-teal-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-teal-900">Enrolment confirmed — payment received</h3>
                <p className="text-teal-800 text-sm mt-1">You now have access to the course materials. When you have completed the course, generate your verifiable certificate below.</p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start">
                  <Button onClick={handleGenerateCert} disabled={issuing} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {issuing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
                    {certData ? "Re-download certificate" : "I've completed the course — generate certificate"}
                  </Button>
                  {certData && (
                    <div className="text-sm text-teal-800">
                      <p>Code: <strong>{certData.certificate_code}</strong></p>
                      <a href={`/VerifyCertificate?code=${encodeURIComponent(certData.certificate_code)}`} className="text-teal-700 underline">Verify certificate →</a>
                    </div>
                  )}
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <GraduationCap className="w-14 h-14 mx-auto mb-3 text-slate-200" />
            <p className="font-semibold text-slate-400 text-lg">Courses are being configured</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
                {course.cover_image_url ? (
                  <img src={course.cover_image_url} alt={course.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 text-white/80" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className="bg-blue-100 text-blue-800">{CATEGORY_LABEL[course.category] || course.category}</Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><BarChart3 className="w-3 h-3" />{LEVEL_LABEL[course.level] || course.level}</span>
                    {course.duration_hours > 0 && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_hours}h</span>}
                  </div>
                  <p className="text-xs font-mono text-slate-400 mb-1">{course.course_code}</p>
                  <h3 className="font-bold text-slate-900 leading-snug mb-1">{course.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-1">{course.subtitle || course.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <span className="text-lg font-bold text-teal-700">{fmtMoney(course.price, course.currency)}</span>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openEnrol(course)}>View & enrol</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-teal-600" /> {selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge className="bg-blue-100 text-blue-800">{CATEGORY_LABEL[selected.category]}</Badge>
                <Badge variant="outline">{LEVEL_LABEL[selected.level]}</Badge>
                <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{selected.duration_hours} hours</span>
                <span className="text-slate-500 font-mono">{selected.course_code}</span>
              </div>
              <p className="text-sm text-slate-700">{selected.description}</p>
              {selected.learning_outcomes?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Learning outcomes</h4>
                  <ul className="space-y-1">{selected.learning_outcomes.map((o, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />{o}</li>)}</ul>
                </div>
              )}
              {selected.syllabus?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Curriculum</h4>
                  <div className="space-y-2">{selected.syllabus.map((m, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3">
                      <p className="font-medium text-sm text-slate-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-teal-600" />{m.module}</p>
                      {m.topics?.length > 0 && <ul className="ml-6 mt-1 list-disc text-sm text-slate-600">{m.topics.map((t, j) => <li key={j}>{t}</li>)}</ul>}
                    </div>
                  ))}</div>
                </div>
              )}
              {selected.features?.length > 0 && (
                <div className="flex flex-wrap gap-2">{selected.features.map((f, i) => <Badge key={i} variant="outline" className="bg-slate-50">{f}</Badge>)}</div>
              )}
              <form onSubmit={handleEnrol} className="space-y-3 border-t border-slate-200 pt-4">
                <h4 className="font-semibold text-slate-900">Enrol & pay</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Full name *</Label><Input required value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} placeholder="As it should appear on the certificate" /></div>
                  <div><Label>Email *</Label><Input required type="email" value={form.user_email} onChange={e => setForm(f => ({ ...f, user_email: e.target.value }))} placeholder="you@institution.edu" /></div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Enrol — {fmtMoney(selected.price, selected.currency)}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}