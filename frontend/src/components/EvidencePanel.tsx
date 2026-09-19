import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Fingerprint,
  Layers,
  Info,
  CheckCircle2,
  XCircle,
  Database,
} from "lucide-react";
import {
  ReviewPriority,
  ValidationResultItem,
  TamperResultItem,
  FaceResultItem,
} from "../types";

interface EvidencePanelProps {
  priority: ReviewPriority;
  overallConfidence: number;
  validationResults: ValidationResultItem[];
  tamperResults: TamperResultItem[];
  faceResult?: FaceResultItem | null;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  priority,
  overallConfidence,
  validationResults,
  tamperResults,
  faceResult,
}) => {
  const failedRules = validationResults.filter((r) => r.status === "FAIL");
  const warningRules = validationResults.filter((r) => r.status === "WARNING");
  const passedRules = validationResults.filter((r) => r.status === "PASS");

  const getPriorityStyle = () => {
    switch (priority) {
      case "HIGH_PRIORITY_REVIEW":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          icon: <ShieldAlert className="h-5 w-5 text-rose-400" />,
          title: "HIGH-PRIORITY REVIEW",
          desc: "Critical inconsistencies or physical/digital tampering indicators detected.",
        };
      case "NEEDS_REVIEW":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
          title: "NEEDS HUMAN REVIEW",
          desc: "Rule discrepancies or inconclusive anomalies require officer examination.",
        };
      case "LOW_CONCERN":
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
          title: "LOW CONCERN",
          desc: "All automated integrity and biometric checks passed within normal thresholds.",
        };
    }
  };

  const pStyle = getPriorityStyle();

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
      {/* Top Banner: Review Priority */}
      <div className={`p-4 border-b ${pStyle.bg} flex items-start space-x-3`}>
        <div className="mt-0.5">{pStyle.icon}</div>
        <div>
          <h2 className="text-sm font-bold tracking-tight">{pStyle.title}</h2>
          <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{pStyle.desc}</p>
        </div>
      </div>

      {/* Main Evidence Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Signals Summary Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            INTEGRITY SIGNALS SUMMARY
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">OCR Confidence:</span>
              <strong className="font-mono text-slate-100">{Math.round(overallConfidence * 100)}%</strong>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">MRZ Validation:</span>
              <strong className="text-emerald-400 font-semibold">
                {validationResults.some((r) => r.category === "MRZ" && r.status === "FAIL") ? "FAIL" : "PASS"}
              </strong>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Date Consistency:</span>
              <strong className="text-slate-200 font-semibold">
                {validationResults.some((r) => r.category === "DATE" && r.status === "FAIL") ? (
                  <span className="text-rose-400">FAIL</span>
                ) : (
                  <span className="text-emerald-400">PASS</span>
                )}
              </strong>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Tamper Forensics:</span>
              <strong className="font-semibold text-slate-200">
                {tamperResults.some((t) => t.status === "POSSIBLE_ANOMALY") ? (
                  <span className="text-rose-400">ANOMALY</span>
                ) : tamperResults.some((t) => t.status === "REQUIRES_REVIEW") ? (
                  <span className="text-amber-400">REVIEW</span>
                ) : (
                  <span className="text-emerald-400">CLEAR</span>
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* 2. Validation Alerts (Critical & Major) */}
        {(failedRules.length > 0 || warningRules.length > 0) && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              RULE VALIDATION ALERTS ({failedRules.length + warningRules.length})
            </span>

            {failedRules.map((r) => (
              <div
                key={r.rule_id}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span className="font-bold text-rose-300 font-mono">{r.rule_id}</span>
                  </div>
                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-300">
                    {r.severity}
                  </span>
                </div>
                <div className="font-semibold text-slate-200">{r.rule_name}</div>
                <p className="text-rose-200/90 leading-relaxed text-[11px]">{r.explanation}</p>
                {r.evidence && (
                  <div className="rounded bg-slate-950/80 p-2 font-mono text-[10px] text-slate-400 overflow-x-auto border border-slate-800">
                    {JSON.stringify(r.evidence)}
                  </div>
                )}
              </div>
            ))}

            {warningRules.map((r) => (
              <div
                key={r.rule_id}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-bold text-amber-300 font-mono">{r.rule_id}</span>
                  </div>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                    {r.severity}
                  </span>
                </div>
                <div className="font-semibold text-slate-200">{r.rule_name}</div>
                <p className="text-amber-200/90 leading-relaxed text-[11px]">{r.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {/* 3. Tampering Forensics Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="h-3 w-3 text-indigo-400" />
            COMPUTER VISION TAMPERING FORENSICS
          </span>

          {tamperResults.map((t) => {
            const isAnomaly = t.status === "POSSIBLE_ANOMALY";
            const isReview = t.status === "REQUIRES_REVIEW";

            return (
              <div
                key={t.anomaly_type}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  isAnomaly
                    ? "border-rose-500/30 bg-rose-500/5"
                    : isReview
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-slate-800 bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    {t.anomaly_type.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isAnomaly
                        ? "bg-rose-500/20 text-rose-300"
                        : isReview
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {t.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{t.explanation}</p>
              </div>
            );
          })}
        </div>

        {/* 4. Face Verification Card */}
        {faceResult && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Fingerprint className="h-3 w-3 text-blue-400" />
              BIOMETRIC FACE COMPARISON
            </span>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Comparison Result:</span>
                <span
                  className={`font-semibold ${
                    faceResult.outcome === "SUPPORTING_MATCH"
                      ? "text-emerald-400"
                      : faceResult.outcome === "POTENTIAL_MISMATCH"
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  {faceResult.outcome.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{faceResult.explanation}</p>
              <div className="text-[10px] text-slate-500 italic border-t border-slate-800/80 pt-1.5">
                {faceResult.uncertainty_disclaimer}
              </div>
            </div>
          </div>
        )}

        {/* 5. Authorized Reference Border Check */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Database className="h-3 w-3 text-emerald-400" />
              BORDER REFERENCE GATEWAY
            </span>
            <span className="text-emerald-400 font-semibold text-[11px]">ACTIVE / CLEAR</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Queried simulated border authority gateway and Interpol Stolen & Lost Travel Documents (SLTD).
            No active alerts or revocation recorded.
          </p>
        </div>
      </div>
    </div>
  );
};
