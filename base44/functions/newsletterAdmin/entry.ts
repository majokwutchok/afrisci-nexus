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
import { instrument } from "../../shared/newsletterTrack.ts";

const EMAIL_IN_TEXT = /([^\s<>"',;]+@[^\s<>"',;]+\.[^\s<>"',;]{2,})/;
/** "Name <email>", "email, Name", "Name, email" or plain email per line (CSV with a header row works too). */
function parseContacts(text) {
  const out = new Map();
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(/[;,\t]/).map((x) => x.trim().replace(/^"|"$/g, ""));
    for (const chunk of parts.length > 1 ? [line] : line.split(/\s+(?=[^\s]+@)/)) {
      const m = chunk.match(EMAIL_IN_TEXT);
      if (!m) continue;
      const email = normEmail(m[1].replace(/^<|>$/g, ""));
      if (!validEmail(email)) continue;
      let name = "";
      const angle = chunk.match(/^\s*"?([^"<]+?)"?\s*</);
      if (angle) name = angle[1].trim();
      else if (parts.length > 1) name = parts.find((x) => x && !x.includes("@") && !/^(e-?mail|name|full name)$/i.test(x)) || "";
      if (!out.has(email)) out.set(email, name.slice(0, 120));
    }
  }
  return [...out.entries()].map(([email, name]) => ({ email, name }));
}

async function addMembers(db, listId, contacts, source) {
  const existing = new Set((await find(db.MailingListMember, { list_id: listId }, { limit: 5000, fields: ["email"] })).map((m) => normEmail(m.email)));
  const fresh = contacts.filter((c) => !existing.has(c.email));
  for (let i = 0; i < fresh.length; i += 200) {
    await db.MailingListMember.bulkCreate(fresh.slice(i, i + 200).map((c) => ({ list_id: listId, email: c.email, name: c.name || "", source })));
  }
  const count = existing.size + fresh.length;
  await db.MailingList.update(listId, { member_count: count });
  return { added: fresh.length, skipped: contacts.length - fresh.length, count };
}

async function issueEngagement(db, newsletterId) {
  const ev = await find(db.NewsletterEvent, { newsletter_id: newsletterId }, { sort: "created_date", limit: 5000, fields: ["email", "type", "url", "device", "created_date"] });
  return ev;
}

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
            const html = await instrument(r.html, { site, newsletterId: nl.id, email: to }).catch((e) => { console.error("track", e?.message || e); return r.html; });
            msgs.push({ to, subject: r.subject, html, text: r.text, headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
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

      /* ---------------- analytics ---------------- */
      case "analytics_overview": {
        const issues = await find(db.Newsletter, { status: { $in: ["sent", "sending"] } }, { sort: "-sent_at", limit: 100, fields: ["id", "issue_number", "headline", "subject", "sent_at", "send_date", "sent_count", "recipient_count", "failed_count", "journal_title", "status"] });
        const ids = issues.map((i) => i.id);
        const ev = ids.length ? await find(db.NewsletterEvent, { newsletter_id: { $in: ids } }, { limit: 5000, fields: ["newsletter_id", "email", "type"] }) : [];
        const un = ids.length ? await find(db.NewsletterSuppression, { newsletter_id: { $in: ids } }, { limit: 5000, fields: ["newsletter_id"] }) : [];
        const agg = {};
        ev.forEach((e) => {
          const a = (agg[e.newsletter_id] ||= { opens: new Set(), clicks: new Set() });
          (e.type === "click" ? a.clicks : a.opens).add(e.email);
        });
        const unsub = {};
        un.forEach((u) => (unsub[u.newsletter_id] = (unsub[u.newsletter_id] || 0) + 1));
        return json({
          ok: true,
          truncated: ev.length >= 5000,
          issues: issues.map((i) => ({
            ...i,
            unique_opens: agg[i.id]?.opens.size || 0,
            unique_clicks: agg[i.id]?.clicks.size || 0,
            unsubscribes: unsub[i.id] || 0,
          })),
        });
      }

      case "analytics_issue": {
        const nl = await db.Newsletter.get(p.newsletter_id).catch(() => null);
        if (!nl) return json({ error: "Issue not found" }, 404);
        const ev = await issueEngagement(db, nl.id);
        const un = await find(db.NewsletterSuppression, { newsletter_id: nl.id }, { limit: 5000, fields: ["email", "created_date"] });
        const people = {};
        const links = {};
        const firstOpens = [];
        const devices = {};
        for (const e of ev) {
          const r = (people[e.email] ||= { email: e.email, opens: 0, clicks: 0, first_open: "", last_activity: "", device: "" });
          r.last_activity = e.created_date;
          if (e.type === "open") {
            if (!r.opens) { r.first_open = e.created_date; r.device = e.device || "unknown"; firstOpens.push(e.created_date); devices[r.device] = (devices[r.device] || 0) + 1; }
            r.opens++;
          } else {
            r.clicks++;
            const l = (links[e.url] ||= { url: e.url, clicks: 0, people: new Set() });
            l.clicks++;
            l.people.add(e.email);
          }
        }
        const unsubSet = new Set(un.map((u) => normEmail(u.email)));
        const recipients = (nl.recipient_list || []).map((email) => {
          const r = people[email] || { email, opens: 0, clicks: 0, first_open: "", last_activity: "", device: "" };
          return { ...r, opened: r.opens > 0, clicked: r.clicks > 0, unsubscribed: unsubSet.has(email) };
        });
        const opened = recipients.filter((r) => r.opened).length;
        const clicked = recipients.filter((r) => r.clicked).length;
        return json({
          ok: true,
          issue: { id: nl.id, issue_number: nl.issue_number, headline: nl.headline, subject: nl.subject, sent_at: nl.sent_at, status: nl.status, journal_title: nl.journal_title },
          totals: {
            recipients: recipients.length, sent: nl.sent_count || 0, failed: nl.failed_count || 0,
            unique_opens: opened, unique_clicks: clicked, total_opens: ev.filter((e) => e.type === "open").length,
            total_clicks: ev.filter((e) => e.type === "click").length, unsubscribes: un.length,
          },
          first_opens: firstOpens,
          devices,
          links: Object.values(links).map((l) => ({ url: l.url, clicks: l.clicks, unique: l.people.size })).sort((a, b) => b.clicks - a.clicks),
          recipients,
        });
      }

      /* ---------------- mailing lists ---------------- */
      case "lists": {
        const lists = await find(db.MailingList, {}, { sort: "name", limit: 200 });
        return json({ ok: true, lists });
      }
      case "list_create": {
        const name = String(p.name || "").trim().slice(0, 120);
        if (!name) return json({ error: "Give the list a name" }, 400);
        const list = await db.MailingList.create({ name, description: String(p.description || "").slice(0, 500), member_count: 0, source_note: `Created by ${user.email}` });
        return json({ ok: true, list });
      }
      case "list_rename": {
        await db.MailingList.update(p.list_id, { name: String(p.name || "").slice(0, 120), description: String(p.description || "").slice(0, 500) });
        return json({ ok: true });
      }
      case "list_delete": {
        const ms = await find(db.MailingListMember, { list_id: p.list_id }, { limit: 5000, fields: ["id"] });
        for (const m of ms) await db.MailingListMember.delete(m.id).catch(() => {});
        await db.MailingList.delete(p.list_id);
        return json({ ok: true });
      }
      case "list_members": {
        const members = await find(db.MailingListMember, { list_id: p.list_id }, { sort: "email", limit: 5000, fields: ["id", "email", "name", "source", "created_date"] });
        const suppressed = new Set((await find(db.NewsletterSuppression, {}, { limit: 5000, fields: ["email"] })).map((x) => normEmail(x.email)));
        return json({ ok: true, members: members.map((m) => ({ ...m, unsubscribed: suppressed.has(normEmail(m.email)) })) });
      }
      case "list_add": {
        const list = await db.MailingList.get(p.list_id).catch(() => null);
        if (!list) return json({ error: "List not found" }, 404);
        const contacts = parseContacts(p.text).slice(0, 5000);
        if (!contacts.length) return json({ error: "No valid email addresses found" }, 400);
        return json({ ok: true, ...(await addMembers(db, list.id, contacts, p.source === "csv" ? "csv" : "manual")) });
      }
      case "list_remove": {
        const ids = (Array.isArray(p.member_ids) ? p.member_ids : []).slice(0, 500);
        for (const id of ids) await db.MailingListMember.delete(id).catch(() => {});
        const count = (await find(db.MailingListMember, { list_id: p.list_id }, { limit: 5000, fields: ["id"] })).length;
        await db.MailingList.update(p.list_id, { member_count: count });
        return json({ ok: true, count });
      }
      case "list_build": {
        // Fill a list from a segment: subscribers, authors, users, or engagement with a sent issue.
        let listId = p.list_id;
        if (!listId) {
          const name = String(p.name || "").trim().slice(0, 120);
          if (!name) return json({ error: "Give the new list a name" }, 400);
          listId = (await db.MailingList.create({ name, description: String(p.description || "").slice(0, 500), member_count: 0, source_note: `Built from ${p.source}` })).id;
        }
        let emails = [];
        if (["subscribers", "authors", "users"].includes(p.source)) {
          emails = (await resolveRecipients(db, { [p.source]: true }, { journalId: p.journal_id || "" })).list;
        } else if (["openers", "clickers", "non_openers"].includes(p.source)) {
          const nl = await db.Newsletter.get(p.newsletter_id).catch(() => null);
          if (!nl) return json({ error: "Choose a sent issue" }, 400);
          const ev = await issueEngagement(db, nl.id);
          const opened = new Set(ev.filter((e) => e.type === "open").map((e) => e.email));
          const clicked = new Set(ev.filter((e) => e.type === "click").map((e) => e.email));
          const all = nl.recipient_list || [];
          emails = p.source === "openers" ? all.filter((e) => opened.has(e)) : p.source === "clickers" ? all.filter((e) => clicked.has(e)) : all.filter((e) => !opened.has(e));
        } else return json({ error: "Unknown segment" }, 400);
        const r = await addMembers(db, listId, emails.map((email) => ({ email, name: "" })), p.source);
        return json({ ok: true, list_id: listId, ...r });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    console.error("newsletterAdmin", error);
    return json({ error: error?.message || "Unexpected error" }, 500);
  }
}
