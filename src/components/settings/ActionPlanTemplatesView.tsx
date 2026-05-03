import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TemplateFieldKey = "titel" | "beschreibung" | "kategorie" | "prioritaet" | "haeufigkeit" | "hinweise";

interface TemplateFieldMeta {
  key: TemplateFieldKey;
  label: string;
  type: "text" | "textarea";
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
  { key: "kategorie", label: "Kategorie", type: "text" },
  { key: "prioritaet", label: "Priorität", type: "text" },
  { key: "haeufigkeit", label: "Häufigkeit", type: "text" },
  { key: "hinweise", label: "Hinweise", type: "textarea" },
];

const buildDefaultFields = () =>
  templateFieldMeta.reduce(
    (acc, field) => {
      acc[field.key] = "";
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
      kategorie: "Alltag",
      prioritaet: "Mittel",
      haeufigkeit: "Täglich",
      hinweise: "Ressourcenorientiert arbeiten.",
    },
    editable: {
      titel: true,
      beschreibung: true,
      kategorie: false,
      prioritaet: true,
      haeufigkeit: false,
      hinweise: true,
    },
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
      setTemplates((prev) => [
        ...prev,
        {
          id: `tpl-${Date.now()}`,
          name: draftName.trim() || "Neue Vorlage",
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
              fields: draftFields,
              editable: draftEditable,
            }
          : entry,
      ),
    );

    closePanel();
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((entry) => entry.id !== templateId));
    if (templateId === selectedTemplateId) {
      setSelectedTemplateId(null);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-[#ededf0] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vorlagen</h2>
        <Button type="button" onClick={openCreatePanel}>Neue Vorlage</Button>
      </div>

      <div className="overflow-hidden rounded-md border border-border/80">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-[#f1f1f3]">
            <tr className="border-b border-border/80">
              <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">Name</th>
              <th className="w-44 px-4 py-2 text-right text-xs font-semibold text-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-[#f8f8f9]">
            {templates.map((entry) => (
              <tr key={entry.id} className="border-b border-border/80 even:bg-[#f0f0f2]">
                <td className="px-4 py-2 text-[13px] text-foreground">{entry.name}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEditPanel(entry.id)}>
                      Bearbeiten
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => deleteTemplate(entry.id)}>
                      Löschen
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPanelMounted && (
        <div className={`pointer-events-none fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isPanelOpen ? "opacity-100" : "opacity-0"}`}>
          <aside
            className={`pointer-events-auto flex h-full w-full max-w-4xl flex-col bg-[#f3f3f5] shadow-2xl transition-transform duration-300 ease-out ${
              isPanelOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onTransitionEnd={handlePanelAnimationEnd}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-3xl font-light text-foreground">{isCreating ? "Neue Vorlage" : draftName}</h2>
              <button type="button" onClick={closePanel} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              <p className="text-sm text-muted-foreground">Die Felder „Datum von“ und „Datum bis“ werden bei der Verwendung in der Handlungsplanung gesetzt.</p>
              <div className="grid grid-cols-[200px_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3">
                <label className="pt-2 text-sm text-foreground">Vorlagenname</label>
                <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
                <span className="pt-2 text-xs text-muted-foreground">immer editierbar</span>

                {templateFieldMeta.map((field) => {
                  const control = field.type === "textarea" ? (
                    <Textarea
                      value={draftFields[field.key]}
                      onChange={(event) => setDraftFields((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={draftFields[field.key]}
                      onChange={(event) => setDraftFields((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  );

                  return (
                    <Fragment key={field.key}>
                      <label className="pt-2 text-sm text-foreground">{field.label}</label>
                      <div>{control}</div>
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
                    </Fragment>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between bg-primary px-6 py-3">
              <Button type="button" variant="ghost" onClick={closePanel} className="text-white hover:bg-white/10 hover:text-white">Abbrechen</Button>
              <Button type="button" variant="ghost" onClick={saveTemplate} className="text-white hover:bg-white/10 hover:text-white">Speichern</Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
