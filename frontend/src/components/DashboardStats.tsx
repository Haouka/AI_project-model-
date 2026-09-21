import React from "react";
import { AlertTriangle, Clock, CheckCircle2, ShieldCheck, Flame } from "lucide-react";
import { Card } from "./ui/Card";

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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Active Processing */}
      <Card
        variant="pastel"
        pastelBg="blue"
        interactive={true}
        onClick={() => onFilterClick && onFilterClick("PROCESSING")}
        className="p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-ink">
            Active Cases
          </span>
          <div className="p-1 rounded-lg bg-white border-2 border-ink shadow-[1px_1px_0_#171717]">
            <Clock className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-display text-3xl font-black tracking-tight text-ink">
            {stats.active_cases}
          </div>
          <p className="text-xs font-bold text-ink/75 mt-0.5">In inspection pipeline</p>
        </div>
      </Card>

      {/* 2. Needs Review */}
      <Card
        variant="pastel"
        pastelBg="orange"
        interactive={true}
        onClick={() => onFilterClick && onFilterClick("NEEDS_REVIEW")}
        className="p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-ink">
            Needs Review
          </span>
          <div className="p-1 rounded-lg bg-white border-2 border-ink shadow-[1px_1px_0_#171717]">
            <AlertTriangle className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-display text-3xl font-black tracking-tight text-ink">
            {stats.needs_review}
          </div>
          <p className="text-xs font-bold text-ink/75 mt-0.5">Awaiting officer decision</p>
        </div>
      </Card>

      {/* 3. High Priority Review */}
      <Card
        variant="pastel"
        pastelBg="coral"
        interactive={true}
        onClick={() => onFilterClick && onFilterClick("HIGH_PRIORITY")}
        className="p-4 text-white"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            High Priority
          </span>
          <div className="p-1 rounded-lg bg-white border-2 border-ink shadow-[1px_1px_0_#171717]">
            <Flame className="h-3.5 w-3.5 text-coral stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-display text-3xl font-black tracking-tight text-white">
            {stats.high_priority}
          </div>
          <p className="text-xs font-bold text-white/90 mt-0.5">Anomalies & flags</p>
        </div>
      </Card>

      {/* 4. Completed */}
      <Card
        variant="pastel"
        pastelBg="mint"
        interactive={true}
        onClick={() => onFilterClick && onFilterClick("COMPLETED")}
        className="p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-ink">
            Completed
          </span>
          <div className="p-1 rounded-lg bg-white border-2 border-ink shadow-[1px_1px_0_#171717]">
            <CheckCircle2 className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-display text-3xl font-black tracking-tight text-ink">
            {stats.completed}
          </div>
          <p className="text-xs font-bold text-ink/75 mt-0.5">Cleared & recorded</p>
        </div>
      </Card>

      {/* 5. Average Latency */}
      <Card variant="pastel" pastelBg="lavender" className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-ink">
            Avg Latency
          </span>
          <div className="p-1 rounded-lg bg-white border-2 border-ink shadow-[1px_1px_0_#171717]">
            <ShieldCheck className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="font-display text-3xl font-black tracking-tight text-ink">
            ~3.4s
          </div>
          <p className="text-xs font-bold text-ink/75 mt-0.5">End-to-end pipeline</p>
        </div>
      </Card>
    </div>
  );
};
