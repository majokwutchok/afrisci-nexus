import { useEffect } from "react";

/**
 * SEO component — dynamically updates <head> meta tags per page.
 * Supports title, description, keywords, Open Graph, Twitter Card,
 * canonical URL, and JSON-LD structured data.
 */
export default function SEO({
  title,
  description,
  keywords,
  canonicalPath = "",
  ogType = "website",
  ogImage = "https://afrisco-nexus.base44.app/og-image.png",
  structuredData = null,
  noIndex = false,
}) {
  const BASE_URL = "https://afrisco-nexus.base44.app";
  const SITE_NAME = "AfriSci Nexus";
  const DEFAULT_DESC =
    "Africa's leading open-access academic publishing platform. 50+ peer-reviewed journals, 10,000+ articles, serving 54 African countries.";

  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | African Open Access Peer-Reviewed Journals`;
  const metaDesc = description || DEFAULT_DESC;
  const canonical = `${BASE_URL}${canonicalPath}`;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        const [attrName, attrVal] = selector.includes("property=")
          ? ["property", selector.match(/property="([^"]+)"/)[1]]
          : ["name", selector.match(/name="([^"]+)"/)[1]];
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Standard meta
    setMeta('meta[name="description"]', "content", metaDesc);
    if (keywords) setMeta('meta[name="keywords"]', "content", keywords);
    setMeta('meta[name="robots"]', "content", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");

    // Open Graph
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", metaDesc);
    setMeta('meta[property="og:type"]', "content", ogType);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[property="og:image"]', "content", ogImage);
    setMeta('meta[property="og:site_name"]', "content", SITE_NAME);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", metaDesc);
    setMeta('meta[name="twitter:image"]', "content", ogImage);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");

    // Canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonical);

    // JSON-LD structured data
    if (structuredData) {
      const existing = document.querySelector('script[data-seo-dynamic="true"]');
      if (existing) existing.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-dynamic", "true");
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup dynamic JSON-LD on unmount
      const el = document.querySelector('script[data-seo-dynamic="true"]');
      if (el) el.remove();
    };
  }, [fullTitle, metaDesc, keywords, canonical, ogType, ogImage, noIndex, structuredData]);

  return null;
}