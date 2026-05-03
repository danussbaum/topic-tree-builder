import { Fragment, forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSimpleXlsxBlob } from "@/lib/xlsx";

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
  | "wiederholungMonatlich";

interface TemplateFieldMeta {
  key: TemplateFieldKey;
  label: string;
  type: "text" | "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
}

interface ActionPlanTemplate {
  id: string;
  name: string;
  fields: Record<TemplateFieldKey, string>;
  editable: Record<TemplateFieldKey, boolean>;
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
    options: [
      { value: "none", label: "Keine Angabe" },
      { value: "morning", label: "Morgen" },
      { value: "noon", label: "Mittag" },
      { value: "evening", label: "Abend" },
      { value: "night", label: "Nacht" },
    ],
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
];

const buildDefaultFields = () =>
  templateFieldMeta.reduce(
    (acc, field) => {
      acc[field.key] = field.options?.[0]?.value ?? "";
      return acc;
    },
    {} as Record<TemplateFieldKey, string>,
  );

const buildDefaultEditable = (value = true) =>
  templateFieldMeta.reduce(
    (acc, field) => {
      acc[field.key] = value;
      return acc;
    },
    {} as Record<TemplateFieldKey, boolean>,
  );

const initialTemplates: ActionPlanTemplate[] = [
  {
    id: "tpl-1",
    name: "Morgenroutine",
    fields: {
      titel: "Tagesstart begleiten",
      beschreibung: "Begleitung bei der Morgenhygiene und Planung des Tagesablaufs.",
      hilfsmittel: "Pflegeutensilien bereitstellen.",
      dauer: "20",
      personen: "1",
      kategorie: "a",
      tageszeit: "morning",
      resultat: "required",
      wiederholung: "daily",
      wiederholungMonatlich: "none",
      wiederholungWochentage: "mon,tue,wed,thu,fri",
    },
    editable: buildDefaultEditable(true),
  },
];

export interface ActionPlanTemplatesHandle {
  openCreate: () => void;
  exportExcel: () => void;
  openImport: () => void;
}

export const ActionPlanTemplatesView = forwardRef<ActionPlanTemplatesHandle>((_props, ref) => {
  const [templates, setTemplates] = useState<ActionPlanTemplate[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [draftFields, setDraftFields] = useState<Record<TemplateFieldKey, string>>(buildDefaultFields);
  const [draftEditable, setDraftEditable] = useState<Record<TemplateFieldKey, boolean>>(buildDefaultEditable);
  const [filePickerKey, setFilePickerKey] = useState(0);

  const allowedByField = useMemo(() => {
    const map = new Map<TemplateFieldKey, Set<string>>();
    templateFieldMeta.forEach((field) => {
      if (field.options) map.set(field.key, new Set(field.options.map((option) => option.value)));
    });
    return map;
  }, []);

  const readBlobAsText = async (blob: Blob) => new TextDecoder().decode(await blob.arrayBuffer());

  const getColumnIndexFromCellRef = (cellRef: string) => {
    const letters = cellRef.match(/[A-Z]+/i)?.[0] ?? "A";
    return letters
      .toUpperCase()
      .split("")
      .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;
  };

  const readZipEntries = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const entries = new Map<string, Uint8Array>();
    let offset = 0;

    while (offset + 30 <= bytes.length) {
      const view = new DataView(buffer, offset);
      if (view.getUint32(0, true) !== 0x04034b50) break;
      const method = view.getUint16(8, true);
      const compressedSize = view.getUint32(18, true);
      const nameLength = view.getUint16(26, true);
      const extraLength = view.getUint16(28, true);
      const nameStart = offset + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const dataEnd = dataStart + compressedSize;
      const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLength));
      const compressedData = bytes.slice(dataStart, dataEnd);

      if (method === 0) {
        entries.set(name, compressedData);
      } else if (method === 8) {
        const stream = new Blob([compressedData]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        const inflated = new Uint8Array(await new Response(stream).arrayBuffer());
        entries.set(name, inflated);
      }

      offset = dataEnd;
    }

    return entries;
  };

  const parseSharedStrings = (xml: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    return Array.from(doc.getElementsByTagName("si")).map((entry) =>
      Array.from(entry.getElementsByTagName("t"))
        .map((textNode) => textNode.textContent ?? "")
        .join(""),
    );
  };

  const parseWorksheetRows = (worksheetXml: string, sharedStrings: string[]) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(worksheetXml, "application/xml");
    return Array.from(doc.getElementsByTagName("row")).map((row) => {
      const values: string[] = [];
      Array.from(row.getElementsByTagName("c")).forEach((cell) => {
        const ref = cell.getAttribute("r") ?? "A1";
        const colIndex = getColumnIndexFromCellRef(ref);
        const type = cell.getAttribute("t");
        const inlineText = cell.getElementsByTagName("t")[0]?.textContent;
        const rawValue = cell.getElementsByTagName("v")[0]?.textContent ?? "";

        let resolved = inlineText ?? rawValue;
        if (type === "s") {
          const sharedIndex = Number(rawValue);
          resolved = Number.isInteger(sharedIndex) ? (sharedStrings[sharedIndex] ?? "") : "";
        }

        values[colIndex] = (resolved ?? "").trim();
      });
      return values;
    });
  };

  const normalizeEditable = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (["ja", "yes", "true", "1"].includes(normalized)) return true;
    if (["nein", "no", "false", "0"].includes(normalized)) return false;
    return null;
  };

  const openImportPicker = () => {
    const input = document.getElementById("templates-import-input") as HTMLInputElement | null;
    input?.click();
  };

  const importTemplatesExcel = async (file: File) => {
    const entries = await readZipEntries(file);
    const worksheet = entries.get("xl/worksheets/sheet1.xml");
    if (!worksheet) {
      setImportErrors(["Datei enthält kein erwartetes Tabellenblatt (xl/worksheets/sheet1.xml)."]);
      return;
    }

    const sharedStringsXml = entries.get("xl/sharedStrings.xml");
    const sharedStrings = sharedStringsXml
      ? parseSharedStrings(await readBlobAsText(new Blob([sharedStringsXml])))
      : [];

    const rows = parseWorksheetRows(await readBlobAsText(new Blob([worksheet])), sharedStrings);
    const dataRows = rows.slice(1);
    const rowErrors: string[] = [];
    const validRows: ActionPlanTemplate[] = [];

    dataRows.forEach((row, rowIndex) => {
      const excelRowNumber = rowIndex + 2;
      const errors: string[] = [];
      const name = row[0]?.trim() ?? "";
      if (!name) errors.push("Name fehlt");

      const nextFields = buildDefaultFields();
      const nextEditable = buildDefaultEditable(true);

      templateFieldMeta.forEach((field, index) => {
        const value = row[1 + index * 2] ?? "";
        const editableValue = row[2 + index * 2] ?? "";
        nextFields[field.key] = value;

        const allowed = allowedByField.get(field.key);
        if (allowed && !allowed.has(value)) {
          errors.push(`${field.label}: ungültiger Wert "${value}"`);
        }

        if (field.key === "dauer" || field.key === "personen") {
          if (!/^\d+$/.test(value)) {
            errors.push(`${field.label}: muss eine ganze Zahl >= 0 sein`);
          }
        }

        if (field.key === "wiederholungWochentage" && value) {
          const days = value.split(",").map((entry) => entry.trim()).filter(Boolean);
          const allowedDays = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
          const invalid = days.filter((day) => !allowedDays.has(day));
          if (invalid.length > 0) errors.push(`${field.label}: ungültige Wochentage ${invalid.join(", ")}`);
        }

        const editable = normalizeEditable(editableValue);
        if (editable === null) {
          errors.push(`${field.label} veränderbar: ungültiger Wert "${editableValue}" (erlaubt: Ja/Nein)`);
        } else {
          nextEditable[field.key] = editable;
        }
      });

      if (errors.length > 0) {
        rowErrors.push(`Zeile ${excelRowNumber}: ${errors.join("; ")}`);
        return;
      }

      const existing = templates.find((template) => template.name === name);
      validRows.push({
        id: existing?.id ?? `tpl-${Date.now()}-${rowIndex}`,
        name,
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

  useEffect(() => {
    if (!isPanelMounted) return;
    const frame = requestAnimationFrame(() => setIsPanelOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelMounted]);

  const openCreatePanel = () => {
    setIsCreating(true);
    setSelectedTemplateId(null);
    setDraftName("Neue Vorlage");
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
      setTemplates((prev) => [...prev, { id: `tpl-${Date.now()}`, name: draftName.trim() || "Neue Vorlage", fields: draftFields, editable: draftEditable }]);
      closePanel();
      return;
    }
    if (!selectedTemplate) return;
    setTemplates((prev) => prev.map((entry) => (entry.id === selectedTemplate.id ? { ...entry, name: draftName.trim() || entry.name, fields: draftFields, editable: draftEditable } : entry)));
    closePanel();
  };

  const deleteSelectedTemplate = () => {
    if (!selectedTemplateId) return;
    setTemplates((prev) => prev.filter((entry) => entry.id !== selectedTemplateId));
    closePanel();
  };

  const exportTemplatesExcel = () => {
    const headers = [
      "Name",
      ...templateFieldMeta.flatMap((field) => [field.label, `${field.label} veränderbar`]),
    ];

    const rows = templates.map((template) => [
      template.name,
      ...templateFieldMeta.flatMap((field) => [
        template.fields[field.key] ?? "",
        template.editable[field.key] ? "Ja" : "Nein",
      ]),
    ]);

    const blob = createSimpleXlsxBlob({
      sheetName: "Vorlagen",
      headers,
      rows,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vorlagen_attribute.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(
    ref,
    () => ({ openCreate: openCreatePanel, exportExcel: exportTemplatesExcel, openImport: openImportPicker }),
    [templates],
  );

  return (
    <>
      <input
        id="templates-import-input"
        key={filePickerKey}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await importTemplatesExcel(file);
          setFilePickerKey((prev) => prev + 1);
        }}
      />
      {importErrors.length > 0 && (
        <section className="border-b border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">Importfehler</p>
          <ul className="mt-1 list-disc pl-6">
            {importErrors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </section>
      )}
      <section className="overflow-hidden border-y border-border/80 bg-background">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]"><tr className="border-b border-border/80"><th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Name</th></tr></thead>
          <tbody className="bg-background">
            {templates.map((entry) => (
              <tr key={entry.id} className="cursor-pointer border-b border-border/80 even:bg-[#f7f7f9] hover:bg-[#d6e2f4]" onClick={() => openEditPanel(entry.id)}>
                <td className="px-4 py-2 text-[13px] text-foreground">{entry.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isPanelMounted && (
        <div className={`pointer-events-none fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isPanelOpen ? "opacity-100" : "opacity-0"}`}>
          <aside className={`pointer-events-auto flex h-full w-full max-w-4xl flex-col bg-[#f3f3f5] shadow-2xl transition-transform duration-300 ease-out ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`} onTransitionEnd={handlePanelAnimationEnd}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-3xl font-light text-foreground">{isCreating ? "Neue Vorlage" : draftName}</h2>
              <button type="button" onClick={closePanel} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-[200px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
                <label className="pt-2 text-sm text-foreground">Vorlagenname</label>
                <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                <span className="pt-2 text-xs text-muted-foreground">immer editierbar</span>

                {templateFieldMeta.map((field) => {
                  if (field.key === "wiederholungWochentage" && draftFields.wiederholung !== "weekly") {
                    return null;
                  }

                  if (field.key === "wiederholungMonatlich" && draftFields.wiederholung !== "monthly") {
                    return null;
                  }

                  const control = field.type === "textarea" ? (
                    <Textarea value={draftFields[field.key]} onChange={(event) => setDraftFields((prev) => ({ ...prev, [field.key]: event.target.value }))} rows={3} />
                  ) : field.type === "select" ? (
                    <Select value={draftFields[field.key]} onValueChange={(value) => setDraftFields((prev) => ({ ...prev, [field.key]: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                    </Select>
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
                        const selected = draftFields.wiederholungWochentage.split(",").filter(Boolean);
                        const isSelected = selected.includes(weekday.value);
                        return (
                          <button
                            key={weekday.value}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? selected.filter((value) => value !== weekday.value)
                                : [...selected, weekday.value];
                              setDraftFields((prev) => ({ ...prev, wiederholungWochentage: next.join(",") }));
                            }}
                            className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                              isSelected ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary/60"
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
                      onChange={(event) => setDraftFields((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  ) : (
                    <Input value={draftFields[field.key]} onChange={(event) => setDraftFields((prev) => ({ ...prev, [field.key]: event.target.value }))} />
                  );

                  return (
                    <Fragment key={field.key}>
                      <label className="pt-2 text-sm text-foreground">{field.label}</label>
                      <div>{control}</div>
                      <label className="inline-flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                        <Checkbox checked={draftEditable[field.key]} onCheckedChange={(checked) => setDraftEditable((prev) => ({ ...prev, [field.key]: checked === true }))} />
                        veränderbar
                      </label>
                    </Fragment>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={closePanel} className="text-white hover:bg-white/10 hover:text-white">Abbrechen</Button>
                {!isCreating && <Button type="button" variant="ghost" onClick={deleteSelectedTemplate} className="text-white hover:bg-white/10 hover:text-white">Löschen</Button>}
              </div>
              <Button type="button" variant="ghost" onClick={saveTemplate} className="text-white hover:bg-white/10 hover:text-white">Speichern</Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
});
ActionPlanTemplatesView.displayName = "ActionPlanTemplatesView";
