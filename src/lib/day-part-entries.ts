import { dayPartIndex } from "@/lib/day-parts";

/**
 * Zeitangabe einer Handlung: keine, oder eine bis mehrere Tageszeiten. Pro
 * Tageszeit sind optional eine oder mehrere Uhrzeiten möglich — eine Uhrzeit gibt
 * es nur zusammen mit einer Tageszeit.
 */
export interface DayPartEntry {
  /**
   * Stabile Kennung der einzelnen Durchführung. Bei bestehenden Handlungen ist
   * das die ActionNode-ID — dadurch bleibt die Bestätigungshistorie erhalten,
   * auch wenn Tageszeit oder Uhrzeit geändert werden.
   */
  id: string;
  /** Tageszeit-ID */
  dayPart?: string;
  /** Optionale Uhrzeit (HH:mm), nur zusammen mit einer Tageszeit */
  scheduledTime?: string;
}

let entryCounter = 0;
export const newDayPartEntryId = () =>
  `dpe-${Date.now().toString(36)}-${(entryCounter++).toString(36)}`;

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
    id: `${entry.dayPart ?? "none"}#${index}`,
  }));
}

/** Kanonische Reihenfolge: nach Tageszeit (Morgen … Nacht), darin ohne Uhrzeit zuerst, dann nach Uhrzeit. */
export function sortDayPartEntries(entries: DayPartEntry[]): DayPartEntry[] {
  return [...entries].sort(
    (a, b) =>
      dayPartIndex(a.dayPart) - dayPartIndex(b.dayPart) ||
      (a.scheduledTime?.trim() ?? "").localeCompare(b.scheduledTime?.trim() ?? ""),
  );
}

/**
 * Prüfung vor dem Speichern: Hat eine Tageszeit mehrere Durchführungen, braucht
 * jede eine eigene, unterschiedliche Uhrzeit — sonst wären sie nicht unterscheidbar.
 */
export function scheduleEntriesError(entries: DayPartEntry[]): string | null {
  if (entries.some((entry) => !entry.dayPart && entry.scheduledTime?.trim())) {
    return "Eine Uhrzeit braucht eine Tageszeit.";
  }
  // Eine einzelne Durchführung ohne Tageszeit ist "Ohne Zeitangabe".
  if (entries.some((entry) => !entry.dayPart) && entries.length > 1) {
    return "Ohne Zeitangabe ist nur eine Durchführung möglich.";
  }
  const byDayPart = new Map<string, string[]>();
  entries.filter((entry) => entry.dayPart).forEach((entry) => {
    const times = byDayPart.get(entry.dayPart!) ?? [];
    times.push(entry.scheduledTime?.trim() ?? "");
    byDayPart.set(entry.dayPart!, times);
  });
  for (const times of byDayPart.values()) {
    if (times.length < 2) continue;
    if (times.some((time) => !time) || new Set(times).size !== times.length) {
      return "Mehrere Durchführungen in derselben Tageszeit brauchen je eine eigene, unterschiedliche Uhrzeit.";
    }
  }
  return null;
}
