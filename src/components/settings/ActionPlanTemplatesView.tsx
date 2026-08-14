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
import type { ActionServiceEntry, ActionServiceType } from "@/types/assessment";
import {
  ACTION_SERVICE_TYPE_SELECT_OPTIONS,
  buildDefaultTemplateEditable as buildDefaultEditable,
  buildDefaultTemplateFields as buildDefaultFields,
  buildDefaultTemplateRequired as buildDefaultRequired,
  getTemplateDisciplineLabels,
  getTemplateValidationIssues,
  type ActionPlanTemplate,
  loadActionPlanTemplates,
  normalizeTemplateDisciplineIds,
  normalizeTemplateSelectValue,
  parseTageszeit,
  parseLeistungsarten,
  serializeLeistungsarten,
  parseOptionalLeistungsarten,
  serializeOptionalLeistungsarten,
  resolveTemplateDisciplineIds,
  saveActionPlanTemplates,
  serializeTageszeit,
} from "@/lib/action-plan-templates";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DayPartChipSelector } from "@/components/assessment/DayPartChipSelector";
import {
  scheduleEntriesError,
  scheduleModeOf,
  withPositionalIds,
  type DayPartEntry,
} from "@/lib/day-part-entries";
import { loadActionPlanDisciplines } from "@/lib/action-plan-disciplines";
import { DisciplineMultiSelect } from "@/components/settings/DisciplineMultiSelect";
import { ResourceMultiSelect } from "@/components/settings/ResourceMultiSelect";
import {
  getResourceNames,
  getResourcesForDisciplines,
  loadActionPlanResources,
  parseResourceIds,
  resolveResourceIdsByName,
  serializeResourceIds,
} from "@/lib/action-plan-resources";

type TemplateSortKey = "name" | "kategorie" | "leistungsart" | "wiederholung";

interface TemplateSortState {
  key: TemplateSortKey;
  direction: "asc" | "desc";
}

type TemplateFieldKey =
  | "titel"
  | "beschreibung"
  | "hilfsmittel"
  | "dauer"
  | "personen"
  | "kategorie"
  | "tageszeit"
  | "resultat"
  | "wiederholung"
  | "wiederholungWochentage"
  | "wiederholungMonatlich"
  | "leistungsart"
  | "optionaleLeistungsarten";

interface TemplateFieldMeta {
  key: TemplateFieldKey;
  label: string;
  type: "text" | "textarea" | "select" | "time" | "dayparts" | "leistungsarten" | "optionaleLeistungsarten" | "hilfsmittel";
  options?: Array<{ value: string; label: string }>;
  editable?: boolean;
  /**
   * false = das Feld kann nicht als "zwingend" markiert werden, weil es ohnehin
   * immer Pflicht ist (Wiederholung: ohne sie erscheint keine Handlung in der Umsetzung).
   */
  requirable?: boolean;
}

const templateFieldMeta: TemplateFieldMeta[] = [
  { key: "titel", label: "Titel", type: "text", requirable: false },
  { key: "beschreibung", label: "Beschreibung", type: "textarea" },
  { key: "hilfsmittel", label: "Hilfsmittel", type: "hilfsmittel" },
  { key: "dauer", label: "Geplante Dauer (Min.)", type: "text" },
  { key: "personen", label: "Anz. Personen", type: "text" },
  {
    key: "kategorie",
    label: "Klassifizierung",
    type: "select",
    options: [
      { value: "none", label: "Keine Angabe" },
      { value: "a", label: "KLV A" },
      { value: "b", label: "KLV B" },
      { value: "c", label: "KLV C" },
    ],
  },
  {
    key: "tageszeit",
    label: "Tageszeit",
    type: "dayparts",
    // Es ist immer ein Modus gewählt ("Ohne Zeitangabe" als Vorgabe) und keine
    // Auswahl ist nicht möglich — "zwingend" hätte darum keine Wirkung.
    requirable: false,
  },
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
    requirable: false,
    options: [
      { value: "daily", label: "Täglich" },
      { value: "weekly", label: "Wöchentlich" },
      { value: "monthly", label: "Monatlich" },
      { value: "on_demand", label: "Nach Bedarf" },
    ],
  },
  {
    key: "wiederholungMonatlich",
    label: "Monatliche Regel",
    type: "select",
    requirable: false,
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
    requirable: false,
  },
  {
    key: "leistungsart",
    label: "Leistungsarten",
    type: "leistungsarten",
    editable: false,
  },
  {
    key: "optionaleLeistungsarten",
    label: "Optionale Leistungsarten",
    type: "optionaleLeistungsarten",
    editable: false,
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
  /**
   * Die Zeitangabe wird als eigener Zustand geführt und nicht bei jedem Rendern aus
   * dem Vorlagen-String abgeleitet: Eine neu angelegte, noch leere Uhrzeit lässt sich
   * im String nicht abbilden und verschwände sonst sofort wieder.
   */
  const [draftDayPartEntries, setDraftDayPartEntries] = useState<DayPartEntry[]>([]);
  const [leistungsartenAddError, setLeistungsartenAddError] = useState(false);
  const [leistungsartenSaveError, setLeistungsartenSaveError] = useState(false);
  const [templateSaveErrors, setTemplateSaveErrors] = useState<string[]>([]);
  const [draftEditable, setDraftEditable] =
    useState<Record<TemplateFieldKey, boolean>>(buildDefaultEditable);
  const [draftRequired, setDraftRequired] =
    useState<Record<TemplateFieldKey, boolean>>(buildDefaultRequired);
  const [filePickerKey, setFilePickerKey] = useState(0);
  const [sortState, setSortState] = useState<TemplateSortState>({
    key: "name",
    direction: "asc",
  });
  const disciplineOptions = loadActionPlanDisciplines();
  const resourceOptions = loadActionPlanResources();

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

  const getFieldOptionLabel = (fieldKey: TemplateFieldKey, value?: string) => {
    if (!value || value === "none") return "";
    const field = templateFieldMeta.find((entry) => entry.key === fieldKey);
    return (
      field?.options?.find((option) => option.value === value)?.label ?? value
    );
  };

  const toggleSort = (key: TemplateSortKey) => {
    setSortState((prev) =>
      prev.key === key
        ? { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const renderSortableHeader = (key: TemplateSortKey, label: string) => (
    <button
      type="button"
      className="inline-flex items-center gap-1"
      onClick={() => toggleSort(key)}
    >
      {label}
      {sortState.key === key && (
        <span aria-hidden="true">
          {sortState.direction === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );

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
    const hasUhrzeitColumn = headerRow.some(
      (h) => h.trim().toLocaleLowerCase("de") === "uhrzeit",
    );
    const headerHasColumn = (label: string) =>
      headerRow.some(
        (h) => h.trim().toLocaleLowerCase("de") === label.toLocaleLowerCase("de"),
      );
    const dataRows = rows.slice(1);
    const rowErrors: string[] = [];
    const validRows: ActionPlanTemplate[] = [];

    dataRows.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 2;
      const errors: string[] = [];
      const name = row[0]?.trim() ?? "";

      const nextFields = buildDefaultFields();
      const nextEditable = buildDefaultEditable(true);
      const nextRequired = buildDefaultRequired();
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
        // Ältere Exporte führen auch für die Wiederholungsfelder eine "zwingend"-Spalte.
        // Sie wird noch eingelesen, damit die Spaltenzählung stimmt, aber ignoriert.
        const hasRequiredColumn =
          field.editable !== false &&
          (field.requirable !== false || headerHasColumn(`${field.label} zwingend`));
        const requiredValue = hasRequiredColumn ? (row[columnIndex] ?? "") : "Nein";
        if (hasRequiredColumn) columnIndex += 1;
        nextFields[field.key] = value;

        const allowed = allowedByField.get(field.key);
        if (allowed && !allowed.has(value)) {
          errors.push(`${field.label}: ungültiger Wert "${rawValue}"`);
        }

        if (
          (field.key === "leistungsart" || field.key === "optionaleLeistungsarten") &&
          value &&
          value !== "none"
        ) {
          const validTypes = new Set(
            ACTION_SERVICE_TYPE_SELECT_OPTIONS.filter((o) => o.value !== "none").map((o) => o.value),
          );
          const entries = value.split("|").map((p) => p.trim()).filter(Boolean);
          const invalidTypes = entries
            .map((p) => p.split(":")[0].trim())
            .filter((t) => !validTypes.has(t));
          if (invalidTypes.length > 0) {
            errors.push(`${field.label}: ungültige Leistungsart(en) "${invalidTypes.join(", ")}"`);
          }
        }

        // Hilfsmittel stehen im CSV als Namen — beim Import zurück auf IDs abbilden.
        if (field.key === "hilfsmittel") {
          const { resourceIds, invalidEntries } = resolveResourceIdsByName(
            rawValue,
            resourceOptions,
          );
          nextFields[field.key] = serializeResourceIds(resourceIds);
          if (invalidEntries.length > 0) {
            errors.push(
              `${field.label}: unbekannte Hilfsmittel ${invalidEntries.join(", ")}`,
            );
          }
        }

        if (field.key === "dauer" || field.key === "personen") {
          if (!/^\d+$/.test(value)) {
            errors.push(`${field.label}: muss eine ganze Zahl >= 0 sein`);
          }
        }

        if (field.key === "tageszeit" && hasUhrzeitColumn) {
          // Old CSV format: uhrzeit was a separate column after tageszeit
          const uhrzeitValue = (row[columnIndex] ?? "").trim();
          columnIndex += 1; // uhrzeit value
          columnIndex += 1; // uhrzeit veränderbar
          columnIndex += 1; // uhrzeit zwingend
          if (uhrzeitValue && value && value !== "none") {
            nextFields[field.key] = `${value}(${uhrzeitValue})`;
          }
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
          nextRequired[field.key] = false;
        } else if (field.requirable === false) {
          const editable = normalizeEditable(editableValue);
          if (editable === null) {
            errors.push(
              `${field.label} veränderbar: ungültiger Wert "${editableValue}" (erlaubt: Ja/Nein)`,
            );
          } else {
            nextEditable[field.key] = editable;
          }
          nextRequired[field.key] = false;
        } else {
          const editable = normalizeEditable(editableValue);
          if (editable === null) {
            errors.push(
              `${field.label} veränderbar: ungültiger Wert "${editableValue}" (erlaubt: Ja/Nein)`,
            );
          } else {
            nextEditable[field.key] = editable;
          }
          const required = normalizeEditable(requiredValue);
          if (required === null) {
            errors.push(
              `${field.label} zwingend: ungültiger Wert "${requiredValue}" (erlaubt: Ja/Nein)`,
            );
          } else {
            nextRequired[field.key] = editable === false ? false : required;
          }
        }
      });

      // Name, Bezeichnung und Wiederholung sind zwingend — sonst entstünden
      // Handlungen ohne Bezeichnung oder solche, die nie in der Umsetzung erscheinen.
      getTemplateValidationIssues(name, nextFields, nextEditable).forEach((issue) =>
        errors.push(issue),
      );

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
        required: nextRequired,
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
    const sorted = [...filtered].sort((a, b) => {
      const getSortValue = (template: ActionPlanTemplate) => {
        if (sortState.key === "name") return template.name;
        return getFieldOptionLabel(
          sortState.key,
          template.fields[sortState.key],
        );
      };
      const result = getSortValue(a).localeCompare(getSortValue(b), "de", {
        sensitivity: "base",
      });
      if (result !== 0) return result;
      return a.name.localeCompare(b.name, "de", { sensitivity: "base" });
    });
    return sortState.direction === "asc" ? sorted : sorted.reverse();
  }, [searchQuery, sortState, templates]);

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
    const fields = buildDefaultFields();
    setDraftFields(fields);
    setDraftDayPartEntries(withPositionalIds(parseTageszeit(fields.tageszeit)));
    setDraftEditable(buildDefaultEditable(true));
    setDraftRequired(buildDefaultRequired());
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
    setDraftDayPartEntries(withPositionalIds(parseTageszeit(template.fields.tageszeit)));
    setDraftEditable({ ...template.editable });
    setDraftRequired({ ...buildDefaultRequired(), ...template.required });
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
    const leistungsartenEntries = parseLeistungsarten(draftFields.leistungsart);
    const hasInvalidOrder = leistungsartenEntries.length >= 2 && (
      leistungsartenEntries.slice(0, -1).some((e) => e.maxMinutes == null) ||
      leistungsartenEntries[leistungsartenEntries.length - 1]?.maxMinutes != null
    );
    if (hasInvalidOrder) {
      setLeistungsartenSaveError(true);
      return;
    }
    setLeistungsartenSaveError(false);
    const issues = getTemplateValidationIssues(draftName, draftFields, draftEditable);
    // Eine angelegte, aber leere Uhrzeit darf nicht still als "ohne Zeitangabe" landen.
    const scheduleIssue = scheduleEntriesError(
      draftDayPartEntries,
      scheduleModeOf(draftDayPartEntries),
    );
    if (scheduleIssue) issues.push(`Tageszeit: ${scheduleIssue}`);
    setTemplateSaveErrors(issues);
    if (issues.length > 0) return;
    if (isCreating) {
      setTemplates((prev) => [
        ...prev,
        {
          id: `tpl-${Date.now()}`,
          name: draftName.trim(),
          disciplineIds: draftDisciplineIds,
          fields: draftFields,
          editable: draftEditable,
          required: draftRequired,
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
              name: draftName.trim(),
              disciplineIds: draftDisciplineIds,
              fields: draftFields,
              editable: draftEditable,
              required: draftRequired,
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

  // Hilfsmittel werden im CSV lesbar als Namen geführt, nicht als IDs.
  const templateFieldCsvValue = (
    template: ActionPlanTemplate,
    fieldKey: TemplateFieldKey,
  ) =>
    fieldKey === "hilfsmittel"
      ? getResourceNames(
          parseResourceIds(template.fields.hilfsmittel ?? ""),
          resourceOptions,
        ).join(", ")
      : (template.fields[fieldKey] ?? "");

  const exportTemplatesCsv = () => {
    const headers = [
      "Name",
      "Disziplinen",
      ...templateFieldMeta.flatMap((field) =>
        field.editable === false
          ? [field.label]
          : field.requirable === false
            ? [field.label, `${field.label} veränderbar`]
            : [field.label, `${field.label} veränderbar`, `${field.label} zwingend`],
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
          ? [templateFieldCsvValue(template, field.key)]
          : field.requirable === false
            ? [templateFieldCsvValue(template, field.key), template.editable[field.key] ? "Ja" : "Nein"]
            : [
                templateFieldCsvValue(template, field.key),
                template.editable[field.key] ? "Ja" : "Nein",
                template.editable[field.key] && template.required[field.key] ? "Ja" : "Nein",
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
                {renderSortableHeader("name", "Name")}
              </th>
              <th className="w-32 px-4 py-2 text-left text-xs font-semibold text-foreground">
                {renderSortableHeader("kategorie", "Klassifizierung")}
              </th>
              <th className="w-44 px-4 py-2 text-left text-xs font-semibold text-foreground">
                {renderSortableHeader("leistungsart", "Leistungsart")}
              </th>
              <th className="w-32 px-4 py-2 text-left text-xs font-semibold text-foreground">
                {renderSortableHeader("wiederholung", "Wiederholung")}
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
                <td className="px-4 py-2 text-[13px] text-muted-foreground">
                  {getFieldOptionLabel("kategorie", entry.fields.kategorie)}
                </td>
                <td className="px-4 py-2 text-[13px] text-muted-foreground">
                  {parseLeistungsarten(entry.fields.leistungsart).map((e) => {
                    const label = ACTION_SERVICE_TYPE_SELECT_OPTIONS.find((o) => o.value === e.serviceType)?.label ?? e.serviceType;
                    return e.maxMinutes != null ? `${label} (max. ${e.maxMinutes} Min.)` : label;
                  }).join(" | ") || "–"}
                </td>
                <td className="px-4 py-2 text-[13px] text-muted-foreground">
                  {getFieldOptionLabel("wiederholung", entry.fields.wiederholung) || "–"}
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
                  onChange={(event) => {
                    setDraftName(event.target.value);
                    setTemplateSaveErrors((prev) =>
                      prev.filter((message) => !message.startsWith("Handlungsvorlagenname")),
                    );
                  }}
                  className={cn(
                    templateSaveErrors.some((message) => message.startsWith("Handlungsvorlagenname")) &&
                      "border-destructive",
                  )}
                />
                <span className="pt-2 text-xs text-muted-foreground">
                  immer editierbar
                </span>

                <label className="pt-2 text-sm text-foreground">
                  Disziplin
                </label>
                <DisciplineMultiSelect
                  options={disciplineOptions}
                  value={draftDisciplineIds}
                  onChange={setDraftDisciplineIds}
                />
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
                    field.type === "hilfsmittel" ? (
                      <ResourceMultiSelect
                        options={getResourcesForDisciplines(
                          resourceOptions,
                          draftDisciplineIds,
                        )}
                        value={parseResourceIds(draftFields[field.key])}
                        onChange={(resourceIds) =>
                          setDraftFields((prev) => ({
                            ...prev,
                            [field.key]: serializeResourceIds(resourceIds),
                          }))
                        }
                      />
                    ) : field.type === "textarea" ? (
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
                    ) : field.type === "dayparts" ? (
                      <DayPartChipSelector
                        value={draftDayPartEntries}
                        onChange={(entries: DayPartEntry[]) => {
                          setDraftDayPartEntries(entries);
                          setDraftFields((prev) => ({
                            ...prev,
                            [field.key]: serializeTageszeit(entries),
                          }));
                        }}
                      />
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
                    ) : field.type === "leistungsarten" ? (() => {
                      const entries = parseLeistungsarten(draftFields[field.key]);
                      const setEntries = (next: ActionServiceEntry[]) =>
                        setDraftFields((prev) => ({ ...prev, [field.key]: serializeLeistungsarten(next) }));
                      return (
                        <div className="space-y-2">
                          {entries.map((entry, idx) => {
                            const usedTypes = new Set(entries.filter((_, i) => i !== idx).map((e) => e.serviceType));
                            return (
                            <div key={idx} className="flex items-center gap-1.5">
                              <Select
                                value={entry.serviceType}
                                onValueChange={(v) => {
                                  const next = entries.map((e, i) => i === idx ? { ...e, serviceType: v as ActionServiceType } : e);
                                  setEntries(next);
                                }}
                              >
                                <SelectTrigger className="flex-1 min-w-0"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {ACTION_SERVICE_TYPE_SELECT_OPTIONS.filter((o) => o.value !== "none" && !usedTypes.has(o.value as ActionServiceType)).map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min={1}
                                placeholder="Max. Min."
                                value={entry.maxMinutes ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value === "" ? undefined : Math.max(1, Number(e.target.value));
                                  const next = entries.map((en, i) => i === idx ? { ...en, maxMinutes: v } : en);
                                  setEntries(next);
                                  if (v != null && idx === entries.length - 1) { setLeistungsartenAddError(false); setLeistungsartenSaveError(false); }
                                }}
                                className="w-24"
                              />
                              <div className="flex flex-col gap-0.5">
                                <button type="button" disabled={idx === 0} onClick={() => { const n = [...entries]; [n[idx-1],n[idx]]=[n[idx],n[idx-1]]; setEntries(n); }} className="inline-flex h-4 w-6 items-center justify-center rounded border border-border bg-background text-xs disabled:opacity-30 hover:bg-secondary/60" aria-label="Nach oben">▲</button>
                                <button type="button" disabled={idx === entries.length - 1} onClick={() => { const n = [...entries]; [n[idx+1],n[idx]]=[n[idx],n[idx+1]]; setEntries(n); }} className="inline-flex h-4 w-6 items-center justify-center rounded border border-border bg-background text-xs disabled:opacity-30 hover:bg-secondary/60" aria-label="Nach unten">▼</button>
                              </div>
                              <button type="button" onClick={() => setEntries(entries.filter((_, i) => i !== idx))} className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background hover:bg-destructive/10 hover:text-destructive" aria-label="Entfernen"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                            );
                          })}
                          {leistungsartenAddError && (
                            <p className="text-xs text-destructive">Die letzte Leistungsart benötigt eine Max. Anzahl Minuten, bevor eine weitere hinzugefügt werden kann.</p>
                          )}
                          {(() => {
                            const usedTypes = new Set(entries.map((e) => e.serviceType));
                            const nextType = ACTION_SERVICE_TYPE_SELECT_OPTIONS.find((o) => o.value !== "none" && !usedTypes.has(o.value as ActionServiceType));
                            if (!nextType) return null;
                            return <button type="button" onClick={() => {
                              const last = entries[entries.length - 1];
                              if (last && last.maxMinutes == null) { setLeistungsartenAddError(true); return; }
                              setLeistungsartenAddError(false);
                              setEntries([...entries, { serviceType: nextType.value as ActionServiceType }]);
                            }} className="flex items-center gap-1 text-xs text-primary hover:underline">+ Leistungsart hinzufügen</button>;
                          })()}
                        </div>
                      );
                    })() : field.type === "optionaleLeistungsarten" ? (() => {
                      const selected = parseOptionalLeistungsarten(draftFields[field.key]);
                      const setSelected = (next: ActionServiceType[]) =>
                        setDraftFields((prev) => ({ ...prev, [field.key]: serializeOptionalLeistungsarten(next) }));
                      const availableOptions = ACTION_SERVICE_TYPE_SELECT_OPTIONS.filter((o) => o.value !== "none");
                      return (
                        <div className="space-y-2">
                          {selected.map((serviceType, idx) => {
                            const usedTypes = new Set(selected.filter((_, i) => i !== idx));
                            return (
                              <div key={serviceType} className="flex items-center gap-1.5">
                                <Select
                                  value={serviceType}
                                  onValueChange={(v) =>
                                    setSelected(selected.map((s, i) => (i === idx ? (v as ActionServiceType) : s)))
                                  }
                                >
                                  <SelectTrigger className="flex-1 min-w-0"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {availableOptions
                                      .filter((o) => !usedTypes.has(o.value as ActionServiceType))
                                      .map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <button
                                  type="button"
                                  onClick={() => setSelected(selected.filter((_, i) => i !== idx))}
                                  className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background hover:bg-destructive/10 hover:text-destructive"
                                  aria-label="Entfernen"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                          {(() => {
                            const usedTypes = new Set(selected);
                            const nextType = availableOptions.find((o) => !usedTypes.has(o.value as ActionServiceType));
                            if (!nextType) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => setSelected([...selected, nextType.value as ActionServiceType])}
                                className={cn(
                                  "flex items-center gap-1 text-xs text-primary hover:underline",
                                  // Ohne Einträge ist der Link das erste Element — gleiche Höhe wie das Label.
                                  selected.length === 0 && "pt-2",
                                )}
                              >
                                + Optionale Leistungsart hinzufügen
                              </button>
                            );
                          })()}
                        </div>
                      );
                    })() : field.key === "dauer" || field.key === "personen" ? (
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
                        <div className="flex flex-col gap-1 pt-2">
                          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <Checkbox
                              checked={draftEditable[field.key]}
                              onCheckedChange={(checked) => {
                                const isEditable = checked === true;
                                setDraftEditable((prev) => ({
                                  ...prev,
                                  [field.key]: isEditable,
                                }));
                                if (!isEditable) {
                                  setDraftRequired((prev) => ({
                                    ...prev,
                                    [field.key]: false,
                                  }));
                                }
                              }}
                            />
                            veränderbar
                          </label>
                          {field.requirable !== false && draftEditable[field.key] && (
                            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <Checkbox
                                aria-label={`${field.label} zwingend`}
                                checked={draftRequired[field.key]}
                                onCheckedChange={(checked) =>
                                  setDraftRequired((prev) => ({
                                    ...prev,
                                    [field.key]: checked === true,
                                  }))
                                }
                              />
                              zwingend
                            </label>
                          )}
                        </div>
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
              <div className="flex flex-col items-end gap-1">
                {templateSaveErrors.map((message) => (
                  <p key={message} className="text-xs text-primary-foreground/80">{message}</p>
                ))}
                {leistungsartenSaveError && (
                  <p className="text-xs text-primary-foreground/80">Alle ausser der letzten Leistungsart brauchen eine Max. Zeit — die letzte darf keine haben.</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={saveTemplate}
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Speichern
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
});
ActionPlanTemplatesView.displayName = "ActionPlanTemplatesView";
