import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

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
        to: 'editorial@afriscinexus.org',
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
                  <a href="mailto:info@afriscinexus.org" className="text-teal-600 hover:text-teal-700 font-medium">
                    info@afriscinexus.org
                  </a>
                  <p className="text-slate-600 text-sm mt-3 mb-2">Editorial:</p>
                  <a href="mailto:editorial@afriscinexus.org" className="text-teal-600 hover:text-teal-700 font-medium">
                    editorial@afriscinexus.org
                  </a>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Phone</h3>
                  </div>
                  <p className="text-slate-700 font-medium">+254 700 123 456</p>
                  <p className="text-slate-500 text-sm">Monday - Friday, 9 AM - 5 PM EAT</p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Location</h3>
                  </div>
                  <p className="text-slate-700">AfriSci Nexus</p>
                  <p className="text-slate-600 text-sm">University Way, Nairobi</p>
                  <p className="text-slate-600 text-sm">Kenya, East Africa</p>
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
                  <a href="#" className="block hover:underline">Submission Guidelines</a>
                  <a href="#" className="block hover:underline">Peer Review Process</a>
                  <a href="#" className="block hover:underline">Author Resources</a>
                  <a href="#" className="block hover:underline">FAQ</a>
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
    </div>
  );
}