import { useState } from "react";
import { SettingsTopBar } from "@/components/settings/SettingsTopBar";
import { SettingsCategorySidebar } from "@/components/settings/SettingsCategorySidebar";
import { SettingsGrid } from "@/components/settings/SettingsGrid";
import { PermissionLevelsView } from "@/components/settings/PermissionLevelsView";
import { ActionPlanTemplatesView } from "@/components/settings/ActionPlanTemplatesView";

const Settings = () => {
  const [activeGroup, setActiveGroup] = useState<string | undefined>();
  const [showPermissionLevels, setShowPermissionLevels] = useState(false);
  const [showActionPlanTemplates, setShowActionPlanTemplates] = useState(false);
  const handleBackToSettings = () => {
    setShowPermissionLevels(false);
    setShowActionPlanTemplates(false);
  };

  return (
    <div className="min-h-dvh flex w-full bg-background">
      <SettingsCategorySidebar
        activeId={activeGroup}
        onSelect={(id) => {
          setActiveGroup(id);
          setShowPermissionLevels(false);
          setShowActionPlanTemplates(false);
        }}
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <SettingsTopBar />
        <div className="flex-1 overflow-y-auto">
          {showPermissionLevels || showActionPlanTemplates ? (
            <div className="px-6 pb-6 pt-0 max-w-[1600px] mx-auto">
              {showPermissionLevels ? (
                <PermissionLevelsView onBack={handleBackToSettings} />
              ) : (
                <ActionPlanTemplatesView onBack={handleBackToSettings} />
              )}
            </div>
          ) : (
            <div className="p-6 max-w-[1600px] mx-auto">
              <h1 className="text-2xl font-semibold text-foreground mb-6">Einstellungen</h1>
              <SettingsGrid
                onLinkClick={(catId, label) => {
                  setActiveGroup(catId);
                  if (catId === "handlungsplanung" && label === "Berechtigungsstufen") {
                    setShowPermissionLevels(true);
                    setShowActionPlanTemplates(false);
                  }
                  if (catId === "handlungsplanung" && label === "Vorlagen") {
                    setShowActionPlanTemplates(true);
                    setShowPermissionLevels(false);
                  }
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
