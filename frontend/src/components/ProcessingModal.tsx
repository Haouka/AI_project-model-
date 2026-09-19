import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Circle, ShieldCheck } from "lucide-react";

interface ProcessingModalProps {
  isOpen: boolean;
  step: number; // 0 to 6
  onComplete?: () => void;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen, step }) => {
  if (!isOpen) return null;

  const steps = [
    { label: "Image Quality & Resolution Assessment", desc: "Checking sharpness, glare, and blur levels" },
    { label: "Document Classification & Template Alignment", desc: "Verifying document boundaries & geometry" },
    { label: "OCR & Machine Readable Zone (MRZ) Parsing", desc: "Extracting structured text & computing checksums" },
    { label: "Deterministic Rule-Based Validation", desc: "Evaluating expiry dates, chronology & formatting" },
    { label: "Computer Vision Tampering & ELA Forensics", desc: "Analyzing compression error, noise, and photo edges" },
    { label: "Biometric Facial Verification", desc: "Assessing portrait quality and feature similarity" },
    { label: "Synthesizing Evidence & Review Priority", desc: "Aggregating multi-source risk indicators" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">ANALYZING DOCUMENT</h3>
            <p className="text-xs text-slate-400">Executing multi-layer identity verification pipeline...</p>
          </div>
        </div>

        {/* Step-by-Step Progress List */}
        <div className="space-y-3">
          {steps.map((s, idx) => {
            const isCompleted = step > idx;
            const isCurrent = step === idx;
            const isPending = step < idx;

            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-blue-600/10 border border-blue-500/30"
                    : isCompleted
                    ? "bg-slate-950/40"
                    : "opacity-40"
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-semibold ${
                      isCompleted ? "text-slate-200" : isCurrent ? "text-blue-300" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          <span>Estimated latency: ~3.4s</span>
          <span className="font-mono text-blue-400">Pipeline Step {Math.min(step + 1, 7)} / 7</span>
        </div>
      </div>
    </div>
  );
};
