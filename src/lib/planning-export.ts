import {
  formatActionResources,
  getActionPlanResources,
  type ActionPlanResource,
} from "@/lib/action-plan-resources";
import {
  ACTION_SERVICE_TYPE_SELECT_OPTIONS,
  getActionServiceTypeLabel,
} from "@/lib/action-plan-templates";
import { initialActionPlanDisciplines, type ActionPlanDiscipline } from "@/lib/action-plan-disciplines";
import { getDayParts, type DayPartDefinition } from "@/lib/day-parts";
import { effectiveDayPart, scheduleSortKey } from "@/lib/day-part-rollover";
import type {
  ActionNode,
  Client,
  MonthlyRecurrencePattern,
  RecurrenceType,
  ResultRequirement,
  TargetNode,
  TopicNode,
  Weekday,
} from "@/types/assessment";

export const PLANNING_EXPORT_HEADERS = [
  "Klient/in",
  "Disziplin",
  "Schwerpunkt",
  "Ziel",
  "Zielbeschreibung",
  "Ziel gültig ab",
  "Ziel gültig bis",
  "Handlung",
  "Beschreibung",
  "Planungsart",
  "Wiederholung",
  "Wochentage",
  "Tageszeiten",
  "Uhrzeit",
  "Gültig ab",
  "Gültig bis",
  "Klassifizierung",
  "Leistungsarten",
  "Optionale Leistungen",
  "Hilfsmittel",
  "Minuten geplant",
  "Personen",
  "Resultat erforderlich",
] as const;

export const PLANNING_EXPORT_DATE_HEADERS = new Set([
  "Ziel gültig ab",
  "Ziel gültig bis",
  "Gültig ab",
  "Gültig bis",
]);

export const PLANNING_EXPORT_NUMBER_HEADERS = new Set(["Minuten geplant", "Personen"]);

const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Mo",
  tuesday: "Di",
  wednesday: "Mi",
  thursday: "Do",
  friday: "Fr",
  saturday: "Sa",
  sunday: "So",
};

const WEEKDAY_ORDER: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  on_demand: "Nach Bedarf",
};

const MONTHLY_PATTERN_LABELS: Record<MonthlyRecurrencePattern, string> = {
  first_day: "Erster Tag im Monat",
  first_monday: "Erster Montag im Monat",
  last_day: "Letzter Tag im Monat",
  last_friday: "Letzter Freitag im Monat",
};

const RESULT_REQUIREMENT_LABELS: Record<ResultRequirement, string> = {
  none: "Nein",
  optional: "Optional",
  required: "Ja",
};

const NO_DAY_PART_LABEL = "Ohne Zeitangabe";

const recurrenceText = (action: ActionNode) => {
  if (!action.recurrence) return "";
  const label = RECURRENCE_LABELS[action.recurrence];
  if (action.recurrence === "monthly" && action.recurrenceMonthlyPattern) {
    return `${label} (${MONTHLY_PATTERN_LABELS[action.recurrenceMonthlyPattern]})`;
  }
  return label;
};

const weekdayText = (action: ActionNode) =>
  action.recurrence === "weekly"
    ? WEEKDAY_ORDER.filter((day) => (action.recurrenceWeekdays ?? []).includes(day))
        .map((day) => WEEKDAY_LABELS[day])
        .join(", ")
    : "";

/**
 * Tageszeiten einer Handlungsgruppe: "2 × Morgen | Abend" — die Anzahl der
 * Durchführungen pro Tageszeit steht vorne, weil Tageszeit-Titel selbst Klammern
 * enthalten können (gleiche Konvention wie bei den optionalen Leistungen).
 */
const dayPartsText = (nodes: ActionNode[], dayParts: DayPartDefinition[]) => {
  const counts: Array<{ title: string; count: number }> = [];
  nodes.forEach((node) => {
    const title = effectiveDayPart(node, dayParts)?.title ?? NO_DAY_PART_LABEL;
    const existing = counts.find((entry) => entry.title === title);
    if (existing) existing.count += 1;
    else counts.push({ title, count: 1 });
  });
  return counts
    .map((entry) => (entry.count > 1 ? `${entry.count} × ${entry.title}` : entry.title))
    .join(" | ");
};

const scheduledTimesText = (nodes: ActionNode[]) =>
  Array.from(
    new Set(nodes.map((node) => node.scheduledTime?.trim()).filter((time): time is string => !!time)),
  ).join(" | ");

const serviceTypesText = (action: ActionNode) =>
  (action.serviceEntries ?? [])
    .map((entry) => {
      const label =
        ACTION_SERVICE_TYPE_SELECT_OPTIONS.find((option) => option.value === entry.serviceType)?.label ??
        entry.serviceType;
      return entry.maxMinutes != null ? `${label} (max. ${entry.maxMinutes} Min.)` : label;
    })
    .join(" | ");

const optionalServicesText = (action: ActionNode) =>
  (action.optionalServices ?? []).length > 0
    ? (action.optionalServices ?? [])
        .map((entry) => `${entry.quantity} × ${getActionServiceTypeLabel(entry.serviceType)}`)
        .join(" | ")
    : (action.optionalServiceTypes ?? []).map((type) => getActionServiceTypeLabel(type)).join(" | ");

export type PlanningExportRow = Record<string, string | number>;

export interface PlanningExportOptions {
  disciplines?: ActionPlanDiscipline[];
  resources?: ActionPlanResource[];
  dayParts?: DayPartDefinition[];
}

/**
 * Zeilen des Planungs-Exports: eine Zeile pro Handlung, wobei eine Handlung wie in
 * der Planungsansicht die Gruppe aller Tageszeiten derselben groupId ist. Ziele ohne
 * Handlung erscheinen mit leeren Handlungs-Spalten, damit unfertige Äste des Plans
 * nicht stillschweigend verschwinden.
 */
export const buildPlanningExportRows = (
  clients: Client[],
  {
    disciplines = initialActionPlanDisciplines,
    resources = getActionPlanResources(),
    dayParts = getDayParts(),
  }: PlanningExportOptions = {},
): PlanningExportRow[] => {
  const disciplineTitle = (topic: TopicNode) =>
    disciplines.find((discipline) => discipline.id === topic.disciplineId)?.title ??
    topic.disciplineId ??
    "Ohne Disziplin";

  const clientName = (client: Client) => `${client.firstName} ${client.lastName}`.trim();

  const baseRow = (client: Client, topic: TopicNode, target?: TargetNode): PlanningExportRow => ({
    "Klient/in": clientName(client),
    Disziplin: disciplineTitle(topic),
    Schwerpunkt: topic.title,
    Ziel: target?.title ?? "",
    Zielbeschreibung: target?.notes ?? "",
    "Ziel gültig ab": target?.validFrom ?? "",
    "Ziel gültig bis": target?.validTo ?? "",
  });

  return [...clients]
    .sort((a, b) => clientName(a).localeCompare(clientName(b)))
    .flatMap((client) =>
      [...client.topics]
        .sort(
          (a, b) =>
            disciplineTitle(a).localeCompare(disciplineTitle(b)) || a.title.localeCompare(b.title),
        )
        .flatMap((topic) => {
          if (topic.targets.length === 0) return [baseRow(client, topic)];

          return [...topic.targets]
            .sort((a, b) => a.title.localeCompare(b.title))
            .flatMap((target) => {
              // Bedarfs-Durchführungen und ungeplante Handlungen sind Umsetzungs-Daten,
              // keine eigenen Plan-Handlungen (siehe Planungsansicht).
              const plannedActions = target.actions.filter(
                (action) => !action.isUnplanned && !action.isOnDemandOccurrence,
              );
              if (plannedActions.length === 0) return [baseRow(client, topic, target)];

              const groups = new Map<string, ActionNode[]>();
              plannedActions.forEach((action) => {
                groups.set(action.groupId, [...(groups.get(action.groupId) ?? []), action]);
              });

              return Array.from(groups.values())
                .map((nodes) =>
                  [...nodes].sort((a, b) =>
                    scheduleSortKey(a, dayParts).localeCompare(scheduleSortKey(b, dayParts)),
                  ),
                )
                .sort(
                  (a, b) =>
                    scheduleSortKey(a[0], dayParts).localeCompare(scheduleSortKey(b[0], dayParts)) ||
                    (a[0].title || "").localeCompare(b[0].title || ""),
                )
                .map((nodes) => {
                  const action = nodes[0];
                  return {
                    ...baseRow(client, topic, target),
                    Handlung: action.title,
                    Beschreibung: action.notes,
                    Planungsart: action.recurrence === "on_demand" ? "Nach Bedarf" : "Geplant",
                    Wiederholung: recurrenceText(action),
                    Wochentage: weekdayText(action),
                    Tageszeiten: dayPartsText(nodes, dayParts),
                    Uhrzeit: scheduledTimesText(nodes),
                    "Gültig ab": action.validFrom ?? "",
                    "Gültig bis": action.validTo ?? "",
                    Klassifizierung: action.category ? `KLV ${action.category.toUpperCase()}` : "",
                    Leistungsarten: serviceTypesText(action),
                    "Optionale Leistungen": optionalServicesText(action),
                    Hilfsmittel: formatActionResources(action, resources),
                    "Minuten geplant": action.plannedMinutes ?? "",
                    Personen: action.requiredPersons ?? "",
                    "Resultat erforderlich": action.resultRequirement
                      ? RESULT_REQUIREMENT_LABELS[action.resultRequirement]
                      : "",
                  };
                });
            });
        }),
    );
};
