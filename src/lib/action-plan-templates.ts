export type TemplateFieldKey =
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

export interface ActionPlanTemplate {
  id: string;
  name: string;
  fields: Record<TemplateFieldKey, string>;
  editable: Record<TemplateFieldKey, boolean>;
}

export const ACTION_PLAN_TEMPLATES_STORAGE_KEY = "action-plan-templates-v1";

export const buildDefaultTemplateFields = (): Record<TemplateFieldKey, string> => ({
  titel: "",
  beschreibung: "",
  hilfsmittel: "",
  dauer: "",
  personen: "",
  kategorie: "none",
  tageszeit: "none",
  resultat: "none",
  wiederholung: "daily",
  wiederholungWochentage: "",
  wiederholungMonatlich: "none",
});

export const buildDefaultTemplateEditable = (value = true): Record<TemplateFieldKey, boolean> => ({
  titel: value,
  beschreibung: value,
  hilfsmittel: value,
  dauer: value,
  personen: value,
  kategorie: value,
  tageszeit: value,
  resultat: value,
  wiederholung: value,
  wiederholungWochentage: value,
  wiederholungMonatlich: value,
});

export const initialTemplates: ActionPlanTemplate[] = [
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
    editable: buildDefaultTemplateEditable(true),
  },
];

export const loadActionPlanTemplates = (): ActionPlanTemplate[] => {
  if (typeof window === "undefined") return initialTemplates;
  const raw = window.localStorage.getItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY);
  if (!raw) return initialTemplates;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialTemplates;
    return parsed;
  } catch {
    return initialTemplates;
  }
};

export const saveActionPlanTemplates = (templates: ActionPlanTemplate[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
};
