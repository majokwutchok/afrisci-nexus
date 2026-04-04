import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latex_source, manuscript_title } = await req.json();

    if (!latex_source || latex_source.trim().length === 0) {
      return Response.json({ error: 'No LaTeX source provided' }, { status: 400 });
    }

    // Build a minimal valid LaTeX document if only body content provided
    const isFullDocument = latex_source.includes('\\documentclass');
    const fullSource = isFullDocument ? latex_source : `\\documentclass[12pt,a4paper]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb,amsthm}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{natbib}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\title{${(manuscript_title || 'Manuscript Preview').replace(/[{}\\]/g, '')}}
\\date{\\today}
\\begin{document}
\\maketitle
${latex_source}
\\end{document}`;

    // Use LaTeX.Online free compilation API
    const formData = new FormData();
    const blob = new Blob([fullSource], { type: 'text/plain' });
    formData.append('filecontents[]', blob, 'manuscript.tex');
    formData.append('filename[]', 'manuscript.tex');

    const compileResponse = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      body: formData,
    });

    if (!compileResponse.ok) {
      const errText = await compileResponse.text();
      return Response.json({
        error: 'LaTeX compilation failed',
        details: errText.slice(0, 1000),
      }, { status: 422 });
    }

    const contentType = compileResponse.headers.get('content-type') || '';
    if (!contentType.includes('pdf')) {
      // Likely returned an error log as HTML/text
      const logText = await compileResponse.text();
      return Response.json({
        error: 'Compilation error — check your LaTeX source',
        log: logText.slice(0, 2000),
      }, { status: 422 });
    }

    // Stream the PDF back to the client
    const pdfBuffer = await compileResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return Response.json({
      success: true,
      pdf_base64: base64Pdf,
      filename: `${(manuscript_title || 'manuscript').replace(/\s+/g, '_')}_proof.pdf`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});