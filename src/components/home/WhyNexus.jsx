import React from 'react';
import { Globe, ShieldCheck, TrendingUp, Edit } from 'lucide-react';

const benefits = [
  {
    icon: Globe,
    title: "Global Visibility",
    description: "Our open-access platform ensures your research reaches a worldwide audience, maximizing impact and citations.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop"
  },
  {
    icon: ShieldCheck,
    title: "Rigorous Peer Review",
    description: "Benefit from a thorough, fair, and constructive peer-review process conducted by experts in your field.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
  },
  {
    icon: TrendingUp,
    title: "Boost Your Profile",
    description: "Publishing with us enhances your academic profile and connects you with a vibrant community of African researchers.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop"
  },
  {
    icon: Edit,
    title: "Author-Centric Support",
    description: "From our AI-assisted submission process to post-publication support, we are dedicated to your success.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&auto=format&fit=crop"
  },
];

export default function WhyNexus() {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, #14B8A6 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, #3B82F6 0%, transparent 50%),
                           radial-gradient(circle at 40% 80%, #8B5CF6 0%, transparent 50%)`
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Publish With AfriSci Nexus?</h2>
          <p className="mt-4 max-w-2xl mx-auto text-blue-200">
            We are committed to elevating African science through a platform built for visibility, quality, and author success.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group">
              {/* Image Card */}
              <div className="relative h-48 mb-6 overflow-hidden rounded-2xl">
                <div 
                  className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500"
                  style={{backgroundImage: `url(${benefit.image})`}}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Icon Overlay */}
                <div className="absolute bottom-4 left-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-3 group-hover:text-teal-300 transition-colors duration-300">
                  {benefit.title}
                </h3>
                <p className="text-blue-200 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}