// Local, heuristic-based news post writer.
// Generates a full news post (title, summary, content, tags) from a short brief
// without calling any AI integration — works even when integration credits are exhausted.

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "in", "on", "for", "to", "with",
  "is", "are", "was", "were", "be", "been", "at", "by", "from", "as", "that",
  "this", "it", "its", "will", "we", "our", "your", "their", "into", "about",
]);

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function firstSentence(text) {
  const match = text.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : text).trim();
}

function extractKeywords(text, max = 8) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const seen = new Set();
  const unique = [];
  for (const w of words) {
    if (!seen.has(w)) {
      seen.add(w);
      unique.push(w);
    }
  }
  return unique.slice(0, max);
}

const CATEGORY_TEMPLATES = {
  call_for_papers: {
    opener: (brief) => `AfriSci Nexus is pleased to announce a call for papers: ${brief}`,
    sections: [
      (brief) => `We invite researchers, academics, and practitioners to submit original manuscripts related to this call. ${brief}`,
      () => `Submissions will undergo our standard double-blind peer review process. Accepted articles will be published open access, assigned a permanent DOI, and indexed for global discoverability.`,
      () => `Authors are encouraged to review our submission guidelines before preparing their manuscripts, and to reach out to the editorial team with any questions regarding scope or formatting.`,
    ],
    cta: "We look forward to receiving your contributions and advancing African scholarship together.",
  },
  indexing: {
    opener: (brief) => `AfriSci Nexus is proud to share an important indexing update: ${brief}`,
    sections: [
      (brief) => `${brief} This milestone reflects our ongoing commitment to expanding the global visibility and discoverability of African research.`,
      () => `Indexing improves the reach of published articles, making them easier to find, cite, and build upon by the international research community.`,
      () => `We thank our editorial board, reviewers, and authors whose rigorous work made this recognition possible.`,
    ],
    cta: "Explore our journals to see how this update benefits published and future authors alike.",
  },
  conference: {
    opener: (brief) => `AfriSci Nexus is excited to announce: ${brief}`,
    sections: [
      (brief) => `${brief} This event brings together researchers, policymakers, and institutions to exchange ideas and showcase emerging African scholarship.`,
      () => `Attendees can expect keynote sessions, research presentations, and networking opportunities designed to strengthen collaboration across disciplines and borders.`,
      () => `Further details on registration, submission deadlines, and the event schedule will be shared as they become available.`,
    ],
    cta: "We hope to see you there as we continue celebrating African scientific excellence.",
  },
  announcement: {
    opener: (brief) => `AfriSci Nexus has an important announcement: ${brief}`,
    sections: [
      (brief) => `${brief} We are committed to keeping our community informed as our platform continues to grow.`,
      () => `This update is part of our broader mission to support African researchers, editors, and reviewers with a world-class open-access publishing experience.`,
      () => `We appreciate the continued trust of our authors and readers across the continent and beyond.`,
    ],
    cta: "Stay tuned for more updates from the AfriSci Nexus editorial team.",
  },
  award: {
    opener: (brief) => `AfriSci Nexus is delighted to recognise an outstanding achievement: ${brief}`,
    sections: [
      (brief) => `${brief} This award celebrates excellence, dedication, and impact within the African research community.`,
      () => `Recognition like this highlights the caliber of work being produced across our network of journals and reviewers.`,
      () => `We congratulate all involved and look forward to celebrating more achievements in the future.`,
    ],
    cta: "Join us in congratulating this well-deserved recognition.",
  },
  partnership: {
    opener: (brief) => `AfriSci Nexus is proud to announce a new partnership: ${brief}`,
    sections: [
      (brief) => `${brief} This collaboration strengthens our shared mission of advancing open access to African research.`,
      () => `Through this partnership, we aim to expand opportunities for authors, reviewers, and institutions across the continent.`,
      () => `We look forward to the impact this collaboration will bring to the broader research community.`,
    ],
    cta: "We are excited about what this partnership will achieve together.",
  },
};

export function generateLocalNewsPost({ category, prompt }) {
  const brief = (prompt || "").trim();
  const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.announcement;
  const keywords = extractKeywords(brief, 8);

  const opener = template.opener(brief);
  const title = toTitleCase(firstSentence(brief)).slice(0, 80).replace(/[.!?]$/, "");

  const summarySource = `${firstSentence(brief)} ${brief.split(/[.!?]/)[1] || ""}`.trim();
  const summary = summarySource.length > 160 ? summarySource.slice(0, 157).trim() + "…" : summarySource;

  const paragraphs = [opener, ...template.sections.map((s) => s(brief)), template.cta];
  const content = paragraphs.filter(Boolean).join("\n\n");

  const baseTags = {
    call_for_papers: ["call for papers", "open access", "peer review"],
    indexing: ["indexing", "discoverability", "open access"],
    conference: ["conference", "African research", "networking"],
    announcement: ["announcement", "AfriSci Nexus"],
    award: ["award", "recognition", "excellence"],
    partnership: ["partnership", "collaboration", "open access"],
  }[category] || ["AfriSci Nexus", "African research"];

  const tags = Array.from(new Set([...baseTags, ...keywords])).slice(0, 10);

  return { title: title || "Untitled Announcement", summary: summary || brief.slice(0, 160), content, tags };
}