import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createCourseEnrolmentCheckout } from "@/functions/createCourseEnrolmentCheckout";
import { createCohortCheckout } from "@/functions/createCohortCheckout";
import { enrolInCohort } from "@/functions/enrolInCohort";
import CourseLearner from "@/components/training/CourseLearner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Clock, BarChart3, CheckCircle, Loader2, BookOpen, Users, Link as LinkIcon } from "lucide-react";

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
const seatDiscount = (seats) => (seats >= 20 ? 0.20 : seats >= 10 ? 0.15 : seats >= 5 ? 0.10 : 0);

export default function Training() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [enrolTab, setEnrolTab] = useState("individual");
  const [form, setForm] = useState({ user_name: "", user_email: "" });
  const [cohortForm, setCohortForm] = useState({ institution_name: "", contact_name: "", contact_email: "", seats: 5 });
  const [joinForm, setJoinForm] = useState({ cohort_code: "", join_name: "", join_email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [successEnrolment, setSuccessEnrolment] = useState(null);
  const [successCourseId, setSuccessCourseId] = useState(null);
  const [purchasedCohort, setPurchasedCohort] = useState(null);

  useEffect(() => {
    base44.entities.Course.filter({ is_active: true }, "sort_order", 50)
      .then(setCourses).catch(() => setCourses([])).finally(() => setLoading(false));
    const params = new URLSearchParams(window.location.search);
    if (params.get("stripe") === "success" && params.get("enrolment")) {
      setSuccessEnrolment(params.get("enrolment"));
      if (params.get("course")) setSuccessCourseId(params.get("course"));
    }
    if (params.get("cohort") === "purchased" && params.get("cohort_id")) {
      try {
        const pending = JSON.parse(localStorage.getItem("pendingCohort") || "null");
        if (pending && pending.cohort_id === params.get("cohort_id")) setPurchasedCohort(pending);
        localStorage.removeItem("pendingCohort");
      } catch {}
    }
    if (params.get("join")) {
      setJoinForm(f => ({ ...f, cohort_code: params.get("join") }));
      setTimeout(() => document.getElementById("join-cohort")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  const openEnrol = (course) => { setError(null); setEnrolTab("individual"); setSelected(course); };

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

  const handleCohortPurchase = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (window.self !== window.top) { setError("Checkout works only from the published app. Please open the app in a new tab."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await createCohortCheckout({
        course_id: selected.id, institution_name: cohortForm.institution_name,
        contact_name: cohortForm.contact_name, contact_email: cohortForm.contact_email, seats: cohortForm.seats
      });
      const data = res?.data || res;
      if (data?.url) {
        localStorage.setItem("pendingCohort", JSON.stringify({
          cohort_id: data.cohort_id, cohort_code: data.cohort_code, course_title: selected.title, seats: cohortForm.seats
        }));
        window.location.href = data.url;
      } else throw new Error("Could not start checkout.");
    } catch (err) { setError(err?.message || "Cohort purchase failed."); }
    setSubmitting(false);
  };

  const handleJoinCohort = async (e) => {
    e.preventDefault();
    setJoining(true); setJoinError(null);
    try {
      const res = await enrolInCohort({ cohort_code: joinForm.cohort_code, user_name: joinForm.join_name, user_email: joinForm.join_email });
      const data = res?.data || res;
      if (data?.enrolment_id) {
        setSuccessEnrolment(data.enrolment_id);
        if (data.course_id) setSuccessCourseId(data.course_id);
        setJoinForm({ cohort_code: "", join_name: "", join_email: "" });
        setTimeout(() => document.getElementById("learner-panel")?.scrollIntoView({ behavior: "smooth" }), 100);
      } else throw new Error(data?.error || "Could not join cohort.");
    } catch (err) { setJoinError(err?.message || "Could not join cohort."); }
    setJoining(false);
  };

  const perSeat = selected ? Math.round((selected.price || 0) * (1 - seatDiscount(parseInt(cohortForm.seats, 10) || 0))) : 0;
  const totalCohort = perSeat * (parseInt(cohortForm.seats, 10) || 0);
  const discountPct = Math.round(seatDiscount(parseInt(cohortForm.seats, 10) || 0) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Training & Certification — AfriSci Nexus Discovery" description="Paid courses and webinars on research methods, grant writing, publication ethics, AI ethics, technical writing and peer review, with interactive modules, final quizzes and verifiable certificates." canonicalPath="/Training" />
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Badge className="bg-teal-500/20 text-teal-100 border border-teal-400/30 mb-3">AfriSci Nexus Discovery</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Training & Certification</h1>
          <p className="text-blue-100 max-w-2xl">Professional courses for researchers and institutions. Work through interactive modules, pass a final quiz, and earn a verifiable, branded certificate. Enrol individually or buy a cohort for your institution.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {purchasedCohort && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-blue-900">Cohort purchased, payment received</h3>
                <p className="text-blue-800 text-sm mt-1">Share this cohort code with your {purchasedCohort.seats} learners. Each learner joins with the code, completes the modules and quiz, and downloads a branded certificate.</p>
                <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-blue-100"><p className="text-blue-400 text-xs">Cohort code</p><p className="font-mono font-bold text-blue-900">{purchasedCohort.cohort_code}</p></div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100"><p className="text-blue-400 text-xs">Course</p><p className="font-medium text-blue-900">{purchasedCohort.course_title}</p></div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100"><p className="text-blue-400 text-xs">Seats</p><p className="font-medium text-blue-900">{purchasedCohort.seats}</p></div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Share join link:</span>
                  <code className="bg-white px-2 py-1 rounded border border-blue-100 text-blue-900 text-xs">{window.location.origin}/Training?join={encodeURIComponent(purchasedCohort.cohort_code)}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {successEnrolment && successCourseId && (
          <div id="learner-panel" className="mb-8">
            <CourseLearner enrolmentId={successEnrolment} courseId={successCourseId} />
          </div>
        )}

        <div id="join-cohort" className="mb-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-700" /></div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Join your institution cohort</h2>
              <p className="text-sm text-slate-600">Have a cohort code from your institution? Enter it below to claim your prepaid seat and start the course.</p>
            </div>
          </div>
          <form onSubmit={handleJoinCohort} className="grid sm:grid-cols-4 gap-3 items-end">
            <div><Label>Cohort code *</Label><Input required value={joinForm.cohort_code} onChange={e => setJoinForm(f => ({ ...f, cohort_code: e.target.value }))} placeholder="COHORT-2026-XXXXX" /></div>
            <div><Label>Your name *</Label><Input required value={joinForm.join_name} onChange={e => setJoinForm(f => ({ ...f, join_name: e.target.value }))} placeholder="As it should appear on the certificate" /></div>
            <div><Label>Your email *</Label><Input required type="email" value={joinForm.join_email} onChange={e => setJoinForm(f => ({ ...f, join_email: e.target.value }))} placeholder="you@institution.edu" /></div>
            <Button type="submit" disabled={joining} className="bg-blue-700 hover:bg-blue-800 text-white">
              {joining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Join & start
            </Button>
          </form>
          {joinError && <p className="text-sm text-red-600 mt-2">{joinError}</p>}
        </div>

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

              <div className="flex gap-2 border-t border-slate-200 pt-4">
                <button type="button" onClick={() => setEnrolTab("individual")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${enrolTab === "individual" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Individual enrolment</button>
                <button type="button" onClick={() => setEnrolTab("cohort")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${enrolTab === "cohort" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Institutional cohort</button>
              </div>

              {enrolTab === "individual" && (
                <form onSubmit={handleEnrol} className="space-y-3">
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
              )}

              {enrolTab === "cohort" && (
                <form onSubmit={handleCohortPurchase} className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Buy a cohort for your institution</h4>
                  <p className="text-xs text-slate-500">Minimum 5 seats. Volume discounts: 5 to 9 seats 10% off, 10 to 19 seats 15% off, 20 or more seats 20% off.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Institution name *</Label><Input required value={cohortForm.institution_name} onChange={e => setCohortForm(f => ({ ...f, institution_name: e.target.value }))} placeholder="University of ..." /></div>
                    <div><Label>Contact name</Label><Input value={cohortForm.contact_name} onChange={e => setCohortForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Training coordinator" /></div>
                    <div><Label>Contact email *</Label><Input required type="email" value={cohortForm.contact_email} onChange={e => setCohortForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="coordinator@institution.edu" /></div>
                    <div><Label>Seats *</Label><Input required type="number" min="5" value={cohortForm.seats} onChange={e => setCohortForm(f => ({ ...f, seats: parseInt(e.target.value, 10) || 5 }))} /></div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-slate-600">Per seat</span><span className="font-medium">{fmtMoney(perSeat, selected.currency)} {discountPct > 0 && <span className="text-teal-600 ml-1">({discountPct}% off)</span>}</span></div>
                    <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span>{fmtMoney(totalCohort, selected.currency)}</span></div>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                    <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                      Buy cohort — {fmtMoney(totalCohort, selected.currency)}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}