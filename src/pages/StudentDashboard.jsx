import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStudentDashboard } from "@/functions/getStudentDashboard";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, BarChart3, Award, CheckCircle, XCircle, Loader2, BookOpen, Trophy, ArrowRight } from "lucide-react";

const STATUS_LABEL = { pending_payment: "Pending payment", active: "In progress", completed: "Completed", canceled: "Canceled" };
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default function StudentDashboard() {
  const [lookupEmail, setLookupEmail] = useState("");
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("studentEmail");
    if (saved) { setLookupEmail(saved); load(saved); }
  }, []);

  const load = async (em) => {
    setLoading(true); setError(null);
    try {
      const res = await getStudentDashboard({ email: em });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setItems(data?.enrolments || []);
      localStorage.setItem("studentEmail", em);
    } catch (err) { setError(err?.message || "Could not load your courses."); setItems([]); }
    setLoading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!lookupEmail) return;
    load(lookupEmail);
  };

  const activeCourses = items?.filter(i => i.status === "active") || [];
  const completedCourses = items?.filter(i => i.status === "completed") || [];
  const scored = items?.filter(i => i.quiz_score != null) || [];
  const avgScore = scored.length ? Math.round(scored.reduce((s, i) => s + i.quiz_score, 0) / scored.length) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="My Learning Dashboard — AfriSci Nexus Discovery" description="View your enrolled courses, track module progress and see your quiz scores." canonicalPath="/StudentDashboard" />
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Badge className="bg-teal-500/20 text-teal-100 border border-teal-400/30 mb-3">AfriSci Nexus Discovery</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">My Learning Dashboard</h1>
          <p className="text-blue-100 max-w-2xl">Track your enrolled courses, module progress and assessment scores. Enter the email you used to enrol to view your learning.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <Label>Your enrolment email</Label>
            <Input type="email" required value={lookupEmail} onChange={e => setLookupEmail(e.target.value)} placeholder="you@institution.edu" />
          </div>
          <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            View my courses
          </Button>
        </form>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">{error}</div>}

        {loading && <div className="grid sm:grid-cols-2 gap-4">{[0, 1].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>}

        {items && !loading && (
          <>
            {items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <GraduationCap className="w-14 h-14 mx-auto mb-3 text-slate-200" />
                <p className="font-semibold text-slate-400 text-lg">No courses found for this email</p>
                <p className="text-sm text-slate-400 mt-1">Enrol in a course to see your progress here.</p>
                <Link to="/Training"><Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">Browse courses</Button></Link>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <StatCard icon={BookOpen} label="Enrolled courses" value={items.length} color="blue" />
                  <StatCard icon={Trophy} label="Completed" value={completedCourses.length} color="teal" />
                  <StatCard icon={Award} label="Avg quiz score" value={avgScore != null ? `${avgScore}/15` : "—"} color="amber" />
                </div>

                {activeCourses.length > 0 && (
                  <Section title="In progress">
                    {activeCourses.map(c => <CourseCard key={c.enrolment_id} c={c} />)}
                  </Section>
                )}
                {completedCourses.length > 0 && (
                  <Section title="Completed">
                    {completedCourses.map(c => <CourseCard key={c.enrolment_id} c={c} />)}
                  </Section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { blue: "bg-blue-100 text-blue-700", teal: "bg-teal-100 text-teal-700", amber: "bg-amber-100 text-amber-700" };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}><Icon className="w-5 h-5" /></div>
      <div><p className="text-sm text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900">{value}</p></div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="font-bold text-slate-900 text-lg mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CourseCard({ c }) {
  const progress = pct(c.completed_modules, c.total_modules);
  const readyForCert = c.modules_complete && c.quiz_passed;
  const resumeUrl = `/Training?enrolment=${encodeURIComponent(c.enrolment_id)}&course=${encodeURIComponent(c.course_id)}`;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="font-mono">{c.course_code}</Badge>
            <Badge className={c.status === "completed" ? "bg-teal-100 text-teal-800" : "bg-blue-100 text-blue-800"}>{STATUS_LABEL[c.status] || c.status}</Badge>
            {c.cohort_code && <Badge variant="outline" className="bg-slate-50">Cohort: {c.cohort_code}</Badge>}
          </div>
          <h3 className="font-bold text-slate-900">{c.course_title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {c.certificate_code ? (
            <Link to={`/VerifyCertificate?code=${encodeURIComponent(c.certificate_code)}`}><Button size="sm" variant="outline" className="border-teal-300 text-teal-700"><Award className="w-4 h-4 mr-2" />View certificate</Button></Link>
          ) : readyForCert ? (
            <Link to={resumeUrl}><Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white"><Award className="w-4 h-4 mr-2" />Get certificate</Button></Link>
          ) : (
            <Link to={resumeUrl}><Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
          )}
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">Module progress</span><span className="font-medium text-slate-900">{c.completed_modules}/{c.total_modules}</span></div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
          {c.modules_complete && <p className="text-xs text-teal-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All modules complete</p>}
        </div>
        <div>
          <p className="text-sm text-slate-600 mb-1">Final quiz</p>
          {c.quiz_score != null ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={c.quiz_passed ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-800"}>
                {c.quiz_passed ? <CheckCircle className="w-3.5 h-3.5 mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                {c.quiz_score}/{c.quiz_total} {c.quiz_passed ? "passed" : "not passed"}
              </Badge>
              <span className="text-xs text-slate-500">{c.quiz_attempts} attempt{c.quiz_attempts === 1 ? "" : "s"}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not yet attempted</p>
          )}
        </div>
      </div>
    </div>
  );
}