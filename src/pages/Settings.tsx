import { useRef, useState } from "react";
import { ArrowLeft, Download, Plus, Upload } from "lucide-react";
import { SettingsTopBar } from "@/components/settings/SettingsTopBar";
import { SettingsCategorySidebar } from "@/components/settings/SettingsCategorySidebar";
import { SettingsGrid } from "@/components/settings/SettingsGrid";
import { PermissionLevelsView } from "@/components/settings/PermissionLevelsView";
import {
  ActionPlanTemplatesView,
  type ActionPlanTemplatesHandle,
} from "@/components/settings/ActionPlanTemplatesView";
import {
  ActionPlanDisciplinesView,
  type ActionPlanDisciplinesHandle,
} from "@/components/settings/ActionPlanDisciplinesView";
import {
  SettingsRibbon,
  type SettingsRibbonAction,
} from "@/components/settings/SettingsRibbon";

const Settings = () => {
  const [activeGroup, setActiveGroup] = useState<string | undefined>();
  const [showPermissionLevels, setShowPermissionLevels] = useState(false);
  const [showActionPlanTemplates, setShowActionPlanTemplates] = useState(false);
  const [showActionPlanDisciplines, setShowActionPlanDisciplines] =
    useState(false);
  const templatesRef = useRef<ActionPlanTemplatesHandle | null>(null);
  const disciplinesRef = useRef<ActionPlanDisciplinesHandle | null>(null);

  const handleBackToSettings = () => {
    setShowPermissionLevels(false);
    setShowActionPlanTemplates(false);
    setShowActionPlanDisciplines(false);
  };

  const ribbonActions: SettingsRibbonAction[] = [
    {
      key: "back",
      label: "Zurück",
      icon: ArrowLeft,
      onClick: handleBackToSettings,
      dividerAfter: true,
    },
    ...(showActionPlanTemplates || showActionPlanDisciplines
      ? [
          {
            key: showActionPlanDisciplines ? "new-discipline" : "new-template",
            label: showActionPlanDisciplines ? "Neu" : "Neue Handlungsvorlage",
            icon: Plus,
            onClick: () =>
              showActionPlanDisciplines
                ? disciplinesRef.current?.openCreate()
                : templatesRef.current?.openCreate(),
          } satisfies SettingsRibbonAction,
        ]
      : []),
    ...(showActionPlanTemplates
      ? [
          {
            key: "import-templates",
            label: "Import",
            icon: Download,
            onClick: () => templatesRef.current?.openImport(),
          } satisfies SettingsRibbonAction,
          {
            key: "export-templates",
            label: "Export",
            icon: Upload,
            onClick: () => templatesRef.current?.exportCsv(),
          } satisfies SettingsRibbonAction,
        ]
      : []),
  ];

  const subPageTitle = showPermissionLevels
    ? "Kategorien"
    : showActionPlanTemplates
      ? "Handlungsvorlagen"
      : showActionPlanDisciplines
        ? "Disziplinen"
        : null;

  return (
    <div className="min-h-dvh flex w-full bg-background">
      <SettingsCategorySidebar
        activeId={activeGroup}
        onSelect={(id) => {
          setActiveGroup(id);
          setShowPermissionLevels(false);
          setShowActionPlanTemplates(false);
          setShowActionPlanDisciplines(false);
        }}
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <SettingsTopBar />
        {subPageTitle && <SettingsRibbon actions={ribbonActions} />}
        <div className="flex-1 overflow-y-auto">
          {subPageTitle ? (
            <>
              <div className="bg-[#ededf0] border-b border-border px-6 py-4">
                <h1 className="text-2xl font-light text-foreground">
                  {subPageTitle}
                </h1>
              </div>
              {showPermissionLevels ? (
                <PermissionLevelsView />
              ) : showActionPlanTemplates ? (
                <ActionPlanTemplatesView ref={templatesRef} />
              ) : (
                <ActionPlanDisciplinesView ref={disciplinesRef} />
              )}
            </>
          ) : (
            <div className="p-6 max-w-[1600px] mx-auto">
              <h1 className="text-2xl font-semibold text-foreground mb-6">
                Einstellungen
              </h1>
              <SettingsGrid
                onLinkClick={(catId, label) => {
                  setActiveGroup(catId);
                  if (
                    (catId === "handlungsplanung" && (label === "Berechtigungsstufen" || label === "Kategorien")) ||
                    (catId === "kategorien" && label === "Kategorien")
                  ) {
                    setShowPermissionLevels(true);
                    setShowActionPlanTemplates(false);
                    setShowActionPlanDisciplines(false);
                  }
                  if (
                    catId === "handlungsplanung" &&
                    label === "Handlungsvorlagen"
                  ) {
                    setShowActionPlanTemplates(true);
                    setShowPermissionLevels(false);
                    setShowActionPlanDisciplines(false);
                  }
                  if (catId === "handlungsplanung" && label === "Disziplinen") {
                    setShowActionPlanDisciplines(true);
                    setShowPermissionLevels(false);
                    setShowActionPlanTemplates(false);
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
