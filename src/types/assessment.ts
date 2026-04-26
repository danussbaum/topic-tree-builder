export type ActionStatus =
  | "open"
  | "done_as_planned"
  | "done_with_deviation"
  | "not_done";

export type DayPart = "morning" | "noon" | "evening" | "night";
export type ResultRequirement = "none" | "optional" | "required";
export type NumericComparisonOperator = "gt" | "lt" | "eq";

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
  actualMinutes?: number;
  reason?: string;
  result?: string;
  observations?: string;
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
  /** Gültig ab (ISO Datum, zwingend bei erfasster Handlung) */
  validFrom?: string;
  /** Gültig bis (ISO Datum, optional) */
  validTo?: string;
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
  "evening",
  "night",
];

export const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: "Morgen",
  noon: "Mittag",
  evening: "Abend",
  night: "Nacht",
};
