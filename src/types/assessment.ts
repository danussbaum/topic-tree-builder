export type ActionStatus =
  | "open"
  | "done_as_planned"
  | "done_with_deviation"
  | "not_done";

export type DayPart = "morning" | "noon" | "evening" | "night";

export interface ActionNode {
  id: string;
  title: string;
  notes: string;
  /** Geplante Zeit in Minuten */
  plannedMinutes?: number;
  /** Tatsächliche Zeit in Minuten (bei Abweichung) */
  actualMinutes?: number;
  /** Begründung bei Abweichung oder nicht durchgeführt */
  reason?: string;
  /** Optionale Beobachtungen bei Durchführung */
  observations?: string;
  /** Tageszeit zur Gruppierung */
  dayPart?: DayPart;
  /** Gültig ab (ISO Datum, zwingend bei erfasster Massnahme) */
  validFrom?: string;
  /** Gültig bis (ISO Datum, optional) */
  validTo?: string;
  status: ActionStatus;
  /** abgeleitet: alles ausser "open" zählt als erledigt für Statistiken */
  done: boolean;
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
