import React, { useState } from "react";
import { Check, Camera, AlertOctagon, FileCheck, Send, MessageSquare } from "lucide-react";

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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Notes Input Area */}
        <div className="flex-1 w-full relative">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-1.5 font-medium">
            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
            <span>Reviewer Findings & Audit Notes:</span>
          </div>
          <input
            type="text"
            placeholder="Add official screening comments, physical inspection observations, or reason for escalation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Action Decision Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Request Better Image */}
          <button
            onClick={() => handleActionClick("REQUEST_BETTER_IMAGE")}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
          >
            <Camera className="h-4 w-4 text-amber-400" />
            <span>Request Better Image</span>
          </button>

          {/* Escalate */}
          <button
            onClick={() => handleActionClick("ESCALATE")}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all disabled:opacity-50"
          >
            <AlertOctagon className="h-4 w-4 text-rose-400" />
            <span>Escalate Case</span>
          </button>

          {/* Clear / Approve */}
          <button
            onClick={() => handleActionClick("CLEAR")}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>Clear / Approve</span>
          </button>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Confirm Review Decision</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to record the review outcome as{" "}
              <strong className="text-blue-400">{confirmModalAction}</strong> for case{" "}
              <strong className="font-mono text-white">{caseId}</strong>?
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
              <span className="text-slate-400 block mb-1">Attached Officer Note:</span>
              <p className="text-slate-200 font-medium">
                {notes ? notes : <span className="italic text-slate-500">No notes provided</span>}
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              This action will be permanently recorded in the immutable audit trail with your credential signature.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmModalAction(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30"
              >
                {isSubmitting ? "Recording..." : "Confirm & Sign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
