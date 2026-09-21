import React from "react";

export type CardVariant = "default" | "lg" | "flat" | "pastel";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  pastelBg?: "blue" | "orange" | "coral" | "mint" | "lavender" | "cream";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = "",
      variant = "default",
      interactive = false,
      pastelBg,
      ...props
    },
    ref
  ) => {
    let style = "border-2 border-ink bg-white shadow-neo rounded-2xl transition-all";

    if (variant === "lg") {
      style = "border-3 border-ink bg-white shadow-neo-lg rounded-2xl transition-all";
    } else if (variant === "flat") {
      style = "border-2 border-ink bg-white rounded-xl transition-all";
    } else if (variant === "pastel" && pastelBg) {
      const pastelClass = {
        blue: "bg-blue",
        orange: "bg-orange",
        coral: "bg-coral text-white",
        mint: "bg-mint",
        lavender: "bg-lavender",
        cream: "bg-[#FFFDF7]",
      }[pastelBg];
      style = `border-2 border-ink ${pastelClass} shadow-neo rounded-2xl transition-all`;
    }

    const interactiveStyle = interactive
      ? "hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-pressed cursor-pointer"
      : "";

    return (
      <div ref={ref} className={`${style} ${interactiveStyle} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`p-4 border-b-2 border-ink bg-[#FFFDF7] flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3 className={`font-display text-base font-black tracking-tight text-ink ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => <div className={`p-4 ${className}`} {...props}>{children}</div>;
