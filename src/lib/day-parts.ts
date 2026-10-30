/**
 * Tageszeiten sind fix vorgegeben und nicht konfigurierbar. Sie haben bewusst kein
 * Zeitfenster: Eine Uhrzeit wird zusätzlich zur Tageszeit erfasst und nicht auf
 * Plausibilität geprüft ("Mittag, 23:30" ist zulässig).
 */
export interface DayPartDefinition {
  id: string;
  title: string;
}

/** IDs sind Konstanten: Vorlagen, Handlungen und Tests verweisen darauf. */
export const DAY_PART_SEED_IDS = {
  morning: "day-part-morgen",
  noon: "day-part-mittag",
  afternoon: "day-part-nachmittag",
  evening: "day-part-abend",
  night: "day-part-nacht",
} as const;

/** Reihenfolge für die Auswahl in Planung und Vorlagen. */
export const DAY_PARTS: DayPartDefinition[] = [
  { id: DAY_PART_SEED_IDS.morning, title: "Morgen" },
  { id: DAY_PART_SEED_IDS.noon, title: "Mittag" },
  { id: DAY_PART_SEED_IDS.afternoon, title: "Nachmittag" },
  { id: DAY_PART_SEED_IDS.evening, title: "Abend" },
  { id: DAY_PART_SEED_IDS.night, title: "Nacht" },
];

/** Alte Tageszeit-Schlüssel aus der Zeit des festen Union-Typs. */
export const LEGACY_DAY_PART_IDS: Record<string, string> = {
  morning: DAY_PART_SEED_IDS.morning,
  noon: DAY_PART_SEED_IDS.noon,
  afternoon: DAY_PART_SEED_IDS.afternoon,
  evening: DAY_PART_SEED_IDS.evening,
  night: DAY_PART_SEED_IDS.night,
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isValidTime = (value: string): boolean => TIME_PATTERN.test(value);

export const getDayParts = (): DayPartDefinition[] => DAY_PARTS;

export const findDayPartById = (
  id: string | undefined,
  dayParts: DayPartDefinition[] = DAY_PARTS,
): DayPartDefinition | undefined =>
  id ? dayParts.find((dayPart) => dayPart.id === id) : undefined;

/** Für den Vorlagen-Import: Titel unabhängig von Gross-/Kleinschreibung auflösen. */
export const findDayPartByTitle = (
  title: string,
  dayParts: DayPartDefinition[] = DAY_PARTS,
): DayPartDefinition | undefined => {
  const value = title.trim();
  if (!value) return undefined;
  return dayParts.find(
    (dayPart) => dayPart.title.localeCompare(value, "de", { sensitivity: "base" }) === 0,
  );
};

/** Position in der Auswahlreihenfolge (Morgen … Nacht); unbekannte zuletzt. */
export const dayPartIndex = (id: string | undefined): number => {
  const index = DAY_PARTS.findIndex((dayPart) => dayPart.id === id);
  return index < 0 ? DAY_PARTS.length : index;
};
