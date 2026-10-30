import { DAY_PART_SEED_IDS, findDayPartById, type DayPartDefinition } from "@/lib/day-parts";

/** Zeitangabe einer Handlung: optionale Tageszeit-ID, optional mit Uhrzeit. */
export interface ScheduledAction {
  dayPart?: string;
  scheduledTime?: string;
}

/**
 * Eine Durchführung ist immer am geplanten Datum fällig — auch "Nacht, 02:00".
 * Die Uhrzeit ist reine Angabe und verschiebt nichts auf den Folgetag.
 */
export const formatScheduledTime = (action: ScheduledAction): string =>
  action.scheduledTime?.trim() ?? "";

/** Die Tageszeit einer Handlung — Grundlage für Anzeige, Filter und Export. */
export const effectiveDayPart = (action: ScheduledAction): DayPartDefinition | undefined =>
  findDayPartById(action.dayPart);

/**
 * Zeitangabe einer Durchführung an einem Termin: nach einer Neuplanung die neue
 * Tageszeit und Uhrzeit, sonst die geplante.
 */
export const scheduleOf = (
  action: ScheduledAction,
  confirmation?: { postponedToDayPart?: string; postponedToTime?: string },
): ScheduledAction => {
  if (confirmation?.postponedToDayPart !== undefined) {
    const dayPart = confirmation.postponedToDayPart === "none" ? undefined : confirmation.postponedToDayPart;
    return { dayPart, scheduledTime: dayPart ? confirmation.postponedToTime : undefined };
  }
  return {
    dayPart: action.dayPart,
    scheduledTime: confirmation?.postponedToTime ?? action.scheduledTime,
  };
};

/** Schlüssel der Abschnitte in der Umsetzung: Tageszeit-ID, "none" ohne Zeitangabe. */
export type ConfirmationDayPartKey = string;

export const NO_DAY_PART_KEY = "none";

/** Reihenfolge der Abschnitte eines Tages in der Umsetzung: ohne Zeitangabe, dann Nacht bis Abend. */
export const confirmationDayPartOrder = (): ConfirmationDayPartKey[] => [
  NO_DAY_PART_KEY,
  DAY_PART_SEED_IDS.night,
  DAY_PART_SEED_IDS.morning,
  DAY_PART_SEED_IDS.noon,
  DAY_PART_SEED_IDS.afternoon,
  DAY_PART_SEED_IDS.evening,
];

export const confirmationDayPartKey = (action: ScheduledAction): ConfirmationDayPartKey =>
  effectiveDayPart(action)?.id ?? NO_DAY_PART_KEY;

/**
 * Sortierschlüssel innerhalb eines Tages: erst der Abschnitt, dann die Uhrzeit —
 * Handlungen ohne Uhrzeit stehen innerhalb der Tageszeit hinten.
 */
export const scheduleSortKey = (action: ScheduledAction): string => {
  const order = confirmationDayPartOrder();
  const index = order.indexOf(confirmationDayPartKey(action));
  const section = String(index < 0 ? order.length : index).padStart(3, "0");
  return `${section}#${action.scheduledTime?.trim() || "zz:zz"}`;
};

export const dayPartSectionLabel = (key: ConfirmationDayPartKey): string =>
  key === NO_DAY_PART_KEY ? "Ohne Zeitangabe" : (findDayPartById(key)?.title ?? key);

/** Verschiebt ein ISO-Datum (yyyy-MM-dd) um die angegebenen Tage. */
export const shiftISODate = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
