import { type ElementType } from "react";
import { cn } from "@/lib/utils";

export interface SettingsRibbonAction {
  key: string;
  label: string;
  icon: ElementType;
  onClick?: () => void;
  disabled?: boolean;
}

interface SettingsRibbonProps {
  actions: SettingsRibbonAction[];
  className?: string;
}

export function SettingsRibbon({ actions, className }: SettingsRibbonProps) {
  return (
    <div className={cn("rounded-md border border-border bg-background", className)}>
      <div className="flex min-h-16 items-stretch overflow-x-auto bg-secondary/50 px-2 py-1">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div key={action.key} className="flex items-stretch">
              <button
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "flex w-24 flex-col items-center justify-center gap-1 px-2 py-1 text-foreground/80 transition-colors",
                  "hover:bg-secondary hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-center text-[11px] leading-tight">{action.label}</span>
              </button>
              {index < actions.length - 1 && <div className="my-2 w-px bg-border/70" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
