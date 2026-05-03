import { type ElementType } from "react";
import { Ribbon, RibbonButton, RibbonDivider } from "@/components/ribbon/Ribbon";

export interface SettingsRibbonAction {
  key: string;
  label: string;
  icon: ElementType;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  highlighted?: boolean;
  /** Insert a vertical divider AFTER this action */
  dividerAfter?: boolean;
}

interface SettingsRibbonProps {
  actions: SettingsRibbonAction[];
  className?: string;
}

/**
 * Ribbon used on settings sub-pages. Visually identical to the planning /
 * confirmation ribbon by reusing the shared Ribbon primitives.
 */
export function SettingsRibbon({ actions, className }: SettingsRibbonProps) {
  return (
    <Ribbon className={className}>
      {actions.map((action, idx) => (
        <span key={action.key} className="inline-flex items-center">
          <RibbonButton
            icon={action.icon}
            label={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            active={action.active}
            highlighted={action.highlighted}
          />
          {action.dividerAfter && idx < actions.length - 1 && <RibbonDivider />}
        </span>
      ))}
    </Ribbon>
  );
}
