import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, id, className = "", ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-black uppercase tracking-wider text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-ink/60">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : undefined}
            className={`w-full rounded-xl border-2 border-ink bg-[#FFFDF7] py-2.5 px-3.5 text-xs font-bold text-ink placeholder:text-ink/40 shadow-neo-sm focus:shadow-neo focus:outline-none transition-all disabled:opacity-50 ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${
              error ? "border-coral bg-coral-50 focus:border-coral" : ""
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 pointer-events-none text-ink/60">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[11px] font-bold text-coral flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
