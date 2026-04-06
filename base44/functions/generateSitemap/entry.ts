import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BASE_URL = "https://afrisco-nexus.base44.app";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all published manuscripts and active journals in parallel
    const [manuscripts, journals] = await Promise.all([
      base44.asServiceRole.entities.Manuscript.filter({ status: "published" }),
      base44.asServiceRole.entities.Journal.filter({ status: "active" }),
    ]);

    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/Journals", priority: "0.9", changefreq: "daily" },
      { url: "/Publications", priority: "0.9", changefreq: "daily" },
      { url: "/Submit", priority: "0.8", changefreq: "monthly" },
      { url: "/About", priority: "0.7", changefreq: "monthly" },
      { url: "/Editorial", priority: "0.7", changefreq: "monthly" },
      { url: "/OpenAccess", priority: "0.6", changefreq: "monthly" },
      { url: "/Guidelines", priority: "0.6", changefreq: "monthly" },
      { url: "/AuthorResources", priority: "0.6", changefreq: "monthly" },
      { url: "/Contact", priority: "0.5", changefreq: "monthly" },
    ];

    const staticEntries = staticPages.map(p => `
  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("");

    const journalEntries = journals.map(j => `
  <url>
    <loc>${BASE_URL}/JournalDetail?id=${j.id}</loc>
    <lastmod>${(j.updated_date || j.created_date || today).split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("");

    const articleEntries = manuscripts.map(m => `
  <url>
    <loc>${BASE_URL}/ManuscriptDetail?id=${m.id}</loc>
    <lastmod>${(m.publication_date || m.updated_date || today).split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticEntries}
${journalEntries}
${articleEntries}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Robots-Tag": "noindex", // sitemap itself shouldn't be indexed
      },
    });
  } catch (error) {
    return new Response(`<?xml version="1.0"?><error>${error.message}</error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
});