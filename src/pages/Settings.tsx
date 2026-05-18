import { useRef, useState } from "react";
import { ArrowLeft, Download, Plus, Search, Upload, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";

const Settings = () => {
  const [activeGroup, setActiveGroup] = useState<string | undefined>();
  const [showPermissionLevels, setShowPermissionLevels] = useState(false);
  const [showActionPlanTemplates, setShowActionPlanTemplates] = useState(false);
  const [showActionPlanDisciplines, setShowActionPlanDisciplines] =
    useState(false);
  const templatesRef = useRef<ActionPlanTemplatesHandle | null>(null);
  const disciplinesRef = useRef<ActionPlanDisciplinesHandle | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [disciplineSearchQuery, setDisciplineSearchQuery] = useState("");

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

  const searchQuery = showActionPlanTemplates
    ? templateSearchQuery
    : showActionPlanDisciplines
      ? disciplineSearchQuery
      : "";

  const setSearchQuery = showActionPlanTemplates
    ? setTemplateSearchQuery
    : showActionPlanDisciplines
      ? setDisciplineSearchQuery
      : null;

  const searchPlaceholder = showActionPlanTemplates
    ? "Handlungsvorlagen suchen"
    : showActionPlanDisciplines
      ? "Disziplinen suchen"
      : "";

  const ribbonSearch = setSearchQuery ? (
    <div className="relative w-[min(24rem,calc(100vw-2rem))]">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-9 bg-background pl-9 pr-9"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Suche zurücksetzen"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  ) : null;

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
        {subPageTitle && (
          <SettingsRibbon
            actions={ribbonActions}
            trailingContent={ribbonSearch}
          />
        )}
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
                <ActionPlanTemplatesView
                  ref={templatesRef}
                  searchQuery={templateSearchQuery}
                />
              ) : (
                <ActionPlanDisciplinesView
                  ref={disciplinesRef}
                  searchQuery={disciplineSearchQuery}
                />
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
                    (catId === "handlungsplanung" &&
                      (label === "Berechtigungsstufen" ||
                        label === "Kategorien")) ||
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
