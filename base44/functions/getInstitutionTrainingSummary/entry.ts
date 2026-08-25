import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getCourseMap, courseModuleCount, courseDurationHours, normalizeEmail } from '../../shared/courseLookup.ts';
import { displayName } from '../../shared/learnerUtils.ts';

// Institutional training summary. Aggregates cohort-linked enrolments per
// institution into member progress + assessment scores, and ranks institutions
// by total points (quiz score + completed training hours). Email-based
// (public app): the partner's contact email identifies their institution.
// Credit-free: entity reads only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email || '');

    const cohorts = await base44.asServiceRole.entities.CourseCohort.list('-created_date', 500);
    const enrolments = await base44.asServiceRole.entities.Enrolment.list('-created_date', 500);
    const courseMap = await getCourseMap(base44, enrolments.map(e => e.course_id));

    // Map cohort id / code -> institution key (lowercased institution_name).
    const cohortInst = {};
    const cohortCodeInst = {};
    const instMeta = {};
    for (const c of cohorts) {
      const key = (c.institution_name || '').trim().toLowerCase() || c.id;
      cohortInst[c.id] = key;
      if (c.cohort_code) cohortCodeInst[c.cohort_code.trim().toLowerCase()] = key;
      if (!instMeta[key]) instMeta[key] = { name: c.institution_name || 'Unknown', contact_email: normalizeEmail(c.contact_email) };
    }

    // Resolve the partner's institution key from their contact email.
    let instKey = null;
    if (email) {
      for (const c of cohorts) {
        if (normalizeEmail(c.contact_email) === email) {
          instKey = (c.institution_name || '').trim().toLowerCase() || c.id;
          break;
        }
      }
    }

    // Group enrolments by institution, then by member.
    const instMembers = {};
    for (const e of enrolments) {
      let key = e.cohort_id ? cohortInst[e.cohort_id] : null;
      if (!key && e.cohort_code) key = cohortCodeInst[e.cohort_code.trim().toLowerCase()];
      if (!key) continue;
      const course = courseMap[e.course_id] || null;
      const totalModules = courseModuleCount(course);
      const completedCount = (e.completed_module_indices || []).length;
      const durationHours = courseDurationHours(course);
      const ratio = totalModules > 0 ? completedCount / totalModules : 0;
      const em = normalizeEmail(e.user_email);
      if (!em) continue;
      if (!instMembers[key]) instMembers[key] = {};
      if (!instMembers[key][em]) instMembers[key][em] = { email: em, name: e.user_name || '', completedHours: 0, quizScore: 0, completedCourses: 0, enrolments: 0 };
      const m = instMembers[key][em];
      if (!m.name && e.user_name) m.name = e.user_name;
      m.completedHours += ratio * durationHours;
      if (typeof e.quiz_score === 'number' && e.quiz_score > 0) m.quizScore += e.quiz_score;
      if (e.status === 'completed' || (totalModules > 0 && completedCount >= totalModules)) m.completedCourses += 1;
      m.enrolments += 1;
    }

    // Build institution aggregate rows.
    const instRows = Object.entries(instMembers).map(([key, membersMap]) => {
      const memberList = Object.values(membersMap);
      let totalHours = 0, totalScore = 0, totalCompleted = 0;
      for (const m of memberList) { totalHours += m.completedHours; totalScore += m.quizScore; totalCompleted += m.completedCourses; }
      const points = Math.round((totalScore + totalHours) * 10) / 10;
      return {
        key, name: instMeta[key]?.name || 'Unknown',
        contact_email: instMeta[key]?.contact_email || '',
        memberCount: memberList.length,
        completedHours: Math.round(totalHours * 10) / 10,
        quizScore: totalScore, completedCourses: totalCompleted, points
      };
    });
    instRows.sort((a, b) => b.points - a.points || b.memberCount - a.memberCount);
    const ranked = instRows.filter(r => r.points > 0);

    const ranking = ranked.slice(0, 10).map((r, i) => ({
      rank: i + 1, name: r.name, memberCount: r.memberCount,
      completedHours: r.completedHours, quizScore: r.quizScore,
      completedCourses: r.completedCourses, points: r.points,
      is_me: instKey ? r.key === instKey : false
    }));

    let institution = null;
    if (instKey && instMembers[instKey]) {
      const idx = instRows.findIndex(x => x.key === instKey);
      const r = instRows[idx];
      const rankedIdx = ranked.findIndex(x => x.key === instKey);
      const members = Object.values(instMembers[instKey]).map(m => {
        const points = Math.round((m.quizScore + m.completedHours) * 10) / 10;
        return {
          name: displayName(m.name, m.email),
          completedHours: Math.round(m.completedHours * 10) / 10,
          quizScore: m.quizScore, completedCourses: m.completedCourses,
          enrolments: m.enrolments, points
        };
      }).sort((a, b) => b.points - a.points);
      institution = {
        name: instMeta[instKey]?.name || 'Unknown',
        rank: idx + 1,
        inTop: rankedIdx >= 0 && rankedIdx < 10,
        memberCount: r.memberCount,
        completedHours: r.completedHours,
        quizScore: r.quizScore,
        completedCourses: r.completedCourses,
        points: r.points,
        members
      };
    }

    return Response.json({ ranking, institution });
  } catch (error) {
    console.error('getInstitutionTrainingSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}