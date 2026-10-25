import { pdfjs } from "react-pdf";
// Load the PDF worker that ships with the installed pdfjs-dist build so it is
// served from the app bundle instead of a third-party CDN.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export default pdfjs;