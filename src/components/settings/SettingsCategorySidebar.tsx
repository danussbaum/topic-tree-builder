import { ChevronRight } from "lucide-react";
import { settingsSidebarGroups } from "./settingsData";

interface SettingsCategorySidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

/**
 * Left navigation listing settings groups, mimicking the secondary sidebar
 * shown on the original settings screen.
 */
export const SettingsCategorySidebar = ({
  activeId,
  onSelect,
}: SettingsCategorySidebarProps) => {
  return (
    <aside
      aria-label="Einstellungs-Kategorien"
      className="hidden md:flex w-64 shrink-0 flex-col bg-topbar-active text-topbar-active-foreground border-r border-border overflow-y-auto"
    >
      <ul className="py-2">
        {settingsSidebarGroups.map((group) => {
          const isActive = group.id === activeId;
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onSelect?.(group.id)}
                className={
                  "w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left transition-colors " +
                  (isActive
                    ? "bg-background/15 font-medium"
                    : "hover:bg-background/10")
                }
              >
                <span className="truncate">{group.label}</span>
                <ChevronRight className="h-4 w-4 opacity-70 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
