import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, children, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-black uppercase tracking-wider text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative inline-block w-full">
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none rounded-xl border-2 border-ink bg-white py-2 pl-3 pr-8 text-xs font-bold text-ink shadow-neo-sm outline-none cursor-pointer focus:shadow-neo transition-all ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink">
            <ChevronDown className="h-4 w-4 stroke-[2.5]" />
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";
