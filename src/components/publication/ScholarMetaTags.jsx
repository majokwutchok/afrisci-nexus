import { useEffect } from "react";

/**
 * Injects Google Scholar citation meta tags + Dublin Core meta tags into <head>.
 * These enable:
 *  - Google Scholar automatic indexing & author profile attribution
 *  - OpenAIRE, BASE, CORE and other aggregator harvesting
 *  - Semantic Scholar, Crossref, and similar services
 *
 * Spec: https://scholar.google.com/intl/en/scholar/inclusion.html#indexing
 */
export default function ScholarMetaTags({ manuscript, journal, coverImage }) {
  useEffect(() => {
    if (!manuscript || manuscript.status !== "published") return;

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

    const articleUrl = `${window.location.origin}/ManuscriptDetail?id=${manuscript.id}`;
    const pubDate = manuscript.publication_date || manuscript.created_date?.split("T")[0] || "";

    // ── Google Scholar citation_* tags ────────────────────────────────────
    add("citation_title", manuscript.title);
    add("citation_publisher", "AfriSci Nexus");
    add("citation_publication_date", pubDate);
    add("citation_journal_title", journal?.title);
    add("citation_issn", journal?.issn);
    add("citation_language", manuscript.language || "en");
    add("citation_abstract_html_url", articleUrl);
    add("citation_fulltext_html_url", articleUrl);

    if (manuscript.doi) {
      add("citation_doi", manuscript.doi);
      add("citation_pdf_url", `https://doi.org/${manuscript.doi}`);
    } else if (manuscript.manuscript_file_url) {
      add("citation_pdf_url", manuscript.manuscript_file_url);
    }

    (manuscript.authors || []).forEach(a => {
      add("citation_author", a.name);
      if (a.affiliation) add("citation_author_institution", a.affiliation);
      if (a.orcid) add("citation_author_orcid", `https://orcid.org/${a.orcid}`);
    });

    (manuscript.keywords || []).forEach(k => add("citation_keywords", k));

    // ── Dublin Core dc.* tags (OpenAIRE, BASE, CORE, etc.) ───────────────
    add("dc.title", manuscript.title);
    add("dc.publisher", "AfriSci Nexus");
    add("dc.date", pubDate, "W3CDTF");
    add("dc.type", "Text");
    add("dc.format", "application/pdf");
    add("dc.language", manuscript.language || "en");
    add("dc.description", manuscript.abstract);
    add("dc.rights", "https://creativecommons.org/licenses/by/4.0/");
    add("dc.identifier", articleUrl);
    if (manuscript.doi) add("dc.identifier", `doi:${manuscript.doi}`);
    if (journal?.title) add("dc.source", journal.title);
    if (journal?.issn) add("dc.relation", `urn:issn:${journal.issn}`);

    (manuscript.authors || []).forEach(a => add("dc.creator", a.name));
    (manuscript.keywords || []).forEach(k => add("dc.subject", k));

    // ── Highwire Press tags (used by many repositories) ──────────────────
    add("HW.identifier", manuscript.doi ? `doi:${manuscript.doi}` : articleUrl);

    // ── Open Graph for social/structured sharing ──────────────────────────
    const og = (property, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      meta.setAttribute("content", String(content));
      meta.setAttribute("data-scholar-tag", "true");
      document.head.appendChild(meta);
      tags.push(meta);
    };

    og("og:title", manuscript.title);
    og("og:type", "article");
    og("og:url", articleUrl);
    og("og:description", manuscript.abstract?.substring(0, 300));
    og("og:site_name", "AfriSci Nexus");
    
    // Add cover image for social media preview (1200x630px is optimal)
    // Use provided coverImage or fallback to stored URL
    const imageToUse = coverImage || manuscript.cover_image_url;
    if (imageToUse) {
      og("og:image", imageToUse);
      og("og:image:width", "1200");
      og("og:image:height", "630");
      og("og:image:alt", `${manuscript.title} - ${journal?.title || 'AfriSci Nexus'}`);
    }
    
    // Twitter Card tags for enhanced social media sharing
    const twitterMeta = (name, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      meta.setAttribute("content", String(content));
      meta.setAttribute("data-scholar-tag", "true");
      document.head.appendChild(meta);
      tags.push(meta);
    };
    
    twitterMeta("twitter:card", "summary_large_image");
    twitterMeta("twitter:title", manuscript.title);
    twitterMeta("twitter:description", manuscript.abstract?.substring(0, 280));
    if (imageToUse) {
      twitterMeta("twitter:image", imageToUse);
    }
    twitterMeta("twitter:site", "@AfriSciNexus");

    // Cleanup: remove tags on unmount / manuscript change
    return () => tags.forEach(t => t.parentNode?.removeChild(t));
  }, [manuscript?.id, manuscript?.status, journal?.id, coverImage]);

  return null;
}