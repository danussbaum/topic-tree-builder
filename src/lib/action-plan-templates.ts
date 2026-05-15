import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";

export type TemplateFieldKey =
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

export interface ActionPlanTemplate {
  id: string;
  name: string;
  fields: Record<TemplateFieldKey, string>;
  editable: Record<TemplateFieldKey, boolean>;
}

export interface TemplateSelectOption {
  value: string;
  label: string;
}

export const normalizeTemplateSelectValue = (
  value: string,
  options: TemplateSelectOption[],
) => {
  const trimmed = value.trim();
  const normalized = trimmed.toLocaleLowerCase("de");
  if (!trimmed && options.some((entry) => entry.value === "none")) return "none";
  const option = options.find(
    (entry) =>
      entry.value.toLocaleLowerCase("de") === normalized ||
      entry.label.toLocaleLowerCase("de") === normalized,
  );
  return option?.value ?? trimmed;
};

export const ACTION_PLAN_TEMPLATES_STORAGE_KEY = APPLICATION_BROWSER_STORAGE_KEYS[1];

export const buildDefaultTemplateFields = (): Record<TemplateFieldKey, string> => ({
  titel: "",
  beschreibung: "",
  hilfsmittel: "",
  dauer: "",
  personen: "",
  kategorie: "none",
  tageszeit: "none",
  uhrzeit: "",
  resultat: "none",
  wiederholung: "daily",
  wiederholungWochentage: "",
  wiederholungMonatlich: "none",
  leistungsart: "none",
});

export const buildDefaultTemplateEditable = (value = true): Record<TemplateFieldKey, boolean> => ({
  titel: value,
  beschreibung: value,
  hilfsmittel: value,
  dauer: value,
  personen: value,
  kategorie: value,
  tageszeit: value,
  uhrzeit: value,
  resultat: value,
  wiederholung: value,
  wiederholungWochentage: value,
  wiederholungMonatlich: value,
  leistungsart: false,
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
      uhrzeit: "07:30",
      resultat: "required",
      wiederholung: "daily",
      wiederholungMonatlich: "none",
      wiederholungWochentage: "mon,tue,wed,thu,fri",
      leistungsart: "none",
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
    return parsed.map((template) => ({
      ...template,
      fields: { ...buildDefaultTemplateFields(), ...(template.fields ?? {}) },
      editable: { ...buildDefaultTemplateEditable(true), ...(template.editable ?? {}) },
    }));
  } catch {
    return initialTemplates;
  }
};

export const saveActionPlanTemplates = (templates: ActionPlanTemplate[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
};
