import React from "react";
import { Trophy, Medal, Award, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardWidget({ leaderboard, me, loading }) {
  if (loading) return <Skeleton className="h-72 rounded-2xl" />;
  if (!leaderboard || leaderboard.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-white" />
        <h2 className="font-bold text-white text-lg">Learner Leaderboard</h2>
        <span className="text-amber-100 text-xs ml-auto hidden sm:inline">Top performers by score and hours</span>
      </div>
      <div className="divide-y divide-slate-100">
        {leaderboard.map((r) => (
          <div key={r.rank} className={`flex items-center gap-3 px-5 py-3 ${r.is_me ? "bg-teal-50" : ""}`}>
            <RankBadge rank={r.rank} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">
                {r.name} {r.is_me && <Badge className="bg-teal-100 text-teal-800 ml-1">You</Badge>}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.completedHours}h</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{r.quizScore} pts</span>
                <span>{r.completedCourses} completed</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-slate-900">{r.points}</p>
              <p className="text-xs text-slate-400">points</p>
            </div>
          </div>
        ))}
      </div>
      {me && !me.inTop && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <RankBadge rank={me.rank} />
          <p className="text-sm text-slate-700 flex-1">
            Your rank: <strong>#{me.rank}</strong> — {me.completedHours}h, {me.quizScore} pts, {me.completedCourses} completed
          </p>
          <span className="font-bold text-slate-900">{me.points} pts</span>
        </div>
      )}
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0"><Medal className="w-5 h-5 text-amber-600" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"><Medal className="w-5 h-5 text-slate-500" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><Award className="w-5 h-5 text-orange-600" /></div>;
  return <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0">{rank}</div>;
}