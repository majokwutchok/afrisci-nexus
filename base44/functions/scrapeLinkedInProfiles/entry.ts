import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { country, institution_type, batch_size = 30, mode = 'link' } = await req.json();

  // Load prospects that don't have linkedin yet
  const filter = { country };
  if (institution_type) filter.institution_type = institution_type;
  const allProspects = await base44.asServiceRole.entities.ProspectEmail.filter(filter);

  let targets;
  if (mode === 'discover') {
    // Discover brand-new profiles not in DB yet
    targets = [];
  } else {
    // Link mode: enrich existing prospects that have no LinkedIn
    targets = allProspects
      .filter(p => !p.linkedin_url && p.contact_name)
      .slice(0, batch_size);
  }

  if (mode === 'link' && targets.length === 0) {
    return Response.json({ message: 'All existing prospects already have LinkedIn profiles linked, or no named contacts found.', linked: 0 });
  }

  let prompt;

  if (mode === 'discover') {
    // Discover new academics on LinkedIn in this country
    const existingEmails = new Set(allProspects.map(p => p.email.toLowerCase()));
    const institutionDesc = institution_type
      ? institution_type.replace('_', ' ')
      : 'universities, hospitals, research institutes, NGOs, and government agencies';

    prompt = `You are an expert academic research assistant. Search LinkedIn and the web to find ${batch_size} ACTIVE academic and professional profiles from ${country} working at ${institutionDesc}.

For each person find:
1. Their name
2. Their institution/employer
3. Their LinkedIn profile URL (must be a real linkedin.com/in/ URL)
4. Their headline/job title
5. Their professional email address (search their institution website, Google Scholar, ResearchGate, or professional bios — NOT personal gmail/yahoo)
6. Google Scholar URL if available
7. ResearchGate URL if available
8. Their department

Requirements:
- Only include profiles where you can find a REAL institutional email address
- LinkedIn URL must be a real linkedin.com/in/[username] URL
- Focus on: professors, researchers, department heads, deans, directors, doctors, scientists
- No duplicates
- All from ${country}

Return JSON:
{
  "profiles": [
    {
      "contact_name": "string",
      "institution": "string",
      "department": "string or null",
      "email": "string",
      "linkedin_url": "string",
      "linkedin_headline": "string or null",
      "google_scholar_url": "string or null",
      "researchgate_url": "string or null",
      "source_url": "string or null"
    }
  ]
}`;
  } else {
    // Link mode: find LinkedIn for existing named contacts
    const targetList = targets.map(p =>
      `- ${p.contact_name} at ${p.institution || p.country}${p.department ? ` (${p.department})` : ''} [email: ${p.email}]`
    ).join('\n');

    prompt = `You are an expert academic research assistant. For each person below, find their LinkedIn profile URL by searching LinkedIn and the web.

People to find (all based in ${country}):
${targetList}

For each person, search LinkedIn, ResearchGate, Google Scholar, and institutional websites to find:
1. Their LinkedIn profile URL (must be a real linkedin.com/in/[username] URL)
2. Their LinkedIn headline/job title
3. Their Google Scholar URL if available
4. Their ResearchGate URL if available

Rules:
- Only include a linkedin_url if you are CONFIDENT it matches the right person (same name + institution)
- If you cannot find a verified LinkedIn for someone, set linkedin_url to null
- linkedin_url MUST be in format: https://www.linkedin.com/in/[username]

Return JSON:
{
  "profiles": [
    {
      "email": "string (the person's email from the input list)",
      "linkedin_url": "string or null",
      "linkedin_headline": "string or null",
      "google_scholar_url": "string or null",
      "researchgate_url": "string or null"
    }
  ]
}`;
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_1_pro',
    response_json_schema: {
      type: 'object',
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              contact_name: { type: 'string' },
              institution: { type: 'string' },
              department: { type: 'string' },
              linkedin_url: { type: 'string' },
              linkedin_headline: { type: 'string' },
              google_scholar_url: { type: 'string' },
              researchgate_url: { type: 'string' },
              source_url: { type: 'string' }
            }
          }
        }
      }
    }
  });

  const profiles = result?.profiles || [];
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+\/?$/;
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  let linked = 0;
  let created = 0;
  const details = [];

  if (mode === 'link') {
    // Update existing ProspectEmail records
    for (const profile of profiles) {
      if (!profile.email) continue;
      const prospect = targets.find(p => p.email.toLowerCase() === profile.email.toLowerCase());
      if (!prospect) continue;

      const updates = {};
      if (profile.linkedin_url && linkedinRegex.test(profile.linkedin_url)) {
        updates.linkedin_url = profile.linkedin_url;
        updates.linkedin_verified_at = new Date().toISOString();
      }
      if (profile.linkedin_headline) updates.linkedin_headline = profile.linkedin_headline;
      if (profile.google_scholar_url) updates.google_scholar_url = profile.google_scholar_url;
      if (profile.researchgate_url) updates.researchgate_url = profile.researchgate_url;

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.ProspectEmail.update(prospect.id, updates);
        linked++;
        details.push({ name: prospect.contact_name, email: prospect.email, linkedin_url: updates.linkedin_url || null });
      }
    }
  } else {
    // Discover mode: create new ProspectEmail records
    const existingEmails = new Set(allProspects.map(p => p.email.toLowerCase()));
    for (const profile of profiles) {
      if (!profile.email || !emailRegex.test(profile.email)) continue;
      if (existingEmails.has(profile.email.toLowerCase())) continue;
      if (!profile.linkedin_url || !linkedinRegex.test(profile.linkedin_url)) continue;

      await base44.asServiceRole.entities.ProspectEmail.create({
        email: profile.email,
        contact_name: profile.contact_name || null,
        institution: profile.institution || null,
        department: profile.department || null,
        institution_type: institution_type || 'other',
        country,
        linkedin_url: profile.linkedin_url,
        linkedin_headline: profile.linkedin_headline || null,
        google_scholar_url: profile.google_scholar_url || null,
        researchgate_url: profile.researchgate_url || null,
        source_url: profile.source_url || profile.linkedin_url,
        linkedin_verified_at: new Date().toISOString(),
        campaign_status: 'new'
      });
      existingEmails.add(profile.email.toLowerCase());
      created++;
      details.push({ name: profile.contact_name, email: profile.email, linkedin_url: profile.linkedin_url });
    }
  }

  return Response.json({ success: true, mode, linked, created, profiles_found: profiles.length, details });
});