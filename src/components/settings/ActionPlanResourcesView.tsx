import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DisciplineMultiSelect } from "@/components/settings/DisciplineMultiSelect";
import { loadActionPlanDisciplines } from "@/lib/action-plan-disciplines";
import {
  loadActionPlanResources,
  saveActionPlanResources,
  type ActionPlanResource,
} from "@/lib/action-plan-resources";

export interface ActionPlanResourcesHandle {
  openCreate: () => void;
  exportCsv: () => void;
  openImport: () => void;
}

interface ActionPlanResourcesViewProps {
  searchQuery: string;
}

const CSV_HEADERS = ["Name", "Beschreibung", "Disziplinen"];

const escapeCsvValue = (value: string) =>
  value.includes(";") || value.includes("\n") || value.includes('"')
    ? `"${value.replaceAll('"', '""')}"`
    : value;

export const ActionPlanResourcesView = forwardRef<
  ActionPlanResourcesHandle,
  ActionPlanResourcesViewProps
>(({ searchQuery }, ref) => {
  const [resources, setResources] = useState<ActionPlanResource[]>(() =>
    loadActionPlanResources(),
  );
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftDisciplineIds, setDraftDisciplineIds] = useState<string[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [filePickerKey, setFilePickerKey] = useState(0);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const disciplineOptions = loadActionPlanDisciplines();

  const selectedResource = useMemo(
    () => resources.find((entry) => entry.id === selectedResourceId) ?? null,
    [resources, selectedResourceId],
  );

  const visibleResources = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("de");
    const filtered = resources.filter((entry) =>
      entry.name.toLocaleLowerCase("de").includes(query),
    );
    const sorted = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, "de", { sensitivity: "base" }),
    );
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [resources, searchQuery, sortDirection]);

  useEffect(() => {
    if (!isPanelMounted) return;
    const frame = requestAnimationFrame(() => setIsPanelOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelMounted]);

  useEffect(() => {
    saveActionPlanResources(resources);
  }, [resources]);

  const disciplineLabels = (disciplineIds: string[]) =>
    disciplineIds
      .map((id) => disciplineOptions.find((entry) => entry.id === id)?.title ?? id)
      .join(", ");

  const openCreatePanel = () => {
    setIsCreating(true);
    setSelectedResourceId(null);
    setDraftName("Neues Hilfsmittel");
    setDraftDescription("");
    setDraftDisciplineIds([]);
    setIsPanelMounted(true);
  };

  const openEditPanel = (resourceId: string) => {
    const resource = resources.find((entry) => entry.id === resourceId);
    if (!resource) return;
    setIsCreating(false);
    setSelectedResourceId(resourceId);
    setDraftName(resource.name);
    setDraftDescription(resource.description);
    setDraftDisciplineIds(resource.disciplineIds);
    setIsPanelMounted(true);
  };

  const closePanel = () => setIsPanelOpen(false);

  const handlePanelAnimationEnd = () => {
    if (isPanelOpen) return;
    setIsPanelMounted(false);
    setIsCreating(false);
    setSelectedResourceId(null);
  };

  const saveResource = () => {
    const name = draftName.trim() || "Neues Hilfsmittel";
    if (isCreating) {
      setResources((prev) => [
        ...prev,
        {
          id: `resource-${Date.now()}`,
          name,
          description: draftDescription,
          disciplineIds: draftDisciplineIds,
        },
      ]);
      closePanel();
      return;
    }
    if (!selectedResource) return;
    setResources((prev) =>
      prev.map((entry) =>
        entry.id === selectedResource.id
          ? { ...entry, name, description: draftDescription, disciplineIds: draftDisciplineIds }
          : entry,
      ),
    );
    closePanel();
  };

  const deleteSelectedResource = () => {
    if (!selectedResourceId) return;
    setResources((prev) => prev.filter((entry) => entry.id !== selectedResourceId));
    closePanel();
  };

  const openImportPicker = () => {
    const input = document.getElementById(
      "resources-import-input",
    ) as HTMLInputElement | null;
    input?.click();
  };

  const importResourcesCsv = async (file: File) => {
    const text = await file.text();
    const utf8Bom = "﻿";
    const normalized = text.startsWith(utf8Bom) ? text.slice(1) : text;
    const rows = normalized
      .split(/\r?\n/)
      .filter((row) => row.trim() !== "")
      .map((row) => row.split(";").map((cell) => cell.trim()));

    const errors: string[] = [];
    const imported: ActionPlanResource[] = [];

    rows.slice(1).forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 2;
      const name = row[0]?.trim() ?? "";
      if (!name) {
        errors.push(`Zeile ${rowNumber}: Name fehlt`);
        return;
      }
      const disciplineNames = (row[2] ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      const disciplineIds: string[] = [];
      disciplineNames.forEach((title) => {
        const match = disciplineOptions.find(
          (entry) => entry.title.localeCompare(title, "de", { sensitivity: "base" }) === 0,
        );
        if (!match) errors.push(`Zeile ${rowNumber}: unbekannte Disziplin "${title}"`);
        else if (!disciplineIds.includes(match.id)) disciplineIds.push(match.id);
      });

      imported.push({
        id: `resource-${Date.now()}-${rowIndex}`,
        name,
        description: row[1] ?? "",
        disciplineIds,
      });
    });

    setImportErrors(errors);
    if (imported.length > 0) setResources(imported);
    setFilePickerKey((prev) => prev + 1);
  };

  const exportResourcesCsv = () => {
    const rows = resources.map((resource) => [
      resource.name,
      resource.description,
      disciplineLabels(resource.disciplineIds),
    ]);
    const csvContent = [CSV_HEADERS, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(String(cell ?? ""))).join(";"))
      .join("\n");
    const blob = new Blob(["﻿", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hilfsmittel.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(ref, () => ({
    openCreate: openCreatePanel,
    exportCsv: exportResourcesCsv,
    openImport: openImportPicker,
  }));

  return (
    <>
      <input
        key={filePickerKey}
        id="resources-import-input"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) await importResourcesCsv(file);
        }}
      />

      {importErrors.length > 0 && (
        <div className="border-b border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <div className="font-medium">Import mit Fehlern</div>
          <ul className="mt-1 list-disc pl-5">
            {importErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="overflow-hidden border-y border-border/80 bg-background">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]">
            <tr className="border-b border-border/80">
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() =>
                    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                >
                  Hilfsmittel
                  <span aria-hidden="true">{sortDirection === "asc" ? "↑" : "↓"}</span>
                </button>
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
                Beschreibung
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
                Disziplinen
              </th>
            </tr>
          </thead>
          <tbody className="bg-background">
            {visibleResources.map((entry) => (
              <tr
                key={entry.id}
                className="cursor-pointer border-b border-border/80 even:bg-[#f7f7f9] hover:bg-[#d6e2f4]"
                onClick={() => openEditPanel(entry.id)}
              >
                <td className="px-4 py-2 text-[13px] text-foreground">{entry.name}</td>
                <td className="px-4 py-2 text-[13px] text-muted-foreground">
                  {entry.description}
                </td>
                <td className="px-4 py-2 text-[13px] text-muted-foreground">
                  {entry.disciplineIds.length === 0
                    ? "Alle Disziplinen"
                    : disciplineLabels(entry.disciplineIds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isPanelMounted && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isPanelOpen ? "opacity-100" : "opacity-0"}`}
        >
          <aside
            className={`pointer-events-auto flex h-full w-full max-w-4xl flex-col bg-[#F5F5F6] shadow-2xl transition-transform duration-300 ease-out ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
            onTransitionEnd={handlePanelAnimationEnd}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-3xl font-light text-foreground">
                {isCreating ? "Neues Hilfsmittel" : draftName}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-[200px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
                <label className="pt-2 text-sm text-foreground">Name</label>
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
                <span />

                <label className="pt-2 text-sm text-foreground">Beschreibung</label>
                <Textarea
                  rows={3}
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                />
                <span />

                <label className="pt-2 text-sm text-foreground">Disziplinen</label>
                <DisciplineMultiSelect
                  options={disciplineOptions}
                  value={draftDisciplineIds}
                  onChange={setDraftDisciplineIds}
                />
                <span className="pt-2 text-xs text-muted-foreground">
                  leer = alle Disziplinen
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closePanel}
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Abbrechen
                </Button>
                {!isCreating && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={deleteSelectedResource}
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    Löschen
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={saveResource}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                Speichern
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
});
ActionPlanResourcesView.displayName = "ActionPlanResourcesView";
