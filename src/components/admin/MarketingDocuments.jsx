import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, X, FileText, Award, Handshake, Users, Mail, Megaphone } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const LOGO_ICON_URL = "https://media.base44.com/images/public/689712620d81bb990dd76bb3/698e59606_generated_image.png";
const LOGO_FULL_URL = "https://media.base44.com/images/public/689712620d81bb990dd76bb3/6189be205_generated_image.png";
const FOUNDER = "Majok Wutchok";
const TITLE = "Founder & CEO | Principal Chief Editor";
const PLATFORM = "AfriSci Nexus";
const EMAIL = "editor@afriscinexus.com";
const WEBSITE = "www.afriscinexus.com";
const TODAY = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// ─── Document Templates ───────────────────────────────────────────────────────

const HEADER = (extra = "") => `
  <div style="background:linear-gradient(135deg,#1e3a8a 0%,#0d9488 100%);padding:28px 40px 22px;color:white;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#0D9488,#0F766E 60%,#F59E0B 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(13,148,136,0.4);flex-shrink:0;overflow:hidden;">
          <img src="${LOGO_ICON_URL}" alt="AfriSci Nexus" style="width:44px;height:44px;object-fit:contain;" />
        </div>
        <div>
          <div style="display:flex;align-items:baseline;gap:4px;">
            <span style="font-size:26px;font-weight:900;color:white;letter-spacing:-0.5px;">AfriSci</span>
            <span style="font-size:26px;font-weight:900;color:#F59E0B;letter-spacing:-0.5px;">Nexus</span>
          </div>
          <div style="font-size:11px;color:#bfdbfe;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">Africa's Premier Open-Access Research Platform</div>
          <div style="font-size:11px;color:#7dd3fc;margin-top:2px;">🌍 Serving 54 African Countries | ${WEBSITE}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:11px;color:#bfdbfe;">
        <div>${TODAY}</div>
        <div style="margin-top:4px;">${EMAIL}</div>
        ${extra}
      </div>
    </div>
  </div>
`;

const FOOTER = () => `
  <div style="margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#0D9488,#0F766E 60%,#F59E0B 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
        <img src="${LOGO_ICON_URL}" alt="" style="width:34px;height:34px;object-fit:contain;" />
      </div>
      <div>
        <p style="margin:0 0 2px;font-weight:700;color:#0f172a;">${FOUNDER}</p>
        <p style="margin:0;color:#64748b;font-size:13px;">${TITLE}</p>
        <p style="margin:2px 0 0;color:#0d9488;font-size:13px;font-weight:600;">${PLATFORM}</p>
        <p style="margin:2px 0 0;color:#94a3b8;font-size:12px;">${EMAIL} | ${WEBSITE}</p>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;background:#f0fdf4;border-radius:8px;padding:12px 16px;">
      <img src="${LOGO_FULL_URL}" alt="AfriSci Nexus" style="height:32px;object-fit:contain;" />
      <div style="font-size:11px;color:#166534;">
        Open Access · Peer Reviewed · Africa-Led · Globally Indexed
      </div>
    </div>
  </div>
`;

const BODY_WRAP = (content) => `
  <div style="font-family:'Georgia',serif;background:white;max-width:760px;margin:0 auto;box-shadow:0 4px 32px rgba(0,0,0,0.12);">
    ${content}
    <div style="padding:0 40px 40px;">${FOOTER()}</div>
  </div>
`;

const LETTER_BODY = (recipient, subject, body) => `
  <div style="padding:32px 40px 0;">
    <div style="background:#f0f9ff;border-left:4px solid #0d9488;padding:12px 16px;margin-bottom:28px;border-radius:0 8px 8px 0;">
      <div style="font-size:11px;color:#0369a1;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Subject</div>
      <div style="font-size:15px;color:#0f172a;font-weight:700;margin-top:2px;">${subject}</div>
    </div>
    <p style="color:#475569;font-size:14px;margin-bottom:20px;">${recipient}</p>
    ${body}
  </div>
`;

// ─── All Document Definitions ─────────────────────────────────────────────────

const DOCUMENTS = [
  {
    id: "call_chief_editor",
    title: "Call for Chief Editors",
    category: "Recruitment",
    icon: Users,
    color: "bg-blue-100 text-blue-700",
    html: () => BODY_WRAP(`
      ${HEADER()}
      ${LETTER_BODY(
        "Dear Distinguished Scholar,",
        "Invitation to Serve as Editor-in-Chief — AfriSci Nexus",
        `
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          AfriSci Nexus is Africa's fastest-growing open-access academic publishing platform, committed to amplifying the voices of African researchers across 54 nations and connecting their work with the global scholarly community. We are currently expanding our editorial leadership and invite exceptional scholars to apply for the prestigious role of <strong>Editor-in-Chief</strong>.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#1e3a8a;margin:0 0 12px;font-size:15px;">Role Overview</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Lead the editorial vision and strategy of your assigned journal</li>
            <li>Oversee double-blind peer review processes</li>
            <li>Recruit and manage Associate Editors and Reviewers</li>
            <li>Uphold COPE ethical standards and publishing excellence</li>
            <li>Represent AfriSci Nexus at academic conferences and institutions</li>
          </ul>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#166534;margin:0 0 12px;font-size:15px;">What We Offer</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Official recognition and a verifiable editorial credential</li>
            <li>Listed on AfriSci Nexus editorial board (globally visible)</li>
            <li>Certificate of Editorship and annual recognition award</li>
            <li>Access to AI-powered editorial tools and reviewer matching</li>
            <li>Collaboration with researchers across Africa and the world</li>
          </ul>
        </div>
        <p style="color:#334155;line-height:1.8;">
          We seek scholars holding a doctoral degree with a strong publication record, institutional affiliation, and a passion for advancing African science. Applications are invited from all 54 African countries.
        </p>
        <p style="color:#334155;line-height:1.8;margin-top:16px;">
          To express your interest, please submit your CV and a brief statement of editorial philosophy to <strong>${EMAIL}</strong> or apply through <strong>${WEBSITE}/Apply</strong>.
        </p>
        <p style="color:#334155;line-height:1.8;margin-top:16px;">We look forward to welcoming you to the AfriSci Nexus family.</p>
        <p style="color:#334155;margin-top:24px;">Warm regards,</p>
        `
      )}
    `),
  },
  {
    id: "call_asst_editor",
    title: "Call for Assistant Editors",
    category: "Recruitment",
    icon: Users,
    color: "bg-sky-100 text-sky-700",
    html: () => BODY_WRAP(`
      ${HEADER()}
      ${LETTER_BODY(
        "Dear Emerging Scholar,",
        "Invitation to Join AfriSci Nexus as Associate / Assistant Editor",
        `
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          AfriSci Nexus is expanding its editorial team and is pleased to invite qualified early-career and mid-career academics to join as <strong>Associate / Assistant Editors</strong>. This is a unique opportunity to shape African scholarly publishing and build an internationally recognised editorial record.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#1e3a8a;margin:0 0 12px;font-size:15px;">Responsibilities</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Support the Editor-in-Chief in managing submissions</li>
            <li>Conduct initial manuscript quality assessments</li>
            <li>Coordinate with reviewers and authors</li>
            <li>Ensure timely editorial decisions and communication</li>
            <li>Assist with special issues and thematic collections</li>
          </ul>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#1e40af;margin:0 0 12px;font-size:15px;">Eligibility</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Masters or PhD degree in a relevant discipline</li>
            <li>At least 2 peer-reviewed publications</li>
            <li>Strong written English communication skills</li>
            <li>Commitment of 4–6 hours per month</li>
          </ul>
        </div>
        <p style="color:#334155;line-height:1.8;">
          Applications are open to scholars across all 54 African nations. To apply, send your CV to <strong>${EMAIL}</strong> or visit <strong>${WEBSITE}/Apply</strong>.
        </p>
        <p style="color:#334155;margin-top:24px;">Sincerely,</p>
        `
      )}
    `),
  },
  {
    id: "call_reviewers",
    title: "Call for Peer Reviewers",
    category: "Recruitment",
    icon: Eye,
    color: "bg-purple-100 text-purple-700",
    html: () => BODY_WRAP(`
      ${HEADER()}
      ${LETTER_BODY(
        "Dear Expert Researcher,",
        "Invitation to Join AfriSci Nexus as a Peer Reviewer",
        `
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          AfriSci Nexus is building Africa's most diverse and rigorous peer review community. We warmly invite subject-matter experts to join our growing network of <strong>500+ peer reviewers</strong> and contribute to the quality and integrity of African scientific publishing.
        </p>
        <div style="background:#faf5ff;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#6b21a8;margin:0 0 12px;font-size:15px;">What Peer Reviewers Do</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Evaluate manuscripts for scientific rigor, originality and clarity</li>
            <li>Provide constructive feedback to authors</li>
            <li>Recommend acceptance, revision or rejection</li>
            <li>Help maintain the integrity of African science</li>
            <li>Complete reviews within agreed timelines (typically 14–21 days)</li>
          </ul>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#166534;margin:0 0 12px;font-size:15px;">Recognition & Benefits</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Official Reviewer Certificate from AfriSci Nexus</li>
            <li>Public recognition on the Reviewer Honours page</li>
            <li>Annual Outstanding Reviewer Award</li>
            <li>Verified reviewing record for career development</li>
            <li>Access to published articles in your field at no cost</li>
          </ul>
        </div>
        <p style="color:#334155;line-height:1.8;">
          We welcome reviewers from all academic disciplines. Apply today at <strong>${WEBSITE}/Apply</strong> or email your profile and areas of expertise to <strong>${EMAIL}</strong>.
        </p>
        <p style="color:#334155;margin-top:24px;">With appreciation,</p>
        `
      )}
    `),
  },
  {
    id: "call_submissions",
    title: "Call for Submissions",
    category: "Authors",
    icon: FileText,
    color: "bg-teal-100 text-teal-700",
    html: () => BODY_WRAP(`
      ${HEADER()}
      ${LETTER_BODY(
        "Dear Author / Researcher,",
        "Call for Manuscript Submissions — AfriSci Nexus Open Access Journals",
        `
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          AfriSci Nexus invites original research articles, review papers, case studies, and short communications for publication across our growing portfolio of <strong>peer-reviewed open-access journals</strong>. We are committed to giving African research the global platform it deserves.
        </p>
        <div style="background:#f0fdfa;border:2px solid #99f6e4;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#0f766e;margin:0 0 12px;font-size:15px;">🔬 Disciplines We Cover</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;color:#134e4a;font-size:13px;line-height:2;">
            <div>✔ STEM & Technology</div><div>✔ Medicine & Public Health</div>
            <div>✔ Agriculture & Environment</div><div>✔ Social Sciences</div>
            <div>✔ Law & Policy</div><div>✔ Business & Economics</div>
            <div>✔ Education & Pedagogy</div><div>✔ Arts & Humanities</div>
          </div>
        </div>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#1e3a8a;margin:0 0 12px;font-size:15px;">Why Publish with AfriSci Nexus?</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li><strong>Open Access:</strong> Free to read, download and cite worldwide</li>
            <li><strong>Rapid Review:</strong> Editorial decision within 21 days</li>
            <li><strong>DOI Assignment:</strong> Permanent, citable digital identifier</li>
            <li><strong>Global Indexing:</strong> Google Scholar, DOAJ, AJOL and more</li>
            <li><strong>AI-Powered Tools:</strong> Journal matching, plagiarism screening</li>
            <li><strong>No Hidden Fees:</strong> Transparent and affordable APCs</li>
          </ul>
        </div>
        <p style="color:#334155;line-height:1.8;">
          Submit your manuscript today at <strong>${WEBSITE}/Submit</strong>. For submission guidelines visit <strong>${WEBSITE}/Guidelines</strong> or contact <strong>${EMAIL}</strong>.
        </p>
        <p style="color:#334155;margin-top:24px;">We look forward to publishing your work,</p>
        `
      )}
    `),
  },
  {
    id: "call_partnership",
    title: "Call for Institutional Partnership",
    category: "Partnership",
    icon: Handshake,
    color: "bg-emerald-100 text-emerald-700",
    html: () => BODY_WRAP(`
      ${HEADER()}
      ${LETTER_BODY(
        "Dear Vice Chancellor / Research Director,",
        "Institutional Partnership Invitation — AfriSci Nexus Publishing Platform",
        `
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          On behalf of <strong>AfriSci Nexus</strong>, I am pleased to extend this formal invitation for your esteemed institution to join our growing network of <strong>Institutional Publishing Partners</strong>. This partnership will elevate the global visibility of your researchers and position your institution at the forefront of African scholarly publishing.
        </p>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#166534;margin:0 0 12px;font-size:15px;">Partnership Tiers Available</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#dcfce7;"><th style="text-align:left;padding:8px 12px;border-radius:4px 0 0 4px;">Tier</th><th style="padding:8px 12px;">Authors</th><th style="padding:8px 12px;border-radius:0 4px 4px 0;">Annual Fee</th></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">Starter</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">10</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">$10,000/yr</td></tr>
            <tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">Growth</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">25</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">$15,000/yr</td></tr>
            <tr><td style="padding:8px 12px;">Premier</td><td style="padding:8px 12px;text-align:center;">50</td><td style="padding:8px 12px;text-align:center;font-weight:700;">$25,000/yr</td></tr>
          </table>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#1e40af;margin:0 0 12px;font-size:15px;">Partnership Benefits Include</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Unlimited submissions for all enrolled authors</li>
            <li>Dedicated editorial liaison and expedited review</li>
            <li>Institutional profile page with publication portfolio</li>
            <li>DOI registration and global indexing for all articles</li>
            <li>Bi-annual impact reports and co-branded press releases</li>
          </ul>
        </div>
        <p style="color:#334155;line-height:1.8;">
          I would welcome the opportunity to discuss how AfriSci Nexus can serve as your institution's primary open-access publishing partner. Please contact us at <strong>${EMAIL}</strong> or apply directly at <strong>${WEBSITE}/InstitutionalPartnership</strong>.
        </p>
        <p style="color:#334155;margin-top:24px;">Yours sincerely,</p>
        `
      )}
    `),
  },
  {
    id: "sponsorship_conference",
    title: "Sponsorship — SS National Science Conference",
    category: "Sponsorship",
    icon: Award,
    color: "bg-amber-100 text-amber-700",
    html: () => BODY_WRAP(`
      ${HEADER('<div style="margin-top:4px;background:rgba(255,255,255,0.15);border-radius:6px;padding:4px 8px;font-size:11px;font-weight:700;color:#fef08a;">🏛️ Official Sponsorship Proposal</div>')}
      ${LETTER_BODY(
        "Dear Esteemed Sponsor,",
        "Sponsorship Proposal: South Sudan National Scientific Conference — October 2026",
        `
        <div style="background:linear-gradient(135deg,#fef9c3,#fef08a);border-radius:12px;padding:16px 20px;margin-bottom:24px;border:2px solid #facc15;">
          <p style="margin:0;font-weight:800;color:#78350f;font-size:16px;">🇸🇸 First-Ever South Sudan National Scientific Conference</p>
          <p style="margin:4px 0 0;color:#92400e;font-size:13px;">October 2026 | Juba, South Sudan | Hosted by AfriSci Nexus</p>
        </div>
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          AfriSci Nexus is proud to announce the inaugural <strong>South Sudan National Scientific Conference</strong>, to be held in <strong>October 2026 in Juba, South Sudan</strong>. This landmark event will bring together scientists, researchers, policymakers, university leaders and international development partners to showcase South Sudan's emerging research talent and set the agenda for national science and innovation policy.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#1e3a8a;margin:0 0 12px;font-size:15px;">Conference Highlights</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>Expected 200–400 delegates from 20+ African nations</li>
            <li>Keynote addresses by Pan-African and international scientists</li>
            <li>Research paper presentations across 8 scientific disciplines</li>
            <li>Policy roundtables with government and UN representatives</li>
            <li>Student and early-career researcher poster sessions</li>
            <li>Launch of South Sudan's first nationally indexed research journal</li>
          </ul>
        </div>
        <div style="background:#fef3c7;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#92400e;margin:0 0 12px;font-size:15px;">Sponsorship Packages</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#fde68a;"><th style="text-align:left;padding:8px 12px;">Level</th><th style="padding:8px 12px;text-align:center;">Investment</th><th style="padding:8px 12px;text-align:left;">Key Benefits</th></tr>
            <tr style="border-bottom:1px solid #fde68a;"><td style="padding:8px 12px;font-weight:700;color:#92400e;">🥇 Platinum</td><td style="padding:8px 12px;text-align:center;font-weight:700;">$15,000+</td><td style="padding:8px 12px;">Keynote slot, lead branding, VIP dinner host</td></tr>
            <tr style="border-bottom:1px solid #fde68a;"><td style="padding:8px 12px;font-weight:700;color:#6b7280;">🥈 Gold</td><td style="padding:8px 12px;text-align:center;font-weight:700;">$7,500</td><td style="padding:8px 12px;">Panel seat, branding, exhibition booth</td></tr>
            <tr><td style="padding:8px 12px;font-weight:700;color:#cd7f32;">🥉 Silver</td><td style="padding:8px 12px;text-align:center;font-weight:700;">$3,000</td><td style="padding:8px 12px;">Logo placement, delegate passes, listing</td></tr>
          </table>
        </div>
        <p style="color:#334155;line-height:1.8;">
          This conference represents a once-in-a-generation opportunity to position your organisation at the heart of South Sudan's scientific renaissance. We would be honoured to partner with you in making this vision a reality.
        </p>
        <p style="color:#334155;line-height:1.8;margin-top:12px;">
          To discuss your sponsorship package, please contact <strong>${EMAIL}</strong> or call our partnerships team directly.
        </p>
        <p style="color:#334155;margin-top:24px;">With highest regards,</p>
        `
      )}
    `),
  },
  {
    id: "funding_request",
    title: "Funding Request Letter",
    category: "Sponsorship",
    icon: FileText,
    color: "bg-rose-100 text-rose-700",
    html: () => BODY_WRAP(`
      ${HEADER()}
      ${LETTER_BODY(
        "Dear Funding Committee / Programme Director,",
        "Funding Request — AfriSci Nexus: Open-Access Science Infrastructure for Africa",
        `
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          I write to formally request funding support for <strong>AfriSci Nexus</strong>, Africa's dedicated open-access scientific publishing platform. Our mission is to ensure that research produced across 54 African nations is accessible, citable, globally indexed and professionally published — at a cost that African institutions can afford.
        </p>
        <div style="background:#fff1f2;border-radius:12px;padding:20px;margin-bottom:20px;border-left:4px solid #e11d48;">
          <p style="font-weight:700;color:#9f1239;margin:0 0 8px;font-size:15px;">The Problem We Solve</p>
          <p style="margin:0;color:#334155;line-height:1.7;font-size:14px;">
            Over <strong>70% of African scientific research</strong> remains invisible to global databases because it is published in under-resourced local journals lacking DOIs, indexing and professional editorial infrastructure. AfriSci Nexus solves this by providing a world-class publishing platform purpose-built for the African context.
          </p>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#166534;margin:0 0 12px;font-size:15px;">Funding Will Enable</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li>CrossRef membership and DOI registration for 500+ articles/year</li>
            <li>DOAJ and COPE accreditation applications</li>
            <li>Hosting the inaugural South Sudan National Scientific Conference (Oct 2026)</li>
            <li>Author fee waiver programme for researchers from LDCs</li>
            <li>AI-powered plagiarism screening and reviewer-matching tools</li>
            <li>Multilingual publishing support (French, Arabic, Swahili, Portuguese)</li>
          </ul>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#1e40af;margin:0 0 12px;font-size:15px;">Requested Support</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr style="background:#dbeafe;"><th style="text-align:left;padding:8px 12px;">Component</th><th style="padding:8px 12px;text-align:right;">Budget (USD)</th></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 12px;">CrossRef + ISSN + COPE registrations</td><td style="padding:8px 12px;text-align:right;">$2,500</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 12px;">South Sudan Science Conference logistics</td><td style="padding:8px 12px;text-align:right;">$25,000</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 12px;">Author fee waiver fund (50 waivers)</td><td style="padding:8px 12px;text-align:right;">$15,000</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 12px;">Platform development and AI tools</td><td style="padding:8px 12px;text-align:right;">$20,000</td></tr>
            <tr style="background:#dbeafe;font-weight:700;"><td style="padding:8px 12px;">Total Requested</td><td style="padding:8px 12px;text-align:right;">$62,500</td></tr>
          </table>
        </div>
        <p style="color:#334155;line-height:1.8;">
          We are happy to provide a full project proposal, financial statements and impact measurement framework upon request. Thank you for considering this investment in African science.
        </p>
        <p style="color:#334155;margin-top:24px;">Respectfully submitted,</p>
        `
      )}
    `),
  },
  {
    id: "social_media",
    title: "Social Media Marketing Letter",
    category: "Marketing",
    icon: Megaphone,
    color: "bg-indigo-100 text-indigo-700",
    html: () => BODY_WRAP(`
      ${HEADER()}
      ${LETTER_BODY(
        "Dear Social Media Manager / Communications Officer,",
        "AfriSci Nexus — Social Media Partnership & Content Collaboration",
        `
        <p style="color:#334155;line-height:1.8;margin-bottom:16px;">
          AfriSci Nexus is seeking dynamic social media collaborators, institutional communication teams and science communicators to help amplify African research to global audiences. We invite you to partner with us in telling Africa's scientific story.
        </p>
        <div style="background:#eef2ff;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#3730a3;margin:0 0 12px;font-size:15px;">📲 Platform Presence</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;color:#334155;">
            <div style="background:white;border-radius:8px;padding:12px;border:1px solid #e0e7ff;"><div style="font-weight:700;color:#1d4ed8;">🐦 Twitter / X</div><div>@AfriSciNexus | Daily research spotlights</div></div>
            <div style="background:white;border-radius:8px;padding:12px;border:1px solid #e0e7ff;"><div style="font-weight:700;color:#0a66c2;">💼 LinkedIn</div><div>AfriSci Nexus | Professional network</div></div>
            <div style="background:white;border-radius:8px;padding:12px;border:1px solid #e0e7ff;"><div style="font-weight:700;color:#e1306c;">📸 Instagram</div><div>@afriscinexus | Visual science stories</div></div>
            <div style="background:white;border-radius:8px;padding:12px;border:1px solid #e0e7ff;"><div style="font-weight:700;color:#1877f2;">📘 Facebook</div><div>AfriSci Nexus | Community updates</div></div>
          </div>
        </div>
        <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#166534;margin:0 0 12px;font-size:15px;">Collaboration Opportunities</p>
          <ul style="margin:0;padding-left:20px;color:#334155;line-height:2;">
            <li><strong>Research Spotlights:</strong> Share our weekly African researcher features</li>
            <li><strong>Open Access Advocacy:</strong> Co-create #AfricanScience content</li>
            <li><strong>Journal Launches:</strong> Announce new journals to your network</li>
            <li><strong>Conference Promotion:</strong> Help promote the South Sudan Science Conference 2026</li>
            <li><strong>Author Profiles:</strong> Feature published authors from your institution</li>
          </ul>
        </div>
        <div style="background:#fef3c7;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <p style="font-weight:700;color:#92400e;margin:0 0 8px;">📣 Sample Content Themes</p>
          <p style="margin:0;color:#334155;font-size:13px;line-height:1.8;">
            "African researchers publish world-class science — and now the world can read it. 🌍📖 #AfriSciNexus #AfricanScience #OpenAccess" <br/>
            "Submit your research to Africa's premier open-access journal. Free submission, global reach. ✍️🔬 ${WEBSITE}" <br/>
            "Calling peer reviewers! Join 500+ experts shaping African scientific publishing. 🏅 Apply: ${WEBSITE}/Apply"
          </p>
        </div>
        <p style="color:#334155;line-height:1.8;">
          To discuss a social media collaboration, content exchange, or institutional communication partnership, please reach out at <strong>${EMAIL}</strong>. Together, we can make African science impossible to ignore.
        </p>
        <p style="color:#334155;margin-top:24px;">With enthusiasm,</p>
        `
      )}
    `),
  },
  {
    id: "cert_editor",
    title: "Certificate — Editor Recognition",
    category: "Certificate",
    icon: Award,
    color: "bg-yellow-100 text-yellow-700",
    isCertificate: true,
    html: (name = "Dr. [Recipient Name]", journal = "[Journal Name]", role = "Editor-in-Chief") => `
      <div style="font-family:'Georgia',serif;background:white;max-width:800px;margin:0 auto;box-shadow:0 4px 32px rgba(0,0,0,0.15);">
        <div style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#0d9488 100%);padding:6px;"></div>
        <div style="padding:48px;position:relative;background:white;">
          <div style="position:absolute;inset:16px;border:2px solid #e2e8f0;border-radius:8px;pointer-events:none;"></div>
          <div style="position:absolute;inset:20px;border:1px solid #0d9488;border-radius:6px;pointer-events:none;opacity:0.3;"></div>
          <div style="text-align:center;position:relative;z-index:1;">
            <div style="font-size:30px;font-weight:900;background:linear-gradient(135deg,#1e3a8a,#0d9488);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;">AfriSci Nexus</div>
            <div style="font-size:11px;color:#64748b;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px;">Africa's Premier Open-Access Research Platform</div>
            <div style="width:80px;height:3px;background:linear-gradient(90deg,#1e3a8a,#0d9488);margin:0 auto 24px;border-radius:2px;"></div>
            <div style="font-size:13px;color:#64748b;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">Certificate of Recognition</div>
            <div style="font-size:32px;font-weight:300;color:#334155;margin-bottom:4px;">This is to certify that</div>
            <div style="font-size:42px;font-weight:700;color:#1e3a8a;font-style:italic;margin:16px 0;border-bottom:2px solid #0d9488;display:inline-block;padding-bottom:8px;">${name}</div>
            <div style="font-size:16px;color:#475569;margin:20px 0;">has served with distinction as</div>
            <div style="font-size:26px;font-weight:700;color:#0f766e;margin:8px 0;">${role}</div>
            <div style="font-size:16px;color:#64748b;margin-bottom:24px;">${journal}</div>
            <div style="font-size:14px;color:#94a3b8;margin-bottom:40px;">
              In recognition of exemplary contributions to African scientific publishing,<br/>
              rigorous peer review standards, and advancing open-access knowledge on the African continent.
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;">
              <div style="text-align:center;">
                <div style="width:160px;height:1px;background:#334155;margin-bottom:8px;"></div>
                <div style="font-weight:700;color:#0f172a;font-size:14px;">${FOUNDER}</div>
                <div style="color:#64748b;font-size:12px;">${TITLE}</div>
              </div>
              <div style="text-align:center;">
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#1e3a8a,#0d9488);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;box-shadow:0 4px 16px rgba(13,148,136,0.4);overflow:hidden;">
                  <img src="${LOGO_ICON_URL}" alt="" style="width:54px;height:54px;object-fit:contain;" />
                </div>
                <div style="font-size:11px;color:#94a3b8;">AfriSci Nexus Seal</div>
              </div>
              <div style="text-align:center;">
                <div style="width:160px;height:1px;background:#334155;margin-bottom:8px;"></div>
                <div style="font-weight:700;color:#0f172a;font-size:14px;">Date Issued</div>
                <div style="color:#64748b;font-size:12px;">${TODAY}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#0d9488 0%,#1e3a8a 100%);padding:6px;"></div>
      </div>
    `,
  },
  {
    id: "cert_reviewer",
    title: "Certificate — Reviewer Recognition",
    category: "Certificate",
    icon: Award,
    color: "bg-purple-100 text-purple-700",
    isCertificate: true,
    html: (name = "Dr. [Recipient Name]", journal = "[Journal Name]", role = "Peer Reviewer") => `
      <div style="font-family:'Georgia',serif;background:white;max-width:800px;margin:0 auto;box-shadow:0 4px 32px rgba(0,0,0,0.15);">
        <div style="background:linear-gradient(135deg,#6d28d9 0%,#4c1d95 50%,#0d9488 100%);padding:6px;"></div>
        <div style="padding:48px;position:relative;background:white;">
          <div style="position:absolute;inset:16px;border:2px solid #ede9fe;border-radius:8px;pointer-events:none;"></div>
          <div style="position:absolute;inset:20px;border:1px solid #6d28d9;border-radius:6px;pointer-events:none;opacity:0.3;"></div>
          <div style="text-align:center;position:relative;z-index:1;">
            <div style="font-size:30px;font-weight:900;background:linear-gradient(135deg,#4c1d95,#0d9488);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;">AfriSci Nexus</div>
            <div style="font-size:11px;color:#64748b;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px;">Africa's Premier Open-Access Research Platform</div>
            <div style="width:80px;height:3px;background:linear-gradient(90deg,#6d28d9,#0d9488);margin:0 auto 24px;border-radius:2px;"></div>
            <div style="font-size:13px;color:#64748b;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">Certificate of Appreciation</div>
            <div style="font-size:32px;font-weight:300;color:#334155;margin-bottom:4px;">This is to acknowledge that</div>
            <div style="font-size:42px;font-weight:700;color:#4c1d95;font-style:italic;margin:16px 0;border-bottom:2px solid #0d9488;display:inline-block;padding-bottom:8px;">${name}</div>
            <div style="font-size:16px;color:#475569;margin:20px 0;">has made a distinguished contribution as a</div>
            <div style="font-size:26px;font-weight:700;color:#0f766e;margin:8px 0;">${role}</div>
            <div style="font-size:16px;color:#64748b;margin-bottom:24px;">${journal}</div>
            <div style="font-size:14px;color:#94a3b8;margin-bottom:40px;">
              In recognition of expert manuscript evaluation, constructive scholarly feedback,<br/>
              and upholding the highest standards of academic integrity and peer review excellence.
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;">
              <div style="text-align:center;">
                <div style="width:160px;height:1px;background:#334155;margin-bottom:8px;"></div>
                <div style="font-weight:700;color:#0f172a;font-size:14px;">${FOUNDER}</div>
                <div style="color:#64748b;font-size:12px;">${TITLE}</div>
              </div>
              <div style="text-align:center;">
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#4c1d95,#0d9488);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
                  <span style="color:white;font-size:28px;">🌍</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;">AfriSci Nexus Seal</div>
              </div>
              <div style="text-align:center;">
                <div style="width:160px;height:1px;background:#334155;margin-bottom:8px;"></div>
                <div style="font-weight:700;color:#0f172a;font-size:14px;">Date Issued</div>
                <div style="color:#64748b;font-size:12px;">${TODAY}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#0d9488 0%,#4c1d95 100%);padding:6px;"></div>
      </div>
    `,
  },
  {
    id: "cert_partner",
    title: "Certificate — Institutional Partnership",
    category: "Certificate",
    icon: Handshake,
    color: "bg-emerald-100 text-emerald-700",
    isCertificate: true,
    html: (name = "[Institution Name]", journal = "[Country]", role = "Institutional Partner") => `
      <div style="font-family:'Georgia',serif;background:white;max-width:800px;margin:0 auto;box-shadow:0 4px 32px rgba(0,0,0,0.15);">
        <div style="background:linear-gradient(135deg,#065f46 0%,#0d9488 50%,#1e3a8a 100%);padding:6px;"></div>
        <div style="padding:48px;position:relative;background:white;">
          <div style="position:absolute;inset:16px;border:2px solid #d1fae5;border-radius:8px;pointer-events:none;"></div>
          <div style="position:absolute;inset:20px;border:1px solid #059669;border-radius:6px;pointer-events:none;opacity:0.3;"></div>
          <div style="text-align:center;position:relative;z-index:1;">
            <div style="font-size:30px;font-weight:900;background:linear-gradient(135deg,#065f46,#1e3a8a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;">AfriSci Nexus</div>
            <div style="font-size:11px;color:#64748b;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px;">Africa's Premier Open-Access Research Platform</div>
            <div style="width:80px;height:3px;background:linear-gradient(90deg,#065f46,#1e3a8a);margin:0 auto 24px;border-radius:2px;"></div>
            <div style="font-size:13px;color:#64748b;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">Certificate of Partnership</div>
            <div style="font-size:32px;font-weight:300;color:#334155;margin-bottom:4px;">This certifies that</div>
            <div style="font-size:42px;font-weight:700;color:#065f46;font-style:italic;margin:16px 0;border-bottom:2px solid #0d9488;display:inline-block;padding-bottom:8px;">${name}</div>
            <div style="font-size:15px;color:#64748b;margin:4px 0 16px;">${journal}</div>
            <div style="font-size:16px;color:#475569;margin:12px 0;">is a recognised</div>
            <div style="font-size:26px;font-weight:700;color:#0f766e;margin:8px 0;">${role}</div>
            <div style="font-size:16px;color:#64748b;margin-bottom:24px;">AfriSci Nexus Publishing Platform</div>
            <div style="font-size:14px;color:#94a3b8;margin-bottom:40px;">
              This partnership represents a commitment to advancing open-access African science,<br/>
              supporting researchers, and contributing to the global visibility of African scholarship.
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;">
              <div style="text-align:center;">
                <div style="width:160px;height:1px;background:#334155;margin-bottom:8px;"></div>
                <div style="font-weight:700;color:#0f172a;font-size:14px;">${FOUNDER}</div>
                <div style="color:#64748b;font-size:12px;">${TITLE}</div>
              </div>
              <div style="text-align:center;">
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#065f46,#1e3a8a);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
                  <span style="color:white;font-size:28px;">🌍</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;">AfriSci Nexus Seal</div>
              </div>
              <div style="text-align:center;">
                <div style="width:160px;height:1px;background:#334155;margin-bottom:8px;"></div>
                <div style="font-weight:700;color:#0f172a;font-size:14px;">Valid Until</div>
                <div style="color:#64748b;font-size:12px;">${new Date(new Date().setFullYear(new Date().getFullYear()+1)).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,#1e3a8a 0%,#0d9488 100%);padding:6px;"></div>
      </div>
    `,
  },
];

const CATEGORIES = ["All", ...new Set(DOCUMENTS.map(d => d.category))];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketingDocuments() {
  const [selected, setSelected] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [certName, setCertName] = useState("");
  const [certJournal, setCertJournal] = useState("");
  const [certRole, setCertRole] = useState("");
  const [exporting, setExporting] = useState("");
  const previewRef = useRef(null);

  const filtered = catFilter === "All" ? DOCUMENTS : DOCUMENTS.filter(d => d.category === catFilter);

  const getHtml = (doc) => {
    if (doc.isCertificate) return doc.html(certName || undefined, certJournal || undefined, certRole || undefined);
    return doc.html();
  };

  const downloadWord = (doc) => {
    const html = getHtml(doc);
    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${doc.title}</title></head><body>${html}</body></html>`;
    const blob = new Blob([wordHtml], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.title.replace(/\s+/g, "_")}.doc`;
    a.click();
  };

  const downloadPDF = async (doc) => {
    setExporting("pdf");
    try {
      const el = previewRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: doc.isCertificate ? "landscape" : "portrait", unit: "mm", format: "a4" });
      const pW = pdf.internal.pageSize.getWidth();
      const pH = pdf.internal.pageSize.getHeight();
      const imgW = pW;
      const imgH = (canvas.height * pW) / canvas.width;
      let y = 0;
      if (imgH <= pH) {
        pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
      } else {
        let remaining = imgH;
        while (remaining > 0) {
          pdf.addImage(imgData, "PNG", 0, y === 0 ? 0 : -(imgH - remaining), imgW, imgH);
          remaining -= pH;
          if (remaining > 0) { pdf.addPage(); y -= pH; }
        }
      }
      pdf.save(`${doc.title.replace(/\s+/g, "_")}.pdf`);
    } finally { setExporting(""); }
  };

  const downloadPNG = async (doc) => {
    setExporting("png");
    try {
      const el = previewRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${doc.title.replace(/\s+/g, "_")}.png`;
      a.click();
    } finally { setExporting(""); }
  };

  return (
    <div className="space-y-5">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === cat ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Document Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(doc => (
          <Card key={doc.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelected(doc); setCertName(""); setCertJournal(""); setCertRole(""); }}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${doc.color} flex items-center justify-center mb-3`}>
                <doc.icon className="w-5 h-5" />
              </div>
              <Badge className="text-xs mb-2 bg-slate-100 text-slate-600 border-0">{doc.category}</Badge>
              <h3 className="font-bold text-slate-900 text-sm mb-3 leading-tight">{doc.title}</h3>
              <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-1">
                <Eye className="w-3.5 h-3.5" /> Preview & Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="font-bold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-slate-500">Preview document before downloading</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => downloadWord(selected)} className="gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Download className="w-3.5 h-3.5" /> Word
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadPDF(selected)} disabled={exporting === "pdf"} className="gap-1 text-xs border-red-300 text-red-700 hover:bg-red-50">
                  <Download className="w-3.5 h-3.5" /> {exporting === "pdf" ? "Exporting…" : "PDF"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadPNG(selected)} disabled={exporting === "png"} className="gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Download className="w-3.5 h-3.5" /> {exporting === "png" ? "Exporting…" : "PNG"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)} className="text-slate-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Certificate Name Fields */}
            {selected.isCertificate && (
              <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-amber-800 block mb-1">Recipient Name</label>
                  <input value={certName} onChange={e => setCertName(e.target.value)} placeholder="e.g. Dr. Amara Okafor" className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-amber-800 block mb-1">Journal / Institution</label>
                  <input value={certJournal} onChange={e => setCertJournal(e.target.value)} placeholder="e.g. AfriSci Journal of Medicine" className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs font-semibold text-amber-800 block mb-1">Role / Title</label>
                  <input value={certRole} onChange={e => setCertRole(e.target.value)} placeholder="e.g. Editor-in-Chief" className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
            )}

            {/* Document Preview */}
            <div className="p-6 bg-slate-100 overflow-auto">
              <div ref={previewRef} dangerouslySetInnerHTML={{ __html: getHtml(selected) }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}