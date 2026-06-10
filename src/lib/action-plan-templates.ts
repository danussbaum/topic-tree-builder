import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";
import type { ActionPlanDiscipline } from "@/lib/action-plan-disciplines";
import type { ActionNode, DayPart } from "@/types/assessment";

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
  | "wiederholungMonatlich"
  | "leistungsart";

export interface ActionPlanTemplate {
  id: string;
  name: string;
  disciplineIds: string[];
  fields: Record<TemplateFieldKey, string>;
  editable: Record<TemplateFieldKey, boolean>;
  required: Record<TemplateFieldKey, boolean>;
}

const TEMPLATE_FIELD_TO_ACTION_FIELD: Record<TemplateFieldKey, keyof ActionNode> = {
  titel: "title",
  beschreibung: "notes",
  hilfsmittel: "requiredResources",
  dauer: "plannedMinutes",
  personen: "requiredPersons",
  kategorie: "category",
  tageszeit: "dayPart",
  resultat: "resultRequirement",
  wiederholung: "recurrence",
  wiederholungWochentage: "recurrenceWeekdays",
  wiederholungMonatlich: "recurrenceMonthlyPattern",
  leistungsart: "serviceType",
};

export const getTemplateLockedActionFields = (
  template?: Pick<ActionPlanTemplate, "editable">,
): string[] => {
  if (!template) return [];

  return (Object.entries(template.editable) as Array<[TemplateFieldKey, boolean]>)
    .filter(([, editable]) => !editable)
    .map(([field]) => TEMPLATE_FIELD_TO_ACTION_FIELD[field]);
};

export const getTemplateRequiredActionFields = (
  template?: Pick<ActionPlanTemplate, "editable" | "required">,
): string[] => {
  if (!template) return [];

  return (Object.entries(template.required) as Array<[TemplateFieldKey, boolean]>)
    .filter(([field, required]) => required && template.editable[field])
    .map(([field]) => TEMPLATE_FIELD_TO_ACTION_FIELD[field]);
};

export const isTemplateLockedActionField = (
  action: Pick<ActionNode, "templateLockedFields">,
  field: keyof ActionNode | string,
): boolean => action.templateLockedFields?.includes(String(field)) ?? false;

export interface TemplateSelectOption {
  value: string;
  label: string;
}

export const ACTION_SERVICE_TYPE_SELECT_OPTIONS: TemplateSelectOption[] = [
  { value: "none", label: "<leer>" },
  { value: "spitex-klv-a", label: "Spitex, KLV a" },
  { value: "spitex-klv-b", label: "Spitex, KLV b" },
  { value: "spitex-klv-c", label: "Spitex, KLV c" },
];

export const getActionServiceTypeLabel = (value?: string) => {
  if (!value || value === "none") return "";
  return ACTION_SERVICE_TYPE_SELECT_OPTIONS.find((option) => option.value === value)?.label ?? value;
};

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

export const normalizeTemplateDisciplineIds = (
  disciplineIds: unknown,
  disciplines: ActionPlanDiscipline[],
): string[] => {
  if (!Array.isArray(disciplineIds)) return [];

  const validDisciplineIds = new Set(disciplines.map((discipline) => discipline.id));
  return Array.from(
    new Set(
      disciplineIds.filter(
        (disciplineId): disciplineId is string =>
          typeof disciplineId === "string" && validDisciplineIds.has(disciplineId),
      ),
    ),
  );
};

export const templateMatchesDiscipline = (
  template: Pick<ActionPlanTemplate, "disciplineIds">,
  disciplineId?: string,
): boolean => {
  if (template.disciplineIds.length === 0) return true;
  if (!disciplineId) return false;
  return template.disciplineIds.includes(disciplineId);
};

export const getTemplateDisciplineLabels = (
  disciplineIds: string[],
  disciplines: ActionPlanDiscipline[],
): string[] => {
  const labelsById = new Map(disciplines.map((discipline) => [discipline.id, discipline.title]));
  return disciplineIds.map((disciplineId) => labelsById.get(disciplineId) ?? disciplineId);
};

export const resolveTemplateDisciplineIds = (
  value: string,
  disciplines: ActionPlanDiscipline[],
): { disciplineIds: string[]; invalidEntries: string[] } => {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const disciplineById = new Map(disciplines.map((discipline) => [discipline.id.toLocaleLowerCase("de"), discipline]));
  const disciplineByTitle = new Map(disciplines.map((discipline) => [discipline.title.toLocaleLowerCase("de"), discipline]));
  const disciplineIds: string[] = [];
  const invalidEntries: string[] = [];

  entries.forEach((entry) => {
    const normalized = entry.toLocaleLowerCase("de");
    const discipline = disciplineById.get(normalized) ?? disciplineByTitle.get(normalized);
    if (!discipline) {
      invalidEntries.push(entry);
      return;
    }
    if (!disciplineIds.includes(discipline.id)) disciplineIds.push(discipline.id);
  });

  return { disciplineIds, invalidEntries };
};

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
  resultat: value,
  wiederholung: value,
  wiederholungWochentage: value,
  wiederholungMonatlich: value,
  leistungsart: false,
});

export const buildDefaultTemplateRequired = (): Record<TemplateFieldKey, boolean> => ({
  titel: false,
  beschreibung: false,
  hilfsmittel: false,
  dauer: false,
  personen: false,
  kategorie: false,
  tageszeit: false,
  resultat: false,
  wiederholung: false,
  wiederholungWochentage: false,
  wiederholungMonatlich: false,
  leistungsart: false,
});

export const initialTemplates: ActionPlanTemplate[] = [
  {
    id: "tpl-1",
    name: "Morgenroutine",
    disciplineIds: [],
    fields: {
      titel: "Tagesstart begleiten",
      beschreibung: "Begleitung bei der Morgenhygiene und Planung des Tagesablaufs.",
      hilfsmittel: "Pflegeutensilien bereitstellen.",
      dauer: "20",
      personen: "1",
      kategorie: "a",
      tageszeit: "morning(07:30)",
      resultat: "required",
      wiederholung: "daily",
      wiederholungMonatlich: "none",
      wiederholungWochentage: "mon,tue,wed,thu,fri",
      leistungsart: "none",
    },
    editable: buildDefaultTemplateEditable(true),
    required: buildDefaultTemplateRequired(),
  },
];

export function parseTageszeit(value: string): Array<{ dayPart: DayPart; scheduledTime?: string }> {
  if (!value || value === "none") return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const match = entry.match(/^([a-z]+)(?:\((\d{2}:\d{2})\))?$/);
      if (!match) return [];
      const dayPart = match[1] as DayPart;
      const validDayParts: DayPart[] = ["morning", "noon", "afternoon", "evening", "night"];
      if (!validDayParts.includes(dayPart)) return [];
      return [{ dayPart, scheduledTime: match[2] || undefined }];
    });
}

export function serializeTageszeit(entries: Array<{ dayPart: DayPart; scheduledTime?: string }>): string {
  if (entries.length === 0) return "none";
  return entries
    .map(({ dayPart, scheduledTime }) => scheduledTime ? `${dayPart}(${scheduledTime})` : dayPart)
    .join(",");
}

const migrateTemplateFields = (fields: Record<string, string>): Record<TemplateFieldKey, string> => {
  const defaults = buildDefaultTemplateFields();
  const tageszeit = fields.tageszeit ?? defaults.tageszeit;
  const uhrzeit = (fields as Record<string, string>).uhrzeit ?? "";

  let normalizedTageszeit = tageszeit;
  if (tageszeit && tageszeit !== "none" && !tageszeit.includes(",") && !tageszeit.includes("(") && uhrzeit) {
    normalizedTageszeit = `${tageszeit}(${uhrzeit})`;
  }

  const { uhrzeit: _dropped, ...rest } = { ...defaults, ...fields, tageszeit: normalizedTageszeit } as Record<string, string>;
  return rest as Record<TemplateFieldKey, string>;
};

export const loadActionPlanTemplates = (): ActionPlanTemplate[] => {
  if (typeof window === "undefined") return initialTemplates;
  const raw = window.localStorage.getItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY);
  if (!raw) return initialTemplates;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialTemplates;
    return parsed.map((template) => ({
      ...template,
      disciplineIds: Array.isArray(template.disciplineIds)
        ? template.disciplineIds.filter((disciplineId): disciplineId is string => typeof disciplineId === "string")
        : [],
      fields: migrateTemplateFields(template.fields ?? {}),
      editable: { ...buildDefaultTemplateEditable(true), ...(template.editable ?? {}) },
      required: { ...buildDefaultTemplateRequired(), ...(template.required ?? {}) },
    }));
  } catch {
    return initialTemplates;
  }
};

export const saveActionPlanTemplates = (templates: ActionPlanTemplate[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
};
