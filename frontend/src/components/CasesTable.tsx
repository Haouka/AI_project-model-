import React from "react";
import { Search, Filter, ArrowUpRight, ShieldCheck, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { CaseListItem, CaseStatus, ReviewPriority } from "../types";

interface CasesTableProps {
  cases: CaseListItem[];
  onSelectCase: (caseId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  docTypeFilter: string;
  setDocTypeFilter: (type: string) => void;
  onRefresh: () => void;
}

export const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  onSelectCase,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  docTypeFilter,
  setDocTypeFilter,
  onRefresh,
}) => {
  const getPriorityBadge = (priority: ReviewPriority) => {
    switch (priority) {
      case "HIGH_PRIORITY_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            HIGH PRIORITY
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            NEEDS REVIEW
          </span>
        );
      case "LOW_CONCERN":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3" />
            LOW CONCERN
          </span>
        );
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case "COMPLETED":
        return <span className="text-xs font-medium text-emerald-400">Completed</span>;
      case "ESCALATED":
        return <span className="text-xs font-medium text-rose-400">Escalated</span>;
      case "NEEDS_REVIEW":
        return <span className="text-xs font-medium text-amber-300">Awaiting Review</span>;
      case "PROCESSING":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400">
            <Clock className="h-3 w-3 animate-spin" /> Processing
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/40">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-900/80">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Case ID, Name, or Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center space-x-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="">All Document Types</option>
            <option value="PASSPORT">Passport</option>
            <option value="VISA">Visa</option>
            <option value="NATIONAL_ID">National ID</option>
          </select>
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 font-semibold">Case ID</th>
              <th className="py-3 px-4 font-semibold">Document</th>
              <th className="py-3 px-4 font-semibold">Applicant & Identifiers</th>
              <th className="py-3 px-4 font-semibold">Review Priority</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">OCR Confidence</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <p className="text-sm font-medium">No document screening cases found</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Click "Load Demo Fixtures" or "New Screening" to begin analysis.
                  </p>
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className="group cursor-pointer transition-colors hover:bg-slate-800/40"
                >
                  <td className="py-3 px-4 font-mono font-medium text-blue-400">
                    {c.id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-200">{c.document_type}</span>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.title}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{c.applicant_name}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {c.document_number} {c.nationality ? `• ${c.nationality}` : ""}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getPriorityBadge(c.review_priority)}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.overall_confidence > 0.9
                              ? "bg-emerald-400"
                              : c.overall_confidence > 0.8
                              ? "bg-blue-400"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${Math.round((c.overall_confidence || 0.85) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-300">
                        {Math.round((c.overall_confidence || 0.85) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c.id);
                      }}
                      className="inline-flex items-center space-x-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                    >
                      <span>Review</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
