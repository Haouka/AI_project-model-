import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  preventClose?: boolean;
  showCloseButton?: boolean;
  headerIcon?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  preventClose = false,
  showCloseButton = true,
  headerIcon,
}) => {
  // Handle keyboard Escape
  useEffect(() => {
    if (!isOpen || preventClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, preventClose, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  }[maxWidth];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !preventClose && onClose) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/65 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        className={`w-full ${maxWidthClasses} rounded-2xl border-3 border-ink bg-white p-6 sm:p-7 shadow-neo-xl relative space-y-5 my-8`}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between border-b-2 border-ink pb-4 gap-3">
            <div className="flex items-center space-x-3">
              {headerIcon && (
                <div className="p-2 rounded-xl border-2 border-ink shadow-neo-sm">
                  {headerIcon}
                </div>
              )}
              <div>
                {title && (
                  <h2 id="modal-title" className="font-display text-lg sm:text-xl font-black text-ink tracking-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs font-bold text-ink/70 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {showCloseButton && !preventClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-xl border-2 border-ink bg-white text-ink shadow-neo-sm hover:bg-coral hover:text-white transition-all cursor-pointer shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div>{children}</div>
      </div>
    </div>
  );
};
