export type ActionStatus =
  | "open"
  | "done_as_planned"
  | "done_with_deviation"
  | "not_done";

export type DayPart = "morning" | "noon" | "evening" | "night";

export type ResultsRequirement = "none" | "optional" | "required";

export interface ActionConfirmation {
  status: ActionStatus;
  actualMinutes?: number;
  reason?: string;
  observations?: string;
  results?: string;
  done: boolean;
}

export interface ActionNode {
  id: string;
  title: string;
  notes: string;
  /** Beschreibung der Handlung (Freitext) */
  description?: string;
  /** Benötigte Anzahl Personen für die Durchführung */
  requiredPersons?: number;
  /** Ob bei der Bestätigung Resultate erfasst werden müssen */
  resultsRequirement?: ResultsRequirement;
  /** Geplante Zeit in Minuten */
  plannedMinutes?: number;
  /** Tageszeit zur Gruppierung */
  dayPart?: DayPart;
  /** Gültig ab (ISO Datum, zwingend bei erfasster Massnahme) */
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
  observations?: string;
  results?: string;
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
