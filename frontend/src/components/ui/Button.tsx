import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "coral"
  | "mint"
  | "orange"
  | "blue"
  | "lavender"
  | "outline"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "outline",
      size = "md",
      isLoading = false,
      loading,
      disabled = false,
      leftIcon,
      icon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isSpinning = Boolean(isLoading || loading);
    const leadingIcon = leftIcon || icon;
    const baseStyles =
      "inline-flex items-center justify-center font-black rounded-xl border-2 border-ink transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2";

    const variantStyles: Record<ButtonVariant, string> = {
      coral:
        "bg-coral text-white shadow-neo hover:shadow-neo-lg hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-pressed disabled:opacity-45 disabled:pointer-events-none",
      mint:
        "bg-mint text-ink shadow-neo hover:shadow-neo-lg hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-pressed disabled:opacity-45 disabled:pointer-events-none",
      orange:
        "bg-orange text-ink shadow-neo hover:shadow-neo-lg hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-pressed disabled:opacity-45 disabled:pointer-events-none",
      blue:
        "bg-blue text-ink shadow-neo hover:shadow-neo-lg hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-pressed disabled:opacity-45 disabled:pointer-events-none",
      lavender:
        "bg-lavender text-ink shadow-neo-sm hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-pressed disabled:opacity-45 disabled:pointer-events-none",
      outline:
        "bg-white text-ink shadow-neo-sm hover:bg-cream hover:shadow-neo active:translate-x-[1px] active:translate-y-[1px] active:shadow-neo-pressed disabled:opacity-45 disabled:pointer-events-none",
      ghost:
        "bg-transparent text-ink border-transparent shadow-none hover:bg-black/5 active:bg-black/10 disabled:opacity-45 disabled:pointer-events-none",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-2.5 py-1 text-xs gap-1.5",
      md: "px-3.5 py-2 text-xs gap-2",
      lg: "px-4.5 py-2.5 text-sm gap-2",
      icon: "p-2 text-xs",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isSpinning}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isSpinning ? (
          <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
        ) : (
          leadingIcon
        )}
        {children}
        {!isSpinning && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
