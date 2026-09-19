import React from "react";
import { CheckCircle2, AlertCircle, HelpCircle, FileText, ChevronDown, Check } from "lucide-react";
import { ExtractedField } from "../types";

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

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Extracted Document Fields
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {visualFields.length} fields recognized
        </span>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Field</th>
                <th className="py-2.5 px-3 font-semibold">Extracted Value</th>
                <th className="py-2.5 px-3 font-semibold">Confidence</th>
                <th className="py-2.5 px-2 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {visualFields.map((f) => {
                const isSelected = selectedFieldName === f.field_name;
                const confPercent = Math.round(f.confidence * 100);

                return (
                  <tr
                    key={f.field_name}
                    onClick={() => onSelectField(f.field_name)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-600/20 text-white font-medium ring-1 ring-blue-500/50"
                        : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium text-slate-400">
                      {formatFieldName(f.field_name)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-100">
                      {f.value || <span className="text-slate-600 italic">Not extracted</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              confPercent >= 95
                                ? "bg-emerald-400"
                                : confPercent >= 85
                                ? "bg-blue-400"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${confPercent}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{confPercent}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 inline-block" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Machine Readable Zone (MRZ) Inspector Card */}
        {mrzFields.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                MACHINE READABLE ZONE (ICAO 9303)
              </span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/20">
                TD3 FORMAT
              </span>
            </div>

            <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-xs text-blue-300 border border-slate-800 space-y-1 overflow-x-auto select-all">
              {mrzFields.map((mf, idx) => (
                <div key={idx} className="tracking-widest whitespace-nowrap">
                  {mf.value}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 mt-2">
              Encodes document number, nationality, date of birth, expiry date, and check digits.
            </p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2.5 px-4 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500">
        Click any field row to trace and highlight its source region on the document viewer.
      </div>
    </div>
  );
};
