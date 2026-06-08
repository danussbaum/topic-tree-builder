import { HelpCircle } from "lucide-react";
import { ModuleNav } from "@/components/ModuleNav";
import { ApplicationLogoutButton } from "@/components/ApplicationLogoutButton";

export const SettingsTopBar = () => {
  return (
    <div className="flex items-center bg-topbar text-topbar-foreground border-b border-border h-12 pr-2 overflow-hidden">
      <ModuleNav activeLabel="Einstellungen" />
      <div className="flex items-stretch shrink-0">
        <div className="border-l border-border flex items-center">
          <button
            type="button"
            className="p-2 rounded hover:bg-secondary text-muted-foreground"
            aria-label="Hilfe"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="border-l border-r border-border flex items-center">
          <ApplicationLogoutButton />
        </div>
      </div>
    </div>
  );
};
