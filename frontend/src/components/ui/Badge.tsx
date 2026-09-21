import React from "react";
import { AlertCircle, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { ReviewPriority, CaseStatus } from "../../types";

export type BadgeVariant =
  | "coral"
  | "orange"
  | "mint"
  | "lavender"
  | "blue"
  | "cream"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  priority?: ReviewPriority;
  status?: CaseStatus;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "cream",
  priority,
  status,
  size = "md",
  icon,
  ...props
}) => {
  // If priority is specified, map to semantic styling and icon
  if (priority) {
    switch (priority) {
      case "HIGH_PRIORITY_REVIEW":
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg bg-coral px-2.5 py-1 text-xs font-black text-white border-2 border-ink shadow-[1.5px_1.5px_0_#171717] ${className}`}
            {...props}
          >
            <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" />
            {children || "HIGH PRIORITY"}
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg bg-orange px-2.5 py-1 text-xs font-black text-ink border-2 border-ink shadow-[1.5px_1.5px_0_#171717] ${className}`}
            {...props}
          >
            <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" />
            {children || "NEEDS REVIEW"}
          </span>
        );
      case "LOW_CONCERN":
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg bg-mint px-2.5 py-1 text-xs font-black text-ink border-2 border-ink shadow-[1.5px_1.5px_0_#171717] ${className}`}
            {...props}
          >
            <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
            {children || "LOW CONCERN"}
          </span>
        );
    }
  }

  // If status is specified, map to semantic status indicator
  if (status) {
    switch (status) {
      case "COMPLETED":
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md bg-mint/50 px-2 py-0.5 text-xs font-bold text-ink border border-ink ${className}`}
            {...props}
          >
            {children || "Completed"}
          </span>
        );
      case "ESCALATED":
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md bg-coral/20 px-2 py-0.5 text-xs font-bold text-coral-700 border border-ink ${className}`}
            {...props}
          >
            {children || "Escalated"}
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md bg-orange/40 px-2 py-0.5 text-xs font-bold text-ink border border-ink ${className}`}
            {...props}
          >
            {children || "Awaiting Review"}
          </span>
        );
      case "PROCESSING":
      default:
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md bg-blue/40 px-2 py-0.5 text-xs font-bold text-ink border border-ink ${className}`}
            {...props}
          >
            <Clock className="h-3 w-3 animate-spin stroke-[2.5]" />
            {children || "Processing"}
          </span>
        );
    }
  }

  const baseStyles =
    "inline-flex items-center font-extrabold uppercase tracking-wider rounded-lg border-2 border-ink shadow-[1.5px_1.5px_0_#171717]";

  const variantStyles: Record<BadgeVariant, string> = {
    coral: "bg-coral text-white",
    orange: "bg-orange text-ink",
    mint: "bg-mint text-ink",
    lavender: "bg-lavender text-ink",
    blue: "bg-blue text-ink",
    cream: "bg-[#FFFDF7] text-ink",
    outline: "bg-white text-ink",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1 border",
    md: "px-2.5 py-1 text-xs gap-1.5 border-2",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
      {icon}
      {children}
    </span>
  );
};
