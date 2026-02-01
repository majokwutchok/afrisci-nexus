import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Users,
  Book,
  Clock,
  Shield,
  Award
} from 'lucide-react';

const StepCard = ({ number, title, icon: Icon, children }) => (
  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Icon className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          </div>
          <div className="text-slate-600 leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function GuidelinesPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-24 px-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 text-white">
        <FileText className="w-16 h-16 mx-auto mb-6 text-emerald-100" />
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Submission Guidelines</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-emerald-50">
          Your complete guide to submitting manuscripts to AfriSci Nexus journals.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-16">
        {/* Quick Overview */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 bg-white shadow-2xl">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Before You Submit</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Original Research</h4>
                    <p className="text-sm text-slate-600">Your work must be original and not under consideration elsewhere</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Ethical Approval</h4>
                    <p className="text-sm text-slate-600">Obtain necessary ethical approvals for research involving humans or animals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">All Authors Agree</h4>
                    <p className="text-sm text-slate-600">Ensure all co-authors have reviewed and approved the submission</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Proper Formatting</h4>
                    <p className="text-sm text-slate-600">Follow journal-specific formatting guidelines</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Process Steps */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Submission Process</h2>
          <div className="space-y-6">
            <StepCard number="1" title="Prepare Your Manuscript" icon={FileText}>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Format your manuscript according to journal requirements (typically Word or LaTeX)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Include title page with all author information and affiliations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Write a comprehensive abstract (150-250 words)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Provide 4-6 relevant keywords</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Include figures, tables, and supplementary materials</span>
                </li>
              </ul>
            </StepCard>

            <StepCard number="2" title="Choose Your Journal" icon={Book}>
              <p>Use our AI-powered journal matching tool to find the best fit for your research:</p>
              <ul className="space-y-2 text-sm mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Enter your title and abstract</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Our AI analyzes your work and suggests the most appropriate journals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Review journal scope, impact factor, and publication fees</span>
                </li>
              </ul>
            </StepCard>

            <StepCard number="3" title="Submit Online" icon={Upload}>
              <p>Our user-friendly submission system guides you through each step:</p>
              <ul className="space-y-2 text-sm mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Upload your manuscript file (PDF, Word, or LaTeX)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Enter all author details and ORCIDs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Upload supplementary files if applicable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Suggest potential reviewers (optional but recommended)</span>
                </li>
              </ul>
            </StepCard>

            <StepCard number="4" title="Peer Review" icon={Users}>
              <p>Your manuscript undergoes rigorous peer review:</p>
              <ul className="space-y-2 text-sm mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Initial screening by editorial team (2-3 days)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Assignment to expert reviewers (typically 2-3 reviewers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Review period: 14-21 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Editorial decision based on reviewer feedback</span>
                </li>
              </ul>
            </StepCard>

            <StepCard number="5" title="Revision & Resubmission" icon={Clock}>
              <p>If revisions are requested:</p>
              <ul className="space-y-2 text-sm mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Carefully address all reviewer comments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Prepare a point-by-point response letter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Upload revised manuscript with changes highlighted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Submit within the specified timeframe (typically 30-60 days)</span>
                </li>
              </ul>
            </StepCard>

            <StepCard number="6" title="Publication" icon={Award}>
              <p>Once accepted:</p>
              <ul className="space-y-2 text-sm mt-2">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Your article is copyedited and formatted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>You receive proofs for final review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>DOI assigned and article published online</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Immediate open access availability worldwide</span>
                </li>
              </ul>
            </StepCard>
          </div>
        </div>

        {/* Manuscript Format Requirements */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Manuscript Format Requirements</h2>
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-8">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border-b border-slate-200">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Title Page
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 text-slate-600 space-y-2">
                    <p>The title page should include:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li>Full title of the manuscript (concise but informative)</li>
                      <li>Short running title (maximum 50 characters)</li>
                      <li>All authors' full names and affiliations</li>
                      <li>ORCID iDs for all authors</li>
                      <li>Corresponding author's contact information</li>
                      <li>Funding sources and grant numbers</li>
                      <li>Conflict of interest statement</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-b border-slate-200">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Abstract & Keywords
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 text-slate-600 space-y-2">
                    <p><strong>Abstract:</strong> 150-250 words, structured or unstructured depending on journal</p>
                    <p>Should typically include:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li>Background/Introduction</li>
                      <li>Methods</li>
                      <li>Results</li>
                      <li>Conclusions</li>
                    </ul>
                    <p className="mt-3"><strong>Keywords:</strong> 4-6 relevant keywords not in the title</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-b border-slate-200">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Main Text Structure
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 text-slate-600 space-y-2">
                    <p>Typical structure for research articles:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li><strong>Introduction:</strong> Background, rationale, and objectives</li>
                      <li><strong>Materials and Methods:</strong> Detailed methodology</li>
                      <li><strong>Results:</strong> Findings with figures and tables</li>
                      <li><strong>Discussion:</strong> Interpretation and implications</li>
                      <li><strong>Conclusion:</strong> Summary and future directions</li>
                      <li><strong>Acknowledgments:</strong> Funding and contributions</li>
                      <li><strong>References:</strong> Formatted per journal style</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-b border-slate-200">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    Figures & Tables
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 text-slate-600 space-y-2">
                    <p><strong>Figures:</strong></p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li>High resolution (minimum 300 dpi)</li>
                      <li>Accepted formats: TIFF, EPS, PDF, or high-quality JPEG</li>
                      <li>Include descriptive captions</li>
                      <li>Number consecutively (Figure 1, Figure 2, etc.)</li>
                    </ul>
                    <p className="mt-3"><strong>Tables:</strong></p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li>Submit as editable text, not as images</li>
                      <li>Include clear titles and footnotes</li>
                      <li>Number consecutively (Table 1, Table 2, etc.)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-b border-slate-200">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    References
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 text-slate-600 space-y-2">
                    <p>We accept multiple citation styles (APA, Vancouver, Harvard, Chicago). Choose the style most common in your field.</p>
                    <p className="mt-2"><strong>General requirements:</strong></p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      <li>Cite only published or accepted manuscripts</li>
                      <li>Include DOIs when available</li>
                      <li>Ensure all citations in text appear in reference list</li>
                      <li>Use reference management software (Zotero, Mendeley, EndNote)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Important Policies */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Important Policies</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                  <h3 className="text-xl font-bold text-slate-900">Plagiarism</h3>
                </div>
                <p className="text-slate-700 text-sm mb-3">
                  All submissions are screened for plagiarism using advanced detection software.
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Self-plagiarism is also unacceptable</li>
                  <li>• Properly cite all sources</li>
                  <li>• Paraphrase correctly</li>
                  <li>• Use quotation marks for direct quotes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">Research Ethics</h3>
                </div>
                <p className="text-slate-700 text-sm mb-3">
                  Ethical approval is required for research involving:
                </p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Human participants</li>
                  <li>• Human tissue or data</li>
                  <li>• Animals</li>
                  <li>• Include ethics approval numbers</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-teal-600 to-emerald-600 p-12 rounded-2xl shadow-2xl text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Submit?</h2>
          <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of researchers who have chosen AfriSci Nexus to share their groundbreaking work with the world.
          </p>
          <Link to={createPageUrl("Submit")}>
            <Button size="lg" className="bg-white text-teal-700 hover:bg-slate-100 font-semibold px-8 py-4 text-lg">
              Start Your Submission
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}