import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  BookOpen, 
  Video, 
  HelpCircle,
  ExternalLink,
  CheckCircle,
  Lightbulb,
  Zap,
  Award
} from 'lucide-react';

const ResourceCard = ({ icon: Icon, title, description, badge, link, linkText }) => (
  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {badge && <Badge className="text-xs">{badge}</Badge>}
          </div>
          <p className="text-slate-600 text-sm mb-4">{description}</p>
          {link && (
            <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(link, '_blank')}>
              <ExternalLink className="w-3 h-3 mr-2" />
              {linkText || 'Learn More'}
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const TipCard = ({ title, children }) => (
  <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
    <Lightbulb className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
    <div>
      <h4 className="font-semibold text-slate-900 mb-2">{title}</h4>
      <p className="text-sm text-slate-700">{children}</p>
    </div>
  </div>
);

export default function AuthorResourcesPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-24 px-4 bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-600 text-white">
        <BookOpen className="w-16 h-16 mx-auto mb-6 text-teal-100" />
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Author Resources</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-teal-50">
          Everything you need to successfully publish your research with AfriSci Nexus.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {/* Writing & Preparation Tools */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Writing & Preparation Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <ResourceCard
              icon={FileText}
              title="Manuscript Templates"
              description="Download Word and LaTeX templates pre-formatted for AfriSci Nexus journals."
              badge="Popular"
              link="#"
              linkText="Download Templates"
            />
            <ResourceCard
              icon={CheckCircle}
              title="Submission Checklist"
              description="Ensure your manuscript is complete before submission with our comprehensive checklist."
              link="#"
              linkText="View Checklist"
            />
            <ResourceCard
              icon={BookOpen}
              title="Style Guides"
              description="Detailed guides on citation styles, formatting, and journal-specific requirements."
              link="#"
              linkText="Access Guides"
            />
            <ResourceCard
              icon={Zap}
              title="Graphical Abstract Tool"
              description="Create compelling visual summaries of your research with our free online tool."
              badge="New"
              link="#"
              linkText="Create Now"
            />
            <ResourceCard
              icon={Award}
              title="Title & Abstract Guide"
              description="Learn how to craft effective titles and abstracts that maximize discoverability."
              link="#"
              linkText="Read Guide"
            />
            <ResourceCard
              icon={Video}
              title="Video Abstract Guidelines"
              description="Enhance your article with a video abstract. See our best practices and examples."
              link="#"
              linkText="Watch Tutorial"
            />
          </div>
        </div>

        {/* Writing Tips */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Writing Tips for Success</h2>
          <div className="space-y-4">
            <TipCard title="Start with a Strong Introduction">
              Clearly state your research question, explain its significance, and outline your approach. Make readers understand why your work matters.
            </TipCard>
            <TipCard title="Be Clear and Concise">
              Use simple, direct language. Avoid jargon where possible. Each sentence should add value to your narrative.
            </TipCard>
            <TipCard title="Use Active Voice">
              Active voice makes your writing more engaging and easier to understand. "We analyzed the data" is clearer than "The data was analyzed."
            </TipCard>
            <TipCard title="Tell a Story">
              Structure your paper as a narrative. Guide readers through your research journey from problem to solution.
            </TipCard>
            <TipCard title="Visual Elements Matter">
              Use high-quality figures and tables. They should be self-explanatory and add information, not just repeat text.
            </TipCard>
          </div>
        </div>

        {/* Research Tools & Software */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Research Tools & Software</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-teal-600" />
                  Reference Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Zotero</p>
                    <p className="text-sm text-slate-600">Free, open-source reference manager</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Mendeley</p>
                    <p className="text-sm text-slate-600">Reference manager with PDF annotation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">EndNote</p>
                    <p className="text-sm text-slate-600">Professional reference management software</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-teal-600" />
                  Writing & Editing Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Grammarly</p>
                    <p className="text-sm text-slate-600">Grammar and style checker</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Overleaf</p>
                    <p className="text-sm text-slate-600">Online LaTeX editor for collaboration</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Hemingway Editor</p>
                    <p className="text-sm text-slate-600">Makes your writing bold and clear</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Webinars & Training */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Webinars & Training</h2>
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <Video className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Upcoming Webinars</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="font-semibold text-slate-900">Writing an Effective Abstract</p>
                      <p className="text-sm text-slate-600">March 15, 2025 • 2:00 PM EAT</p>
                      <Button size="sm" className="mt-2" variant="outline">Register</Button>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <p className="font-semibold text-slate-900">Navigating Peer Review</p>
                      <p className="text-sm text-slate-600">March 22, 2025 • 2:00 PM EAT</p>
                      <Button size="sm" className="mt-2" variant="outline">Register</Button>
                    </div>
                  </div>
                </div>
                <div>
                  <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Recorded Sessions</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="font-semibold text-slate-900">Open Access Publishing 101</p>
                      <p className="text-sm text-slate-600">45 minutes • Beginner</p>
                      <Button size="sm" className="mt-2" variant="outline">Watch Now</Button>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <p className="font-semibold text-slate-900">Data Visualization Best Practices</p>
                      <p className="text-sm text-slate-600">60 minutes • Intermediate</p>
                      <Button size="sm" className="mt-2" variant="outline">Watch Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  How long does the peer review process take?
                </h3>
                <p className="text-slate-600 pl-7">
                  On average, the peer review process takes 4-6 weeks from submission to initial decision. However, this can vary depending on reviewer availability and the complexity of the manuscript.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  Can I suggest reviewers for my manuscript?
                </h3>
                <p className="text-slate-600 pl-7">
                  Yes, we encourage authors to suggest potential reviewers. However, final reviewer selection is at the editor's discretion. You can also indicate researchers you'd prefer not to review your work.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  What happens if I need to make corrections after publication?
                </h3>
                <p className="text-slate-600 pl-7">
                  Minor corrections can be made through an erratum. For more significant issues, we may publish a corrigendum. In rare cases of serious errors, articles may be retracted following COPE guidelines.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  How do I get a fee waiver?
                </h3>
                <p className="text-slate-600 pl-7">
                  Fee waivers are available for authors from low-income countries and those without institutional funding. Simply indicate your need during submission, and provide a brief justification. We review all waiver requests fairly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div className="max-w-4xl mx-auto text-center bg-white p-12 rounded-2xl shadow-xl border border-slate-200/60">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Need More Help?</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Our editorial team is here to support you throughout the publication process. Don't hesitate to reach out with questions.
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white">
              Contact Editorial Team
            </Button>
            <Button variant="outline">
              Browse Help Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}