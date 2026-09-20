import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
  Layers,
  XCircle,
  Database,
  Sliders,
} from "lucide-react";
import {
  ReviewPriority,
  ValidationResultItem,
  TamperResultItem,
  FaceResultItem,
} from "../types";
import { Badge } from "./ui/Badge";

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

  const getPriorityStyle = () => {
    switch (priority) {
      case "HIGH_PRIORITY_REVIEW":
        return {
          bg: "bg-coral text-white",
          icon: <ShieldAlert className="h-6 w-6 text-white stroke-[2.5]" />,
          title: "HIGH-PRIORITY REVIEW",
          desc: "Critical inconsistencies or physical/digital tampering indicators detected.",
        };
      case "NEEDS_REVIEW":
        return {
          bg: "bg-orange text-ink",
          icon: <AlertTriangle className="h-6 w-6 text-ink stroke-[2.5]" />,
          title: "NEEDS HUMAN REVIEW",
          desc: "Rule discrepancies or inconclusive anomalies require officer inspection.",
        };
      case "LOW_CONCERN":
      default:
        return {
          bg: "bg-mint text-ink",
          icon: <ShieldCheck className="h-6 w-6 text-ink stroke-[2.5]" />,
          title: "LOW CONCERN",
          desc: "All automated integrity and biometric checks passed normal operational thresholds.",
        };
    }
  };

  const pStyle = getPriorityStyle();

  return (
    <div
      className="flex flex-col h-full rounded-2xl border-2 border-ink bg-white overflow-hidden shadow-neo"
      role="region"
      aria-label="Forensic evidence and risk indicators panel"
    >
      {/* Top Banner: Review Priority - Aligned to exact 52px height */}
      <div className={`px-4 py-2 border-b-2 border-ink ${pStyle.bg} flex items-center space-x-2.5 min-h-[52px]`}>
        <div className="p-1 rounded-xl bg-white/20 border border-ink/40 shadow-sm shrink-0" aria-hidden="true">
          {pStyle.icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-xs font-black tracking-tight leading-tight uppercase truncate">{pStyle.title}</h2>
          <p className="text-[11px] font-bold opacity-90 leading-tight truncate">{pStyle.desc}</p>
        </div>
      </div>

      {/* Main Evidence Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Signals Summary Card */}
        <div className="rounded-xl border-2 border-ink bg-[#FFFDF7] p-3.5 space-y-2.5 shadow-neo-sm">
          <div className="flex items-center space-x-1.5">
            <Sliders className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-ink">
              INTEGRITY SIGNALS SUMMARY
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border-2 border-ink flex items-center justify-between shadow-[1px_1px_0_#171717]">
              <span className="font-bold text-ink/75">OCR Confidence:</span>
              <strong className="font-mono font-black text-ink">{Math.round(overallConfidence * 100)}%</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border-2 border-ink flex items-center justify-between shadow-[1px_1px_0_#171717]">
              <span className="font-bold text-ink/75">MRZ Checksum:</span>
              <strong className="text-emerald-700 font-extrabold">
                {validationResults.some((r) => r.category === "MRZ" && r.status === "FAIL") ? "FAIL" : "PASS"}
              </strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border-2 border-ink flex items-center justify-between shadow-[1px_1px_0_#171717]">
              <span className="font-bold text-ink/75">Chronology:</span>
              <strong className="font-extrabold">
                {validationResults.some((r) => r.category === "DATE" && r.status === "FAIL") ? (
                  <span className="text-coral">FAIL</span>
                ) : (
                  <span className="text-emerald-700">PASS</span>
                )}
              </strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border-2 border-ink flex items-center justify-between shadow-[1px_1px_0_#171717]">
              <span className="font-bold text-ink/75">Forensics:</span>
              <strong className="font-extrabold">
                {tamperResults.some((t) => t.status === "POSSIBLE_ANOMALY") ? (
                  <span className="text-coral">ANOMALY</span>
                ) : tamperResults.some((t) => t.status === "REQUIRES_REVIEW") ? (
                  <span className="text-orange-600">REVIEW</span>
                ) : (
                  <span className="text-emerald-700">CLEAR</span>
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* 2. Validation Alerts (Critical & Major) */}
        {(failedRules.length > 0 || warningRules.length > 0) && (
          <div className="space-y-2.5" role="region" aria-label="Validation rule alerts">
            <span className="text-[10px] font-black uppercase tracking-wider text-coral flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" />
              RULE VALIDATION ALERTS ({failedRules.length + warningRules.length})
            </span>

            {failedRules.map((r) => (
              <div
                key={r.rule_id}
                className="rounded-xl border-2 border-ink bg-coral-50 p-3 text-xs space-y-1.5 shadow-neo-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <XCircle className="h-4 w-4 text-coral stroke-[2.5]" />
                    <span className="font-mono font-black text-ink">{r.rule_id}</span>
                  </div>
                  <Badge variant="coral">
                    {r.severity}
                  </Badge>
                </div>
                <div className="font-extrabold text-ink">{r.rule_name}</div>
                <p className="text-ink/80 font-semibold leading-relaxed text-[11px]">{r.explanation}</p>
                {r.evidence && (
                  <div className="rounded-lg bg-white p-2 font-mono text-[10px] font-bold text-ink border-2 border-ink shadow-inner overflow-x-auto">
                    {JSON.stringify(r.evidence)}
                  </div>
                )}
              </div>
            ))}

            {warningRules.map((r) => (
              <div
                key={r.rule_id}
                className="rounded-xl border-2 border-ink bg-orange-50 p-3 text-xs space-y-1.5 shadow-neo-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="h-4 w-4 text-orange-600 stroke-[2.5]" />
                    <span className="font-mono font-black text-ink">{r.rule_id}</span>
                  </div>
                  <Badge variant="orange">
                    {r.severity}
                  </Badge>
                </div>
                <div className="font-extrabold text-ink">{r.rule_name}</div>
                <p className="text-ink/80 font-semibold leading-relaxed text-[11px]">{r.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {/* 3. Tampering Forensics Breakdown */}
        <div className="rounded-xl border-2 border-ink bg-[#FFFDF7] p-3.5 space-y-2.5 shadow-neo-sm">
          <div className="flex items-center space-x-1.5">
            <Layers className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-ink">
              COMPUTER VISION TAMPERING FORENSICS
            </span>
          </div>

          {tamperResults.map((t) => {
            const isAnomaly = t.status === "POSSIBLE_ANOMALY";
            const isReview = t.status === "REQUIRES_REVIEW";

            return (
              <div
                key={t.anomaly_type}
                className={`p-2.5 rounded-lg border-2 border-ink text-xs space-y-1 ${
                  isAnomaly
                    ? "bg-coral-50"
                    : isReview
                    ? "bg-orange-50"
                    : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-ink">
                    {t.anomaly_type.replace(/_/g, " ")}
                  </span>
                  <Badge
                    variant={isAnomaly ? "coral" : isReview ? "orange" : "mint"}
                  >
                    {t.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-ink/75 font-semibold text-[11px] leading-relaxed">{t.explanation}</p>
              </div>
            );
          })}
        </div>

        {/* 4. Face Verification Card */}
        {faceResult && (
          <div className="rounded-xl border-2 border-ink bg-[#FFFDF7] p-3.5 space-y-2 shadow-neo-sm">
            <div className="flex items-center space-x-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-ink">
                BIOMETRIC FACE COMPARISON
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border-2 border-ink text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink/75">Comparison Result:</span>
                <Badge
                  variant={
                    faceResult.outcome === "SUPPORTING_MATCH"
                      ? "mint"
                      : faceResult.outcome === "POTENTIAL_MISMATCH"
                      ? "coral"
                      : "orange"
                  }
                >
                  {faceResult.outcome.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-ink font-bold text-[11px] leading-relaxed">{faceResult.explanation}</p>
              <div className="text-[10px] font-semibold text-ink/60 border-t border-ink/20 pt-1.5">
                {faceResult.uncertainty_disclaimer}
              </div>
            </div>
          </div>
        )}

        {/* 5. Authorized Reference Border Check */}
        <div className="rounded-xl border-2 border-ink bg-[#FFFDF7] p-3 text-xs space-y-1.5 shadow-neo-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Database className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-ink">
                BORDER REFERENCE GATEWAY
              </span>
            </div>
            <Badge variant="mint">
              ACTIVE / CLEAR
            </Badge>
          </div>
          <p className="text-ink/70 font-semibold text-[11px]">
            Queried simulated border authority gateway and Interpol Stolen & Lost Travel Documents (SLTD).
            No active alerts or revocation recorded.
          </p>
        </div>
      </div>
    </div>
  );
};
