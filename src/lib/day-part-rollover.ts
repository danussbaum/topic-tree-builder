import type { DayPart } from "@/types/assessment";

/**
 * Nacht-Handlungen mit einer Uhrzeit vor 12:00 gehören fachlich zur Nacht des
 * Vortages, kalendarisch aber zum Folgetag: Wird am 01.08. "Nacht (01:00)"
 * geplant, ist die Durchführung am 02.08. um 01:00 fällig. "Morgen (01:00)"
 * bleibt dagegen am Planungstag.
 */
export const ROLLOVER_CUTOFF = "12:00";

export const rollsToNextDay = (
  action: { dayPart?: DayPart; scheduledTime?: string },
): boolean => {
  if (action.dayPart !== "night") return false;
  const time = action.scheduledTime?.trim();
  if (!time) return false;
  return time < ROLLOVER_CUTOFF;
};

/** Uhrzeit für die Anzeige, bei verschobenen Nacht-Einträgen mit Hinweis. */
export const formatScheduledTime = (
  action: { dayPart?: DayPart; scheduledTime?: string },
): string => {
  const time = action.scheduledTime?.trim();
  if (!time) return "";
  return rollsToNextDay(action) ? `${time} (+1 Tag)` : time;
};

/**
 * Gruppierung der Umsetzung: Nach dem Rollover ist die Tageszeit allein kein
 * brauchbarer Sortierschlüssel mehr — zwei Nacht-Einträge desselben Kalendertages
 * können an gegenüberliegenden Enden stehen (01:00 zuerst, 22:00 zuletzt). Die
 * verschobenen Einträge bekommen darum einen eigenen Abschnitt vor dem Morgen.
 */
export type ConfirmationDayPartKey = DayPart | "none" | "night_prev";

export const CONFIRMATION_DAY_PART_ORDER: ConfirmationDayPartKey[] = [
  "none",
  "night_prev",
  "morning",
  "noon",
  "afternoon",
  "evening",
  "night",
];

export const confirmationDayPartKey = (
  action: { dayPart?: DayPart; scheduledTime?: string },
): ConfirmationDayPartKey => (rollsToNextDay(action) ? "night_prev" : (action.dayPart ?? "none"));

/** Verschiebt ein ISO-Datum (yyyy-MM-dd) um die angegebenen Tage. */
export const shiftISODate = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
