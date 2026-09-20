import React from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Badge } from "./ui/Badge";

interface ProcessingModalProps {
  isOpen: boolean;
  step: number; // 0 to 6
  onComplete?: () => void;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen, step }) => {
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
    <Modal
      isOpen={isOpen}
      preventClose={true}
      showCloseButton={false}
      title="ANALYZING DOCUMENT"
      description="Executing multi-layer identity verification pipeline..."
      maxWidth="lg"
      headerIcon={<Loader2 className="h-6 w-6 animate-spin text-ink stroke-[2.5]" />}
    >
      <div className="space-y-4">
        {/* Step-by-Step Progress List */}
        <div className="space-y-2.5" role="status" aria-live="polite">
          {steps.map((s, idx) => {
            const isCompleted = step > idx;
            const isCurrent = step === idx;

            return (
              <div
                key={idx}
                className={`flex items-start space-x-3 p-2.5 rounded-xl border-2 border-ink transition-all ${
                  isCurrent
                    ? "bg-blue shadow-neo-sm scale-[1.01]"
                    : isCompleted
                    ? "bg-mint/40"
                    : "bg-[#FFFDF7] opacity-45"
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-800 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-ink animate-spin stroke-[2.5]" />
                  ) : (
                    <Circle className="h-4 w-4 text-ink/40 stroke-[2.5]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-ink">
                    {s.label}
                  </div>
                  <div className="text-[11px] font-semibold text-ink/70 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs font-bold text-ink/70 pt-3 border-t-2 border-ink">
          <span>Estimated pipeline latency: ~3.4s</span>
          <Badge variant="lavender">
            Step {Math.min(step + 1, 7)} of 7
          </Badge>
        </div>
      </div>
    </Modal>
  );
};
