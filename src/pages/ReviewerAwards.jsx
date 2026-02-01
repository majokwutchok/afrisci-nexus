
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Award, Star, TrendingUp, Users, Crown, Medal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const awards = [
  {
    name: "Gold Reviewer",
    icon: Crown,
    color: "from-yellow-500 to-amber-600",
    bgColor: "bg-amber-50",
    textColor: "text-amber-900",
    requirement: "10+ peer reviews completed",
    benefits: [
      "Recognition certificate",
      "Priority consideration for editorial board positions",
      "Featured on our website",
      "Complimentary article processing charge waiver (1 article)"
    ]
  },
  {
    name: "Silver Reviewer",
    icon: Medal,
    color: "from-slate-400 to-slate-600",
    bgColor: "bg-slate-50",
    textColor: "text-slate-900",
    requirement: "5-9 peer reviews completed",
    benefits: [
      "Digital badge for email signature and profiles",
      "Early access to newly published articles",
      "Invitation to exclusive webinars",
      "50% discount on one article processing charge"
    ]
  },
  {
    name: "Bronze Reviewer",
    icon: Award,
    color: "from-orange-400 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-900",
    requirement: "1-4 peer reviews completed",
    benefits: [
      "Public acknowledgment in our annual report",
      "Digital certificate of appreciation",
      "Access to reviewer resources and training",
      "Priority for future review invitations"
    ]
  }
];

const topReviewers = [
  { name: "Dr. Amina Hassan", institution: "University of Nairobi", reviews: 24, expertise: "Medicine & Health" },
  { name: "Prof. Kwame Osei", institution: "University of Ghana", reviews: 19, expertise: "STEM" },
  { name: "Dr. Fatima Ndiaye", institution: "Université Cheikh Anta Diop", reviews: 17, expertise: "Agriculture & Environment" },
  { name: "Prof. Thabo Molefe", institution: "University of Cape Town", reviews: 15, expertise: "Social Sciences" },
];

const AwardCard = ({ award }) => (
  <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <CardContent className="p-8">
      <div className={`w-20 h-20 bg-gradient-to-br ${award.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
        <award.icon className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">{award.name}</h3>
      <Badge className={`${award.bgColor} ${award.textColor} mx-auto block w-fit mb-6`}>
        {award.requirement}
      </Badge>
      <div className="space-y-3">
        <p className="font-semibold text-slate-700">Benefits:</p>
        <ul className="space-y-2">
          {award.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-slate-600">
              <Star className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

export default function ReviewerAwardsPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      <div className="text-center py-24 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Reviewer Recognition Program</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-sky-200">
          Celebrating excellence in peer review and recognizing our community's most dedicated contributors.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
        {/* Award Tiers */}
        <div>
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">Recognition Tiers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {awards.map((award) => (
              <AwardCard key={award.name} award={award} />
            ))}
          </div>
        </div>

        {/* Why Recognition Matters */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">Why We Recognize Reviewers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-teal-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Build Your Academic Profile</h3>
                </div>
                <p className="text-slate-600">
                  Peer review contributions strengthen your CV and demonstrate your expertise to the global scientific community.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-teal-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Join an Elite Network</h3>
                </div>
                <p className="text-slate-600">
                  Connect with leading researchers and editors, opening doors for collaboration and career advancement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Reviewers of the Year */}
        <div>
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">Top Reviewers of 2024</h2>
          <Card className="max-w-4xl mx-auto border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                {topReviewers.map((reviewer, index) => (
                  <div key={reviewer.name} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-teal-50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                        index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-teal-500 to-emerald-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{reviewer.name}</p>
                        <p className="text-sm text-slate-600">{reviewer.institution}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-teal-100 text-teal-800">{reviewer.expertise}</Badge>
                      <p className="text-sm text-slate-600 mt-1">{reviewer.reviews} reviews</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-12 rounded-2xl shadow-xl">
          <Award className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Start Your Reviewer Journey Today</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-teal-50">
            Join 500+ expert reviewers shaping the future of African scientific research. Your expertise matters.
          </p>
          <Link to={createPageUrl("Profile")} className="inline-block bg-white text-teal-700 font-semibold px-8 py-3 rounded-lg hover:bg-teal-50 transition-colors shadow-lg">
            Become a Reviewer
          </Link>
        </div>
      </div>
    </div>
  );
}
