import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const DOWNLOAD_MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const CITATION_MILESTONES = [1, 5, 10, 25, 50, 100];
const VIEW_MILESTONES = [50, 100, 250, 500, 1000, 5000];

function crossedMilestone(milestones, current, previous) {
  return milestones.find(m => current >= m && previous < m) || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require an authenticated admin to prevent unauthenticated callers from
    // triggering milestone processing and notification creation.
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // This runs as a scheduled task — use service role
    const published = await base44.asServiceRole.entities.Manuscript.filter({ status: 'published' });

    let created = 0;

    for (const ms of published) {
      const authorEmail = ms.created_by;
      if (!authorEmail) continue;

      // Fetch existing notifications for this manuscript to determine previous milestones
      const existingNotifs = await base44.asServiceRole.entities.PerformanceNotification.filter({
        manuscript_id: ms.id,
        author_email: authorEmail
      });

      const existingMilestones = (type) =>
        existingNotifs
          .filter(n => n.type === type)
          .map(n => n.milestone);

      const notify = async (type, title, message, milestone, value) => {
        const already = existingMilestones(type);
        if (already.includes(milestone)) return;
        await base44.asServiceRole.entities.PerformanceNotification.create({
          author_email: authorEmail,
          manuscript_id: ms.id,
          manuscript_title: ms.title,
          type,
          title,
          message,
          metric_value: value,
          milestone,
          is_read: false
        });
        created++;
      };

      const prevDownloads = existingNotifs
        .filter(n => n.type === 'download_milestone')
        .reduce((max, n) => Math.max(max, n.milestone), 0);
      const prevCitations = existingNotifs
        .filter(n => n.type === 'citation_milestone')
        .reduce((max, n) => Math.max(max, n.milestone), 0);
      const prevViews = existingNotifs
        .filter(n => n.type === 'view_milestone')
        .reduce((max, n) => Math.max(max, n.milestone), 0);

      const downloads = ms.download_count || 0;
      const citations = ms.citation_count || 0;
      const views = ms.view_count || 0;

      const dlMilestone = crossedMilestone(DOWNLOAD_MILESTONES, downloads, prevDownloads);
      if (dlMilestone) {
        await notify(
          'download_milestone',
          `🎉 ${dlMilestone} Downloads!`,
          `Your article "${ms.title}" has reached ${dlMilestone.toLocaleString()} downloads. Great impact!`,
          dlMilestone,
          downloads
        );
      }

      const citMilestone = crossedMilestone(CITATION_MILESTONES, citations, prevCitations);
      if (citMilestone) {
        await notify(
          'citation_milestone',
          `📚 ${citMilestone} Citation${citMilestone > 1 ? 's' : ''}!`,
          `Your article "${ms.title}" has been cited ${citMilestone} time${citMilestone > 1 ? 's' : ''}. Your research is making an impact.`,
          citMilestone,
          citations
        );
      }

      const viewMilestone = crossedMilestone(VIEW_MILESTONES, views, prevViews);
      if (viewMilestone) {
        await notify(
          'view_milestone',
          `👁 ${viewMilestone.toLocaleString()} Views!`,
          `Your article "${ms.title}" has been viewed ${viewMilestone.toLocaleString()} times.`,
          viewMilestone,
          views
        );
      }

      // Trending: high downloads relative to age (>50 downloads in first 30 days)
      if (ms.publication_date) {
        const ageDays = (Date.now() - new Date(ms.publication_date).getTime()) / (1000 * 60 * 60 * 24);
        const alreadyTrending = existingNotifs.some(n => n.type === 'trending');
        if (!alreadyTrending && ageDays <= 30 && downloads >= 50) {
          await notify(
            'trending',
            '🔥 Your Article is Trending!',
            `"${ms.title}" gained ${downloads} downloads within its first 30 days — it's trending on AfriSci Nexus!`,
            50,
            downloads
          );
        }
      }
    }

    return Response.json({ success: true, notifications_created: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});