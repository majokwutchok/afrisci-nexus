import { useEffect } from "react";

/**
 * Injects Google Scholar citation meta tags + Dublin Core meta tags into <head>.
 * Also updates the page <title> and existing static OG tags so JS-rendering
 * crawlers and social link-preview services see the article title/description.
 *
 * Spec: https://scholar.google.com/intl/en/scholar/inclusion.html#indexing
 */
export default function ScholarMetaTags({ manuscript, journal, coverImage }) {
  useEffect(() => {
    if (!manuscript || !["published", "online_first"].includes(manuscript.status)) return;

    // ── Page title & static OG tag update (for JS-capable crawlers / link previews) ──
    const prevTitle = document.title;
    document.title = `${manuscript.title} — AfriSci Nexus`;

    const articleUrl = `${window.location.origin}/ManuscriptDetail?id=${manuscript.id}`;
    const imageToUse = coverImage || manuscript.cover_image_url ||
      "https://media.base44.com/images/public/689712620d81bb990dd76bb3/21f8643a1_generated_image.png";
    const descSnippet = (manuscript.abstract || "").substring(0, 280);

    // Mutate the static tags already in index.html so platforms that execute JS pick them up
    const setMeta = (selector, attr, value) => {
      const el = document.querySelector(selector);
      if (el && value) el.setAttribute(attr, value);
    };
    setMeta('meta[property="og:title"]', "content", `${manuscript.title} — AfriSci Nexus`);
    setMeta('meta[property="og:description"]', "content", descSnippet);
    setMeta('meta[property="og:url"]', "content", articleUrl);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[property="og:image"]', "content", imageToUse);
    setMeta('meta[name="twitter:title"]', "content", `${manuscript.title} — AfriSci Nexus`);
    setMeta('meta[name="twitter:description"]', "content", descSnippet);
    setMeta('meta[name="twitter:image"]', "content", imageToUse);
    setMeta('meta[name="description"]', "content", descSnippet);

    // ── Dynamically-injected citation / DC tags ────────────────────────────
    const tags = [];

    const add = (name, content, scheme) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      meta.setAttribute("content", String(content));
      if (scheme) meta.setAttribute("scheme", scheme);
      meta.setAttribute("data-scholar-tag", "true");
      document.head.appendChild(meta);
      tags.push(meta);
    };

    const pubDate = manuscript.publication_date || manuscript.created_date?.split("T")[0] || "";

    // Google Scholar citation_* tags
    add("citation_title", manuscript.title);
    add("citation_publisher", "AfriSci Nexus");
    add("citation_publication_date", pubDate);
    add("citation_journal_title", journal?.title);
    add("citation_issn", journal?.issn);
    add("citation_language", manuscript.language || "en");
    add("citation_abstract_html_url", articleUrl);
    add("citation_fulltext_html_url", articleUrl);

    if (manuscript.doi) add("citation_doi", manuscript.doi);
    // Scholar requires citation_pdf_url to point directly at a crawlable PDF file,
    // not a DOI resolver redirect — so always prefer the actual file URL.
    if (manuscript.manuscript_file_url) {
      add("citation_pdf_url", manuscript.manuscript_file_url);
    } else if (manuscript.doi) {
      add("citation_pdf_url", `https://doi.org/${manuscript.doi}`);
    }

    (manuscript.authors || []).forEach(a => {
      add("citation_author", a.name);
      if (a.affiliation) add("citation_author_institution", a.affiliation);
      if (a.orcid) add("citation_author_orcid", `https://orcid.org/${a.orcid}`);
    });
    (manuscript.keywords || []).forEach(k => add("citation_keywords", k));

    // Dublin Core dc.* tags
    add("dc.title", manuscript.title);
    add("dc.publisher", "AfriSci Nexus");
    add("dc.date", pubDate, "W3CDTF");
    add("dc.type", "Text");
    add("dc.format", "application/pdf");
    add("dc.language", manuscript.language || "en");
    add("dc.description", manuscript.abstract);
    add("dc.rights", "https://creativecommons.org/licenses/by/4.0/");
    add("dc.identifier", articleUrl);
    if (manuscript.doi) add("dc.identifier", `https://doi.org/${manuscript.doi}`);
    if (journal?.title) add("dc.source", journal.title);
    if (journal?.issn) add("dc.relation", `urn:issn:${journal.issn}`);
    (manuscript.authors || []).forEach(a => add("dc.creator", a.name));
    (manuscript.keywords || []).forEach(k => add("dc.subject", k));

    // Highwire Press
    add("HW.identifier", manuscript.doi ? `https://doi.org/${manuscript.doi}` : articleUrl);

    // ── JSON-LD structured data for Google Search (ScholarlyArticle) ──
    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.setAttribute("data-scholar-tag", "true");
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ScholarlyArticle",
      "headline": manuscript.title,
      "abstract": manuscript.abstract,
      "datePublished": pubDate,
      "author": (manuscript.authors || []).map(a => ({ "@type": "Person", "name": a.name })),
      "publisher": { "@type": "Organization", "name": "AfriSci Nexus" },
      "isPartOf": journal?.title ? { "@type": "Periodical", "name": journal.title, "issn": journal.issn } : undefined,
      "keywords": (manuscript.keywords || []).join(", "),
      "url": articleUrl,
      "mainEntityOfPage": articleUrl,
      "identifier": manuscript.doi ? `https://doi.org/${manuscript.doi}` : undefined,
      "image": imageToUse,
    });
    document.head.appendChild(jsonLd);
    tags.push(jsonLd);

    // Additional dynamic OG/Twitter tags (added as extra elements for maximum coverage)
    const og = (property, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      meta.setAttribute("content", String(content));
      meta.setAttribute("data-scholar-tag", "true");
      document.head.appendChild(meta);
      tags.push(meta);
    };
    const tw = (name, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      meta.setAttribute("content", String(content));
      meta.setAttribute("data-scholar-tag", "true");
      document.head.appendChild(meta);
      tags.push(meta);
    };

    og("og:title", `${manuscript.title} — AfriSci Nexus`);
    og("og:type", "article");
    og("og:url", articleUrl);
    og("og:description", descSnippet);
    og("og:site_name", "AfriSci Nexus");
    og("og:image", imageToUse);
    og("og:image:width", "1200");
    og("og:image:height", "630");
    og("og:image:alt", `${manuscript.title} — ${journal?.title || "AfriSci Nexus"}`);

    tw("twitter:card", "summary_large_image");
    tw("twitter:title", `${manuscript.title} — AfriSci Nexus`);
    tw("twitter:description", descSnippet);
    tw("twitter:image", imageToUse);
    tw("twitter:site", "@AfriSciNexus");

    return () => {
      document.title = prevTitle;
      tags.forEach(t => t.parentNode?.removeChild(t));
      // Restore static tags to site defaults on unmount
      setMeta('meta[property="og:title"]', "content", "AfriSci Nexus | African Open Access Peer-Reviewed Journals");
      setMeta('meta[property="og:description"]', "content", "Africa's leading open-access academic publishing platform.");
      setMeta('meta[property="og:type"]', "content", "website");
      setMeta('meta[property="og:url"]', "content", "https://afriscinexus.com/");
    };
  }, [manuscript?.id, manuscript?.status, journal?.id, coverImage]);

  return null;
}