import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Records a learner's module-by-module progress and grades the final quiz.
// Credit-free: only entity operations. Enrolment updates are admin-gated by
// RLS, so this service-role function is the only path for learners to record
// progress on a public (no-login) app.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { enrolment_id, action, module_index, answers } = body;
    if (!enrolment_id) return Response.json({ error: 'enrolment_id is required' }, { status: 400 });

    let enrolment;
    try { enrolment = await base44.asServiceRole.entities.Enrolment.get(enrolment_id); } catch { return Response.json({ error: 'Enrolment not found' }, { status: 404 }); }
    if (enrolment.status !== 'active' && enrolment.status !== 'completed') {
      return Response.json({ error: 'Enrolment is not active' }, { status: 400 });
    }

    let course;
    try { course = await base44.asServiceRole.entities.Course.get(enrolment.course_id); } catch { return Response.json({ error: 'Course not found' }, { status: 404 }); }

    const totalModules = (course.syllabus || []).length;
    const completed = new Set(enrolment.completed_module_indices || []);
    const quizTotal = (course.quiz || []).length;
    const passingScore = course.passing_score || Math.ceil(quizTotal * 0.8);

    if (action === 'get') {
      return Response.json({
        completed_module_indices: [...completed],
        total_modules: totalModules,
        all_modules_complete: totalModules > 0 && completed.size >= totalModules,
        quiz_score: enrolment.quiz_score,
        quiz_passed: enrolment.quiz_passed === true,
        quiz_attempts: enrolment.quiz_attempts || 0,
        quiz_total: quizTotal,
        passing_score: passingScore
      });
    }

    if (action === 'complete_module') {
      if (typeof module_index !== 'number' || module_index < 0 || module_index >= totalModules) {
        return Response.json({ error: 'Invalid module index' }, { status: 400 });
      }
      completed.add(module_index);
      await base44.asServiceRole.entities.Enrolment.update(enrolment_id, { completed_module_indices: [...completed] });
      return Response.json({
        completed_module_indices: [...completed],
        total_modules: totalModules,
        all_modules_complete: completed.size >= totalModules
      });
    }

    if (action === 'submit_quiz') {
      if (!Array.isArray(answers)) return Response.json({ error: 'answers array is required' }, { status: 400 });
      const quiz = course.quiz || [];
      let score = 0;
      quiz.forEach((q, i) => { if (answers[i] === q.correct_index) score++; });
      const passed = score >= passingScore;
      const attempts = (enrolment.quiz_attempts || 0) + 1;
      await base44.asServiceRole.entities.Enrolment.update(enrolment_id, { quiz_score: score, quiz_passed: passed, quiz_attempts: attempts });
      return Response.json({ quiz_score: score, quiz_total: quiz.length, quiz_passed: passed, quiz_attempts: attempts, passing_score: passingScore });
    }

    return Response.json({ error: 'Unknown action. Use get, complete_module, or submit_quiz.' }, { status: 400 });
  } catch (error) {
    console.error('recordCourseProgress error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}