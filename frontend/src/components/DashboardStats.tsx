import React from "react";
import { AlertTriangle, Clock, CheckCircle2, ShieldCheck, Flame } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    total: number;
    active_cases: number;
    needs_review: number;
    completed: number;
    high_priority: number;
  };
  onFilterClick?: (status: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, onFilterClick }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Active Processing */}
      <div
        onClick={() => onFilterClick && onFilterClick("PROCESSING")}
        className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-blue-500/50 hover:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">ACTIVE CASES</span>
          <Clock className="h-4 w-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-white">{stats.active_cases}</span>
          <span className="text-xs text-blue-400 font-medium">In pipeline</span>
        </div>
      </div>

      {/* Needs Review */}
      <div
        onClick={() => onFilterClick && onFilterClick("NEEDS_REVIEW")}
        className="cursor-pointer group relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all hover:border-amber-500/50 hover:bg-amber-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-300">NEEDS REVIEW</span>
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-amber-200">{stats.needs_review}</span>
          <span className="text-xs text-amber-400/80 font-medium">Officer action</span>
        </div>
      </div>

      {/* High Priority Review */}
      <div
        onClick={() => onFilterClick && onFilterClick("HIGH_PRIORITY")}
        className="cursor-pointer group relative overflow-hidden rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 transition-all hover:border-rose-500/50 hover:bg-rose-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-300">HIGH PRIORITY</span>
          <Flame className="h-4 w-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-rose-200">{stats.high_priority}</span>
          <span className="text-xs text-rose-400/80 font-medium">Anomalies flagged</span>
        </div>
      </div>

      {/* Completed */}
      <div
        onClick={() => onFilterClick && onFilterClick("COMPLETED")}
        className="cursor-pointer group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-300">COMPLETED</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-200">{stats.completed}</span>
          <span className="text-xs text-emerald-400/80 font-medium">Cleared</span>
        </div>
      </div>

      {/* Average Turnaround */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">AVG LATENCY</span>
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-white">~3.4s</span>
          <span className="text-xs text-indigo-400 font-medium">End-to-end</span>
        </div>
      </div>
    </div>
  );
};
