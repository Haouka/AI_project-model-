import React from "react";
import { History, Clock, User, X } from "lucide-react";
import { AuditEventItem } from "../types";
import { Badge } from "./ui/Badge";

interface AuditTrailViewProps {
  caseId?: string;
  events: AuditEventItem[];
  onClose?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ caseId, events, onClose }) => {
  return (
    <div
      className="rounded-2xl border-3 border-ink bg-white overflow-hidden shadow-neo-xl p-6 space-y-4"
      role="region"
      aria-label="Security audit trail ledger"
    >
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-xl bg-blue border-2 border-ink shadow-neo-sm">
            <History className="h-5 w-5 text-ink stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-display text-base font-black text-ink">
              Immutable Security Audit Trail
            </h3>
            <p className="text-xs font-bold text-ink/70">
              {caseId ? `Cryptographically recorded lifecycle for case ${caseId}` : "System-wide activity ledger"}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit trail"
            className="p-1.5 rounded-xl border-2 border-ink bg-white shadow-neo-sm hover:bg-coral hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-1 before:bg-ink">
        {events.length === 0 ? (
          <div className="text-xs font-bold text-ink/50 py-6 text-center">
            No audit records logged yet.
          </div>
        ) : (
          events.map((ev, idx) => (
            <div key={ev.id || idx} className="relative group">
              {/* Dot icon */}
              <div
                className="absolute -left-6.5 top-1.5 h-4 w-4 rounded-full border-2 border-ink bg-coral shadow-[1px_1px_0_#171717] group-hover:scale-125 transition-transform"
                aria-hidden="true"
              />

              <div className="rounded-xl border-2 border-ink bg-[#FFFDF7] p-3.5 text-xs space-y-2 shadow-neo-sm hover:shadow-neo transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="lavender">
                      {ev.action}
                    </Badge>
                    <Badge variant="mint">
                      {ev.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1.5 text-ink/70 text-[11px] font-mono font-bold">
                    <Clock className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
                    <span>{new Date(ev.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] font-bold text-ink/80">
                  <User className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
                  <span>Actor: <strong className="text-ink">{ev.user}</strong></span>
                  {ev.ip_address && (
                    <span className="text-ink/60 font-mono">• IP: {ev.ip_address}</span>
                  )}
                </div>

                {ev.details && Object.keys(ev.details).length > 0 && (
                  <div className="rounded-lg bg-white p-2.5 font-mono text-[10px] font-bold text-ink overflow-x-auto border-2 border-ink shadow-inner">
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
