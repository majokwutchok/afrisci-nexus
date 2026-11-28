// @ts-nocheck
// AfriSci Newsletter: content gathering, Publishing Solutions Series and the weekly idea engine.
// House style: no dashes in wording.

const PUBLIC = ["published", "online_first"];
const FORTHCOMING = ["accepted"];
// Light fields only (covers and files are stored inline and are far too large to load in bulk).
const ARTICLE_FIELDS = ["id", "title", "abstract", "keywords", "journal_id", "authors", "status", "publication_date", "online_first_date", "created_date", "doi", "view_count", "read_count", "download_count", "citation_count"];

const rows = (r) => (Array.isArray(r) ? r : r?.items ?? []);
const DAY = 86_400_000;

export function weekStart(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(x.getTime() - dow * DAY);
}

function pubDate(m) {
  return m.publication_date || m.online_first_date || m.created_date || "";
}

export function snapshot(m, journals, site) {
  const authors = (Array.isArray(m.authors) ? m.authors : []).map((a) => a?.name).filter(Boolean);
  const isPublic = PUBLIC.includes(m.status);
  return {
    title: m.title || "Untitled article",
    authors: authors.length > 4 ? `${authors.slice(0, 4).join(", ")} et al.` : authors.join(", "),
    journal: journals[m.journal_id] || "",
    journal_id: m.journal_id || "",
    abstract: String(m.abstract || "").replace(/\s+/g, " ").trim().slice(0, 600),
    url: isPublic ? `${site}/ManuscriptDetail?id=${m.id}` : "",
    doi: isPublic ? String(m.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : "",
    date: isPublic ? pubDate(m) : "",
    status: m.status,
    views: Number(m.view_count || 0),
    citations: Number(m.citation_count || 0),
    keywords: (m.keywords || []).slice(0, 8),
  };
}

// ------------------------------------------------------------ Publishing Solutions Series

export function buildSolutions({ site, services = [], courses = [], memberships = [] }) {
  const money = (p) => `${p.currency || "USD"} ${Number(p.price || 0).toLocaleString("en-US")}`;
  const list = [
    {
      key: "author_services",
      title: "Polish your manuscript with AfriSci Author Services",
      body: "Strong research deserves a clear, well presented manuscript. Our academic editors help you get every detail right before you submit, so reviewers can focus on your science.",
      points: services.length
        ? services.map((s) => `${s.name}: ${s.description || ""} (${money(s)})`.replace(": (", " ("))
        : ["Language editing by academic editors", "Formatting and reference checks", "Statistical review", "Translation between English and French"],
      cta_label: "Explore author services",
      cta_url: `${site}/AuthorServices`,
    },
    {
      key: "partnerships",
      title: "Institutional partnerships for universities and research centres",
      body: "One annual agreement lets your institution's researchers publish across all twelve AfriSci Nexus journals with no per article charges, backed by impact reports your research office can use for rankings, accreditation and funding bids.",
      points: memberships.length
        ? memberships.map((p) => `${p.name}: up to ${p.seats || ""} authors, ${money(p)} per year`)
        : ["Starter, Growth and Premier tiers", "Dedicated editorial liaison", "Institutional profile page and impact reports"],
      cta_label: "View partnership options",
      cta_url: `${site}/InstitutionalPartnership`,
    },
    {
      key: "training",
      title: "Build your publishing skills with certified training",
      body: "Our self paced courses are designed for African researchers and award verifiable certificates. Institutions can enrol whole cohorts at discounted rates.",
      points: courses.length
        ? courses.slice(0, 5).map((c) => `${c.title} (${money(c)})`)
        : ["Research methods", "Grant writing", "Publication ethics", "Peer review training"],
      cta_label: "Browse courses",
      cta_url: `${site}/Training`,
    },
    {
      key: "waivers",
      title: "Open access for every researcher: fee waivers and waiver pools",
      body: "Cost should never stand between good research and readers. Researchers from low income settings can request a waiver, and funders and institutions can sponsor waiver pools for early career scholars.",
      points: ["Transparent waiver policy", "Waiver pools funded by partners", "Support for early career researchers"],
      cta_label: "Read the fees and waiver policy",
      cta_url: `${site}/FeesWaiverPolicy`,
    },
    {
      key: "visibility",
      title: "Make your research easy to find, cite and track",
      body: "Every AfriSci Nexus article receives a permanent DOI through Crossref and scholarly metadata that helps search engines and repositories index it. Authors can follow readership and citations as they grow.",
      points: ["Permanent DOI for every article", "ORCID linked author records", "Live readership and citation tracking on the global impact map"],
      cta_label: "See the impact map",
      cta_url: `${site}/Home`,
    },
    {
      key: "online_first",
      title: "Online First: share accepted research sooner",
      body: "Accepted articles can appear Online First with a DOI, so your findings reach readers and start gathering citations before the full issue is compiled.",
      points: ["Fast publication after acceptance", "Citable immediately with a DOI", "Open access from day one"],
      cta_label: "Submit your manuscript",
      cta_url: `${site}/Submit`,
    },
    {
      key: "reviewers",
      title: "Join our community of reviewers and editors",
      body: "Peer review is the heart of trustworthy science. Reviewers and editorial board members shape the quality of African research publishing and receive recognition for their contribution.",
      points: ["Reviewer recognition and awards", "Flexible workload", "Editorial board opportunities across twelve journals"],
      cta_label: "Apply to review",
      cta_url: `${site}/Apply`,
    },
    {
      key: "submission",
      title: "From submission to publication: how we support authors",
      body: "Our editorial office guides you through every stage, from the first technical check to proofs and publication, with clear timelines and a dashboard to track your manuscript.",
      points: ["Technical check and editor assignment", "Rigorous peer review", "Proofs, DOI registration and publication"],
      cta_label: "Read the author guidelines",
      cta_url: `${site}/Guidelines`,
    },
  ];
  return list.map((s, i) => ({ ...s, part: i + 1, total: list.length }));
}

export function solutionForIssue(solutions, issueNumber) {
  if (!solutions.length) return null;
  const s = solutions[((Number(issueNumber) || 1) - 1) % solutions.length];
  return { ...s, series_label: `Publishing Solutions Series · Part ${s.part} of ${s.total}` };
}

// ------------------------------------------------------------ Weekly idea engine

// Fixed international observances relevant to research audiences (month is 1 based).
const OBSERVANCES = [
  [1, 24, "International Day of Education", ["education"]],
  [2, 4, "World Cancer Day", ["medical", "health"]],
  [2, 11, "International Day of Women and Girls in Science", []],
  [3, 8, "International Women's Day", []],
  [3, 22, "World Water Day", ["agriculture", "environment"]],
  [3, 24, "World Tuberculosis Day", ["medical", "health"]],
  [4, 7, "World Health Day", ["medical", "health"]],
  [4, 25, "World Malaria Day", ["medical", "health"]],
  [5, 25, "Africa Day", []],
  [6, 5, "World Environment Day", ["environment", "agriculture"]],
  [8, 12, "International Youth Day", []],
  [9, 8, "International Literacy Day", ["education"]],
  [10, 16, "World Food Day", ["agriculture"]],
  [11, 10, "World Science Day for Peace and Development", []],
  [12, 1, "World AIDS Day", ["medical", "health"]],
];
const SPANS = [
  [9, "third full week", "Peer Review Week", "Celebrate the reviewers who keep African research rigorous."],
  [10, "last full week", "International Open Access Week", "Share why open access matters for African research."],
];

function nextObservances(now, days = 21) {
  const out = [];
  for (const [m, d, name, tags] of OBSERVANCES) {
    for (const y of [now.getUTCFullYear(), now.getUTCFullYear() + 1]) {
      const t = Date.UTC(y, m - 1, d);
      const diff = (t - now.getTime()) / DAY;
      if (diff >= -1 && diff <= days) out.push({ name, date: new Date(t), tags });
    }
  }
  const month = now.getUTCMonth() + 1;
  for (const [m, , name, why] of SPANS) if (m === month || m === month + 1) out.push({ name, date: null, tags: [], why });
  return out;
}

function topKeywords(list, n = 3) {
  const counts = {};
  list.forEach((a) => (a.keywords || []).forEach((k) => {
    const key = String(k).trim().toLowerCase();
    if (key.length > 2) counts[key] = (counts[key] || 0) + 1;
  }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

const title = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Data driven ideas the editor can drop into the issue with one click. */
export function buildIdeas({ site, now = new Date(), fresh = [], archive = [], upcoming = [], journals = {}, journalCounts = {}, courses = [], issueNumber = 1 }) {
  const ideas = [];
  const add = (type, t, body, cta_label = "", cta_url = "", why = "") => ideas.push({ type, title: t, body, cta_label, cta_url, why });

  if (fresh.length) {
    const kw = topKeywords(fresh, 2);
    add("theme", kw.length ? `This week's theme: ${kw.map(title).join(" and ")}` : "This week's new research",
      `This week we published ${fresh.length} new ${fresh.length === 1 ? "article" : "articles"}${kw.length ? `, with a clear focus on ${kw.join(" and ")}` : ""}. Explore the findings below and share them with colleagues who work in these areas.`,
      "Browse all new articles", `${site}/Publications`, "Based on keywords in this week's new articles");
  }
  const popular = [...archive].sort((a, b) => b.views - a.views)[0];
  if (popular && popular.views > 0) {
    add("reader_favourite", `Reader favourite: ${popular.title}`,
      `With ${popular.views.toLocaleString("en-US")} reads so far, this ${popular.journal ? `${popular.journal} ` : ""}article is one of our most read. If you missed it, now is a good time to catch up.`,
      "Read the article", popular.url, "Most read article in the archive");
  }
  const cited = [...archive].filter((a) => a.citations > 0).sort((a, b) => b.citations - a.citations)[0];
  if (cited) {
    add("citations", `Making an impact: ${cited.title}`,
      `This article has already been cited ${cited.citations} ${cited.citations === 1 ? "time" : "times"}, a sign of how African research is shaping global conversations.`,
      "Read the article", cited.url, "Most cited article");
  }
  if (upcoming.length) {
    add("coming_soon", `Coming soon: ${upcoming.length} accepted ${upcoming.length === 1 ? "article" : "articles"} in production`,
      `Our editors have accepted new work that will be published shortly, including "${upcoming[0].title}". Subscribers will be the first to know when ${upcoming.length === 1 ? "it goes" : "they go"} live.`,
      "", "", "Accepted manuscripts awaiting publication");
  }
  // Journals that have gone quiet: call for papers
  const quiet = Object.entries(journals)
    .map(([id, name]) => ({ id, name, recent: journalCounts[id] || 0 }))
    .filter((j) => j.recent === 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (quiet.length) {
    const j = quiet[(Number(issueNumber) || 1) % quiet.length];
    add("call_for_papers", `Call for papers: ${j.name}`,
      `${j.name} is welcoming new submissions. Original research, reviews and short communications are all invited, with rigorous peer review and open access publication.`,
      "Submit to this journal", `${site}/Submit`, "This journal has published nothing in the last 60 days");
  }
  for (const o of nextObservances(now)) {
    const when = o.date ? ` on ${o.date.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}` : "";
    const related = o.tags.length ? Object.values(journals).find((n) => o.tags.some((t) => n.toLowerCase().includes(t))) : "";
    add("observance", `Marking ${o.name}`,
      o.why || `${o.name} falls${when}. We invite researchers to share their work on this theme${related ? `, and ${related} welcomes related submissions` : ""}.`,
      related ? "Submit your research" : "", related ? `${site}/Submit` : "", "Upcoming international observance");
  }
  if (courses.length) {
    const c = courses[(Number(issueNumber) || 1) % courses.length];
    add("course", `Course of the week: ${c.title}`,
      `Strengthen your research career with ${c.title}, a self paced course that awards a verifiable AfriSci Nexus certificate.`,
      "View the course", `${site}/Training`, "Rotating course spotlight");
  }
  add("author_tip", "Author tip: write an abstract editors love",
    "State the problem, your method, the key result and why it matters, in that order and in under 250 words. A clear abstract speeds up editorial screening and helps readers find your work.",
    "Read the author guidelines", `${site}/Guidelines`, "Rotating author advice");
  add("community", "Become a reviewer",
    "Share your expertise and help shape the quality of African research. Reviewers receive recognition and can join our editorial boards over time.",
    "Apply to review", `${site}/Apply`, "Grow the reviewer community");
  return ideas;
}

export function suggestHeadline({ fresh = [], upcoming = [], issueNumber = 1 }) {
  if (fresh.length) {
    const kw = topKeywords(fresh, 1)[0];
    return kw ? `New research on ${kw} and more from across Africa` : `${fresh.length} new ${fresh.length === 1 ? "article" : "articles"} from across Africa`;
  }
  if (upcoming.length) return "What is coming next from AfriSci Nexus";
  return "Highlights from African research this week";
}

export function suggestIntro({ fresh = [], journalTitle = "" }) {
  const scope = journalTitle ? `${journalTitle}` : "AfriSci Nexus";
  return fresh.length
    ? `Welcome to this week's AfriSci Newsletter. ${fresh.length === 1 ? "A new article has" : `${fresh.length} new articles have`} joined ${scope} since our last issue, alongside picks from our archive and a look at what is coming soon.\n\nThank you for reading, sharing and building African research with us.`
    : `Welcome to this week's AfriSci Newsletter. Here are highlights from the ${scope} archive, a look at what is coming soon, and practical support for your next publication.\n\nThank you for reading, sharing and building African research with us.`;
}

// ------------------------------------------------------------ data access

export async function loadContent(db, { site, journalId = "", now = new Date() }) {
  const journalRows = rows(await db.Journal.filter({}, { sort: "title", limit: 200, fields: ["id", "title"] }));
  const journals = Object.fromEntries(journalRows.map((j) => [j.id, j.title]));
  const q = (statuses) => (journalId ? { status: { $in: statuses }, journal_id: journalId } : { status: { $in: statuses } });
  const pub = rows(await db.Manuscript.filter(q(PUBLIC), { sort: "-publication_date", limit: 300, fields: ARTICLE_FIELDS }));
  const fut = rows(await db.Manuscript.filter(q(FORTHCOMING), { sort: "-updated_date", limit: 50, fields: ARTICLE_FIELDS }));

  const since = now.getTime() - 14 * DAY; // last two weeks counts as "new"
  const recent60 = now.getTime() - 60 * DAY;
  const journalCounts = {};
  const fresh = [];
  const archive = [];
  for (const m of pub) {
    const t = new Date(pubDate(m)).getTime();
    if (t >= recent60) journalCounts[m.journal_id] = (journalCounts[m.journal_id] || 0) + 1;
    (t >= since ? fresh : archive).push(m);
  }
  const snap = (m) => ({ id: m.id, ...snapshot(m, journals, site) });
  return {
    journals,
    journalCounts,
    fresh: fresh.map(snap),
    archive: archive.map(snap).sort((a, b) => b.views - a.views),
    upcoming: fut.map(snap),
  };
}

export async function loadOffers(db) {
  const plans = rows(await db.Plan.filter({ is_active: true }, { sort: "price", limit: 100, fields: ["name", "product_type", "price", "currency", "description", "seats"] }));
  const courses = rows(await db.Course.filter({ is_active: true }, { sort: "sort_order", limit: 50, fields: ["title", "price", "currency"] })).filter((c) => c.title);
  return {
    services: plans.filter((p) => p.product_type === "service"),
    memberships: plans.filter((p) => p.product_type === "membership"),
    courses,
  };
}

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const validEmail = (e) => EMAIL_RE.test(normEmail(e));

export function parseManual(text) {
  return [...new Set(String(text || "").split(/[\s,;]+/).map(normEmail).filter(validEmail))];
}

/** Deduplicated recipients for an audience, minus suppressed addresses. */
export async function resolveRecipients(db, audience = {}, { journalId = "" } = {}) {
  const groups = { subscribers: new Set(), authors: new Set(), manual: new Set() };
  if (audience.subscribers) {
    const subs = rows(await db.NewsletterSubscriber.filter({ is_active: { $ne: false } }, { limit: 5000, fields: ["email", "is_active"] }));
    subs.forEach((s) => validEmail(s.email) && groups.subscribers.add(normEmail(s.email)));
  }
  if (audience.authors) {
    const q = { status: { $nin: ["draft"] } };
    if (journalId) q.journal_id = journalId;
    const ms = rows(await db.Manuscript.filter(q, { limit: 5000, fields: ["authors", "created_by"] }));
    ms.forEach((m) => {
      (Array.isArray(m.authors) ? m.authors : []).forEach((a) => validEmail(a?.email) && groups.authors.add(normEmail(a.email)));
      if (validEmail(m.created_by) && !/no-reply\.base44\.com$/i.test(m.created_by)) groups.authors.add(normEmail(m.created_by));
    });
  }
  parseManual(audience.manual).forEach((e) => groups.manual.add(e));
  const suppressed = new Set(rows(await db.NewsletterSuppression.filter({}, { limit: 5000, fields: ["email"] })).map((s) => normEmail(s.email)));
  const all = new Set([...groups.subscribers, ...groups.authors, ...groups.manual]);
  const list = [...all].filter((e) => !suppressed.has(e)).sort();
  return {
    list,
    counts: {
      subscribers: groups.subscribers.size,
      authors: groups.authors.size,
      manual: groups.manual.size,
      suppressed: [...all].filter((e) => suppressed.has(e)).length,
      total: list.length,
    },
  };
}
