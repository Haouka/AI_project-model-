import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, ShieldAlert, Clock, Loader2 } from "lucide-react";
import { api } from "../api/client";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";

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
      <div className="p-16 text-center text-ink flex flex-col items-center justify-center space-y-3" role="status">
        <div className="p-3 rounded-2xl bg-orange border-2 border-ink shadow-neo">
          <Loader2 className="h-6 w-6 animate-spin text-ink stroke-[2.5]" />
        </div>
        <p className="font-extrabold text-sm">Loading screening analytics...</p>
      </div>
    );
  }

  const { summary, rates, confidence_distribution, document_type_distribution } = data;

  return (
    <div className="space-y-6" role="region" aria-label="System screening analytics dashboard">
      {/* Header */}
      <div className="border-b-2 border-ink pb-4">
        <h2 className="font-display text-2xl font-black tracking-tight text-ink">
          System Screening Analytics
        </h2>
        <p className="text-xs font-bold text-ink/70 mt-1">
          Aggregated performance indicators, tamper anomaly rates, and verification throughput metrics.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="pastel" pastelBg="blue" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-ink">
              TOTAL PROCESSED
            </span>
            <div className="p-1 rounded-md bg-white border border-ink shadow-[1px_1px_0_#171717]">
              <BarChart3 className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-ink">
            {summary.total_cases}
          </div>
          <div className="text-xs font-bold text-ink/75 mt-1">100% auditable lifecycle</div>
        </Card>

        <Card variant="pastel" pastelBg="mint" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-ink">
              AVERAGE LATENCY
            </span>
            <div className="p-1 rounded-md bg-white border border-ink shadow-[1px_1px_0_#171717]">
              <Clock className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-ink">
            {summary.average_processing_seconds}s
          </div>
          <div className="text-xs font-bold text-ink/75 mt-1">Pipeline execution benchmark</div>
        </Card>

        <Card variant="pastel" pastelBg="coral" className="p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              TAMPER FLAG RATE
            </span>
            <div className="p-1 rounded-md bg-white border border-ink shadow-[1px_1px_0_#171717]">
              <ShieldAlert className="h-3.5 w-3.5 text-coral stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-white">
            {rates.tamper_flag_rate}
          </div>
          <div className="text-xs font-bold text-white/90 mt-1">High-priority inspection</div>
        </Card>

        <Card variant="pastel" pastelBg="orange" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-ink">
              VALIDATION ALERT RATE
            </span>
            <div className="p-1 rounded-md bg-white border border-ink shadow-[1px_1px_0_#171717]">
              <TrendingUp className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-black text-ink">
            {rates.validation_alert_rate}
          </div>
          <div className="text-xs font-bold text-ink/75 mt-1">Requires human review</div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OCR Confidence Distribution */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>OCR Extraction Confidence Distribution</CardTitle>
            <Badge variant="cream">Mean: 96.2%</Badge>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-4">
            {confidence_distribution.map((bracket: any) => (
              <div key={bracket.bracket} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-ink font-mono">{bracket.bracket}</span>
                  <span className="text-ink/70">{bracket.percentage}% of docs</span>
                </div>
                <div className="h-3.5 rounded-full bg-[#FFFDF7] overflow-hidden border-2 border-ink shadow-[1px_1px_0_#171717]">
                  <div
                    className="h-full rounded-full bg-blue"
                    style={{ width: `${bracket.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Document Classification Distribution */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>Document Type Distribution</CardTitle>
            <Badge variant="cream">3 Classes</Badge>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-4">
            {document_type_distribution.map((d: any) => (
              <div key={d.type} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-ink font-black">{d.type}</span>
                  <span className="text-ink/70 font-mono">{d.count} cases</span>
                </div>
                <div className="h-3.5 rounded-full bg-[#FFFDF7] overflow-hidden border-2 border-ink shadow-[1px_1px_0_#171717]">
                  <div
                    className="h-full rounded-full bg-lavender"
                    style={{ width: `${Math.min(100, d.count * 20)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
