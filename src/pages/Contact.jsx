import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SEO from '@/components/SEO';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send email using the Core.SendEmail integration
      await base44.integrations.Core.SendEmail({
        to: 'editorial@afriscinexus.com',
        subject: `[${formData.category}] ${formData.subject}`,
        body: `Name: ${formData.name}
Email: ${formData.email}
Category: ${formData.category}
Subject: ${formData.subject}

Message:
${formData.message}`
      });
      
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', category: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try emailing us directly.");
    }
    
    setIsSubmitting(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 min-h-screen">
      <SEO
        title="Contact Us"
        description="Get in touch with the AfriSci Nexus editorial team for submission assistance, peer review questions, or partnership opportunities."
        canonicalPath="/Contact"
      />
      {/* Hero Section */}
      <div className="text-center py-24 px-4 bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <Mail className="w-16 h-16 mx-auto mb-6 text-sky-200" />
        <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">Contact Us</h1>
        <p className="mt-4 max-w-3xl mx-auto text-xl text-sky-200">
          We're here to help. Get in touch with our editorial team.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Email</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-2">General Inquiries:</p>
                  <a href="mailto:info@afriscinexus.com" className="text-teal-600 hover:text-teal-700 font-medium">
                    info@afriscinexus.com
                  </a>
                  <p className="text-slate-600 text-sm mt-3 mb-2">Editorial:</p>
                  <a href="mailto:editorial@afriscinexus.com" className="text-teal-600 hover:text-teal-700 font-medium">
                    editorial@afriscinexus.com
                  </a>
                </div>



                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Head Office</h3>
                  </div>
                  <div>
                    <p className="text-slate-700 font-medium text-sm">AfriSci Nexus Discovery</p>
                    <p className="text-slate-500 text-xs">Perth, Western Australia, Australia</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Office Hours</h3>
                  </div>
                  <p className="text-slate-700 text-sm">Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p className="text-slate-700 text-sm">Saturday: 10:00 AM - 2:00 PM</p>
                  <p className="text-slate-700 text-sm">Sunday: Closed</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-0 bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                <div className="space-y-3 text-sm">
                  <Link to={createPageUrl('Guidelines')} className="block hover:underline opacity-90 hover:opacity-100">📄 Submission Guidelines</Link>
                  <Link to={createPageUrl('ReviewGuidelines')} className="block hover:underline opacity-90 hover:opacity-100">🔍 Peer Review Process</Link>
                  <Link to={createPageUrl('AuthorResources')} className="block hover:underline opacity-90 hover:opacity-100">📚 Author Resources</Link>
                  <a href="#faq" className="block hover:underline opacity-90 hover:opacity-100">❓ FAQ</a>
                  <Link to={createPageUrl('Apply')} className="block hover:underline opacity-90 hover:opacity-100">✍️ Apply as Author / Reviewer</Link>
                  <Link to={createPageUrl('Journals')} className="block hover:underline opacity-90 hover:opacity-100">📰 Browse Journals</Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Send Us a Message</h2>
                
                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">Message sent successfully! We'll get back to you soon.</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Dr. Jane Doe"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="jane.doe@university.edu"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Inquiry Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)} required>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submission">Manuscript Submission</SelectItem>
                        <SelectItem value="review">Peer Review</SelectItem>
                        <SelectItem value="editorial">Editorial Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="subscription">Subscription/Access</SelectItem>
                        <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      placeholder="Brief description of your inquiry"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-3"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-3">Frequently Asked Questions</h2>
          <p className="text-slate-500 text-lg">Everything you need to know about publishing with AfriSci Nexus.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} {...faq} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer, links }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-shadow ${open ? 'shadow-md border-teal-300' : 'border-slate-200 bg-white/70'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-slate-900 hover:bg-teal-50/50 transition-colors"
      >
        <span>{question}</span>
        <span className={`ml-4 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors ${open ? 'bg-teal-500' : 'bg-slate-300'}`}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
          <p>{answer}</p>
          {links && (
            <div className="flex flex-wrap gap-3 mt-3">
              {links.map(l => (
                <Link key={l.label} to={l.to}
                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium underline underline-offset-2 text-sm">
                  {l.label} →
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const faqs = [
  {
    question: "How do I submit a manuscript to AfriSci Nexus?",
    answer: "Submitting is straightforward. Create an author account, choose your target journal, and upload your manuscript file along with an abstract and keywords. Our AI-powered system will screen your submission for journal fit before it reaches the editorial team. All submissions must be original, unpublished work.",
    links: [{ label: "Submit a Manuscript", to: createPageUrl('Submit') }, { label: "Submission Guidelines", to: createPageUrl('Guidelines') }]
  },
  {
    question: "What types of articles does AfriSci Nexus publish?",
    answer: "We publish original research articles, systematic reviews, case studies, short communications, and methodological papers. All 12 journals span disciplines including STEM, Medicine & Health, Agriculture, Social Sciences, Law, Arts & Humanities, Business, and Education. Multi-disciplinary work is strongly encouraged.",
    links: [{ label: "Browse Our Journals", to: createPageUrl('Journals') }]
  },
  {
    question: "Is AfriSci Nexus open access?",
    answer: "Yes. All journals on the platform are fully open access — once published, your article is freely available globally with no paywall. We are committed to ensuring African research reaches researchers, policymakers, and practitioners worldwide regardless of institutional subscriptions.",
    links: [{ label: "Our Open Access Policy", to: createPageUrl('OpenAccess') }]
  },
  {
    question: "How long does the peer review process take?",
    answer: "The typical review cycle is 4–8 weeks from submission to first decision. This includes 3–5 days for editorial screening, 2–4 weeks for double-blind peer review by 2–3 experts, and 1 week for editorial decision. Revision periods may add 2–4 additional weeks. We aim to be faster than the industry average.",
    links: [{ label: "Review Guidelines", to: createPageUrl('ReviewGuidelines') }]
  },
  {
    question: "Are there publication or submission fees?",
    answer: "Fees vary by journal. Many journals on the platform are completely free to submit and publish. Where fees apply, they are clearly listed on the journal page. We offer full or partial fee waivers for authors from low-income countries — simply indicate your waiver request during submission and our team will review it.",
    links: [{ label: "Browse Journals & Fees", to: createPageUrl('Journals') }]
  },
  {
    question: "How do I become a peer reviewer?",
    answer: "We welcome expert reviewers from all disciplines. Apply through our Reviewer Application form, providing your academic credentials, areas of expertise, ORCID, and optionally a Google Scholar URL. Approved reviewers are matched to manuscripts using our AI-powered expertise-matching system and receive recognition through our Reviewer Awards programme.",
    links: [{ label: "Apply as Reviewer", to: createPageUrl('Apply?role=reviewer') }, { label: "Reviewer Awards", to: createPageUrl('ReviewerAwards') }]
  },
  {
    question: "Can I track my submission status?",
    answer: "Yes. Once logged in, you can visit 'My Manuscripts' to see real-time status updates for every submission — from initial editorial screening through peer review, revision, and final decision. You will also receive email notifications at each key stage.",
    links: [{ label: "My Manuscripts", to: createPageUrl('MyManuscripts') }]
  },
  {
    question: "What are the formatting requirements for submissions?",
    answer: "Manuscripts should be submitted in .docx or LaTeX format. Include a structured abstract (max 300 words), 4–6 keywords, 12pt font, double spacing, and 1-inch margins. We also accept LaTeX files — use our LaTeX Proof Generator to preview your PDF before submitting. Full citation and ethics declaration guidelines are on the Author Resources page.",
    links: [{ label: "Author Resources", to: createPageUrl('AuthorResources') }, { label: "LaTeX Proof Generator", to: createPageUrl('LaTeXProof') }]
  },
  {
    question: "How does AfriSci Nexus handle plagiarism?",
    answer: "Every manuscript is automatically screened for plagiarism upon submission using our AI-powered detection system. Submissions with a high similarity score are flagged and may be returned to the author before peer review. We have a strict zero-tolerance policy for plagiarism, self-plagiarism, and data fabrication.",
    links: []
  },
  {
    question: "How can my institution partner with AfriSci Nexus?",
    answer: "We offer institutional publishing agreements designed for universities, research institutes, and funding bodies across Africa. Partnership tiers (Starter, Growth, and Premier) provide fee waivers, branding benefits, and usage reporting for 10–50 authors per year. Reach out via our partnership page or contact us directly.",
    links: [{ label: "Institutional Partnership", to: createPageUrl('InstitutionalPartnership') }]
  },
];