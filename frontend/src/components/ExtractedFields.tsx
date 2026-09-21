import React from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { ExtractedField } from "../types";
import { Badge } from "./ui/Badge";

interface ExtractedFieldsProps {
  fields: ExtractedField[];
  selectedFieldName?: string | null;
  onSelectField: (fieldName: string) => void;
}

export const ExtractedFields: React.FC<ExtractedFieldsProps> = ({
  fields,
  selectedFieldName,
  onSelectField,
}) => {
  // Separate MRZ lines from visual fields
  const visualFields = fields.filter((f) => !f.is_mrz);
  const mrzFields = fields.filter((f) => f.is_mrz);

  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectField(fieldName);
    }
  };

  return (
    <div
      className="flex flex-col h-full rounded-2xl border-2 border-ink bg-white overflow-hidden shadow-neo"
      role="region"
      aria-label="Extracted document fields and MRZ inspector"
    >
      {/* Header - Aligned to exact 52px height matching DocumentViewer and EvidencePanel */}
      <div className="px-4 py-2 border-b-2 border-ink bg-[#FFFDF7] flex items-center justify-between min-h-[52px]">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-blue border border-ink shadow-[1px_1px_0_#171717]">
            <FileText className="h-4 w-4 text-ink stroke-[2.5]" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-ink">
            Extracted Fields
          </h3>
        </div>
        <Badge variant="cream">
          {visualFields.length} Recognized
        </Badge>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="rounded-xl border-2 border-ink overflow-hidden bg-white shadow-neo-sm">
          <table className="w-full text-left text-xs" aria-label="Extracted visual fields">
            <thead className="border-b-2 border-ink bg-[#FFFDF7] text-ink text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-2.5 px-3">Field</th>
                <th scope="col" className="py-2.5 px-3">Extracted Value</th>
                <th scope="col" className="py-2.5 px-3">Confidence</th>
                <th scope="col" className="py-2.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/15">
              {visualFields.map((f) => {
                const isSelected = selectedFieldName === f.field_name;
                const confPercent = Math.round(f.confidence * 100);

                return (
                  <tr
                    key={f.field_name}
                    tabIndex={0}
                    onClick={() => onSelectField(f.field_name)}
                    onKeyDown={(e) => handleKeyDown(e, f.field_name)}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`${formatFieldName(f.field_name)}: ${f.value || 'Not extracted'}, ${confPercent}% confidence`}
                    className={`cursor-pointer transition-all outline-none focus-visible:bg-yellow-100 ${
                      isSelected
                        ? "bg-orange/30 font-bold shadow-inner"
                        : "hover:bg-yellow-50/70 text-ink"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-ink/75">
                      {formatFieldName(f.field_name)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-ink">
                      {f.value || <span className="text-ink/30 italic">Not extracted</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-14 h-2 rounded-full bg-cream border border-ink overflow-hidden"
                          aria-hidden="true"
                        >
                          <div
                            className={`h-full rounded-full ${
                              confPercent >= 95
                                ? "bg-mint"
                                : confPercent >= 85
                                ? "bg-blue"
                                : "bg-orange"
                            }`}
                            style={{ width: `${confPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-ink">{confPercent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-600 inline-block stroke-[2.5]"
                        aria-label="Verified field"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Machine Readable Zone (MRZ) Inspector Card */}
        {mrzFields.length > 0 && (
          <div className="rounded-xl border-2 border-ink bg-[#FFFDF7] p-3 shadow-neo-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-ink uppercase tracking-wider">
                ICAO 9303 MRZ INSPECTOR
              </span>
              <Badge variant="mint">
                TD3 FORMAT
              </Badge>
            </div>

            <div
              className="bg-white rounded-lg p-2.5 font-mono text-xs font-bold text-ink border-2 border-ink space-y-1 overflow-x-auto select-all shadow-inner"
              aria-label="Machine Readable Zone raw characters"
            >
              {mrzFields.map((mf, idx) => (
                <div key={idx} className="tracking-widest whitespace-nowrap">
                  {mf.value}
                </div>
              ))}
            </div>

            <p className="text-[10px] font-bold text-ink/60 mt-2">
              Encodes document number, nationality, date of birth, expiry date, and composite checksums.
            </p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2.5 px-4 border-t-2 border-ink bg-[#FFFDF7] text-[11px] font-bold text-ink/60">
        Click or press Enter on any field row to trace its coordinates on the document.
      </div>
    </div>
  );
};
