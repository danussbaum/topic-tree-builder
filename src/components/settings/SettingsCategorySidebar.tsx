import { useState } from "react";
import { ChevronRight, ChevronLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsSidebarGroups } from "./settingsData";

interface SettingsCategorySidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

export const SettingsCategorySidebar = ({
  activeId,
  onSelect,
}: SettingsCategorySidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      aria-label="Einstellungs-Kategorien"
      className={cn(
        "hidden md:flex flex-col bg-white border-r border-border transition-all duration-200 h-full self-stretch",
        collapsed ? "w-12" : "w-64"
      )}
    >
      {/* Profile header */}
      <div
        className={cn("flex items-center gap-3 px-4 h-12 border-b border-border shrink-0", collapsed && "justify-center px-4")}
        style={{ backgroundColor: "#357B60" }}
      >
        <User className="h-5 w-5 shrink-0 text-white" strokeWidth={1.25} />
        {!collapsed && (
          <div className="text-sm leading-tight truncate text-white">
            Assessor (GL)
          </div>
        )}
      </div>


      {/* List */}
      <ul className="py-1 flex-1 overflow-y-auto min-h-0" style={{ backgroundColor: "#666666" }}>
        {settingsSidebarGroups.map((group) => {
          const isActive = group.id === activeId;
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onSelect?.(group.id)}
                title={collapsed ? group.label : undefined}
                className={cn(
                  "w-full flex items-center gap-2 py-2.5 text-sm text-left transition-colors border-b border-border/60 border-l-2",
                  collapsed ? "justify-center px-2" : "justify-between px-4",
                  isActive
                    ? "bg-black/20 text-white border-l-white font-medium"
                    : "border-l-transparent hover:bg-black/10 text-white"
                )}
              >
                {!collapsed && <span className="truncate">{group.label}</span>}
                {!collapsed && <ChevronRight className="h-4 w-4 text-white opacity-70 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="border-t border-border p-3 shrink-0 flex justify-end" style={{ backgroundColor: "#357B60" }}>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 p-1.5 rounded hover:bg-black/10 transition-colors text-white"
          title={collapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
};
