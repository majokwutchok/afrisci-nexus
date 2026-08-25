import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getCourseMap, courseModuleCount, courseDurationHours, normalizeEmail } from '../../shared/courseLookup.ts';

// Public learner leaderboard. Ranks learners by a composite of assessment
// scores and completed training hours. Email-based (public app, no login).
// Credit-free: entity reads only.
function displayName(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  }
  if (!email) return 'Anonymous';
  const [u, d] = email.split('@');
  return (u ? u.slice(0, 2) : '') + '***@' + (d || '');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email || '');

    const enrolments = await base44.asServiceRole.entities.Enrolment.list('-created_date', 500);

    const courseMap = await getCourseMap(base44, enrolments.map(e => e.course_id));

    const users = {};
    for (const e of enrolments) {
      const em = normalizeEmail(e.user_email);
      if (!em) continue;
      const course = courseMap[e.course_id] || null;
      const totalModules = courseModuleCount(course);
      const completedCount = (e.completed_module_indices || []).length;
      const durationHours = courseDurationHours(course);
      const ratio = totalModules > 0 ? completedCount / totalModules : 0;

      if (!users[em]) users[em] = { email: em, name: e.user_name || '', completedHours: 0, quizScore: 0, completedCourses: 0 };
      const u = users[em];
      if (!u.name && e.user_name) u.name = e.user_name;
      u.completedHours += ratio * durationHours;
      if (typeof e.quiz_score === 'number' && e.quiz_score > 0) u.quizScore += e.quiz_score;
      if (e.status === 'completed' || (totalModules > 0 && completedCount >= totalModules)) u.completedCourses += 1;
    }

    const rows = Object.values(users).map(u => {
      const points = Math.round((u.quizScore + u.completedHours) * 10) / 10;
      return {
        email: u.email,
        name: displayName(u.name, u.email),
        completedHours: Math.round(u.completedHours * 10) / 10,
        quizScore: u.quizScore,
        completedCourses: u.completedCourses,
        points
      };
    });
    rows.sort((a, b) => b.points - a.points || b.completedCourses - a.completedCourses);

    const ranked = rows.filter(r => r.points > 0);
    const leaderboard = ranked.slice(0, 10).map((r, i) => ({
      rank: i + 1, name: r.name, completedHours: r.completedHours,
      quizScore: r.quizScore, completedCourses: r.completedCourses,
      points: r.points, is_me: r.email === email
    }));

    let me = null;
    if (email) {
      const idx = ranked.findIndex(r => r.email === email);
      if (idx >= 0) {
        const r = ranked[idx];
        me = { rank: idx + 1, inTop: idx < 10, points: r.points, completedHours: r.completedHours, quizScore: r.quizScore, completedCourses: r.completedCourses };
      }
    }

    return Response.json({ leaderboard, me });
  } catch (error) {
    console.error('getStudentLeaderboard error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}