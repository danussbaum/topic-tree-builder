import type { DayPart } from "@/types/assessment";
import { DAY_PART_ORDER } from "@/types/assessment";

export type DayPartOrNone = DayPart | "none";

export interface DayPartEntry {
  /**
   * Stabile Kennung der einzelnen Durchführung. Bei bestehenden Handlungen ist
   * das die ActionNode-ID — dadurch bleibt die Bestätigungshistorie erhalten,
   * auch wenn Tageszeit oder Uhrzeit geändert werden.
   */
  id: string;
  dayPart: DayPartOrNone;
  scheduledTime?: string;
}

let entryCounter = 0;
export const newDayPartEntryId = () =>
  `dpe-${Date.now().toString(36)}-${(entryCounter++).toString(36)}`;

/**
 * Vergibt Eintrags-IDs aus der Position innerhalb der Tageszeit. Für Quellen ohne
 * eigene Identität (Vorlagen-Feld als String): Die ID bleibt beim Tippen einer
 * Uhrzeit stabil, das Eingabefeld verliert also nicht den Fokus.
 */
export function withPositionalIds(
  entries: Array<{ dayPart: DayPartOrNone; scheduledTime?: string }>,
): DayPartEntry[] {
  const seen = new Map<DayPartOrNone, number>();
  return entries.map((entry) => {
    const index = seen.get(entry.dayPart) ?? 0;
    seen.set(entry.dayPart, index + 1);
    return { ...entry, id: `${entry.dayPart}#${index}` };
  });
}

/** Kanonische Reihenfolge: nach Tageszeit, innerhalb der Tageszeit nach Uhrzeit. */
export function sortDayPartEntries(entries: DayPartEntry[]): DayPartEntry[] {
  return [...entries].sort((a, b) => {
    const orderDiff = DAY_PART_ORDER.indexOf(a.dayPart) - DAY_PART_ORDER.indexOf(b.dayPart);
    if (orderDiff !== 0) return orderDiff;
    const aTime = a.scheduledTime?.trim() ?? "";
    const bTime = b.scheduledTime?.trim() ?? "";
    if (aTime === bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return aTime.localeCompare(bTime);
  });
}
