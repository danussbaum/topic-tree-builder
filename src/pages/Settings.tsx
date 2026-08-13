import { useRef, useState } from "react";
import { ArrowLeft, CirclePlus, Search, X } from "lucide-react";
import { CsvIcon } from "@/components/icons/CsvIcon";
import { CsvImportIcon } from "@/components/icons/CsvImportIcon";
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
  ActionPlanResourcesView,
  type ActionPlanResourcesHandle,
} from "@/components/settings/ActionPlanResourcesView";
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
  const [showActionPlanResources, setShowActionPlanResources] = useState(false);
  const templatesRef = useRef<ActionPlanTemplatesHandle | null>(null);
  const disciplinesRef = useRef<ActionPlanDisciplinesHandle | null>(null);
  const resourcesRef = useRef<ActionPlanResourcesHandle | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [disciplineSearchQuery, setDisciplineSearchQuery] = useState("");
  const [resourceSearchQuery, setResourceSearchQuery] = useState("");

  const handleBackToSettings = () => {
    setShowPermissionLevels(false);
    setShowActionPlanTemplates(false);
    setShowActionPlanDisciplines(false);
    setShowActionPlanResources(false);
  };

  /** Nur eine Unterseite ist offen — Auswahl setzt die übrigen zurück. */
  const openSubPage = (
    page: "permissions" | "templates" | "disciplines" | "resources",
  ) => {
    setShowPermissionLevels(page === "permissions");
    setShowActionPlanTemplates(page === "templates");
    setShowActionPlanDisciplines(page === "disciplines");
    setShowActionPlanResources(page === "resources");
  };

  const ribbonActions: SettingsRibbonAction[] = [
    {
      key: "back",
      label: "Zurück",
      icon: ArrowLeft,
      onClick: handleBackToSettings,
      dividerAfter: true,
    },
    ...(showActionPlanTemplates ||
    showActionPlanDisciplines ||
    showActionPlanResources
      ? [
          {
            key: showActionPlanDisciplines
              ? "new-discipline"
              : showActionPlanResources
                ? "new-resource"
                : "new-template",
            label: "Neu",
            icon: CirclePlus,
            onClick: () =>
              showActionPlanDisciplines
                ? disciplinesRef.current?.openCreate()
                : showActionPlanResources
                  ? resourcesRef.current?.openCreate()
                  : templatesRef.current?.openCreate(),
          } satisfies SettingsRibbonAction,
        ]
      : []),
    ...(showActionPlanTemplates || showActionPlanResources
      ? [
          {
            key: "import-csv",
            label: "Import",
            icon: CsvImportIcon,
            onClick: () =>
              showActionPlanResources
                ? resourcesRef.current?.openImport()
                : templatesRef.current?.openImport(),
          } satisfies SettingsRibbonAction,
          {
            key: "export-csv",
            label: "Export",
            icon: CsvIcon,
            onClick: () =>
              showActionPlanResources
                ? resourcesRef.current?.exportCsv()
                : templatesRef.current?.exportCsv(),
          } satisfies SettingsRibbonAction,
        ]
      : []),
  ];

  const subPageTitle = showPermissionLevels
    ? "Klassifizierungen"
    : showActionPlanTemplates
      ? "Handlungsvorlagen"
      : showActionPlanDisciplines
        ? "Disziplinen"
        : showActionPlanResources
          ? "Hilfsmittel"
          : null;

  const searchQuery = showActionPlanTemplates
    ? templateSearchQuery
    : showActionPlanDisciplines
      ? disciplineSearchQuery
      : showActionPlanResources
        ? resourceSearchQuery
        : "";

  const setSearchQuery = showActionPlanTemplates
    ? setTemplateSearchQuery
    : showActionPlanDisciplines
      ? setDisciplineSearchQuery
      : showActionPlanResources
        ? setResourceSearchQuery
        : null;

  const searchPlaceholder = showActionPlanTemplates
    ? "Handlungsvorlagen suchen"
    : showActionPlanDisciplines
      ? "Disziplinen suchen"
      : showActionPlanResources
        ? "Hilfsmittel suchen"
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
    <div className="h-dvh flex w-full bg-[#F5F5F6]">
      <SettingsCategorySidebar
        activeId={activeGroup}
        onSelect={(id) => {
          setActiveGroup(id);
          handleBackToSettings();
        }}
      />

      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <SettingsTopBar />
        {subPageTitle && (
          <div className="relative">
            <SettingsRibbon
              actions={ribbonActions}
              trailingContent={ribbonSearch}
            />
          </div>
        )}
        <div className="flex-1 overflow-y-auto bg-[#F5F5F6]">
          {subPageTitle ? (
            <>
              <div className="bg-[#F5F5F6] border-b border-border px-6 py-4">
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
              ) : showActionPlanResources ? (
                <ActionPlanResourcesView
                  ref={resourcesRef}
                  searchQuery={resourceSearchQuery}
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
                  if (catId === "sicherheit" && label === "Klassifizierungen") {
                    openSubPage("permissions");
                  }
                  if (
                    catId === "handlungsplanung" &&
                    label === "Handlungsvorlagen"
                  ) {
                    openSubPage("templates");
                  }
                  if (catId === "handlungsplanung" && label === "Disziplinen") {
                    openSubPage("disciplines");
                  }
                  if (catId === "handlungsplanung" && label === "Hilfsmittel") {
                    openSubPage("resources");
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
