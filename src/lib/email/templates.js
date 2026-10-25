// AfriSci Nexus Email Center — generated from shared/templates.js; edit there.
// AfriSci Nexus — built-in branded email templates.
// These are the defaults seeded into the EmailTemplate entity. Admins can edit
// any of them in the Email Center (Templates tab) at any time, and can also
// edit the subject/body of an individual email before it is sent. "Reset to
// default" restores the text below.
//
// Syntax available in subject and body:
//   {{variable}}                      value substitution (see VARIABLE_CATALOG)
//   {{#if variable}}…{{else}}…{{/if}}   optional sections
//   [button: Label | https://…]        branded call-to-action button
//   [box] … [/box]                    highlighted details panel

const details = `[box]<p style="margin:0 0 4px;"><strong>Manuscript:</strong> {{manuscript_title}}</p><p style="margin:0 0 4px;"><strong>Manuscript ID:</strong> {{manuscript_id}}</p><p style="margin:0;"><strong>Journal:</strong> {{journal_name}}</p>[/box]`;

export const DEFAULT_TEMPLATES = [
  // ------------------------------------------------------------ general
  {
    key: "general_message",
    name: "General message",
    category: "general",
    header_label: "",
    description: "Blank branded letter for any reply to authors, reviewers, partners or readers.",
    subject: "{{#if manuscript_id}}[{{manuscript_id}}] {{/if}}Message from AfriSci Nexus",
    body_html: `<p>Dear {{recipient_name}},</p><p>{{custom_message}}</p><p>Please do not hesitate to reply to this email if you have any questions.</p>`,
  },

  // ------------------------------------------------------------ authors
  {
    key: "submission_received",
    name: "Submission received",
    category: "author",
    header_label: "Submission acknowledgement",
    description: "Confirms receipt of a new manuscript and explains next steps.",
    subject: "[{{manuscript_id}}] Submission received – {{journal_name}}",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for submitting your manuscript to <strong>{{journal_name}}</strong>. We confirm that it has been received{{#if submission_date}} on {{submission_date}}{{/if}} and has entered our editorial workflow.</p>${details}<p>Your manuscript will first undergo an editorial screening for scope, originality and adherence to our submission guidelines. If it passes screening, it will be sent for double-blind peer review. We aim to communicate an initial decision within four to six weeks.</p><p>You can follow the progress of your submission at any time from your author dashboard.</p>[button: Track your submission | {{portal_url}}/MyManuscripts]<p>Please quote your manuscript ID in all correspondence.</p>`,
  },
  {
    key: "under_review",
    name: "Sent for peer review",
    category: "author",
    header_label: "Peer review update",
    description: "Tells the author the manuscript passed screening and is with reviewers.",
    subject: "[{{manuscript_id}}] Your manuscript is now under peer review",
    body_html: `<p>Dear {{recipient_name}},</p><p>We are pleased to let you know that your manuscript has passed editorial screening and has now been sent to independent expert reviewers.</p>${details}<p>AfriSci Nexus operates a rigorous double-blind peer review process. We will contact you as soon as the reviewers' reports have been received and the handling editor has reached a decision.</p>[button: View submission status | {{portal_url}}/MyManuscripts]`,
  },
  {
    key: "revision_minor",
    name: "Minor revisions required",
    category: "author",
    header_label: "Editorial decision",
    description: "Decision: minor revisions, with reviewer comments and a deadline.",
    subject: "[{{manuscript_id}}] Decision: minor revisions required",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for your submission to <strong>{{journal_name}}</strong>. Your manuscript has now been reviewed, and I am pleased to inform you that it is potentially acceptable for publication subject to <strong>minor revisions</strong>.</p>${details}{{#if editor_comments}}<h2>Editor's comments</h2><p>{{editor_comments}}</p>{{/if}}<h2>Reviewers' comments</h2><p>{{reviewer_comments}}</p><p>Please upload your revised manuscript together with a point-by-point response to each comment{{#if revision_deadline}} by <strong>{{revision_deadline}}</strong>{{/if}}. Changes in the manuscript should be highlighted.</p>[button: Submit your revision | {{portal_url}}/MyManuscripts]<p>We look forward to receiving your revised manuscript.</p>`,
  },
  {
    key: "revision_major",
    name: "Major revisions required",
    category: "author",
    header_label: "Editorial decision",
    description: "Decision: major revisions, with reviewer comments and a deadline.",
    subject: "[{{manuscript_id}}] Decision: major revisions required",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for submitting your manuscript to <strong>{{journal_name}}</strong>. The reviewers recognise the value of your work but have raised substantive points that need to be addressed. The editor has therefore decided that your manuscript requires <strong>major revisions</strong> before it can be considered further.</p>${details}{{#if editor_comments}}<h2>Editor's comments</h2><p>{{editor_comments}}</p>{{/if}}<h2>Reviewers' comments</h2><p>{{reviewer_comments}}</p><p>Please submit your revised manuscript with a detailed, point-by-point response to the reviewers{{#if revision_deadline}} by <strong>{{revision_deadline}}</strong>{{/if}}. The revised version may be returned to the original reviewers for further assessment.</p>[button: Submit your revision | {{portal_url}}/MyManuscripts]`,
  },
  {
    key: "accepted",
    name: "Manuscript accepted",
    category: "author",
    header_label: "Editorial decision · Accepted",
    description: "Acceptance letter with next steps toward publication.",
    subject: "[{{manuscript_id}}] Congratulations – your manuscript has been accepted",
    body_html: `<p>Dear {{recipient_name}},</p><p>On behalf of the editorial board of <strong>{{journal_name}}</strong>, it is my great pleasure to inform you that your manuscript has been <strong>accepted for publication</strong>{{#if decision_date}} as of {{decision_date}}{{/if}}.</p>${details}{{#if editor_comments}}<p>{{editor_comments}}</p>{{/if}}<p><strong>What happens next</strong></p><ul><li>Our production team will prepare your article for typesetting and send you the proofs for checking.</li><li>A DOI under the Crossref prefix 10.67418 will be registered for your article.</li><li>Once published, your article will be freely available worldwide under our open-access policy.</li></ul>{{#if apc_amount}}<p>An article processing charge of <strong>{{apc_amount}}</strong> applies. You will receive a separate invoice with payment instructions.</p>{{/if}}<p>Congratulations once again, and thank you for choosing AfriSci Nexus to share your research.</p>[button: Go to your author dashboard | {{portal_url}}/MyManuscripts]`,
  },
  {
    key: "rejected",
    name: "Manuscript rejected (after review)",
    category: "author",
    header_label: "Editorial decision",
    description: "Respectful rejection after peer review, including reviewer feedback.",
    subject: "[{{manuscript_id}}] Decision on your manuscript",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for submitting your manuscript to <strong>{{journal_name}}</strong> and for your patience during the review process.</p>${details}<p>After careful consideration of the reviewers' reports, I regret to inform you that we are unable to accept your manuscript for publication.</p>{{#if rejection_reason}}<p>{{rejection_reason}}</p>{{/if}}{{#if reviewer_comments}}<h2>Reviewers' comments</h2><p>{{reviewer_comments}}</p>{{/if}}<p>We hope the reviewers' feedback will be helpful as you develop this work further. This decision is not a reflection on the importance of your research, and we would welcome future submissions from you.</p>`,
  },
  {
    key: "desk_rejected",
    name: "Desk rejection",
    category: "author",
    header_label: "Editorial decision",
    description: "Rejection at screening stage without external review.",
    subject: "[{{manuscript_id}}] Decision on your submission to {{journal_name}}",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for considering <strong>{{journal_name}}</strong> for your manuscript.</p>${details}<p>Following an initial editorial assessment, we regret that we are unable to send your manuscript for external peer review.</p>{{#if rejection_reason}}<p><strong>Reason:</strong> {{rejection_reason}}</p>{{/if}}<p>Because this decision was made at screening, your manuscript is free to be submitted elsewhere immediately. You may also wish to consider one of our other journals that may be a closer fit.</p>[button: Browse AfriSci Nexus journals | {{portal_url}}/Journals]`,
  },
  {
    key: "proofs_ready",
    name: "Proofs ready for checking",
    category: "author",
    header_label: "Production",
    description: "Asks the author to check typeset proofs.",
    subject: "[{{manuscript_id}}] Your article proofs are ready",
    body_html: `<p>Dear {{recipient_name}},</p><p>The typeset proofs of your accepted article are ready for your review.</p>${details}<p>Please check the proofs carefully for typesetting errors, author names and affiliations, tables, figures and references. Only essential corrections can be accepted at this stage.</p>[button: Review your proofs | {{proofs_url}}]<p>Please return your corrections{{#if revision_deadline}} by <strong>{{revision_deadline}}</strong>{{else}} within 3 working days{{/if}}.</p>`,
  },
  {
    key: "published",
    name: "Article published",
    category: "author",
    header_label: "Now published",
    description: "Announces publication with DOI and article link.",
    subject: "Your article is now published – {{journal_name}}",
    body_html: `<p>Dear {{recipient_name}},</p><p>We are delighted to let you know that your article has been <strong>published</strong> in <strong>{{journal_name}}</strong> and is now freely available to readers worldwide.</p>[box]<p style="margin:0 0 4px;"><strong>Title:</strong> {{manuscript_title}}</p><p style="margin:0 0 4px;"><strong>DOI:</strong> <a href="https://doi.org/{{doi}}">https://doi.org/{{doi}}</a></p><p style="margin:0;"><strong>Journal:</strong> {{journal_name}}</p>[/box][button: Read your article | {{article_url}}]<p>To maximise the reach of your work, we encourage you to share the DOI link on your institutional profile, ORCID, Google Scholar and social media.</p><p>Thank you for publishing with AfriSci Nexus.</p>`,
  },
  {
    key: "apc_invoice",
    name: "APC invoice / payment request",
    category: "author",
    header_label: "Article processing charge",
    description: "Requests payment of the article processing charge.",
    subject: "[{{manuscript_id}}] Invoice {{invoice_number}} – article processing charge",
    body_html: `<p>Dear {{recipient_name}},</p><p>Following the acceptance of your manuscript, please find below the details of the article processing charge (APC) that supports open-access publication.</p>[box]<p style="margin:0 0 4px;"><strong>Invoice:</strong> {{invoice_number}}</p><p style="margin:0 0 4px;"><strong>Manuscript:</strong> {{manuscript_title}} ({{manuscript_id}})</p><p style="margin:0 0 4px;"><strong>Amount due:</strong> {{apc_amount}}</p><p style="margin:0;"><strong>Due date:</strong> {{payment_due_date}}</p>[/box][button: Pay securely | {{payment_link}}]<p>If your institution holds an AfriSci Nexus partnership agreement, or if you wish to request a waiver, please reply to this email before the due date.</p>`,
  },
  {
    key: "payment_received",
    name: "Payment received",
    category: "author",
    header_label: "Payment confirmation",
    description: "Confirms APC payment.",
    subject: "[{{manuscript_id}}] Payment received – thank you",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you. We confirm receipt of your payment of <strong>{{amount_paid}}</strong>{{#if invoice_number}} for invoice {{invoice_number}}{{/if}}.</p>${details}<p>Your article will now proceed through production. Please keep this email for your records.</p>`,
  },

  // ------------------------------------------------------------ reviewers
  {
    key: "reviewer_invitation",
    name: "Reviewer invitation",
    category: "reviewer",
    header_label: "Invitation to review",
    description: "Invites an expert to review a manuscript.",
    subject: "Invitation to review for {{journal_name}} [{{manuscript_id}}]",
    body_html: `<p>Dear {{recipient_name}},</p><p>In view of your expertise, I would like to invite you to review the following manuscript submitted to <strong>{{journal_name}}</strong>.</p>${details}<p>We would be grateful to receive your report{{#if review_deadline}} by <strong>{{review_deadline}}</strong>{{/if}}. AfriSci Nexus operates double-blind peer review, and all manuscript content must be treated as confidential.</p>[button: Respond to this invitation | {{portal_url}}/Profile]<p>If you are unable to review, we would greatly appreciate suggestions of alternative reviewers. Thank you for supporting African scholarship.</p>`,
  },
  {
    key: "reviewer_reminder",
    name: "Reviewer reminder",
    category: "reviewer",
    header_label: "Review reminder",
    description: "Gentle reminder of an upcoming or overdue review.",
    subject: "Reminder: review due for {{manuscript_id}}",
    body_html: `<p>Dear {{recipient_name}},</p><p>This is a friendly reminder that your review of the manuscript below is due{{#if review_deadline}} on <strong>{{review_deadline}}</strong>{{/if}}.</p>${details}[button: Open your review | {{portal_url}}/Profile]<p>If you need more time, please reply to this email and let us know when we can expect your report.</p>`,
  },
  {
    key: "reviewer_thanks",
    name: "Thank you for reviewing",
    category: "reviewer",
    header_label: "With our thanks",
    description: "Thanks a reviewer after a completed report.",
    subject: "Thank you for your review – {{manuscript_id}}",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for completing your review of <em>{{manuscript_title}}</em> for <strong>{{journal_name}}</strong>. Your careful assessment is essential to maintaining the quality of research we publish.</p><p>Your contribution will be recorded on your AfriSci Nexus reviewer profile. We hope to call on your expertise again.</p>`,
  },

  // ------------------------------------------------------------ editorial / applications
  {
    key: "application_approved",
    name: "Application approved",
    category: "editorial",
    header_label: "Welcome aboard",
    description: "Approves an author, reviewer or editor application.",
    subject: "Your {{role_name}} application has been approved",
    body_html: `<p>Dear {{recipient_name}},</p><p>We are pleased to inform you that your application to join AfriSci Nexus as a <strong>{{role_name}}</strong>{{#if journal_name}} for {{journal_name}}{{/if}} has been <strong>approved</strong>.</p><p>Your account now has access to the relevant tools. Please sign in and complete your profile, including your areas of expertise and ORCID iD.</p>[button: Sign in to AfriSci Nexus | {{portal_url}}/Profile]<p>Welcome to the AfriSci Nexus community.</p>`,
  },
  {
    key: "application_declined",
    name: "Application declined",
    category: "editorial",
    header_label: "Application update",
    description: "Declines a role application courteously.",
    subject: "Update on your {{role_name}} application",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for your interest in joining AfriSci Nexus as a <strong>{{role_name}}</strong>. After careful review, we are unable to approve your application at this time.</p>{{#if rejection_reason}}<p>{{rejection_reason}}</p>{{/if}}<p>We encourage you to stay connected with our journals, and you are welcome to apply again in the future.</p>`,
  },
  {
    key: "partnership_reply",
    name: "Institutional partnership reply",
    category: "editorial",
    header_label: "Institutional partnership",
    description: "Response to an institutional partnership enquiry.",
    subject: "AfriSci Nexus institutional partnership – {{institution_name}}",
    body_html: `<p>Dear {{recipient_name}},</p><p>Thank you for {{institution_name}}'s interest in an institutional partnership with AfriSci Nexus.</p><p>Our partnership programme allows 10–50 affiliated authors to publish under a single annual agreement, with streamlined invoicing and dedicated editorial support.</p>{{#if custom_message}}<p>{{custom_message}}</p>{{/if}}[button: View partnership options | {{portal_url}}/InstitutionalPartnership]<p>We would be happy to arrange a short call to discuss your institution's needs.</p>`,
  },
];

export const TEMPLATE_CATEGORIES = [
  { value: "author", label: "Authors" },
  { value: "reviewer", label: "Reviewers" },
  { value: "editorial", label: "Editorial & applications" },
  { value: "general", label: "General" },
];
