import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Eye, CheckCircle, AlertCircle, FileText, Clock, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ReviewGuidelinesPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      <div className="text-center py-24 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Peer Review Guidelines</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-sky-200">
          Best practices and standards for conducting rigorous, fair, and constructive peer review.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        {/* Core Principles */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Core Principles of Peer Review</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Objectivity</h3>
                <p className="text-slate-600">
                  Evaluate the manuscript based on its scientific merit, not personal opinions or biases.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Confidentiality</h3>
                <p className="text-slate-600">
                  Treat all manuscripts as confidential documents. Do not share or discuss them with others.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Timeliness</h3>
                <p className="text-slate-600">
                  Complete your review within the agreed timeframe, typically 14-21 days.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Guidelines */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Review Process Guidelines</h2>
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/60">
              <AccordionTrigger className="text-xl font-bold text-slate-900 hover:no-underline">
                <div className="flex items-center gap-4">
                  <FileText className="w-7 h-7 text-teal-600" />
                  Initial Assessment
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 text-slate-600 text-base leading-relaxed space-y-3">
                <p>Begin by reading the manuscript thoroughly to understand its scope and objectives:</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li>Does the manuscript fall within the journal's scope?</li>
                  <li>Is the research question clearly defined and relevant?</li>
                  <li>Are the objectives and hypotheses clearly stated?</li>
                  <li>Is the study design appropriate for the research question?</li>
                </ul>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-900">Tip:</p>
                  <p className="text-blue-800">If the manuscript is outside your area of expertise or you have a conflict of interest, decline the invitation immediately.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/60">
              <AccordionTrigger className="text-xl font-bold text-slate-900 hover:no-underline">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-7 h-7 text-teal-600" />
                  Evaluating Methodology
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 text-slate-600 text-base leading-relaxed space-y-3">
                <p>Assess the rigor and appropriateness of the research methods:</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Study Design:</strong> Is it appropriate for addressing the research question?</li>
                  <li><strong>Sample Size:</strong> Is it adequate and well-justified?</li>
                  <li><strong>Data Collection:</strong> Are the methods clearly described and reproducible?</li>
                  <li><strong>Statistical Analysis:</strong> Are the methods appropriate and correctly applied?</li>
                  <li><strong>Ethical Considerations:</strong> Has ethical approval been obtained where necessary?</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/60">
              <AccordionTrigger className="text-xl font-bold text-slate-900 hover:no-underline">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-7 h-7 text-teal-600" />
                  Results and Discussion
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 text-slate-600 text-base leading-relaxed space-y-3">
                <p>Critically evaluate the presentation and interpretation of results:</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Clarity:</strong> Are results presented clearly with appropriate tables and figures?</li>
                  <li><strong>Interpretation:</strong> Are conclusions supported by the data?</li>
                  <li><strong>Limitations:</strong> Are study limitations acknowledged and discussed?</li>
                  <li><strong>Significance:</strong> Is the contribution to the field clearly articulated?</li>
                  <li><strong>References:</strong> Is prior work appropriately cited?</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/60">
              <AccordionTrigger className="text-xl font-bold text-slate-900 hover:no-underline">
                <div className="flex items-center gap-4">
                  <FileText className="w-7 h-7 text-teal-600" />
                  Writing Your Review
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 text-slate-600 text-base leading-relaxed space-y-3">
                <p>Provide constructive feedback that helps authors improve their work:</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Be Constructive:</strong> Frame criticism positively and suggest improvements.</li>
                  <li><strong>Be Specific:</strong> Provide concrete examples and line numbers where relevant.</li>
                  <li><strong>Be Balanced:</strong> Acknowledge strengths as well as weaknesses.</li>
                  <li><strong>Separate Major and Minor Issues:</strong> Distinguish between critical flaws and minor improvements.</li>
                </ul>
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="font-semibold text-green-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Good Example:
                    </p>
                    <p className="text-green-800 mt-1">"The methodology is sound, but the sample size (n=20) may be too small to detect significant effects. Consider conducting a power analysis or acknowledging this limitation."</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <p className="font-semibold text-red-900 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Avoid:
                    </p>
                    <p className="text-red-800 mt-1">"The sample size is too small. This study is worthless."</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Recommendation Options */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Making Your Recommendation</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <Badge className="bg-green-100 text-green-800 mb-3">Accept</Badge>
                <p className="text-slate-700">
                  The manuscript is scientifically sound, original, and suitable for publication with only minor editorial changes.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <Badge className="bg-blue-100 text-blue-800 mb-3">Minor Revision</Badge>
                <p className="text-slate-700">
                  The manuscript is acceptable but requires small improvements (e.g., clarification, additional analysis, minor restructuring).
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <Badge className="bg-orange-100 text-orange-800 mb-3">Major Revision</Badge>
                <p className="text-slate-700">
                  Significant concerns exist, but the work has potential. Substantial revisions are needed (e.g., additional experiments, major restructuring).
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <Badge className="bg-red-100 text-red-800 mb-3">Reject</Badge>
                <p className="text-slate-700">
                  The manuscript has fundamental flaws that cannot be addressed through revision, or it is not suitable for the journal.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conflicts of Interest */}
        <div className="max-w-4xl mx-auto bg-amber-50 p-8 rounded-2xl border-l-4 border-amber-500">
          <h3 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
            <AlertCircle className="w-7 h-7" />
            Conflicts of Interest
          </h3>
          <p className="text-amber-800 leading-relaxed mb-4">
            You must decline to review if you have any of the following conflicts:
          </p>
          <ul className="list-disc list-inside space-y-2 text-amber-800 pl-4">
            <li>You have collaborated with any of the authors in the past 3 years</li>
            <li>You are from the same institution as any author</li>
            <li>You have a personal or professional relationship with the authors</li>
            <li>You have a financial interest in the work or its outcome</li>
            <li>You have strong personal views that might bias your review</li>
          </ul>
        </div>
      </div>
    </div>
  );
}