import { findDayPartById, getDayParts, type DayPartDefinition } from "@/lib/day-parts";

/**
 * Zeitangabe einer Handlung. Die drei Modi schliessen sich aus: entweder gar keine
 * Angabe, oder N Tageszeiten, oder N Uhrzeiten — Tageszeiten und Uhrzeiten werden
 * nie vermischt.
 */
export type ScheduleMode = "none" | "dayParts" | "times";

export interface DayPartEntry {
  /**
   * Stabile Kennung der einzelnen Durchführung. Bei bestehenden Handlungen ist
   * das die ActionNode-ID — dadurch bleibt die Bestätigungshistorie erhalten,
   * auch wenn Tageszeit oder Uhrzeit geändert werden.
   */
  id: string;
  /** Tageszeit-ID — nur im Modus "dayParts" gesetzt */
  dayPart?: string;
  /** Uhrzeit (HH:mm) — nur im Modus "times" gesetzt */
  scheduledTime?: string;
}

let entryCounter = 0;
export const newDayPartEntryId = () =>
  `dpe-${Date.now().toString(36)}-${(entryCounter++).toString(36)}`;

/** Der Modus ist nicht gespeichert, sondern folgt aus den Einträgen. */
export function scheduleModeOf(entries: DayPartEntry[]): ScheduleMode {
  if (entries.some((entry) => entry.scheduledTime?.trim())) return "times";
  if (entries.some((entry) => entry.dayPart)) return "dayParts";
  return "none";
}

/**
 * Vergibt Eintrags-IDs aus der Position. Für Quellen ohne eigene Identität
 * (Vorlagen-Feld als String): Die ID bleibt beim Tippen einer Uhrzeit stabil, das
 * Eingabefeld verliert also nicht den Fokus.
 */
export function withPositionalIds(
  entries: Array<{ dayPart?: string; scheduledTime?: string }>,
): DayPartEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    id: `${entry.dayPart ?? "time"}#${index}`,
  }));
}

/**
 * Kanonische Reihenfolge: im Uhrzeit-Modus nach Uhrzeit, im Tageszeit-Modus nach
 * dem Beginn der Tageszeit.
 */
export function sortDayPartEntries(
  entries: DayPartEntry[],
  dayParts: DayPartDefinition[] = getDayParts(),
): DayPartEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = a.scheduledTime?.trim() ?? "";
    const bTime = b.scheduledTime?.trim() ?? "";
    if (aTime || bTime) {
      if (aTime === bTime) return 0;
      if (!aTime) return 1;
      if (!bTime) return -1;
      return aTime.localeCompare(bTime);
    }
    const aFrom = findDayPartById(a.dayPart, dayParts)?.from ?? "";
    const bFrom = findDayPartById(b.dayPart, dayParts)?.from ?? "";
    return aFrom.localeCompare(bFrom);
  });
}

/**
 * Prüfung vor dem Speichern: Im gewählten Modus muss mindestens ein Eintrag
 * erfasst sein, und dieselbe Tageszeit bzw. dieselbe Uhrzeit darf nicht doppelt
 * vorkommen.
 */
export function scheduleEntriesError(
  entries: DayPartEntry[],
  mode: ScheduleMode,
): string | null {
  if (mode === "none") {
    // Leere Platzhalter-Zeilen (angelegt, aber nicht ausgefüllt) sind kein "ohne
    // Zeitangabe", sondern eine unvollständige Erfassung.
    return entries.length > 0 ? "Jede Durchführung braucht eine eigene, unterschiedliche Uhrzeit." : null;
  }

  if (mode === "times") {
    const times = entries
      .map((entry) => entry.scheduledTime?.trim())
      .filter((time): time is string => !!time);
    if (times.length === 0) return "Es muss mindestens eine Uhrzeit erfasst sein.";
    if (times.length !== entries.length || new Set(times).size !== times.length) {
      return "Jede Durchführung braucht eine eigene, unterschiedliche Uhrzeit.";
    }
    return null;
  }

  const dayPartIds = entries
    .map((entry) => entry.dayPart)
    .filter((id): id is string => !!id);
  if (dayPartIds.length === 0) return "Es muss mindestens eine Tageszeit gewählt sein.";
  if (new Set(dayPartIds).size !== dayPartIds.length) {
    return "Dieselbe Tageszeit ist mehrfach erfasst.";
  }
  return null;
}
