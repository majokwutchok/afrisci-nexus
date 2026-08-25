import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Returns a student's enrolled courses with module progress and quiz scores.
// Email-based lookup (the app is public with no login), service-role read.
// Credit-free: entity operations only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim();
    if (!email) return Response.json({ error: 'email is required' }, { status: 400 });

    const enrolments = await base44.asServiceRole.entities.Enrolment.filter({ user_email: email }, '-enrolled_at', 100);

    const courseCache = {};
    const getCourse = async (id) => {
      if (!id) return null;
      if (id in courseCache) return courseCache[id];
      try { const c = await base44.asServiceRole.entities.Course.get(id); courseCache[id] = c; return c; }
      catch { courseCache[id] = null; return null; }
    };

    const items = [];
    for (const e of enrolments) {
      const course = await getCourse(e.course_id);
      const totalModules = course ? (course.syllabus || []).length : 0;
      const quizTotal = course ? (course.quiz || []).length : 0;
      const completedCount = (e.completed_module_indices || []).length;
      items.push({
        enrolment_id: e.id,
        course_id: e.course_id,
        course_title: e.course_title,
        course_code: e.course_code,
        status: e.status,
        enrolled_at: e.enrolled_at,
        completed_at: e.completed_at,
        certificate_code: e.certificate_code,
        completed_modules: completedCount,
        total_modules: totalModules,
        modules_complete: totalModules > 0 && completedCount >= totalModules,
        quiz_score: e.quiz_score,
        quiz_total: quizTotal,
        quiz_passed: e.quiz_passed === true,
        quiz_attempts: e.quiz_attempts || 0,
        cohort_code: e.cohort_code
      });
    }
    return Response.json({ email, enrolments: items });
  } catch (error) {
    console.error('getStudentDashboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}