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
      className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar-background text-sidebar-foreground border-r border-border overflow-y-auto"
    >
      <div className="flex items-center gap-3 px-3 py-3 border-b border-sidebar-border bg-sidebar-primary">
        <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground shrink-0">
          AS
        </div>
        <div className="text-sm font-semibold leading-tight truncate">
          Assessor (GL)
        </div>
      </div>

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
                    ? "bg-sidebar-accent/80 text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-primary")
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
