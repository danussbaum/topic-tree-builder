import type {
  ActionNode,
  MonthlyRecurrencePattern,
  RecurrenceType,
  Weekday,
} from "@/types/assessment";

/**
 * Eine Handlung erscheint in der Umsetzung nur, wenn ihr Zeitplan vollständig ist:
 * Ohne Startdatum und ohne (vollständige) Wiederholung wird nie ein Fälligkeitstag
 * berechnet — die Handlung wäre geplant, aber unsichtbar. Diese Regel gilt darum
 * überall dort, wo eine Handlung entsteht oder verändert wird.
 */
export type ScheduleField =
  | "validFrom"
  | "validTo"
  | "recurrence"
  | "recurrenceWeekdays"
  | "recurrenceMonthlyPattern";

export interface ActionSchedule {
  validFrom?: string;
  validTo?: string;
  recurrence?: RecurrenceType;
  recurrenceWeekdays?: Weekday[];
  recurrenceMonthlyPattern?: MonthlyRecurrencePattern;
}

export const SCHEDULE_FIELD_MESSAGE: Record<ScheduleField, string> = {
  validFrom: "Gültig ab ist zwingend — sonst erscheint die Handlung nicht in der Umsetzung.",
  validTo: "Gültig bis darf nicht vor Gültig ab liegen — sonst wird die Handlung nie fällig.",
  recurrence: "Wiederholung ist zwingend — sonst erscheint die Handlung nicht in der Umsetzung.",
  recurrenceWeekdays: "Mindestens ein Wochentag ist zwingend — sonst wird die Handlung nie fällig.",
  recurrenceMonthlyPattern: "Eine monatliche Regel ist zwingend — sonst wird die Handlung nie fällig.",
};

export const getScheduleIssues = (action: ActionSchedule): ScheduleField[] => {
  const issues: ScheduleField[] = [];
  if (!action.validFrom) issues.push("validFrom");
  if (action.validFrom && action.validTo && action.validTo < action.validFrom) issues.push("validTo");
  if (!action.recurrence) {
    issues.push("recurrence");
    return issues;
  }
  if (action.recurrence === "weekly" && (action.recurrenceWeekdays?.length ?? 0) === 0) {
    issues.push("recurrenceWeekdays");
  }
  if (action.recurrence === "monthly" && !action.recurrenceMonthlyPattern) {
    issues.push("recurrenceMonthlyPattern");
  }
  return issues;
};

/** Erscheint die Handlung grundsätzlich in der Umsetzung? */
export const isActionSchedulable = (action: ActionSchedule): boolean =>
  getScheduleIssues(action).length === 0;

export const getScheduleIssuesForAction = (action: ActionNode): ScheduleField[] =>
  getScheduleIssues({
    validFrom: action.validFrom,
    validTo: action.validTo,
    recurrence: action.recurrence,
    recurrenceWeekdays: action.recurrenceWeekdays,
    recurrenceMonthlyPattern: action.recurrenceMonthlyPattern,
  });
