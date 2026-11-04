// AfriSci Nexus — format an existing article PDF in the browser (no server, no credits).
// Adds a branded cover page, a running header and a footer with DOI and page numbers.
// The author's pages are embedded unchanged (vector text stays selectable), scaled very slightly
// so the header and footer never cover their content.
import { citation, fmtDate, ISSN, SITE, STATUS_LABEL } from "./articleFiles.js";

const BRAND = [30 / 255, 64 / 255, 175 / 255]; // #1E40AF
const ACCENT = [245 / 255, 158 / 255, 11 / 255]; // #F59E0B
const INK = [15 / 255, 23 / 255, 42 / 255];
const MUTED = [100 / 255, 116 / 255, 139 / 255];
const RULE = [226 / 255, 232 / 255, 240 / 255];
const A4 = [595.28, 841.89];

export class PdfFormatError extends Error {}

/** Standard PDF fonts only cover Windows-1252. Fold accents and replace anything else. */
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
export function pdfSafe(text) {
  return String(text ?? "")
    .replace(/[‐-‒−]/g, "-")
    .replace(/ /g, " ")
    .split("")
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c === 10) return " ";
      if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255) || WIN_ANSI_EXTRA.has(ch)) return ch;
      const folded = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return folded && folded.charCodeAt(0) < 256 ? folded : "?";
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(text, font, size, width) {
  const words = pdfSafe(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
    if (line) lines.push(line);
    // break very long tokens (URLs)
    let rest = w;
    while (font.widthOfTextAtSize(rest, size) > width) {
      let cut = rest.length;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    line = rest;
  }
  if (line) lines.push(line);
  return lines;
}

function truncate(text, font, size, width) {
  let t = pdfSafe(text);
  if (font.widthOfTextAtSize(t, size) <= width) return t;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > width) t = t.slice(0, -1);
  return `${t.trimEnd()}...`;
}

let libPromise = null;
const loadPdfLib = () => (libPromise ||= import("pdf-lib"));

/**
 * @param {Uint8Array|ArrayBuffer} sourceBytes  the author's PDF
 * @param {object} item  normalised article (see articleFiles.js)
 * @param {{cover?: boolean, headerFooter?: boolean}} options
 * @returns {Promise<Uint8Array>}
 */
export async function formatArticlePdf(sourceBytes, item, { cover = true, headerFooter = true } = {}) {
  const { PDFDocument, StandardFonts, rgb, degrees, PDFName, PDFString } = await loadPdfLib();
  const color = (c) => rgb(c[0], c[1], c[2]);

  let src;
  try {
    src = await PDFDocument.load(sourceBytes, { ignoreEncryption: true, updateMetadata: false });
  } catch (e) {
    throw new PdfFormatError("This file could not be read as a PDF. Download the original instead.");
  }
  if (src.isEncrypted) {
    throw new PdfFormatError("This PDF is password protected, so it cannot be reformatted. Download the original instead.");
  }

  const out = await PDFDocument.create();
  const helv = await out.embedFont(StandardFonts.Helvetica);
  const helvBold = await out.embedFont(StandardFonts.HelveticaBold);
  const times = await out.embedFont(StandardFonts.TimesRoman);
  const timesBold = await out.embedFont(StandardFonts.TimesRomanBold);

  const journal = pdfSafe(item.journal || "AfriSci Nexus");
  const isPublished = item.status === "published" || item.status === "online_first";
  const stage = isPublished ? "Published article" : item.status === "accepted" ? "Accepted manuscript" : "Submitted manuscript";
  const footerId = item.doi ? `https://doi.org/${item.doi}` : `Manuscript ${item.ref}`;

  // ------------------------------------------------------------ cover page
  if (cover) {
    const page = out.addPage(A4);
    const [W, H] = A4;
    const M = 56;
    const width = W - 2 * M;
    page.drawRectangle({ x: 0, y: H - 92, width: W, height: 92, color: color(BRAND) });
    page.drawRectangle({ x: 0, y: H - 96, width: W, height: 4, color: color(ACCENT) });
    page.drawText("AfriSci", { x: M, y: H - 52, size: 24, font: helvBold, color: rgb(1, 1, 1) });
    page.drawText("Nexus", { x: M + helvBold.widthOfTextAtSize("AfriSci ", 24), y: H - 52, size: 24, font: helvBold, color: color(ACCENT) });
    page.drawText("AFRICAN SCIENTIFIC EXCELLENCE", { x: M, y: H - 72, size: 8, font: helv, color: rgb(0.75, 0.83, 1) });
    const right = `ISSN (Online) ${ISSN}`;
    page.drawText(right, { x: W - M - helv.widthOfTextAtSize(right, 9), y: H - 52, size: 9, font: helv, color: rgb(0.86, 0.9, 1) });

    let y = H - 140;
    page.drawText(truncate(journal, helvBold, 11, width), { x: M, y, size: 11, font: helvBold, color: color(BRAND) });
    y -= 18;
    page.drawText(stage, { x: M, y, size: 9.5, font: helv, color: color(MUTED) });
    y -= 34;

    for (const line of wrap(item.title, timesBold, 22, width).slice(0, 6)) {
      page.drawText(line, { x: M, y, size: 22, font: timesBold, color: color(INK) });
      y -= 27;
    }
    y -= 6;

    // authors with affiliation numbers
    const affs = [];
    const authorText = item.authors.map((a) => {
      let n = "";
      if (a.affiliation) {
        let i = affs.indexOf(a.affiliation);
        if (i < 0) { affs.push(a.affiliation); i = affs.length - 1; }
        n = String(i + 1);
      }
      return `${a.name}${n ? ` ${n}` : ""}${a.is_corresponding ? "*" : ""}`;
    }).join(", ");
    for (const line of wrap(authorText || "Author", helv, 12, width).slice(0, 4)) {
      page.drawText(line, { x: M, y, size: 12, font: helv, color: color(INK) });
      y -= 16;
    }
    y -= 2;
    for (const [i, aff] of affs.slice(0, 5).entries()) {
      for (const [j, line] of wrap(`${i + 1} ${aff}`, helv, 8.5, width).slice(0, 2).entries()) {
        page.drawText(j ? `   ${line}` : line, { x: M, y, size: 8.5, font: helv, color: color(MUTED) });
        y -= 11;
      }
    }
    const corr = item.authors.find((a) => a.is_corresponding && a.email);
    if (corr) { page.drawText(pdfSafe(`* Corresponding author: ${corr.email}`), { x: M, y, size: 8.5, font: helv, color: color(MUTED) }); y -= 11; }

    // details panel
    y -= 16;
    const details = [
      ["DOI", item.doi ? `https://doi.org/${item.doi}` : "Not yet assigned"],
      ["Reference", item.ref],
      ["Submitted", fmtDate(item.submitted) || "-"],
      [isPublished ? "Published" : "Status", isPublished ? fmtDate(item.published) || "-" : STATUS_LABEL[item.status] || item.status],
    ];
    const rowH = 17;
    const boxH = details.length * rowH + 16;
    page.drawRectangle({ x: M, y: y - boxH, width, height: boxH, color: rgb(0.973, 0.98, 0.988), borderColor: color(RULE), borderWidth: 0.8 });
    page.drawRectangle({ x: M, y: y - boxH, width: 3, height: boxH, color: color(ACCENT) });
    let dy = y - 20;
    for (const [k, v] of details) {
      page.drawText(k, { x: M + 16, y: dy, size: 9, font: helvBold, color: color(MUTED) });
      page.drawText(truncate(v, helv, 9.5, width - 110), { x: M + 96, y: dy, size: 9.5, font: helv, color: color(k === "DOI" && item.doi ? BRAND : INK) });
      if (k === "DOI" && item.doi) addLink(out, page, PDFName, PDFString, M + 96, dy - 2, helv.widthOfTextAtSize(v, 9.5), 12, `https://doi.org/${item.doi}`);
      dy -= rowH;
    }
    y -= boxH + 26;

    // abstract
    if (item.abstract) {
      page.drawText("Abstract", { x: M, y, size: 11, font: helvBold, color: color(INK) });
      y -= 16;
      const lines = wrap(item.abstract, times, 10.5, width);
      const room = Math.max(0, Math.floor((y - 190) / 14));
      const shown = lines.slice(0, room);
      if (lines.length > room && shown.length) shown[shown.length - 1] = truncate(`${shown[shown.length - 1]} ${lines[room] || ""}`, times, 10.5, width);
      for (const line of shown) { page.drawText(line, { x: M, y, size: 10.5, font: times, color: color(INK) }); y -= 14; }
      y -= 10;
    }
    if (item.keywords?.length && y > 170) {
      const kw = wrap(`Keywords: ${item.keywords.join(", ")}`, helv, 9, width).slice(0, 2);
      for (const line of kw) { page.drawText(line, { x: M, y, size: 9, font: helv, color: color(MUTED) }); y -= 12; }
    }

    // citation + licence at the bottom
    let by = 132;
    page.drawLine({ start: { x: M, y: by + 16 }, end: { x: W - M, y: by + 16 }, thickness: 0.8, color: color(RULE) });
    page.drawText("How to cite", { x: M, y: by, size: 9, font: helvBold, color: color(INK) });
    by -= 13;
    for (const line of wrap(citation(item), helv, 9, width).slice(0, 3)) { page.drawText(line, { x: M, y: by, size: 9, font: helv, color: color(INK) }); by -= 12; }
    by -= 6;
    const licence = isPublished
      ? "Open access. Published under the Creative Commons Attribution 4.0 licence (CC BY 4.0). The authors retain copyright."
      : "This copy is for editorial use. It has not been typeset or published.";
    for (const line of wrap(licence, helv, 8.5, width)) { page.drawText(line, { x: M, y: by, size: 8.5, font: helv, color: color(MUTED) }); by -= 11; }
    const site = `${SITE.replace("https://", "")}  |  Crossref DOI prefix 10.67418  |  COPE member`;
    page.drawText(site, { x: M, y: 40, size: 8, font: helv, color: color(MUTED) });
  }

  // ------------------------------------------------------------ article pages
  const srcPages = src.getPages();
  if (!srcPages.length) throw new PdfFormatError("This PDF has no pages.");
  const total = srcPages.length;

  if (!headerFooter) {
    const copied = await out.copyPages(src, srcPages.map((_, i) => i));
    copied.forEach((p) => out.addPage(p));
  } else {
    const embedded = await out.embedPages(srcPages);
    for (let i = 0; i < srcPages.length; i++) {
      const sp = srcPages[i];
      const ep = embedded[i];
      const rot = ((sp.getRotation().angle % 360) + 360) % 360;
      const { width: bw, height: bh } = sp.getSize(); // unrotated box
      const [pw, ph] = rot === 90 || rot === 270 ? [bh, bw] : [bw, bh]; // as displayed
      const band = Math.max(18, Math.min(26, ph * 0.03));
      const s = Math.min((ph - 2 * band) / ph, 1);
      const cw = pw * s, ch = ph * s;
      const ox = (pw - cw) / 2, oy = band;
      const page = out.addPage([pw, ph]);
      // draw the original page, rotated as it is displayed
      const opts = { xScale: s, yScale: s };
      if (rot === 0) page.drawPage(ep, { ...opts, x: ox, y: oy });
      else if (rot === 90) page.drawPage(ep, { ...opts, x: ox, y: oy + ch, rotate: degrees(-90) });
      else if (rot === 180) page.drawPage(ep, { ...opts, x: ox + cw, y: oy + ch, rotate: degrees(180) });
      else page.drawPage(ep, { ...opts, x: ox + cw, y: oy, rotate: degrees(90) });

      const fs = Math.max(6.5, Math.min(8, pw / 75));
      const hy = ph - band + (band - fs) / 2 + 1;
      const fy = (band - fs) / 2 + 1;
      const mx = Math.max(24, pw * 0.06);
      page.drawText(truncate(journal, helv, fs, pw * 0.6), { x: mx, y: hy, size: fs, font: helv, color: color(MUTED) });
      const brand = "AfriSci Nexus";
      page.drawText(brand, { x: pw - mx - helvBold.widthOfTextAtSize(brand, fs), y: hy, size: fs, font: helvBold, color: color(BRAND) });
      page.drawLine({ start: { x: mx, y: ph - band + 1 }, end: { x: pw - mx, y: ph - band + 1 }, thickness: 0.5, color: color(RULE) });
      page.drawLine({ start: { x: mx, y: band - 1 }, end: { x: pw - mx, y: band - 1 }, thickness: 0.5, color: color(RULE) });
      page.drawText(truncate(footerId, helv, fs, pw * 0.6), { x: mx, y: fy, size: fs, font: helv, color: color(MUTED) });
      const num = `Page ${i + 1} of ${total}`;
      page.drawText(num, { x: pw - mx - helv.widthOfTextAtSize(num, fs), y: fy, size: fs, font: helv, color: color(MUTED) });
      if (item.doi) addLink(out, page, PDFName, PDFString, mx, fy - 2, helv.widthOfTextAtSize(truncate(footerId, helv, fs, pw * 0.6), fs), fs + 4, footerId);
    }
  }

  out.setTitle(pdfSafe(item.title));
  out.setAuthor(pdfSafe(item.authors.map((a) => a.name).join(", ")));
  out.setSubject(pdfSafe(`${journal}${item.doi ? `, https://doi.org/${item.doi}` : ""}`));
  if (item.keywords?.length) out.setKeywords(item.keywords.map(pdfSafe));
  out.setCreator("AfriSci Nexus");
  out.setProducer("AfriSci Nexus article formatter");
  return out.save();
}

function addLink(doc, page, PDFName, PDFString, x, y, w, h, url) {
  const annot = doc.context.obj({
    Type: "Annot", Subtype: "Link", Rect: [x, y, x + w, y + h], Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
  });
  const ref = doc.context.register(annot);
  const existing = page.node.lookup(PDFName.of("Annots"));
  if (existing) existing.push(ref);
  else page.node.set(PDFName.of("Annots"), doc.context.obj([ref]));
}
