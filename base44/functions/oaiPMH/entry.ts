import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BATCH_SIZE = 100;
const BASE_URL = 'https://afrisci-nexus.com/oai';
const REPOSITORY_NAME = 'AfriSci Nexus';
const ADMIN_EMAIL = 'admin@afriscinexus.com';

const dublinCoreNamespace = 'http://purl.org/dc/elements/1.1/';
const oaiNamespace = 'http://www.openarchives.org/OAI/2.0/';

function generateTimestamp() {
  return new Date().toISOString();
}

function generateOAIIdentifier(manuscriptId) {
  return `oai:afrisci-nexus.com:manuscript-${manuscriptId}`;
}

function buildDublinCoreXML(manuscript) {
  const dc = (tag, value) => `<dc:${tag}>${escapeXML(value)}</dc:${tag}>`;
  
  let xml = '<metadata><oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">';
  
  // Required Dublin Core elements
  xml += dc('title', manuscript.title);
  
  // Creators (authors)
  if (manuscript.authors && Array.isArray(manuscript.authors)) {
    manuscript.authors.forEach(author => {
      xml += dc('creator', author.name);
    });
  }
  
  // Subject (keywords)
  if (manuscript.keywords && Array.isArray(manuscript.keywords)) {
    manuscript.keywords.forEach(keyword => {
      xml += dc('subject', keyword);
    });
  }
  
  // Description (abstract)
  xml += dc('description', manuscript.abstract);
  
  // Publisher
  xml += dc('publisher', 'AfriSci Nexus');
  
  // Date of publication
  if (manuscript.publication_date) {
    xml += dc('issued', manuscript.publication_date);
  } else if (manuscript.online_first_date) {
    xml += dc('issued', manuscript.online_first_date);
  } else if (manuscript.created_date) {
    xml += dc('issued', manuscript.created_date.split('T')[0]);
  }
  
  // Language
  xml += dc('language', manuscript.language || 'en');
  
  // Type
  xml += dc('type', 'Journal Article');
  
  // Format
  xml += dc('format', 'application/pdf');
  
  // Identifier (DOI if available)
  if (manuscript.doi) {
    xml += dc('identifier', `doi:${manuscript.doi}`);
  }
  xml += dc('identifier', `oai:afrisci-nexus.com:manuscript-${manuscript.id}`);
  
  // Source (journal)
  xml += dc('source', manuscript.journal_title || 'AfriSci Nexus');
  
  // Rights
  xml += dc('rights', 'CC BY 4.0');
  
  // Access URL
  xml += dc('relation', `https://afrisci-nexus.com/manuscript/${manuscript.id}`);
  
  xml += '</oai_dc:dc></metadata>';
  return xml;
}

function escapeXML(str) {
  if (!str) return '';
  return str.replace(/[<>&'"]/g, char => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  }[char]));
}

function buildOAIRecord(manuscript, includeMetadata = true) {
  const oaiId = generateOAIIdentifier(manuscript.id);
  const datestamp = (manuscript.updated_date || manuscript.created_date).split('T')[0];
  
  let record = '<record>';
  record += `<header><identifier>${oaiId}</identifier><datestamp>${datestamp}</datestamp>`;
  
  // Sets: organize by journal and status
  record += `<setSpec>journal-${manuscript.journal_id}</setSpec>`;
  if (manuscript.status === 'published' || manuscript.status === 'online_first') {
    record += '<setSpec>published</setSpec>';
  }
  record += '</header>';
  
  if (includeMetadata) {
    record += buildDublinCoreXML(manuscript);
  }
  
  record += '</record>';
  return record;
}

function buildOAIResponse(verb, params, data) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += `<OAI-PMH xmlns="${oaiNamespace}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${oaiNamespace} ${oaiNamespace}OAI-PMH.xsd">`;
  xml += `<responseDate>${generateTimestamp()}</responseDate>`;
  xml += `<request verb="${verb}"`;
  Object.entries(params).forEach(([k, v]) => {
    if (k !== 'verb') xml += ` ${k}="${escapeXML(v)}"`;
  });
  xml += `>${BASE_URL}</request>`;
  xml += data;
  xml += '</OAI-PMH>';
  return xml;
}

function buildError(code, message) {
  return `<error code="${code}">${escapeXML(message)}</error>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const verb = params.verb;

  try {
    const base44 = createClientFromRequest(req);
    
    // GetRepositoryInfo
    if (verb === 'Identify') {
      const data = `<Identify>
        <repositoryName>${REPOSITORY_NAME}</repositoryName>
        <baseURL>${BASE_URL}</baseURL>
        <protocolVersion>2.0</protocolVersion>
        <adminEmail>${ADMIN_EMAIL}</adminEmail>
        <earliestDatestamp>2020-01-01</earliestDatestamp>
        <deletedRecord>persistent</deletedRecord>
        <granularity>YYYY-MM-DD</granularity>
      </Identify>`;
      return new Response(buildOAIResponse(verb, params, data), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }

    // ListMetadataFormats
    if (verb === 'ListMetadataFormats') {
      const data = `<ListMetadataFormats>
        <metadataFormat>
          <metadataPrefix>oai_dc</metadataPrefix>
          <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
          <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
        </metadataFormat>
      </ListMetadataFormats>`;
      return new Response(buildOAIResponse(verb, params, data), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }

    // GetRecord - single manuscript by ID
    if (verb === 'GetRecord') {
      if (!params.identifier || !params.metadataPrefix) {
        const error = buildError('badArgument', 'Missing required parameters: identifier, metadataPrefix');
        return new Response(buildOAIResponse(verb, params, error), {
          status: 400,
          headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
      }

      const manuscriptId = params.identifier.split('-').pop();
      const manuscript = await base44.asServiceRole.entities.Manuscript.get(manuscriptId);
      
      if (!manuscript || (manuscript.status !== 'published' && manuscript.status !== 'online_first')) {
        const error = buildError('idDoesNotExist', 'Manuscript not found or not published');
        return new Response(buildOAIResponse(verb, params, error), {
          status: 404,
          headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
      }

      const data = `<GetRecord>${buildOAIRecord(manuscript)}</GetRecord>`;
      return new Response(buildOAIResponse(verb, params, data), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }

    // ListRecords & ListIdentifiers
    if (verb === 'ListRecords' || verb === 'ListIdentifiers') {
      if (!params.metadataPrefix) {
        const error = buildError('badArgument', 'Missing required parameter: metadataPrefix');
        return new Response(buildOAIResponse(verb, params, error), {
          status: 400,
          headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
      }

      const from = params.from ? new Date(params.from) : null;
      const until = params.until ? new Date(params.until) : null;
      const set = params.set;

      // Fetch published manuscripts
      let manuscripts = await base44.asServiceRole.entities.Manuscript.filter({
        status: 'published'
      }, '-updated_date', 1000);

      // Filter by date range
      if (from || until) {
        manuscripts = manuscripts.filter(m => {
          const mDate = new Date(m.updated_date || m.created_date);
          if (from && mDate < from) return false;
          if (until && mDate > until) return false;
          return true;
        });
      }

      // Filter by set
      if (set) {
        if (set.startsWith('journal-')) {
          const journalId = set.replace('journal-', '');
          manuscripts = manuscripts.filter(m => m.journal_id === journalId);
        }
      }

      // Pagination with resumption token
      const resumptionToken = params.resumptionToken;
      let startIndex = 0;
      if (resumptionToken) {
        startIndex = parseInt(resumptionToken);
      }

      const pagedMss = manuscripts.slice(startIndex, startIndex + BATCH_SIZE);
      let data = `<${verb}>`;

      pagedMss.forEach(m => {
        if (verb === 'ListRecords') {
          data += buildOAIRecord(m, true);
        } else {
          const oaiId = generateOAIIdentifier(m.id);
          const datestamp = (m.updated_date || m.created_date).split('T')[0];
          data += `<header><identifier>${oaiId}</identifier><datestamp>${datestamp}</datestamp></header>`;
        }
      });

      // Add resumption token if more records exist
      if (startIndex + BATCH_SIZE < manuscripts.length) {
        const nextToken = startIndex + BATCH_SIZE;
        data += `<resumptionToken completeListSize="${manuscripts.length}" cursor="${startIndex}">${nextToken}</resumptionToken>`;
      } else {
        data += `<resumptionToken completeListSize="${manuscripts.length}" cursor="${startIndex}"/>`;
      }

      data += `</${verb}>`;
      return new Response(buildOAIResponse(verb, params, data), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      });
    }

    // Unknown verb
    const error = buildError('badVerb', `Verb not recognized: ${verb}`);
    return new Response(buildOAIResponse('', params, error), {
      status: 400,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });

  } catch (error) {
    console.error('OAI-PMH error:', error);
    const errorXml = `<OAI-PMH xmlns="${oaiNamespace}">
      <responseDate>${generateTimestamp()}</responseDate>
      <request>${BASE_URL}</request>
      <error code="generalError">${escapeXML(error.message)}</error>
    </OAI-PMH>`;
    return new Response(errorXml, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' }
    });
  }
});