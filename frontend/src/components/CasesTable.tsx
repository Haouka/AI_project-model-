import React from "react";
import { Search, Filter, ArrowUpRight, FileCheck } from "lucide-react";
import { CaseListItem } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

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
}) => {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white overflow-hidden shadow-neo">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b-2 border-ink bg-[#FFFDF7]">
        {/* Search Input */}
        <div className="w-full sm:w-84">
          <Input
            type="text"
            placeholder="Search Case ID, applicant, document number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4 stroke-[2.5]" />}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="hidden sm:flex items-center space-x-1.5 bg-white border-2 border-ink rounded-xl px-2.5 py-1.5 shadow-neo-sm">
            <Filter className="h-3.5 w-3.5 text-ink stroke-[2.5]" />
            <span className="text-xs font-black text-ink uppercase tracking-wider">Filters:</span>
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto"
            aria-label="Filter by case status"
          >
            <option value="">All Statuses</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="ESCALATED">Escalated</option>
          </Select>

          <Select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="w-full sm:w-auto"
            aria-label="Filter by document type"
          >
            <option value="">All Document Types</option>
            <option value="PASSPORT">Passport</option>
            <option value="VISA">Visa</option>
            <option value="NATIONAL_ID">National ID</option>
          </Select>
        </div>
      </div>

      {/* Empty State */}
      {cases.length === 0 ? (
        <div className="py-14 text-center bg-cream/40 p-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange border-2 border-ink shadow-neo-sm mb-3">
            <FileCheck className="h-6 w-6 text-ink stroke-[2.2]" />
          </div>
          <p className="text-sm font-black text-ink">No screening cases found</p>
          <p className="text-xs font-bold text-ink/60 mt-1 max-w-sm mx-auto">
            Click "Load Demo Fixtures" in the header to populate realistic synthetic travel documents, or launch "New Screening".
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List Representation (< md) */}
          <div className="block md:hidden divide-y-2 divide-ink/15">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className="p-4 space-y-3 hover:bg-yellow-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-cream px-2 py-0.5 border-2 border-ink font-mono font-black text-xs shadow-[1px_1px_0_#171717]">
                    {c.id}
                  </span>
                  <Badge priority={c.review_priority} size="sm" />
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-sm text-ink">{c.applicant_name}</div>
                    <div className="text-xs font-bold text-ink/70 font-mono mt-0.5">
                      {c.document_number} {c.nationality ? `• ${c.nationality}` : ""}
                    </div>
                  </div>
                  <Badge status={c.status} size="sm" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">OCR:</span>
                    <div className="w-20 h-2.5 rounded-full bg-cream border-2 border-ink overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.overall_confidence > 0.9
                            ? "bg-mint"
                            : c.overall_confidence > 0.8
                            ? "bg-blue"
                            : "bg-orange"
                        }`}
                        style={{ width: `${Math.round((c.overall_confidence || 0.85) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-ink">
                      {Math.round((c.overall_confidence || 0.85) * 100)}%
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Full Table Representation (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b-2 border-ink bg-[#FFFDF7] text-ink uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-black">Case ID</th>
                  <th className="py-3.5 px-4 font-black">Document</th>
                  <th className="py-3.5 px-4 font-black">Applicant & Identifiers</th>
                  <th className="py-3.5 px-4 font-black">Review Priority</th>
                  <th className="py-3.5 px-4 font-black">Status</th>
                  <th className="py-3.5 px-4 font-black">OCR Confidence</th>
                  <th className="py-3.5 px-4 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/10">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className="group cursor-pointer transition-colors hover:bg-yellow-50/60"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      <span className="rounded bg-cream px-1.5 py-0.5 border border-ink shadow-[1px_1px_0_#171717]">
                        {c.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block font-black text-ink bg-blue/40 border border-ink rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wider mr-1.5">
                        {c.document_type}
                      </span>
                      <span className="text-xs font-bold text-ink/80 truncate max-w-xs">{c.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-ink">{c.applicant_name}</div>
                      <div className="font-mono text-[11px] font-bold text-ink/70">
                        {c.document_number} {c.nationality ? `• ${c.nationality}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge priority={c.review_priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-18 h-2.5 rounded-full bg-cream border-2 border-ink overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              c.overall_confidence > 0.9
                                ? "bg-mint"
                                : c.overall_confidence > 0.8
                                ? "bg-blue"
                                : "bg-orange"
                            }`}
                            style={{ width: `${Math.round((c.overall_confidence || 0.85) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-ink">
                          {Math.round((c.overall_confidence || 0.85) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        rightIcon={<ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c.id);
                        }}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
