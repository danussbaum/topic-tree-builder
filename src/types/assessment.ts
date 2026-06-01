export type ActionStatus =
  | "open"
  | "done_as_planned"
  | "done_with_deviation"
  | "not_done"
  | "postponed";

export type DayPart = "morning" | "noon" | "afternoon" | "evening" | "night";
export type ActionCategory = "a" | "b" | "c";
export type ActionServiceType = "spitex-klv-a" | "spitex-klv-b" | "spitex-klv-c";
export type ResultRequirement = "none" | "optional" | "required";
export type NumericComparisonOperator = "gt" | "lt" | "eq";
export type RecurrenceType = "daily" | "weekly" | "monthly";
export type MonthlyRecurrencePattern =
  | "first_day"
  | "first_monday"
  | "last_day"
  | "last_friday";
export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ConfirmationFilter {
  statuses: ActionStatus[];
  plannedMinutes?: {
    op: NumericComparisonOperator;
    value: number;
  };
  actualMinutes?: {
    op: NumericComparisonOperator;
    value: number;
  };
  differenceMinutes?: number;
  differencePercent?: number;
  dayPart?: DayPart | "none";
  persons?: { kind: "none" } | { kind: "exact"; value: number };
  result?: "none" | "with_result";
}

export interface ActionConfirmation {
  status: ActionStatus;
  /** Snapshot der Leistungsart zum Zeitpunkt der Umsetzung */
  serviceType?: ActionServiceType;
  actualMinutes?: number;
  reason?: string;
  result?: string;
  observations?: string;
  confirmedBy?: string;
  /** ISO timestamp in UTC with second precision, e.g. 2026-04-29T10:15:30Z */
  confirmedAt?: string;
  /** New scheduled date when this occurrence was postponed (ISO yyyy-MM-dd) */
  postponedToDate?: string;
  /** New scheduled time when this occurrence was postponed (HH:mm) */
  postponedToTime?: string;
  /** Mandatory reason why this occurrence was postponed */
  postponedReason?: string;
  /** User who postponed this occurrence */
  postponedBy?: string;
  /** ISO timestamp in UTC with second precision when this occurrence was postponed */
  postponedAt?: string;
  done: boolean;
}

export interface ActionNode {
  id: string;
  title: string;
  notes: string;
  /** Hilfsmittel fuer die Durchfuehrung */
  requiredResources?: string;
  /** Geplante Zeit in Minuten */
  plannedMinutes?: number;
  /** Benoetigte Personen fuer die Durchfuehrung */
  requiredPersons?: number;
  /** Ob bei der Bestaetigung ein Resultat erfasst wird */
  resultRequirement?: ResultRequirement;
  /** Tageszeit zur Gruppierung */
  dayPart?: DayPart;
  /** Exakte Uhrzeit zur Durchführung (HH:mm) */
  scheduledTime?: string;
  /** Kategorie fuer optionale Einteilung */
  category?: ActionCategory;
  /** Leistungsart fuer Abrechnung/Planung */
  serviceType?: ActionServiceType;
  /** Gültig ab (ISO Datum, zwingend bei erfasster Handlung) */
  validFrom?: string;
  /** Gültig bis (ISO Datum, optional) */
  validTo?: string;
  /** Wiederholung der Handlung (zwingend) */
  recurrence?: RecurrenceType;
  /** Wochentage bei wöchentlicher Wiederholung */
  recurrenceWeekdays?: Weekday[];
  /** Regel bei monatlicher Wiederholung */
  recurrenceMonthlyPattern?: MonthlyRecurrencePattern;
  /** History of confirmations by date (ISO yyyy-MM-dd) */
  confirmations?: Record<string, ActionConfirmation>;
  /** Default status/done if no confirmation for date exists */
  status: ActionStatus;
  done: boolean;
  // Deprecated fields moved to ActionConfirmation
  actualMinutes?: number;
  reason?: string;
  result?: string;
  observations?: string;
  /** Kennzeichnet eine direkt in der Umsetzungsmaske erfasste, ungeplante Handlung */
  isUnplanned?: boolean;
  templateId?: string;
  templateName?: string;
  templateLockedFields?: string[];
  templateRequiredFields?: string[];
}

export interface TargetNode {
  id: string;
  title: string;
  notes: string;
  actions: ActionNode[];
}

export interface TopicNode {
  id: string;
  title: string;
  notes: string;
  /** Zugeordnete Disziplin aus den Einstellungen */
  disciplineId?: string;
  targets: TargetNode[];
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  topics: TopicNode[];
}

export type Selection =
  | { kind: "topic"; topicId: string }
  | { kind: "target"; topicId: string; targetId: string }
  | { kind: "action"; topicId: string; targetId: string; actionId: string };

export const DAY_PART_ORDER: (DayPart | "none")[] = [
  "none",
  "morning",
  "noon",
  "afternoon",
  "evening",
  "night",
];

export const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: "Morgen",
  noon: "Mittag",
  afternoon: "Nachmittag",
  evening: "Abend",
  night: "Nacht",
};

export const DAY_PART_OPTIONS: Array<{ value: DayPart; label: string }> = [
  { value: "morning", label: DAY_PART_LABEL.morning },
  { value: "noon", label: DAY_PART_LABEL.noon },
  { value: "afternoon", label: DAY_PART_LABEL.afternoon },
  { value: "evening", label: DAY_PART_LABEL.evening },
  { value: "night", label: DAY_PART_LABEL.night },
];

export const DAY_PART_SELECT_OPTIONS: Array<{ value: DayPart | "none"; label: string }> = [
  { value: "none", label: "Keine Angabe" },
  ...DAY_PART_OPTIONS,
];
