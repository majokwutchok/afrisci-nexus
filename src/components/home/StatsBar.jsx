import React from 'react';
import { BookOpen, FileText, Users, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const StatItem = ({ icon: Icon, value, label, isLoading, gradient }) => (
  <div className={`p-6 rounded-2xl text-white shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ${gradient}`}>
    <div className="flex items-center gap-5">
      <div className="bg-white/20 p-4 rounded-full border-2 border-white/30">
        <Icon className="h-7 w-7 text-white" />
      </div>
      <div className="text-left">
        {isLoading || value == null ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20 bg-white/30" />
            <Skeleton className="h-5 w-28 bg-white/20" />
          </div>
        ) : (
          <>
            <p className="text-4xl font-bold">{value.toLocaleString()}+</p>
            <p className="text-sm font-medium text-white/90">{label}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

export default function StatsBar({ stats, isLoading }) {
  const statItems = [
    { icon: BookOpen, value: stats.journals, label: "Active Journals", gradient: "bg-gradient-to-br from-blue-600 to-cyan-500" },
    { icon: FileText, value: stats.articles, label: "Published Articles", gradient: "bg-gradient-to-br from-emerald-600 to-teal-500" },
    { icon: Users, value: stats.reviewers, label: "Expert Reviewers", gradient: "bg-gradient-to-br from-indigo-600 to-purple-500" },
    { icon: Globe, value: stats.countries, label: "Countries Reached", gradient: "bg-gradient-to-br from-amber-500 to-orange-600" }
  ];

  return (
    <section className="-mt-20 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => (
          <StatItem key={index} {...item} isLoading={isLoading} />
        ))}
      </div>
    </section>
  );
}