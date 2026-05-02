import { useState } from "react";
import { SettingsTopBar } from "@/components/settings/SettingsTopBar";
import { SettingsCategorySidebar } from "@/components/settings/SettingsCategorySidebar";
import { SettingsGrid } from "@/components/settings/SettingsGrid";

const Settings = () => {
  const [activeGroup, setActiveGroup] = useState<string | undefined>();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <SettingsTopBar />
      <div className="flex flex-1 min-h-0 w-full">
        <SettingsCategorySidebar
          activeId={activeGroup}
          onSelect={setActiveGroup}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 max-w-[1600px] mx-auto">
            <h1 className="text-2xl font-semibold text-foreground mb-6">
              Einstellungen
            </h1>
            <SettingsGrid
              onLinkClick={(catId) => setActiveGroup(catId)}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
