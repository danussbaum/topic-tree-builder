import { Fragment, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TemplateFieldKey =
  | "titel"
  | "beschreibung"
  | "hilfsmittel"
  | "dauer"
  | "personen"
  | "kategorie"
  | "tageszeit"
  | "resultat"
  | "haeufigkeit"
  | "haeufigkeitMonatlich"
  | "hinweise";

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
  { key: "personen", label: "Benötigte Personen", type: "text" },
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
    key: "haeufigkeit",
    label: "Häufigkeit",
    type: "select",
    options: [
      { value: "daily", label: "Täglich" },
      { value: "weekly", label: "Wöchentlich" },
      { value: "monthly", label: "Monatlich" },
    ],
  },
  {
    key: "haeufigkeitMonatlich",
    label: "Monatsmuster",
    type: "select",
    options: [
      { value: "none", label: "Keine Angabe" },
      { value: "first_day", label: "Erster Tag" },
      { value: "first_monday", label: "Erster Montag" },
      { value: "last_day", label: "Letzter Tag" },
      { value: "last_friday", label: "Letzter Freitag" },
    ],
  },
  { key: "hinweise", label: "Hinweise", type: "textarea" },
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
      haeufigkeit: "daily",
      haeufigkeitMonatlich: "none",
      hinweise: "Ressourcenorientiert arbeiten.",
    },
    editable: buildDefaultEditable(true),
  },
];

export const ActionPlanTemplatesView = () => {
  const [templates, setTemplates] = useState<ActionPlanTemplate[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftFields, setDraftFields] = useState<Record<TemplateFieldKey, string>>(buildDefaultFields);
  const [draftEditable, setDraftEditable] = useState<Record<TemplateFieldKey, boolean>>(buildDefaultEditable);

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

  return (
    <div className="space-y-3 rounded-md border border-border bg-[#ededf0] p-4">
      <div className="rounded-md border border-border bg-background">
        <div className="flex items-center gap-1 bg-secondary/60 px-3 py-2">
          <TemplateRibbonButton icon={Plus} label="Neu" onClick={openCreatePanel} />
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vorlagen</h2>

      <div className="overflow-hidden rounded-md border border-border/80">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]"><tr className="border-b border-border/80"><th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Name</th></tr></thead>
          <tbody className="bg-[#f8f8f9]">
            {templates.map((entry) => (
              <tr key={entry.id} className="cursor-pointer border-b border-border/80 even:bg-[#f0f0f2] hover:bg-[#d6e2f4]" onClick={() => openEditPanel(entry.id)}>
                <td className="px-4 py-2 text-[13px] text-foreground">{entry.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  const control = field.type === "textarea" ? (
                    <Textarea value={draftFields[field.key]} onChange={(event) => setDraftFields((prev) => ({ ...prev, [field.key]: event.target.value }))} rows={3} />
                  ) : field.type === "select" ? (
                    <Select value={draftFields[field.key]} onValueChange={(value) => setDraftFields((prev) => ({ ...prev, [field.key]: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{field.options?.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                    </Select>
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
              <Button type="button" variant="ghost" onClick={closePanel} className="text-white hover:bg-white/10 hover:text-white">Abbrechen</Button>
              <div className="flex items-center gap-2">
                {!isCreating && <Button type="button" variant="ghost" onClick={deleteSelectedTemplate} className="text-white hover:bg-white/10 hover:text-white">Löschen</Button>}
                <Button type="button" variant="ghost" onClick={saveTemplate} className="text-white hover:bg-white/10 hover:text-white">Speichern</Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

function TemplateRibbonButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-24 flex-col items-center justify-center gap-0.5 rounded px-2 py-1.5 text-foreground/80 transition-colors",
        "hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-center text-[11px] font-medium leading-tight whitespace-normal break-words">{label}</span>
    </button>
  );
}
