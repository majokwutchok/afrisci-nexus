
import React from 'react';
import { CheckCircle, Download, Share2, Globe, DollarSign, Users, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const BenefitCard = ({ icon: Icon, title, description, color }) => (
  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
    <CardContent className="p-6">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

export default function OpenAccessPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-24 px-4 bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 text-white">
        <Globe className="w-16 h-16 mx-auto mb-6 text-emerald-100" />
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Open Access Policy</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-emerald-50">
          Making African research freely accessible to everyone, everywhere.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {/* Main Policy Statement */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 bg-white shadow-2xl">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Commitment to Open Access</h2>
              <div className="space-y-4 text-lg text-slate-700 leading-relaxed">
                <p>
                  AfriSci Nexus is committed to the principle that research should be freely available to everyone. We believe that open access accelerates discovery, promotes collaboration, and maximizes the impact of African scientific research globally.
                </p>
                <p>
                  All articles published in AfriSci Nexus journals are immediately and permanently free for everyone to read, download, copy, distribute, print, search, link to, and build upon, subject to proper attribution to the original authors and source.
                </p>
                <p className="font-semibold text-emerald-700">
                  We operate under the Creative Commons Attribution License (CC BY 4.0), ensuring maximum dissemination and impact of your research while protecting your rights as an author.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits of Open Access */}
        <div>
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Benefits of Open Access</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BenefitCard
              icon={Globe}
              title="Global Reach"
              description="Your research reaches readers worldwide without barriers, increasing visibility and impact."
              color="from-blue-500 to-blue-600"
            />
            <BenefitCard
              icon={Users}
              title="Increased Citations"
              description="Open access articles are cited up to 3x more than subscription-based articles."
              color="from-emerald-500 to-teal-600"
            />
            <BenefitCard
              icon={Zap}
              title="Rapid Dissemination"
              description="Immediate publication upon acceptance means your work is available to the community right away."
              color="from-purple-500 to-indigo-600"
            />
            <BenefitCard
              icon={Share2} {/* Fix applied here: changed from "Share2} to {Share2} */}
              title="Enhanced Collaboration"
              description="Free access promotes interdisciplinary collaboration and knowledge exchange."
              color="from-amber-500 to-orange-600"
            />
          </div>
        </div>

        {/* Licensing Information */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Licensing & Copyright</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg">
              <CardContent className="p-8">
                <Shield className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Authors Retain Copyright</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  You, the author, retain copyright to your work. We don't take ownership of your research.
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>You can reuse your own work freely</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Share on personal or institutional websites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Include in future works and compilations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-sky-50 shadow-lg">
              <CardContent className="p-8">
                <Download className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">CC BY 4.0 License</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Articles are published under Creative Commons Attribution 4.0 International License.
                </p>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Others can share and adapt your work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Commercial use is permitted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Attribution to original author required</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Publication Fees */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 bg-white shadow-2xl">
            <CardContent className="p-12">
              <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Article Processing Charges</h2>
                  <p className="text-lg text-slate-600">
                    To sustain our open access model, we charge modest article processing charges (APCs) for accepted manuscripts.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border-l-4 border-emerald-500 mb-8">
                <h3 className="font-bold text-lg text-slate-900 mb-3">Fee Waivers Available</h3>
                <p className="text-slate-700 mb-4">
                  We understand that not all researchers have access to funding. We offer fee waivers and discounts for:
                </p>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Authors from low-income countries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Student researchers and early-career scientists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Researchers without institutional funding</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-slate-600">
                  Financial constraints should never be a barrier to publishing quality research.
                </p>
              </div>

              <div className="text-center">
                <Link to={createPageUrl("Submit")}>
                  <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    Submit Your Research
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance & Standards */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Standards & Compliance</h2>
          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-8">
              <p className="text-slate-700 leading-relaxed mb-6">
                AfriSci Nexus adheres to international standards for open access publishing:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">DOAJ Indexed</h4>
                      <p className="text-sm text-slate-600">Listed in Directory of Open Access Journals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">COPE Member</h4>
                      <p className="text-sm text-slate-600">Committee on Publication Ethics guidelines</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">DOI Registration</h4>
                      <p className="text-sm text-slate-600">All articles receive persistent identifiers</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Long-term Archiving</h4>
                      <p className="text-sm text-slate-600">Preservation in multiple digital archives</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Machine-Readable Metadata</h4>
                      <p className="text-sm text-slate-600">Enhanced discoverability through indexing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Open Citations</h4>
                      <p className="text-sm text-slate-600">All references freely accessible</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
