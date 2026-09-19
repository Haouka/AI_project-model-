import React from "react";
import { History, Shield, Clock, CheckCircle2, User, ChevronRight } from "lucide-react";
import { AuditEventItem } from "../types";

interface AuditTrailViewProps {
  caseId?: string;
  events: AuditEventItem[];
  onClose?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ caseId, events, onClose }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <History className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="text-base font-bold text-white">Immutable Security Audit Trail</h3>
            <p className="text-xs text-slate-400">
              {caseId ? `Cryptographically recorded lifecycle for case ${caseId}` : "System-wide activity ledger"}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {events.length === 0 ? (
          <div className="text-xs text-slate-500 py-6">No audit records logged yet.</div>
        ) : (
          events.map((ev, idx) => (
            <div key={ev.id || idx} className="relative group">
              {/* Dot icon */}
              <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-slate-900 bg-blue-500 group-hover:scale-110 transition-transform" />

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs space-y-1.5 group-hover:border-slate-700 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {ev.action}
                    </span>
                    <span className="text-emerald-400 font-semibold text-[10px] uppercase">
                      {ev.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(ev.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <User className="h-3 w-3" />
                  <span>Actor: <strong className="text-slate-300">{ev.user}</strong></span>
                  {ev.ip_address && (
                    <span className="text-slate-500">• IP: {ev.ip_address}</span>
                  )}
                </div>

                {ev.details && Object.keys(ev.details).length > 0 && (
                  <div className="rounded-lg bg-slate-900/80 p-2 font-mono text-[10px] text-blue-300/80 overflow-x-auto border border-slate-800/60">
                    {JSON.stringify(ev.details, null, 2)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
