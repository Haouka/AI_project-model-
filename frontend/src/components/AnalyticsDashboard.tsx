import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2, Clock, Users, Database } from "lucide-react";
import { api } from "../api/client";

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading system screening analytics...
      </div>
    );
  }

  const { summary, rates, confidence_distribution, document_type_distribution } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">System Screening Analytics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Aggregated performance indicators, alert frequencies, and verification throughput metrics.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400">TOTAL PROCESSED</span>
          <div className="mt-2 text-2xl font-bold text-white">{summary.total_cases}</div>
          <div className="text-[11px] text-blue-400 mt-1">100% auditable</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400">AVERAGE LATENCY</span>
          <div className="mt-2 text-2xl font-bold text-emerald-300">{summary.average_processing_seconds}s</div>
          <div className="text-[11px] text-emerald-400 mt-1">Pipeline benchmark</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400">TAMPER FLAG RATE</span>
          <div className="mt-2 text-2xl font-bold text-rose-300">{rates.tamper_flag_rate}</div>
          <div className="text-[11px] text-rose-400 mt-1">High-priority queue</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold text-slate-400">VALIDATION ALERT RATE</span>
          <div className="mt-2 text-2xl font-bold text-amber-300">{rates.validation_alert_rate}</div>
          <div className="text-[11px] text-amber-400 mt-1">Requires examination</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OCR Confidence Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">OCR Extraction Confidence Distribution</h3>
            <span className="text-xs text-slate-400 font-mono">Mean: 96.2%</span>
          </div>

          <div className="space-y-3 pt-2">
            {confidence_distribution.map((bracket: any) => (
              <div key={bracket.bracket} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">{bracket.bracket}</span>
                  <span className="text-slate-400">{bracket.percentage}% of docs</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${bracket.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Classification Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Document Type Distribution</h3>
            <span className="text-xs text-slate-400 font-mono">Active Types: 3</span>
          </div>

          <div className="space-y-3 pt-2">
            {document_type_distribution.map((d: any) => (
              <div key={d.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{d.type}</span>
                  <span className="text-slate-400 font-mono">{d.count} cases</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(100, d.count * 20)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
