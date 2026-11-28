// AfriSci Newsletter: editorial back office (staff only).
// Actions: bootstrap, count_recipients, ai_ideas, test_send, start_send, send_batch.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.63";
import { currentUser } from "../../shared/authGuard.ts";
import { loadSettings } from "../../shared/emailServer.ts";
import { renderNewsletter, NEWSLETTER_NAME } from "../../shared/newsletterRender.ts";
import {
  loadContent, loadOffers, buildSolutions, solutionForIssue, buildIdeas,
  suggestHeadline, suggestIntro, resolveRecipients, validEmail, normEmail, find,
} from "../../shared/newsletterContent.ts";
import { unsubscribeUrl, sendBatch } from "../../shared/newsletterSend.ts";

const BATCH = 40;
const STAFF = ["admin", "editor"];

const json = (data, status = 200) => Response.json(data, { status });

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await currentUser(base44);
    if (!user) return json({ error: "Please sign in" }, 401);
    if (!STAFF.includes(String(user.role || "").toLowerCase())) return json({ error: "Only editorial staff can use AfriSci Newsletter" }, 403);

    const p = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;
    const { settings } = await loadSettings(base44);
    const site = String(settings.website_url || "https://afriscinexus.com").replace(/\/$/, "");
    const from = `${NEWSLETTER_NAME} <${settings.from_email}>`;

    switch (p.action) {
      case "bootstrap": {
        const journalId = String(p.journal_id || "");
        const last = await find(db.Newsletter, {}, { sort: "-issue_number", limit: 1, fields: ["issue_number"] });
        const lastNo = last[0]?.issue_number || 0;
        const issueNumber = Number(p.issue_number) || lastNo + 1;
        const [content, offers] = await Promise.all([loadContent(db, { site, journalId }), loadOffers(db)]);
        const solutions = buildSolutions({ site, ...offers });
        const journalTitle = journalId ? content.journals[journalId] || "" : "";
        const ideas = buildIdeas({ site, ...content, courses: offers.courses, issueNumber });
        return json({
          ok: true,
          issue_number: issueNumber,
          journals: content.journals,
          content: { fresh: content.fresh, archive: content.archive.slice(0, 60), upcoming: content.upcoming },
          solutions,
          suggested: {
            headline: suggestHeadline({ ...content, issueNumber }),
            intro: suggestIntro({ fresh: content.fresh, journalTitle }),
            solution: solutionForIssue(solutions, issueNumber),
            subject: `${NEWSLETTER_NAME} · Issue ${issueNumber}${content.fresh[0] ? `: ${content.fresh[0].title.slice(0, 70)}` : ""}`,
          },
          ideas,
          site,
          from: settings.from_email,
        });
      }

      case "count_recipients": {
        const r = await resolveRecipients(db, p.audience || {}, { journalId: p.journal_id || "" });
        return json({ ok: true, counts: r.counts });
      }

      case "ai_ideas": {
        // Optional: uses Base44 AI credits. Runs server side so the browser never calls integrations directly.
        const content = await loadContent(db, { site, journalId: String(p.journal_id || "") });
        const facts = {
          journals: Object.values(content.journals),
          new_articles: content.fresh.slice(0, 8).map((a) => ({ title: a.title, journal: a.journal, keywords: a.keywords })),
          popular_archive: content.archive.slice(0, 5).map((a) => ({ title: a.title, journal: a.journal, views: a.views })),
          forthcoming: content.upcoming.slice(0, 5).map((a) => ({ title: a.title, journal: a.journal })),
          today: new Date().toISOString().slice(0, 10),
        };
        const prompt = `You are the editor of AfriSci Newsletter, the weekly newsletter of AfriSci Nexus, an open access publisher of twelve peer reviewed journals for African research.
Using only these facts, propose 6 fresh, specific content ideas for this week's issue (themes, calls for papers, reader engagement, author advice, community spotlights, timely topics). Each idea needs a short title and a 2 to 3 sentence body written ready to publish, warm and professional, in British English. Never use dashes or hyphens in the wording. Do not invent statistics, awards or indexing claims.
${p.focus ? `Editor's focus for this week: ${String(p.focus).slice(0, 300)}\n` : ""}Facts: ${JSON.stringify(facts)}`;
        const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: { ideas: { type: "array", items: { type: "object", properties: { title: { type: "string" }, body: { type: "string" } }, required: ["title", "body"] } } },
            required: ["ideas"],
          },
        });
        const ideas = (out?.ideas || []).slice(0, 8).map((i) => ({
          type: "ai", title: String(i.title || "").slice(0, 140), body: String(i.body || "").slice(0, 900), cta_label: "", cta_url: "", why: "Suggested by AI from this week's content",
        })).filter((i) => i.title && i.body);
        return json({ ok: true, ideas });
      }

      case "test_send": {
        const to = normEmail(p.to || user.email);
        if (!validEmail(to)) return json({ error: "Enter a valid email address for the test" }, 400);
        const issue = p.issue || {};
        const unsub = await unsubscribeUrl(site, to, issue.id || "");
        const r = renderNewsletter(issue, { site, unsubscribeUrl: unsub });
        await sendBatch([{
          to, subject: `[Test] ${r.subject}`, html: r.html, text: r.text,
          headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        }], { from, replyTo: settings.from_email });
        return json({ ok: true, to });
      }

      case "start_send": {
        const nl = await db.Newsletter.get(p.newsletter_id).catch(() => null);
        if (!nl) return json({ error: "Issue not found" }, 404);
        if (nl.status === "sent") return json({ error: "This issue has already been sent" }, 409);
        if (nl.status === "sending" && !p.restart) return json({ ok: true, resumed: true, total: (nl.recipient_list || []).length, sent_index: nl.sent_index || 0 });
        const r = await resolveRecipients(db, nl.audience || {}, { journalId: nl.journal_id || "" });
        if (!r.list.length) return json({ error: "No recipients selected" }, 400);
        if (r.list.length > 5000) return json({ error: "More than 5,000 recipients: please split the audience" }, 400);
        await db.Newsletter.update(nl.id, {
          status: "sending", recipient_list: r.list, recipient_count: r.list.length,
          sent_index: 0, sent_count: 0, failed_count: 0, last_error: "", send_date: new Date().toISOString().slice(0, 10),
        });
        return json({ ok: true, total: r.list.length, counts: r.counts });
      }

      case "send_batch": {
        const nl = await db.Newsletter.get(p.newsletter_id).catch(() => null);
        if (!nl) return json({ error: "Issue not found" }, 404);
        if (nl.status !== "sending") return json({ error: "This issue is not being sent" }, 409);
        const list = nl.recipient_list || [];
        const start = Number(nl.sent_index || 0);
        const chunk = list.slice(start, start + BATCH);
        let sent = Number(nl.sent_count || 0);
        let failed = Number(nl.failed_count || 0);
        let lastError = nl.last_error || "";
        if (chunk.length) {
          const msgs = [];
          for (const to of chunk) {
            const unsub = await unsubscribeUrl(site, to, nl.id);
            const r = renderNewsletter(nl, { site, unsubscribeUrl: unsub });
            msgs.push({ to, subject: r.subject, html: r.html, text: r.text, headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
          }
          try {
            sent += await sendBatch(msgs, { from, replyTo: settings.from_email });
          } catch (e) {
            failed += chunk.length;
            lastError = String(e?.message || e).slice(0, 500);
          }
        }
        const nextIndex = start + chunk.length;
        const done = nextIndex >= list.length;
        await db.Newsletter.update(nl.id, {
          sent_index: nextIndex, sent_count: sent, failed_count: failed, last_error: lastError,
          ...(done ? { status: sent > 0 ? "sent" : "failed", sent_at: new Date().toISOString() } : {}),
        });
        return json({ ok: true, done, sent, failed, total: list.length, sent_index: nextIndex, last_error: lastError });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    console.error("newsletterAdmin", error);
    return json({ error: error?.message || "Unexpected error" }, 500);
  }
}
