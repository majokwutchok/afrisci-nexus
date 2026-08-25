// Shared course-lookup helpers for backend functions that enrich enrolment
// data with course details (module counts, quiz counts, duration). Plain
// module — no Deno.serve — imported by functions that need it.

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

// Fetches a map of course_id -> course record (null on miss) for the given ids,
// de-duplicated to avoid repeat fetches across enrolments.
export async function getCourseMap(base44, courseIds) {
  const cache = {};
  const ids = [...new Set((courseIds || []).filter(Boolean))];
  for (const id of ids) {
    try { cache[id] = await base44.asServiceRole.entities.Course.get(id); }
    catch { cache[id] = null; }
  }
  return cache;
}

export function courseModuleCount(course) {
  return course ? (course.syllabus || []).length : 0;
}

export function courseQuizCount(course) {
  return course ? (course.quiz || []).length : 0;
}

export function courseDurationHours(course) {
  return course ? (course.duration_hours || 0) : 0;
}