import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { SettingsTopBar } from "@/components/settings/SettingsTopBar";
import { SettingsCategorySidebar } from "@/components/settings/SettingsCategorySidebar";
import { SettingsGrid } from "@/components/settings/SettingsGrid";
import { PermissionLevelsView } from "@/components/settings/PermissionLevelsView";

const Settings = () => {
  const [activeGroup, setActiveGroup] = useState<string | undefined>();
  const [showPermissionLevels, setShowPermissionLevels] = useState(false);

  return (
    <div className="min-h-dvh flex w-full bg-background">
      <SettingsCategorySidebar
        activeId={activeGroup}
        onSelect={(id) => {
          setActiveGroup(id);
          setShowPermissionLevels(false);
        }}
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <SettingsTopBar />
        {showPermissionLevels && (
          <div className="flex items-center border-b border-border bg-topbar px-4 py-2 text-topbar-foreground">
            <button
              type="button"
              onClick={() => setShowPermissionLevels(false)}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-topbar-foreground/90 transition-colors hover:text-topbar-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto">
            <h1 className="text-2xl font-semibold text-foreground mb-6">
              {showPermissionLevels ? "Berechtigungsstufen" : "Einstellungen"}
            </h1>
            {showPermissionLevels ? (
              <PermissionLevelsView />
            ) : (
              <SettingsGrid
                onLinkClick={(catId, label) => {
                  setActiveGroup(catId);
                  if (catId === "handlungsplanung" && label === "Berechtigungsstufen") {
                    setShowPermissionLevels(true);
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
