import React from 'react';
import { Target, Eye, Globe, Zap, Users, BookOpen, Award, TrendingUp, Heart, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ValueCard = ({ icon: Icon, title, description, color }) => (
  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
    <CardContent className="p-8">
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const StatCard = ({ icon: Icon, number, label, color }) => (
  <div className="text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
    <Icon className={`w-10 h-10 ${color} mx-auto mb-3`} />
    <p className="text-4xl font-bold text-slate-900 mb-2">{number}</p>
    <p className="text-slate-600">{label}</p>
  </div>
);

const TimelineItem = ({ year, title, description, icon: Icon }) => (
  <div className="flex gap-6 items-start group cursor-pointer">
    <div className="flex-shrink-0">
      <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-8 h-8" />
      </div>
    </div>
    <div className="flex-1 pb-8">
      <Badge className="bg-teal-100 text-teal-800 mb-2">{year}</Badge>
      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #14B8A6 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #38BDF8 0%, transparent 50%)`
          }}></div>
        </div>
        <div className="relative text-center py-24 px-4">
          <Globe className="w-20 h-20 mx-auto mb-6 text-sky-200 animate-pulse" />
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg mb-4">About AfriSci Nexus</h1>
          <p className="mt-4 max-w-3xl mx-auto text-xl md:text-2xl text-sky-200">
            Championing African scientific innovation and disseminating high-impact research to the world
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl("Journals")}>
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white shadow-xl hover:shadow-2xl transition-all">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Our Journals
              </Button>
            </Link>
            <Link to={createPageUrl("Contact")}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 shadow-xl">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        {/* Key Statistics */}
        <div>
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Our Impact in Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard icon={BookOpen} number="50+" label="Active Journals" color="text-blue-600" />
            <StatCard icon={Users} number="10,000+" label="Published Articles" color="text-emerald-600" />
            <StatCard icon={Globe} number="54" label="African Countries" color="text-purple-600" />
            <StatCard icon={TrendingUp} number="2M+" label="Annual Downloads" color="text-amber-600" />
          </div>
        </div>

        {/* Mission and Vision */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-slate-900">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                To provide a premier, globally recognized platform for African researchers to publish their work, fostering collaboration, visibility, and innovation.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-slate-700">
                  <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                  <span>Uphold the highest standards of peer review and ethical publishing</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Globe className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                  <span>Ensure African science takes its rightful place on the world stage</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Heart className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
                  <span>Support researchers from all career stages and backgrounds</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-slate-900">Our Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                To be the central hub for scientific discovery in Africa, creating an ecosystem where research transcends borders and drives positive change.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-slate-700">
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <span>Become the leading publisher of African scientific research globally</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <span>Drive policy changes and fuel economic growth across the continent</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <span>Inspire the next generation of African scientists and innovators</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ValueCard
              icon={Globe}
              title="Global Excellence"
              description="We are committed to international standards of scientific inquiry and peer review, ensuring every published article contributes meaningfully to the global body of knowledge."
              color="from-blue-500 to-sky-600"
            />
            <ValueCard
              icon={Zap}
              title="Innovation & Accessibility"
              description="Leveraging technology to make science more accessible, we champion open access policies and innovative publishing models to remove barriers for authors and readers."
              color="from-purple-500 to-indigo-600"
            />
            <ValueCard
              icon={Users}
              title="Collaboration & Community"
              description="We believe in the power of connection. AfriSci Nexus is more than a publisher; it's a vibrant community for researchers, reviewers, and editors to connect and grow."
              color="from-emerald-500 to-teal-600"
            />
            <ValueCard
              icon={Shield}
              title="Integrity & Ethics"
              description="Our commitment to ethical practices is unwavering. We ensure transparency, rigor, and fairness in every step of the publication process."
              color="from-amber-500 to-orange-600"
            />
          </div>
        </div>

        {/* Our Journey */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Journey</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From vision to reality: Building Africa's premier scientific publishing platform
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8">
                <div className="space-y-8">
                  <TimelineItem
                    year="2024"
                    icon={Zap}
                    title="Platform Launch"
                    description="AfriSci Nexus officially launched with 50+ peer-reviewed journals spanning all major disciplines. Introduced AI-powered submission and review matching systems."
                  />
                  <TimelineItem
                    year="2024 Q2"
                    icon={Globe}
                    title="Continental Expansion"
                    description="Established partnerships with research institutions across all 54 African countries. Launched multi-language support for wider accessibility."
                  />
                  <TimelineItem
                    year="2024 Q3"
                    icon={Award}
                    title="International Recognition"
                    description="Achieved DOAJ indexing for all journals. Formed partnerships with major international research databases and indexing services."
                  />
                  <TimelineItem
                    year="2024 Q4"
                    icon={TrendingUp}
                    title="Growing Impact"
                    description="Surpassed 10,000 published articles milestone. Reached 2 million annual downloads across all journals, with readers from over 150 countries."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">What Makes Us Different</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Combining African expertise with global standards
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-8">
                <BookOpen className="w-12 h-12 text-teal-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">African-Led, Globally Connected</h3>
                <p className="text-slate-700">
                  Our editorial boards comprise leading African scholars with international experience, ensuring research is both locally relevant and globally significant.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-sky-50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-8">
                <Zap className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI-Powered Efficiency</h3>
                <p className="text-slate-700">
                  Our proprietary AI tools streamline submission, reviewer matching, and editorial workflows, reducing time to publication while maintaining quality.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-8">
                <Heart className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-3">Supporting Researchers</h3>
                <p className="text-slate-700">
                  Fee waivers, mentorship programs, and extensive author resources ensure that financial constraints never prevent quality research from being published.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-3xl p-12 shadow-2xl">
          <div className="text-center mb-12">
            <Users className="w-16 h-16 mx-auto mb-6 text-teal-300" />
            <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-sky-200 max-w-3xl mx-auto">
              Dedicated professionals working to advance African scientific research
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  ED
                </div>
                <h3 className="text-xl font-bold mb-2">Editorial Team</h3>
                <p className="text-sky-200 mb-4">
                  500+ expert editors and reviewers from leading institutions across Africa and beyond
                </p>
                <Link to={createPageUrl("Editorial")}>
                  <Button variant="outline" className="border-white text-white hover:bg-white/10">
                    Meet Our Editors →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  TS
                </div>
                <h3 className="text-xl font-bold mb-2">Technical & Support</h3>
                <p className="text-sky-200 mb-4">
                  Dedicated team ensuring smooth operations and providing world-class author support
                </p>
                <Link to={createPageUrl("Contact")}>
                  <Button variant="outline" className="border-white text-white hover:bg-white/10">
                    Contact Support →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white p-12 rounded-3xl shadow-2xl">
          <Award className="w-16 h-16 mx-auto mb-6 text-teal-600" />
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Join Our Mission</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Whether you're an author ready to share your latest discovery, a researcher looking for cutting-edge science, or an expert willing to contribute to peer review, you have a home at AfriSci Nexus.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl("Submit")}>
              <Button size="lg" className="bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white shadow-xl hover:shadow-2xl transition-all">
                <BookOpen className="w-5 h-5 mr-2" />
                Submit Your Work
              </Button>
            </Link>
            <Link to={createPageUrl("Journals")}>
              <Button size="lg" variant="outline" className="shadow-lg hover:shadow-xl transition-all">
                <Globe className="w-5 h-5 mr-2" />
                Browse Journals
              </Button>
            </Link>
            <Link to={createPageUrl("Profile")}>
              <Button size="lg" variant="outline" className="shadow-lg hover:shadow-xl transition-all">
                <Users className="w-5 h-5 mr-2" />
                Become a Reviewer
              </Button>
            </Link>
          </div>
        </div>

        {/* Partners & Recognition */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Recognition & Partnerships</h2>
            <p className="text-xl text-slate-600">
              Proudly affiliated with leading organizations worldwide
            </p>
          </div>
          <div className="bg-white p-12 rounded-2xl shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <Badge className="bg-emerald-100 text-emerald-800 text-sm px-4 py-2">DOAJ Indexed</Badge>
              </div>
              <div className="text-center">
                <Badge className="bg-blue-100 text-blue-800 text-sm px-4 py-2">COPE Member</Badge>
              </div>
              <div className="text-center">
                <Badge className="bg-purple-100 text-purple-800 text-sm px-4 py-2">CrossRef Partner</Badge>
              </div>
              <div className="text-center">
                <Badge className="bg-amber-100 text-amber-800 text-sm px-4 py-2">ORCID Integrated</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}