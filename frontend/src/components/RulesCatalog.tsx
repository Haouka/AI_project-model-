import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

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
    <div className="space-y-6" role="region" aria-label="Rule definitions and validation catalog">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-ink pb-4">
        <div>
          <h2 className="font-display text-2xl font-black tracking-tight text-ink">
            Rule Definitions & Validation Catalog
          </h2>
          <p className="text-xs font-bold text-ink/70 mt-1">
            Configurable deterministic checks applied across identity documents and Machine Readable Zones.
          </p>
        </div>
        <Badge variant="lavender" className="self-start text-xs py-1.5 px-3">
          Active Version: {version}
        </Badge>
      </div>

      {/* Desktop Table View */}
      <Card variant="default" className="overflow-hidden hidden md:block">
        <table className="w-full text-left text-xs border-collapse" aria-label="Rules Catalog Table">
          <thead className="border-b-2 border-ink bg-[#FFFDF7] text-ink text-[11px] font-black uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-3.5 px-4">Rule ID</th>
              <th scope="col" className="py-3.5 px-4">Document</th>
              <th scope="col" className="py-3.5 px-4">Rule Name</th>
              <th scope="col" className="py-3.5 px-4">Category</th>
              <th scope="col" className="py-3.5 px-4">Severity</th>
              <th scope="col" className="py-3.5 px-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-ink/10">
            {rules.map((r) => (
              <tr key={r.rule_id} className="hover:bg-yellow-50/60 transition-colors">
                <td className="py-3 px-4 font-mono font-black text-ink">
                  <span className="rounded bg-[#FFFDF7] px-1.5 py-0.5 border border-ink shadow-[1px_1px_0_#171717]">
                    {r.rule_id}
                  </span>
                </td>
                <td className="py-3 px-4 font-extrabold text-ink">
                  <Badge variant="blue">
                    {r.document_type}
                  </Badge>
                </td>
                <td className="py-3 px-4 font-black text-ink">{r.name}</td>
                <td className="py-3 px-4 text-ink font-mono font-bold text-[11px]">{r.category}</td>
                <td className="py-3 px-4">
                  <Badge variant={r.severity === "CRITICAL" ? "coral" : "orange"}>
                    {r.severity}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-ink/80 font-bold text-[11px] leading-relaxed max-w-md">
                  {r.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile Card List View (< md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rules.map((r) => (
          <Card key={r.rule_id} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-xs bg-[#FFFDF7] px-2 py-0.5 rounded border border-ink shadow-[1px_1px_0_#171717]">
                {r.rule_id}
              </span>
              <Badge variant={r.severity === "CRITICAL" ? "coral" : "orange"}>
                {r.severity}
              </Badge>
            </div>
            <div>
              <h4 className="font-black text-ink text-sm">{r.name}</h4>
              <p className="text-xs text-ink/75 font-semibold mt-1 leading-relaxed">{r.description}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-ink/15 text-[11px] font-bold">
              <Badge variant="blue">{r.document_type}</Badge>
              <span className="text-ink/60 font-mono">Category: {r.category}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
