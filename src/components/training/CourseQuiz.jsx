import React, { useState } from "react";
import { recordCourseProgress } from "@/functions/recordCourseProgress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react";

export default function CourseQuiz({ course, enrolmentId, onDone }) {
  const quiz = course.quiz || [];
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const allAnswered = Object.keys(answers).length >= quiz.length;

  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await recordCourseProgress({ enrolment_id: enrolmentId, action: "submit_quiz", answers });
      const data = res?.data || res;
      setResult(data);
      if (data.quiz_passed) onDone(data);
    } catch (err) { setError(err?.message || "Could not submit quiz."); }
    setSubmitting(false);
  };

  const retry = () => { setResult(null); setAnswers({}); };

  return (
    <div className="mt-4 border border-slate-200 rounded-xl p-4">
      <h4 className="font-bold text-slate-900 mb-1">Final quiz</h4>
      <p className="text-sm text-slate-500 mb-4">Answer all {quiz.length} questions. Pass with {course.passing_score || 12} correct to earn your certificate.</p>
      {quiz.map((q, i) => (
        <div key={i} className="mb-4 pb-4 border-b border-slate-100 last:border-0">
          <p className="font-medium text-sm text-slate-900 mb-2">{i + 1}. {q.question}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, j) => {
              const selected = answers[i] === j;
              const correct = result && j === q.correct_index;
              const wrong = result && selected && j !== q.correct_index;
              return (
                <button key={j} type="button" disabled={!!result} onClick={() => setAnswers(a => ({ ...a, [i]: j }))}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${correct ? "border-teal-500 bg-teal-50 text-teal-900" : wrong ? "border-red-400 bg-red-50 text-red-800" : selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <span className="font-mono mr-2">{String.fromCharCode(65 + j)}.</span>{opt}
                  {correct && <CheckCircle className="w-4 h-4 inline ml-2 text-teal-600" />}
                  {wrong && <XCircle className="w-4 h-4 inline ml-2 text-red-500" />}
                </button>
              );
            })}
          </div>
          {result && q.explanation && <p className="text-xs text-slate-500 mt-2">Explanation: {q.explanation}</p>}
        </div>
      ))}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {!result ? (
        <Button onClick={submit} disabled={!allAnswered || submitting} className="bg-blue-700 hover:bg-blue-800 text-white">
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Submit quiz
        </Button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={result.quiz_passed ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-800"}>
            {result.quiz_passed ? "Passed" : "Not passed"}: {result.quiz_score}/{result.quiz_total}
          </Badge>
          {!result.quiz_passed && <Button onClick={retry} variant="outline" size="sm"><RotateCcw className="w-4 h-4 mr-2" /> Retry quiz</Button>}
        </div>
      )}
    </div>
  );
}