import { jsPDF } from "jspdf";

// Generates a branded AfriSci Nexus Discovery certificate PDF entirely in the
// browser and triggers a download. No server upload, no integration credits.
export function generateCertificatePDF({ studentName, courseTitle, courseCode, certificateCode, issueDate }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");

  // Outer border (teal)
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(6);
  doc.rect(24, 24, W - 48, H - 48);

  // Inner border (blue)
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1.2);
  doc.rect(40, 40, W - 80, H - 80);

  // Brand
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("AfriSci Nexus Discovery", W / 2, 92, { align: "center" });

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Advancing African Scientific Research Globally", W / 2, 112, { align: "center" });

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text("Certificate of Completion", W / 2, 162, { align: "center" });

  // "This certifies that"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text("This is to certify that", W / 2, 196, { align: "center" });

  // Student name
  const name = studentName || "Participant";
  doc.setFont("times", "bold");
  doc.setFontSize(38);
  doc.setTextColor(13, 148, 136);
  doc.text(name, W / 2, 244, { align: "center" });
  const nameWidth = doc.getTextWidth(name);
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(1);
  doc.line(W / 2 - nameWidth / 2 - 12, 252, W / 2 + nameWidth / 2 + 12, 252);

  // "has successfully completed"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  doc.text("has successfully completed the training course", W / 2, 278, { align: "center" });

  // Course title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(courseTitle || "", W - 220);
  doc.text(titleLines, W / 2, 306, { align: "center" });

  // Course ID
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Course ID: ${courseCode || ""}`, W / 2, 332, { align: "center" });

  // Seal
  const sealX = W / 2, sealY = 392;
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(2);
  doc.circle(sealX, sealY, 32, "S");
  doc.setFillColor(30, 64, 175);
  doc.circle(sealX, sealY, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AFRISCI", sealX, sealY - 6, { align: "center" });
  doc.text("NEXUS", sealX, sealY + 3, { align: "center" });
  doc.setFontSize(6.5);
  doc.text("DISCOVERY", sealX, sealY + 12, { align: "center" });

  // Issue date (left) + signature (right)
  const dateStr = issueDate
    ? new Date(issueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString();
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Issued: ${dateStr}`, 90, 408);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(90, 398, 230, 398);
  doc.text("Date", 90, 392);

  doc.text("AfriSci Nexus Editorial Board", W - 90 - 170, 408);
  doc.line(W - 90 - 170, 398, W - 90, 398);
  doc.text("Authorised Signatory", W - 90 - 170, 392);

  // Verification code + URL (bottom)
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certificate Verification Code: ${certificateCode || ""}`, W / 2, 462, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Verify online: https://afriscinexus.base44.app/VerifyCertificate?code=${encodeURIComponent(certificateCode || "")}`, W / 2, 478, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("This certificate can be independently verified at the URL above. AfriSci Nexus Discovery is an initiative of AfriSci Nexus.", W / 2, 494, { align: "center" });

  doc.save(`AfriSciNexus_Certificate_${(certificateCode || "certificate").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}