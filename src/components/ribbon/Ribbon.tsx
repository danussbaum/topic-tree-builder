import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared ribbon primitives used by the planning/confirmation view and the
 * settings sub-pages so the toolbar looks identical everywhere.
 */

interface RibbonProps {
  children: ReactNode;
  className?: string;
}

export function Ribbon({ children, className }: RibbonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-3 py-2 bg-secondary/60 border-b border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface RibbonButtonProps {
  icon: ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  highlighted?: boolean;
}

export function RibbonButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  highlighted,
}: RibbonButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-24 flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded transition-colors",
        highlighted
          ? "bg-primary/15 text-foreground ring-1 ring-primary/40 shadow-sm hover:bg-primary/25 disabled:opacity-100"
          : active
            ? "bg-secondary text-foreground shadow-sm disabled:opacity-100"
            : "text-foreground/80 hover:bg-secondary hover:text-foreground",
        "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/80 disabled:cursor-not-allowed",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-center text-[11px] font-medium leading-tight whitespace-normal break-words">
        {label}
      </span>
    </button>
  );
}

export function RibbonDivider() {
  return <div className="w-px h-10 bg-border mx-1" />;
}
