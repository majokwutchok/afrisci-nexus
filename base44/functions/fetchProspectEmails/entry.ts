import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const AFRICAN_COUNTRIES = [
  "Nigeria","Kenya","South Africa","Ghana","Ethiopia","Tanzania","Uganda","Rwanda","Senegal",
  "Cameroon","Ivory Coast","Zambia","Zimbabwe","Mozambique","Angola","Sudan","Egypt","Morocco",
  "Algeria","Tunisia","Libya","Botswana","Namibia","Malawi","Lesotho","Eswatini","Sierra Leone",
  "Liberia","Guinea","Mali","Burkina Faso","Niger","Chad","Central African Republic","Congo",
  "DR Congo","Gabon","Equatorial Guinea","Djibouti","Somalia","Eritrea","South Sudan",
  "Burundi","Comoros","Mauritius","Madagascar","Cape Verde","Sao Tome and Principe",
  "Seychelles","Gambia","Benin","Togo"
];

const CATEGORY_LABELS = {
  university: "universities and colleges — faculty emails, department heads, research offices",
  hospital: "hospitals and medical schools — research departments, clinical staff, directors",
  school: "secondary schools and international schools — principals, heads of science departments",
  research_institute: "research institutes and think tanks — researchers, directors, coordinators",
  ngo: "NGOs and development organizations — program managers, directors, education officers",
  government: "government ministries of education, science and health — officials and directors",
  professional_association: "professional associations for academics, scientists and doctors — secretariat emails"
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { country, institution_type, page = 1 } = await req.json();

  if (!country || !AFRICAN_COUNTRIES.includes(country)) {
    return Response.json({ error: 'Invalid African country' }, { status: 400 });
  }

  const categoryDesc = CATEGORY_LABELS[institution_type] || "academic and research institutions";
  const offset = (page - 1) * 50;

  const prompt = `You are a research assistant helping find professional contact emails for academic outreach in Africa.

Search the web and find REAL, VERIFIED email addresses from ${categoryDesc} in ${country}.

Requirements:
- Find exactly 50 unique, valid email addresses (skip results ${offset + 1}-${offset + 50} to paginate)
- Each email must be a real institutional/professional email (not gmail/yahoo/hotmail personal emails unless they are official contact emails)
- Include the person's name, institution name, department if available, and the source URL
- Validate email format strictly (must contain @ and proper domain)
- No duplicates
- Focus on: contact pages, faculty directories, staff listings, Google Scholar profiles, ResearchGate, LinkedIn, official websites, social media institutional pages

Return a JSON object with this exact structure:
{
  "emails": [
    {
      "email": "string",
      "contact_name": "string or null",
      "institution": "string",
      "department": "string or null",
      "source_url": "string or null"
    }
  ],
  "total_found": number,
  "country": "${country}",
  "institution_type": "${institution_type}"
}

Return only the 50 best verified emails. If you cannot find 50, return as many as you can find.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: "gemini_3_1_pro",
    response_json_schema: {
      type: "object",
      properties: {
        emails: {
          type: "array",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
              contact_name: { type: "string" },
              institution: { type: "string" },
              department: { type: "string" },
              source_url: { type: "string" }
            }
          }
        },
        total_found: { type: "number" },
        country: { type: "string" },
        institution_type: { type: "string" }
      }
    }
  });

  // Validate emails strictly
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  const seen = new Set();
  const validEmails = (result.emails || []).filter(entry => {
    if (!entry.email || !emailRegex.test(entry.email)) return false;
    if (seen.has(entry.email.toLowerCase())) return false;
    seen.add(entry.email.toLowerCase());
    return true;
  });

  // Deduplicate against already stored emails for this country
  const existing = await base44.asServiceRole.entities.ProspectEmail.filter({ country });
  const existingSet = new Set(existing.map(e => e.email.toLowerCase()));
  const newEmails = validEmails.filter(e => !existingSet.has(e.email.toLowerCase()));

  // Save new emails to DB
  if (newEmails.length > 0) {
    await base44.asServiceRole.entities.ProspectEmail.bulkCreate(
      newEmails.map(e => ({
        email: e.email,
        contact_name: e.contact_name || null,
        institution: e.institution || null,
        department: e.department || null,
        institution_type,
        country,
        source_url: e.source_url || null,
        campaign_status: "new"
      }))
    );
  }

  return Response.json({
    emails: newEmails,
    saved_count: newEmails.length,
    duplicates_skipped: validEmails.length - newEmails.length,
    invalid_skipped: (result.emails?.length || 0) - validEmails.length,
    country,
    institution_type
  });
});