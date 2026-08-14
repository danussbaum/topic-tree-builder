import {
  findDayPartById,
  getDayParts,
  resolveDayPart,
  sortedDayParts,
  spansMidnight,
  type DayPartDefinition,
} from "@/lib/day-parts";

/** Zeitangabe einer Handlung: entweder eine Tageszeit-ID oder eine Uhrzeit, nie beides. */
export interface ScheduledAction {
  dayPart?: string;
  scheduledTime?: string;
}

/**
 * Geht die Tageszeit einer Uhrzeit-Handlung über Mitternacht und liegt die Uhrzeit
 * im Teil nach 00:00, so gehört die Durchführung fachlich zum Vortag, kalendarisch
 * aber zum Folgetag: Wird am 01.08. "01:00" geplant und deckt die Nacht 22:00-06:00
 * ab, ist die Durchführung am 02.08. um 01:00 fällig.
 *
 * Handlungen im Tageszeit-Modus haben keine Uhrzeit und rollen darum nie — sie
 * bleiben im Abschnitt am Tagesende.
 */
export const rollsToNextDay = (
  action: ScheduledAction,
  dayParts: DayPartDefinition[] = getDayParts(),
): boolean => {
  const time = action.scheduledTime?.trim();
  if (!time) return false;
  const dayPart = resolveDayPart(time, dayParts);
  return !!dayPart && spansMidnight(dayPart) && time < dayPart.to;
};

/** Uhrzeit für die Anzeige, bei verschobenen Einträgen mit Hinweis. */
export const formatScheduledTime = (
  action: ScheduledAction,
  dayParts: DayPartDefinition[] = getDayParts(),
): string => {
  const time = action.scheduledTime?.trim();
  if (!time) return "";
  return rollsToNextDay(action, dayParts) ? `${time} (+1 Tag)` : time;
};

/**
 * Die Tageszeit einer Handlung: im Tageszeit-Modus die gesetzte, im Uhrzeit-Modus
 * die aus der Uhrzeit abgeleitete. Grundlage für Anzeige, Filter und Export.
 */
export const effectiveDayPart = (
  action: ScheduledAction,
  dayParts: DayPartDefinition[] = getDayParts(),
): DayPartDefinition | undefined => {
  const time = action.scheduledTime?.trim();
  if (time) return resolveDayPart(time, dayParts);
  return findDayPartById(action.dayPart, dayParts);
};

/**
 * Gruppierung der Umsetzung: Nach dem Rollover ist die Tageszeit allein kein
 * brauchbarer Sortierschlüssel mehr — zwei Einträge derselben über-Mitternacht-
 * Tageszeit können an gegenüberliegenden Enden des Tages stehen (01:00 zuerst,
 * 22:00 zuletzt). Die verschobenen Einträge bekommen darum einen eigenen
 * Abschnitt vor der ersten Tageszeit des Tages.
 *
 * Schlüssel ist die Tageszeit-ID, "none" für Handlungen ohne Zeitangabe und
 * "<id>:prev" für den vorgezogenen Abschnitt.
 */
export type ConfirmationDayPartKey = string;

export const NO_DAY_PART_KEY = "none";

const PREVIOUS_DAY_SUFFIX = ":prev";

export const previousDayKey = (dayPartId: string): ConfirmationDayPartKey =>
  `${dayPartId}${PREVIOUS_DAY_SUFFIX}`;

export const isPreviousDayKey = (key: ConfirmationDayPartKey): boolean =>
  key.endsWith(PREVIOUS_DAY_SUFFIX);

const baseDayPartId = (key: ConfirmationDayPartKey): string =>
  isPreviousDayKey(key) ? key.slice(0, -PREVIOUS_DAY_SUFFIX.length) : key;

/**
 * Reihenfolge der Abschnitte: ohne Zeitangabe, dann die vom Vortag vorgezogenen,
 * dann die Tageszeiten nach "von" aufsteigend.
 */
export const confirmationDayPartOrder = (
  dayParts: DayPartDefinition[] = getDayParts(),
): ConfirmationDayPartKey[] => {
  const sorted = sortedDayParts(dayParts);
  return [
    NO_DAY_PART_KEY,
    ...sorted.filter(spansMidnight).map((dayPart) => previousDayKey(dayPart.id)),
    ...sorted.map((dayPart) => dayPart.id),
  ];
};

export const confirmationDayPartKey = (
  action: ScheduledAction,
  dayParts: DayPartDefinition[] = getDayParts(),
): ConfirmationDayPartKey => {
  const time = action.scheduledTime?.trim();
  if (time) {
    const dayPart = resolveDayPart(time, dayParts);
    if (!dayPart) return NO_DAY_PART_KEY;
    return rollsToNextDay(action, dayParts) ? previousDayKey(dayPart.id) : dayPart.id;
  }
  return findDayPartById(action.dayPart, dayParts)?.id ?? NO_DAY_PART_KEY;
};

/**
 * Sortierschlüssel innerhalb eines Tages: erst der Abschnitt (vorgezogene Einträge
 * vor der ersten Tageszeit, sonst nach "von"), dann die Uhrzeit — Handlungen ohne
 * Uhrzeit stehen innerhalb der Tageszeit hinten.
 */
export const scheduleSortKey = (
  action: ScheduledAction,
  dayParts: DayPartDefinition[] = getDayParts(),
): string => {
  const order = confirmationDayPartOrder(dayParts);
  const index = order.indexOf(confirmationDayPartKey(action, dayParts));
  const section = String(index < 0 ? order.length : index).padStart(3, "0");
  return `${section}#${action.scheduledTime?.trim() || "zz:zz"}`;
};

export const dayPartSectionLabel = (
  key: ConfirmationDayPartKey,
  dayParts: DayPartDefinition[] = getDayParts(),
): string => {
  if (key === NO_DAY_PART_KEY) return "Ohne Zeitangabe";
  const title = findDayPartById(baseDayPartId(key), dayParts)?.title ?? key;
  return isPreviousDayKey(key) ? `${title} (Vortag)` : title;
};

/**
 * Die Tageszeit, aus der ein Vortags-Abschnitt entsteht. Eine dort erfasste Handlung
 * braucht eine Uhrzeit im Teil nach Mitternacht, also kleiner als deren "bis".
 */
export const previousDayDayPart = (
  dayParts: DayPartDefinition[] = getDayParts(),
): DayPartDefinition | undefined => sortedDayParts(dayParts).find(spansMidnight);

/** Verschiebt ein ISO-Datum (yyyy-MM-dd) um die angegebenen Tage. */
export const shiftISODate = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
