import React, { useEffect, useState } from "react";
import { Database, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";

export const RulesCatalog: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    api.getRules()
      .then((res) => {
        setRules(res.rules || []);
        setVersion(res.active_rule_version || "1.0");
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Rule Definitions & Validation Catalog</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configurable deterministic checks applied across identity documents and Machine Readable Zones.
          </p>
        </div>
        <span className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-blue-400 self-start">
          Rule Set: {version}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 font-semibold">Rule ID</th>
              <th className="py-3 px-4 font-semibold">Document</th>
              <th className="py-3 px-4 font-semibold">Rule Name</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Severity</th>
              <th className="py-3 px-4 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rules.map((r) => (
              <tr key={r.rule_id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-blue-400">{r.rule_id}</td>
                <td className="py-3 px-4 text-slate-300 font-medium">{r.document_type}</td>
                <td className="py-3 px-4 font-semibold text-slate-100">{r.name}</td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{r.category}</td>
                <td className="py-3 px-4">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      r.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {r.severity}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300 text-[11px] leading-relaxed max-w-md">
                  {r.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
