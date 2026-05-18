import {
  Fragment,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAY_PART_SELECT_OPTIONS } from "@/types/assessment";
import {
  ACTION_SERVICE_TYPE_SELECT_OPTIONS,
  buildDefaultTemplateEditable as buildDefaultEditable,
  buildDefaultTemplateFields as buildDefaultFields,
  getTemplateDisciplineLabels,
  type ActionPlanTemplate,
  loadActionPlanTemplates,
  normalizeTemplateDisciplineIds,
  normalizeTemplateSelectValue,
  resolveTemplateDisciplineIds,
  saveActionPlanTemplates,
} from "@/lib/action-plan-templates";
import { loadActionPlanDisciplines } from "@/lib/action-plan-disciplines";

type TemplateFieldKey =
  | "titel"
  | "beschreibung"
  | "hilfsmittel"
  | "dauer"
  | "personen"
  | "kategorie"
  | "tageszeit"
  | "uhrzeit"
  | "resultat"
  | "wiederholung"
  | "wiederholungWochentage"
  | "wiederholungMonatlich"
  | "leistungsart";

interface TemplateFieldMeta {
  key: TemplateFieldKey;
  label: string;
  type: "text" | "textarea" | "select" | "time";
  options?: Array<{ value: string; label: string }>;
  editable?: boolean;
}

const templateFieldMeta: TemplateFieldMeta[] = [
  { key: "titel", label: "Titel", type: "text" },
  { key: "beschreibung", label: "Beschreibung", type: "textarea" },
  { key: "hilfsmittel", label: "Hilfsmittel", type: "textarea" },
  { key: "dauer", label: "Geplante Dauer (Min.)", type: "text" },
  { key: "personen", label: "Anz. Personen", type: "text" },
  {
    key: "kategorie",
    label: "Kategorie",
    type: "select",
    options: [
      { value: "none", label: "Keine Angabe" },
      { value: "a", label: "A" },
      { value: "b", label: "B" },
      { value: "c", label: "C" },
    ],
  },
  {
    key: "tageszeit",
    label: "Tageszeit",
    type: "select",
    options: DAY_PART_SELECT_OPTIONS,
  },
  { key: "uhrzeit", label: "Uhrzeit", type: "time" },
  {
    key: "resultat",
    label: "Resultat",
    type: "select",
    options: [
      { value: "none", label: "Kein Resultat" },
      { value: "optional", label: "Resultat optional" },
      { value: "required", label: "Resultat zwingend" },
    ],
  },
  {
    key: "wiederholung",
    label: "Wiederholung",
    type: "select",
    options: [
      { value: "daily", label: "Täglich" },
      { value: "weekly", label: "Wöchentlich" },
      { value: "monthly", label: "Monatlich" },
    ],
  },
  {
    key: "wiederholungMonatlich",
    label: "Monatliche Regel",
    type: "select",
    options: [
      { value: "none", label: "Keine Angabe" },
      { value: "first_day", label: "Erster Tag" },
      { value: "first_weekday", label: "Erster Wochentag" },
      { value: "first_monday", label: "Erster Montag" },
      { value: "last_day", label: "Letzter Tag" },
      { value: "last_weekday", label: "Letzter Wochentag" },
      { value: "last_friday", label: "Letzter Freitag" },
    ],
  },
  {
    key: "wiederholungWochentage",
    label: "Wochentage",
    type: "text",
  },
  {
    key: "leistungsart",
    label: "Leistungsart",
    type: "select",
    editable: false,
    options: ACTION_SERVICE_TYPE_SELECT_OPTIONS,
  },
];

export interface ActionPlanTemplatesHandle {
  openCreate: () => void;
  exportCsv: () => void;
  openImport: () => void;
}

interface ActionPlanTemplatesViewProps {
  searchQuery: string;
}

export const ActionPlanTemplatesView = forwardRef<
  ActionPlanTemplatesHandle,
  ActionPlanTemplatesViewProps
>(({ searchQuery }, ref) => {
  const [templates, setTemplates] = useState<ActionPlanTemplate[]>(() =>
    loadActionPlanTemplates(),
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDisciplineIds, setDraftDisciplineIds] = useState<string[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [draftFields, setDraftFields] =
    useState<Record<TemplateFieldKey, string>>(buildDefaultFields);
  const [draftEditable, setDraftEditable] =
    useState<Record<TemplateFieldKey, boolean>>(buildDefaultEditable);
  const [filePickerKey, setFilePickerKey] = useState(0);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const disciplineOptions = loadActionPlanDisciplines();

  const allowedByField = useMemo(() => {
    const map = new Map<TemplateFieldKey, Set<string>>();
    templateFieldMeta.forEach((field) => {
      if (field.options)
        map.set(
          field.key,
          new Set(field.options.map((option) => option.value)),
        );
    });
    return map;
  }, []);

  const parseCsvRows = (text: string) =>
    text
      .split(/\r?\n/)
      .filter((row) => row.trim() !== "")
      .map((row) => row.split(";").map((cell) => cell.trim()));

  const escapeCsvValue = (value: string) => {
    if (value.includes(";") || value.includes("\n") || value.includes('"')) {
      return `"${value.replaceAll('"', '""')}"`;
    }
    return value;
  };

  const normalizeEditable = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (["ja", "yes", "true", "1"].includes(normalized)) return true;
    if (["nein", "no", "false", "0"].includes(normalized)) return false;
    return null;
  };

  const openImportPicker = () => {
    const input = document.getElementById(
      "templates-import-input",
    ) as HTMLInputElement | null;
    input?.click();
  };

  const importTemplatesCsv = async (file: File) => {
    const text = await file.text();
    const utf8Bom = "\uFEFF";
    const normalizedText = text.startsWith(utf8Bom) ? text.slice(1) : text;
    const rows = parseCsvRows(normalizedText);
    const headerRow = rows[0] ?? [];
    const hasDisciplineColumn =
      headerRow[1]?.toLocaleLowerCase("de") === "disziplinen";
    const dataRows = rows.slice(1);
    const rowErrors: string[] = [];
    const validRows: ActionPlanTemplate[] = [];

    dataRows.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 2;
      const errors: string[] = [];
      const name = row[0]?.trim() ?? "";
      if (!name) errors.push("Name fehlt");

      const nextFields = buildDefaultFields();
      const nextEditable = buildDefaultEditable(true);
      let nextDisciplineIds: string[] = [];

      let columnIndex = 1;
      if (hasDisciplineColumn) {
        const { disciplineIds, invalidEntries } = resolveTemplateDisciplineIds(
          row[columnIndex] ?? "",
          disciplineOptions,
        );
        nextDisciplineIds = disciplineIds;
        if (invalidEntries.length > 0) {
          errors.push(
            `Disziplinen: unbekannte Werte ${invalidEntries.join(", ")}`,
          );
        }
        columnIndex += 1;
      }
      templateFieldMeta.forEach((field) => {
        const rawValue = row[columnIndex] ?? "";
        columnIndex += 1;
        const value = field.options
          ? normalizeTemplateSelectValue(rawValue, field.options)
          : rawValue;
        const editableValue =
          field.editable === false ? "Nein" : (row[columnIndex] ?? "");
        if (field.editable !== false) columnIndex += 1;
        nextFields[field.key] = value;

        const allowed = allowedByField.get(field.key);
        if (allowed && !allowed.has(value)) {
          errors.push(`${field.label}: ungültiger Wert "${rawValue}"`);
        }

        if (field.key === "dauer" || field.key === "personen") {
          if (!/^\d+$/.test(value)) {
            errors.push(`${field.label}: muss eine ganze Zahl >= 0 sein`);
          }
        }

        if (
          field.key === "uhrzeit" &&
          value &&
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
        ) {
          errors.push(`${field.label}: muss im Format HH:mm sein`);
        }

        if (field.key === "wiederholungWochentage" && value) {
          const days = value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean);
          const allowedDays = new Set([
            "mon",
            "tue",
            "wed",
            "thu",
            "fri",
            "sat",
            "sun",
          ]);
          const invalid = days.filter((day) => !allowedDays.has(day));
          if (invalid.length > 0)
            errors.push(
              `${field.label}: ungültige Wochentage ${invalid.join(", ")}`,
            );
        }

        if (field.editable === false) {
          nextEditable[field.key] = false;
        } else {
          const editable = normalizeEditable(editableValue);
          if (editable === null) {
            errors.push(
              `${field.label} veränderbar: ungültiger Wert "${editableValue}" (erlaubt: Ja/Nein)`,
            );
          } else {
            nextEditable[field.key] = editable;
          }
        }
      });

      if (errors.length > 0) {
        rowErrors.push(`Zeile ${rowNumber}: ${errors.join("; ")}`);
        return;
      }

      const existing = templates.find((template) => template.name === name);
      validRows.push({
        id: existing?.id ?? `tpl-${Date.now()}-${rowIndex}`,
        name,
        disciplineIds: nextDisciplineIds,
        fields: nextFields,
        editable: nextEditable,
      });
    });

    setImportErrors(rowErrors);
    if (validRows.length === 0) return;

    setTemplates((prev) => {
      const byName = new Map(prev.map((tpl) => [tpl.name, tpl]));
      validRows.forEach((tpl) => byName.set(tpl.name, tpl));
      return Array.from(byName.values());
    });
  };

  const selectedTemplate = useMemo(
    () => templates.find((entry) => entry.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const visibleTemplates = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("de");
    const filtered = templates.filter((entry) =>
      entry.name.toLocaleLowerCase("de").includes(query),
    );
    const sorted = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, "de", { sensitivity: "base" }),
    );
    return sortDirection === "asc" ? sorted : sorted.reverse();
  }, [searchQuery, sortDirection, templates]);

  useEffect(() => {
    if (!isPanelMounted) return;
    const frame = requestAnimationFrame(() => setIsPanelOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelMounted]);

  const openCreatePanel = () => {
    setIsCreating(true);
    setSelectedTemplateId(null);
    setDraftName("Neue Handlungsvorlage");
    setDraftDisciplineIds([]);
    setDraftFields(buildDefaultFields());
    setDraftEditable(buildDefaultEditable(true));
    setIsPanelMounted(true);
  };

  const openEditPanel = (templateId: string) => {
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;
    setIsCreating(false);
    setSelectedTemplateId(templateId);
    setDraftName(template.name);
    setDraftDisciplineIds(
      normalizeTemplateDisciplineIds(template.disciplineIds, disciplineOptions),
    );
    setDraftFields({ ...template.fields });
    setDraftEditable({ ...template.editable });
    setIsPanelMounted(true);
  };

  const closePanel = () => setIsPanelOpen(false);
  const handlePanelAnimationEnd = () => {
    if (isPanelOpen) return;
    setIsPanelMounted(false);
    setIsCreating(false);
    setSelectedTemplateId(null);
  };

  const saveTemplate = () => {
    if (isCreating) {
      setTemplates((prev) => [
        ...prev,
        {
          id: `tpl-${Date.now()}`,
          name: draftName.trim() || "Neue Handlungsvorlage",
          disciplineIds: draftDisciplineIds,
          fields: draftFields,
          editable: draftEditable,
        },
      ]);
      closePanel();
      return;
    }
    if (!selectedTemplate) return;
    setTemplates((prev) =>
      prev.map((entry) =>
        entry.id === selectedTemplate.id
          ? {
              ...entry,
              name: draftName.trim() || entry.name,
              disciplineIds: draftDisciplineIds,
              fields: draftFields,
              editable: draftEditable,
            }
          : entry,
      ),
    );
    closePanel();
  };

  const deleteSelectedTemplate = () => {
    if (!selectedTemplateId) return;
    setTemplates((prev) =>
      prev.filter((entry) => entry.id !== selectedTemplateId),
    );
    closePanel();
  };

  const exportTemplatesCsv = () => {
    const headers = [
      "Name",
      "Disziplinen",
      ...templateFieldMeta.flatMap((field) =>
        field.editable === false
          ? [field.label]
          : [field.label, `${field.label} veränderbar`],
      ),
    ];

    const rows = templates.map((template) => [
      template.name,
      getTemplateDisciplineLabels(
        template.disciplineIds,
        disciplineOptions,
      ).join(", "),
      ...templateFieldMeta.flatMap((field) =>
        field.editable === false
          ? [template.fields[field.key] ?? ""]
          : [
              template.fields[field.key] ?? "",
              template.editable[field.key] ? "Ja" : "Nein",
            ],
      ),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => escapeCsvValue(String(cell ?? ""))).join(";"),
      )
      .join("\n");
    const utf8Bom = "\uFEFF";
    const blob = new Blob([utf8Bom, csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "handlungsvorlagen_attribute.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    saveActionPlanTemplates(templates);
  }, [templates]);
  useImperativeHandle(ref, () => ({
    openCreate: openCreatePanel,
    exportCsv: exportTemplatesCsv,
    openImport: openImportPicker,
  }));

  return (
    <>
      <input
        id="templates-import-input"
        key={filePickerKey}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await importTemplatesCsv(file);
          setFilePickerKey((prev) => prev + 1);
        }}
      />
      {importErrors.length > 0 && (
        <section className="border-b border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Importfehler</p>
          <ul className="mt-1 list-disc pl-6">
            {importErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="overflow-hidden border-y border-border/80 bg-background">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]">
            <tr className="border-b border-border/80">
              <th className="w-64 px-4 py-2 text-left text-xs font-semibold text-foreground">
                Disziplinen
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
                <button
                  type="button"
                  className="inline-flex items-center gap-1"
                  onClick={() =>
                    setSortDirection((prev) =>
                      prev === "asc" ? "desc" : "asc",
                    )
                  }
                >
                  Name
                  <span aria-hidden="true">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-background">
            {visibleTemplates.map((entry) => (
              <tr
                key={entry.id}
                className="cursor-pointer border-b border-border/80 even:bg-[#f7f7f9] hover:bg-[#d6e2f4]"
                onClick={() => openEditPanel(entry.id)}
              >
                <td className="px-4 py-2 text-[13px] text-muted-foreground">
                  {getTemplateDisciplineLabels(
                    entry.disciplineIds,
                    disciplineOptions,
                  ).join(", ") || "Alle"}
                </td>
                <td className="px-4 py-2 text-[13px] text-foreground">
                  {entry.name}
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
            className={`pointer-events-auto flex h-full w-full max-w-4xl flex-col bg-[#f3f3f5] shadow-2xl transition-transform duration-300 ease-out ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
            onTransitionEnd={handlePanelAnimationEnd}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-3xl font-light text-foreground">
                {isCreating ? "Neue Handlungsvorlage" : draftName}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-[200px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
                <label className="pt-2 text-sm text-foreground">
                  Handlungsvorlagenname
                </label>
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
                <span className="pt-2 text-xs text-muted-foreground">
                  immer editierbar
                </span>

                <label className="pt-2 text-sm text-foreground">
                  Disziplin
                </label>
                <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2">
                  {disciplineOptions.map((discipline) => (
                    <label
                      key={discipline.id}
                      className="inline-flex items-center gap-2 rounded border border-border px-2 py-1 text-xs"
                    >
                      <Checkbox
                        checked={draftDisciplineIds.includes(discipline.id)}
                        onCheckedChange={(checked) => {
                          setDraftDisciplineIds((prev) =>
                            checked === true
                              ? prev.includes(discipline.id)
                                ? prev
                                : [...prev, discipline.id]
                              : prev.filter(
                                  (disciplineId) =>
                                    disciplineId !== discipline.id,
                                ),
                          );
                        }}
                      />
                      {discipline.title}
                    </label>
                  ))}
                </div>
                <span className="pt-2 text-xs text-muted-foreground">
                  leer = alle Disziplinen
                </span>

                {templateFieldMeta.map((field) => {
                  if (
                    field.key === "wiederholungWochentage" &&
                    draftFields.wiederholung !== "weekly"
                  ) {
                    return null;
                  }

                  if (
                    field.key === "wiederholungMonatlich" &&
                    draftFields.wiederholung !== "monthly"
                  ) {
                    return null;
                  }

                  const control =
                    field.type === "textarea" ? (
                      <Textarea
                        value={draftFields[field.key]}
                        onChange={(event) =>
                          setDraftFields((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                        rows={3}
                      />
                    ) : field.type === "select" ? (
                      <Select
                        value={draftFields[field.key]}
                        onValueChange={(value) =>
                          setDraftFields((prev) => ({
                            ...prev,
                            [field.key]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === "time" ? (
                      <Input
                        type="time"
                        value={draftFields[field.key]}
                        onChange={(event) =>
                          setDraftFields((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                    ) : field.key === "wiederholungWochentage" ? (
                      <div className="flex flex-wrap gap-1 select-none">
                        {[
                          { value: "mon", label: "Mo" },
                          { value: "tue", label: "Di" },
                          { value: "wed", label: "Mi" },
                          { value: "thu", label: "Do" },
                          { value: "fri", label: "Fr" },
                          { value: "sat", label: "Sa" },
                          { value: "sun", label: "So" },
                        ].map((weekday) => {
                          const selected = draftFields.wiederholungWochentage
                            .split(",")
                            .filter(Boolean);
                          const isSelected = selected.includes(weekday.value);
                          return (
                            <button
                              key={weekday.value}
                              type="button"
                              onClick={() => {
                                const next = isSelected
                                  ? selected.filter(
                                      (value) => value !== weekday.value,
                                    )
                                  : [...selected, weekday.value];
                                setDraftFields((prev) => ({
                                  ...prev,
                                  wiederholungWochentage: next.join(","),
                                }));
                              }}
                              className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:bg-secondary/60"
                              }`}
                            >
                              {weekday.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : field.key === "dauer" || field.key === "personen" ? (
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={draftFields[field.key]}
                        onChange={(event) =>
                          setDraftFields((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      <Input
                        value={draftFields[field.key]}
                        onChange={(event) =>
                          setDraftFields((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                    );

                  return (
                    <Fragment key={field.key}>
                      <label className="pt-2 text-sm text-foreground">
                        {field.label}
                      </label>
                      <div>{control}</div>
                      {field.editable === false ? (
                        <span aria-hidden="true" />
                      ) : (
                        <label className="inline-flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={draftEditable[field.key]}
                            onCheckedChange={(checked) =>
                              setDraftEditable((prev) => ({
                                ...prev,
                                [field.key]: checked === true,
                              }))
                            }
                          />
                          veränderbar
                        </label>
                      )}
                    </Fragment>
                  );
                })}
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
                    onClick={deleteSelectedTemplate}
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    Löschen
                  </Button>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={saveTemplate}
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
ActionPlanTemplatesView.displayName = "ActionPlanTemplatesView";
