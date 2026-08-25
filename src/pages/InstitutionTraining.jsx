import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInstitutionTrainingSummary } from "@/functions/getInstitutionTrainingSummary";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, Clock, Star, Award, Search, Trophy, ArrowLeft } from "lucide-react";
import InstitutionRankWidget from "@/components/training/InstitutionRankWidget";

export default function InstitutionTraining() {
  const [lookupEmail, setLookupEmail] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [rankLoading, setRankLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("institutionContactEmail");
    if (saved) { setLookupEmail(saved); load(saved); }
    else { loadRanking(""); }
  }, []);

  const loadRanking = async (em) => {
    setRankLoading(true);
    try {
      const res = await getInstitutionTrainingSummary({ email: em || "" });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      setRanking(d?.ranking || []);
      setData(d?.institution || null);
    } catch (err) { setRanking([]); setData(null); }
    setRankLoading(false);
  };

  const load = async (em) => {
    setLoading(true); setError(null); setSearched(true);
    try {
      const res = await getInstitutionTrainingSummary({ email: em });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      setRanking(d?.ranking || []);
      setData(d?.institution || null);
      localStorage.setItem("institutionContactEmail", em);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!lookupEmail) return;
    load(lookupEmail);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Institution Training Dashboard — AfriSci Nexus" description="Institutional partners: track member progress through training modules, assessment scores, and your institutional rank." canonicalPath="/InstitutionTraining" />
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/InstitutionDashboard" className="inline-flex items-center gap-1 text-sky-200 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Institution Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-teal-300" />
            <h1 className="text-2xl sm:text-3xl font-bold">Institution Training Dashboard</h1>
          </div>
          <p className="text-sky-100 max-w-2xl text-sm sm:text-base">
            Track how your members are progressing through training modules, view aggregate assessment scores, and see how your institution ranks against partners.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter the contact email used to purchase cohort seats"
            value={lookupEmail}
            onChange={e => setLookupEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Search className="w-4 h-4 mr-1" /> {loading ? "Loading..." : "View Progress"}
          </Button>
        </form>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

        {loading && <Skeleton className="h-48 rounded-2xl" />}

        {!loading && data && (
          <>
            <SummaryCard data={data} />
            <MembersTable members={data.members} />
          </>
        )}

        {!loading && !data && searched && !error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            No training cohorts found for this contact email. Ensure you used the email registered when purchasing cohort seats.
          </div>
        )}

        <InstitutionRankWidget ranking={ranking} institution={data} loading={rankLoading} />
      </div>
    </div>
  );
}

function SummaryCard({ data }) {
  const stats = [
    { label: "Institutional Rank", value: `#${data.rank}`, icon: Trophy },
    { label: "Active Members", value: data.memberCount, icon: Users },
    { label: "Completed Hours", value: `${data.completedHours}h`, icon: Clock },
    { label: "Assessment Points", value: data.quizScore, icon: Star },
    { label: "Courses Completed", value: data.completedCourses, icon: Award },
    { label: "Total Points", value: data.points, icon: Star }
  ];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="font-bold text-slate-900 text-lg mb-1">{data.name}</h2>
      <p className="text-sm text-slate-500 mb-4">Aggregate training performance across all cohort members</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <s.icon className="w-4 h-4 text-teal-600 mb-1" />
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersTable({ members }) {
  if (!members || members.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900 text-lg">Member Progress</h2>
        <p className="text-sm text-slate-500">Per-learner module progress, scores and points</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">#</th>
              <th className="text-left px-5 py-3">Member</th>
              <th className="text-left px-5 py-3">Enrolments</th>
              <th className="text-left px-5 py-3">Completed Hours</th>
              <th className="text-left px-5 py-3">Quiz Points</th>
              <th className="text-left px-5 py-3">Courses Done</th>
              <th className="text-right px-5 py-3">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-slate-900">{m.name}</td>
                <td className="px-5 py-3 text-slate-600">{m.enrolments}</td>
                <td className="px-5 py-3 text-slate-600">{m.completedHours}h</td>
                <td className="px-5 py-3 text-slate-600">{m.quizScore}</td>
                <td className="px-5 py-3 text-slate-600">{m.completedCourses}</td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">{m.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}