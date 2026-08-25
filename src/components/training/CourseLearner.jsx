import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { recordCourseProgress } from "@/functions/recordCourseProgress";
import { issueCertificate } from "@/functions/issueCertificate";
import { generateCertificatePDF } from "@/utils/generateCertificate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Award, Loader2, ChevronDown, ChevronRight, Lock } from "lucide-react";
import CourseQuiz from "./CourseQuiz";

export default function CourseLearner({ enrolmentId, courseId }) {
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState({ completed_module_indices: [], total_modules: 0, quiz_passed: false, quiz_score: null });
  const [loading, setLoading] = useState(true);
  const [openModule, setOpenModule] = useState(null);
  const [saving, setSaving] = useState(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [certData, setCertData] = useState(null);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await base44.entities.Course.get(courseId);
        setCourse(c);
        const res = await recordCourseProgress({ enrolment_id: enrolmentId, action: "get" });
        setProgress(res?.data || res);
      } catch (e) {}
      setLoading(false);
    })();
  }, [enrolmentId, courseId]);

  const completedSet = new Set(progress.completed_module_indices || []);
  const total = progress.total_modules || (course?.syllabus?.length || 0);
  const allDone = total > 0 && completedSet.size >= total;
  const quizPassed = progress.quiz_passed === true;

  const completeModule = async (i) => {
    setSaving(i);
    try {
      const res = await recordCourseProgress({ enrolment_id: enrolmentId, action: "complete_module", module_index: i });
      setProgress(res?.data || res);
    } catch (e) {}
    setSaving(null);
  };

  const onQuizDone = (p) => {
    setProgress(prev => ({ ...prev, ...p }));
    setQuizOpen(false);
  };

  const generateCert = async () => {
    setIssuing(true); setError(null);
    try {
      const res = await issueCertificate({ enrolment_id: enrolmentId });
      const data = res?.data || res;
      if (data?.certificate_code) {
        setCertData(data);
        generateCertificatePDF({ studentName: data.user_name, courseTitle: data.course_title, courseCode: data.course_code, certificateCode: data.certificate_code, issueDate: data.issue_date });
      } else throw new Error(data?.error || "Could not issue certificate.");
    } catch (err) { setError(err?.message || "Could not issue certificate."); }
    setIssuing(false);
  };

  if (loading) return <Skeleton className="h-64 rounded-xl" />;
  if (!course) return <div className="text-sm text-slate-500">Course not found.</div>;

  return (
    <div className="bg-white rounded-2xl border border-teal-200 shadow-lg p-6">
      <div className="flex items-center gap-2 mb-1">
        <Badge className="bg-teal-100 text-teal-800">Enrolled</Badge>
        <span className="text-sm text-slate-500">{course.course_code}</span>
      </div>
      <h3 className="font-bold text-slate-900 text-lg">{course.title}</h3>
      <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
        <span className="text-slate-600">Modules: <strong>{completedSet.size}/{total}</strong> complete</span>
        {progress.quiz_score != null && (
          <span className="text-slate-600">Quiz: <strong>{progress.quiz_score}/{course.quiz?.length || 0}</strong> {quizPassed ? <span className="text-teal-600">passed</span> : <span className="text-red-500">not passed</span>}</span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {(course.syllabus || []).map((m, i) => {
          const done = completedSet.has(i);
          const open = openModule === i;
          return (
            <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
              <button type="button" onClick={() => setOpenModule(open ? null : i)} className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50">
                {done ? <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                <span className="font-medium text-sm text-slate-900 flex-1">{m.module}</span>
                {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {open && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  {m.topics?.length > 0 && (
                    <ul className="ml-6 mt-2 list-disc text-sm text-slate-600">{m.topics.map((t, j) => <li key={j}>{t}</li>)}</ul>
                  )}
                  {m.content && <p className="text-sm text-slate-700 mt-3 leading-relaxed whitespace-pre-line">{m.content}</p>}
                  <Button size="sm" onClick={() => completeModule(i)} disabled={saving === i} className="mt-3 bg-teal-600 hover:bg-teal-700 text-white">
                    {saving === i ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : done ? <CheckCircle className="w-4 h-4 mr-2" /> : null}
                    {done ? "Completed" : "Mark module complete"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!allDone && <p className="text-sm text-slate-500 mt-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Complete all modules to unlock the final quiz.</p>}

      {allDone && !quizPassed && !quizOpen && (
        <Button onClick={() => setQuizOpen(true)} className="mt-4 bg-blue-700 hover:bg-blue-800 text-white">Take the final quiz ({course.quiz?.length || 0} questions)</Button>
      )}

      {quizOpen && <CourseQuiz course={course} enrolmentId={enrolmentId} onDone={onQuizDone} />}

      {quizPassed && (
        <div className="mt-5 bg-teal-50 border border-teal-200 rounded-xl p-5">
          <h4 className="font-bold text-teal-900">Congratulations, you passed!</h4>
          <p className="text-teal-800 text-sm mt-1">Generate your verifiable, branded certificate.</p>
          <Button onClick={generateCert} disabled={issuing} className="mt-3 bg-teal-600 hover:bg-teal-700 text-white">
            {issuing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
            {certData ? "Re-download certificate" : "Generate certificate"}
          </Button>
          {certData && <div className="text-sm text-teal-800 mt-2"><p>Code: <strong>{certData.certificate_code}</strong></p><a href={`/VerifyCertificate?code=${encodeURIComponent(certData.certificate_code)}`} className="underline">Verify certificate →</a></div>}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}