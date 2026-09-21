import React, { useState } from "react";
import { Check, Camera, AlertOctagon, MessageSquare, ShieldAlert } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Modal } from "./ui/Modal";

interface ReviewActionsProps {
  caseId: string;
  onRecordReview: (action: string, notes: string, reason?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ReviewActions: React.FC<ReviewActionsProps> = ({
  caseId,
  onRecordReview,
  isSubmitting = false,
}) => {
  const [notes, setNotes] = useState("");
  const [confirmModalAction, setConfirmModalAction] = useState<string | null>(null);

  const handleActionClick = (action: string) => {
    setConfirmModalAction(action);
  };

  const handleConfirm = async () => {
    if (!confirmModalAction) return;
    await onRecordReview(confirmModalAction, notes, `Officer review decision: ${confirmModalAction}`);
    setConfirmModalAction(null);
    setNotes("");
  };

  return (
    <div
      className="rounded-2xl border-2 border-ink bg-white p-4 shadow-neo space-y-3"
      role="region"
      aria-label="Review actions and decision toolbar"
    >
      {/* Title Header - Aligned with the input below it */}
      <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-ink">
        <MessageSquare className="h-4 w-4 text-ink stroke-[2.5]" />
        <span>Reviewer Findings & Audit Notes:</span>
      </div>

      {/* Full-width Comment Input */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Add officer comments, physical inspection observations, or reason for decision..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl border-2 border-ink bg-[#FFFDF7] px-3.5 text-xs font-bold text-ink placeholder:text-ink/40 shadow-neo-sm focus:shadow-neo focus:outline-none transition-all"
        />
      </div>

      {/* Action Decision Buttons: Single cohesive flex row with identical height, baseline, and 12px gap */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-0.5">
        {/* Request Better Image */}
        <Button
          type="button"
          variant="orange"
          size="md"
          icon={<Camera className="h-4 w-4 stroke-[2.5]" />}
          onClick={() => handleActionClick("REQUEST_BETTER_IMAGE")}
          disabled={isSubmitting}
          className="h-10 px-4 text-xs font-black"
        >
          Request Better Image
        </Button>

        {/* Escalate Case */}
        <Button
          type="button"
          variant="coral"
          size="md"
          icon={<AlertOctagon className="h-4 w-4 stroke-[2.5]" />}
          onClick={() => handleActionClick("ESCALATE")}
          disabled={isSubmitting}
          className="h-10 px-4 text-xs font-black"
        >
          Escalate Case
        </Button>

        {/* Clear / Approve */}
        <Button
          type="button"
          variant="mint"
          size="md"
          icon={<Check className="h-4 w-4 stroke-[3]" />}
          onClick={() => handleActionClick("CLEAR")}
          disabled={isSubmitting}
          className="h-10 px-4 text-xs font-black"
        >
          Clear / Approve
        </Button>
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmModalAction)}
        onClose={() => setConfirmModalAction(null)}
        title="Confirm Review Decision"
        maxWidth="md"
        headerIcon={<ShieldAlert className="h-5 w-5 text-coral stroke-[2.5]" />}
      >
        <div className="space-y-4">
          <p className="text-xs font-bold text-ink leading-relaxed">
            Are you sure you want to record the review outcome as{" "}
            <span className="rounded bg-lavender px-1.5 py-0.5 border border-ink text-ink font-black">
              {confirmModalAction}
            </span>{" "}
            for case <span className="font-mono font-black text-ink">{caseId}</span>?
          </p>

          <div className="rounded-xl border-2 border-ink bg-[#FFFDF7] p-3 text-xs shadow-neo-sm">
            <span className="text-[10px] font-black uppercase text-ink/60 block mb-1">
              Attached Officer Findings:
            </span>
            <p className="text-ink font-bold">
              {notes ? notes : <span className="italic text-ink/40">No notes provided</span>}
            </p>
          </div>

          <p className="text-[11px] font-semibold text-ink/60">
            This action will be permanently inscribed into the append-only audit trail with your authenticated credentials.
          </p>

          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t-2 border-ink">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalAction(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="coral"
              size="sm"
              loading={isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? "Recording..." : "Confirm & Sign"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
