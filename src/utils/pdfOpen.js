/**
 * Utility to open or download a PDF file that may be stored as a base64 data URL
 * or a regular HTTP URL.
 *
 * "Read" uses an <a target="_blank"> click so browsers don't block it as a popup.
 * "Download" triggers a direct file download with the given filename.
 */

function base64ToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "application/pdf";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Open a PDF in a new browser tab.
 * Works for both base64 data URLs and regular HTTP URLs.
 */
export function openPDFInNewTab(url) {
  if (!url) return;
  let href;
  if (url.startsWith("data:")) {
    href = URL.createObjectURL(base64ToBlob(url));
  } else {
    href = url;
  }
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Trigger a download of a PDF file.
 * Works for both base64 data URLs and regular HTTP URLs.
 */
export function downloadPDF(url, filename) {
  if (!url) return;
  let href;
  if (url.startsWith("data:")) {
    href = URL.createObjectURL(base64ToBlob(url));
  } else {
    href = url;
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = filename || "article.pdf";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}