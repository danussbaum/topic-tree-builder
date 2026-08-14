import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";

/**
 * Tageszeit als Stammdatum: Titel plus Zeitfenster. "Bis" ist exklusiv, damit
 * benachbarte Tageszeiten sich an derselben Uhrzeit berühren können (08:00-12:00
 * und 12:00-14:00 überlappen nicht). Ist "bis" kleiner als "von", geht die
 * Tageszeit über Mitternacht.
 */
export interface DayPartDefinition {
  id: string;
  title: string;
  from: string;
  to: string;
}

export const DAY_PARTS_STORAGE_KEY = APPLICATION_BROWSER_STORAGE_KEYS[5];

/**
 * Seed-IDs sind bewusst Konstanten und nicht generiert: Die Migration bestehender
 * Handlungen bildet die alten Schlüssel ("morning"...) darauf ab, und Tests
 * brauchen deterministische Werte. Nur nachträglich angelegte Tageszeiten
 * bekommen generierte IDs.
 */
export const DAY_PART_SEED_IDS = {
  morning: "day-part-morgen",
  noon: "day-part-mittag",
  afternoon: "day-part-nachmittag",
  evening: "day-part-abend",
  night: "day-part-nacht",
} as const;

export const initialDayParts: DayPartDefinition[] = [
  { id: DAY_PART_SEED_IDS.morning, title: "Morgen", from: "06:00", to: "11:00" },
  { id: DAY_PART_SEED_IDS.noon, title: "Mittag", from: "11:00", to: "14:00" },
  { id: DAY_PART_SEED_IDS.afternoon, title: "Nachmittag", from: "14:00", to: "17:00" },
  { id: DAY_PART_SEED_IDS.evening, title: "Abend", from: "17:00", to: "22:00" },
  { id: DAY_PART_SEED_IDS.night, title: "Nacht", from: "22:00", to: "06:00" },
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

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const MINUTES_PER_DAY = 24 * 60;

const formatMinutes = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

let dayPartCounter = 0;
export const newDayPartId = () =>
  `day-part-${Date.now().toString(36)}-${(dayPartCounter++).toString(36)}`;

export const spansMidnight = (dayPart: DayPartDefinition): boolean =>
  dayPart.to < dayPart.from;

/** Anzeigereihenfolge: nach "von" aufsteigend. */
export const sortedDayParts = (dayParts: DayPartDefinition[]): DayPartDefinition[] =>
  [...dayParts].sort((a, b) => a.from.localeCompare(b.from));

const containsTime = (dayPart: DayPartDefinition, time: string): boolean =>
  spansMidnight(dayPart)
    ? time >= dayPart.from || time < dayPart.to
    : time >= dayPart.from && time < dayPart.to;

/**
 * Tageszeit einer Uhrzeit. Bei gültiger Konfiguration (lückenlos) findet sich
 * immer eine; undefined bleibt für den Defensivfall einer ungültig gespeicherten
 * Konfiguration.
 */
export const resolveDayPart = (
  time: string | undefined,
  dayParts: DayPartDefinition[],
): DayPartDefinition | undefined => {
  const value = time?.trim();
  if (!value || !isValidTime(value)) return undefined;
  return dayParts.find((dayPart) => containsTime(dayPart, value));
};

export const findDayPartById = (
  id: string | undefined,
  dayParts: DayPartDefinition[],
): DayPartDefinition | undefined =>
  id ? dayParts.find((dayPart) => dayPart.id === id) : undefined;

/** Für den Vorlagen-Import: Titel unabhängig von Gross-/Kleinschreibung auflösen. */
export const findDayPartByTitle = (
  title: string,
  dayParts: DayPartDefinition[],
): DayPartDefinition | undefined => {
  const value = title.trim();
  if (!value) return undefined;
  return dayParts.find(
    (dayPart) => dayPart.title.localeCompare(value, "de", { sensitivity: "base" }) === 0,
  );
};

export interface DayPartValidationError {
  /** Betroffene Tageszeit; fehlt bei Fehlern, die die ganze Liste betreffen. */
  dayPartId?: string;
  field?: "title" | "from" | "to";
  message: string;
}

/**
 * Die Konfiguration muss den ganzen Tag überlappungsfrei und lückenlos abdecken.
 * Beides wird in einem Durchgang geprüft: Über-Mitternacht-Tageszeiten werden in
 * zwei Abschnitte zerlegt, danach muss die sortierte Kette bei 00:00 beginnen,
 * ohne Sprung durchlaufen und bei 24:00 enden. Zwei Über-Mitternacht-Tageszeiten
 * fallen dabei automatisch auf, weil sich ihre Abschnitte um 00:00 überlappen.
 */
export const validateDayParts = (
  dayParts: DayPartDefinition[],
): DayPartValidationError[] => {
  const errors: DayPartValidationError[] = [];

  if (dayParts.length === 0) {
    return [{ message: "Es muss mindestens eine Tageszeit erfasst sein." }];
  }

  const titles = new Map<string, string>();
  dayParts.forEach((dayPart) => {
    const title = dayPart.title.trim();
    if (!title) {
      errors.push({ dayPartId: dayPart.id, field: "title", message: "Der Titel fehlt." });
    } else {
      // Doppelte Titel würden das Titel-Matching beim Vorlagen-Import zweideutig machen.
      const key = title.toLocaleLowerCase("de");
      if (titles.has(key)) {
        errors.push({
          dayPartId: dayPart.id,
          field: "title",
          message: `Der Titel "${title}" ist bereits vergeben.`,
        });
      }
      titles.set(key, dayPart.id);
    }

    if (!isValidTime(dayPart.from)) {
      errors.push({ dayPartId: dayPart.id, field: "from", message: "Uhrzeit von fehlt oder ist ungültig." });
    }
    if (!isValidTime(dayPart.to)) {
      errors.push({ dayPartId: dayPart.id, field: "to", message: "Uhrzeit bis fehlt oder ist ungültig." });
    }
    if (isValidTime(dayPart.from) && isValidTime(dayPart.to) && dayPart.from === dayPart.to) {
      errors.push({
        dayPartId: dayPart.id,
        field: "to",
        message: "Uhrzeit von und bis dürfen nicht gleich sein.",
      });
    }
  });

  if (errors.length > 0) return errors;

  const segments = dayParts.flatMap((dayPart) => {
    const from = toMinutes(dayPart.from);
    const to = toMinutes(dayPart.to);
    return spansMidnight(dayPart)
      ? [
          { dayPart, start: from, end: MINUTES_PER_DAY },
          { dayPart, start: 0, end: to },
        ]
      : [{ dayPart, start: from, end: to }];
  });
  segments.sort((a, b) => a.start - b.start || a.end - b.end);

  let cursor = 0;
  for (const segment of segments) {
    if (segment.start < cursor) {
      errors.push({
        dayPartId: segment.dayPart.id,
        field: "from",
        message: `"${segment.dayPart.title}" überlappt eine andere Tageszeit.`,
      });
      return errors;
    }
    if (segment.start > cursor) {
      errors.push({
        dayPartId: segment.dayPart.id,
        field: "from",
        message: `Zwischen ${formatMinutes(cursor)} und ${formatMinutes(segment.start)} ist keine Tageszeit erfasst.`,
      });
      return errors;
    }
    cursor = segment.end;
  }
  if (cursor < MINUTES_PER_DAY) {
    errors.push({
      message: `Zwischen ${formatMinutes(cursor)} und 24:00 ist keine Tageszeit erfasst.`,
    });
  }

  return errors;
};

const normalizeDayPart = (
  dayPart: Partial<DayPartDefinition>,
  index: number,
): DayPartDefinition | null => {
  const title = typeof dayPart.title === "string" ? dayPart.title.trim() : "";
  if (!title) return null;
  if (typeof dayPart.from !== "string" || !isValidTime(dayPart.from)) return null;
  if (typeof dayPart.to !== "string" || !isValidTime(dayPart.to)) return null;

  return {
    id:
      typeof dayPart.id === "string" && dayPart.id.trim()
        ? dayPart.id
        : `day-part-${index}`,
    title,
    from: dayPart.from,
    to: dayPart.to,
  };
};

export const loadDayParts = (): DayPartDefinition[] => {
  if (typeof window === "undefined") return initialDayParts;
  const raw = window.localStorage.getItem(DAY_PARTS_STORAGE_KEY);
  if (!raw) return initialDayParts;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialDayParts;
    const normalized = parsed
      .map((dayPart, index) => normalizeDayPart(dayPart, index))
      .filter((dayPart): dayPart is DayPartDefinition => dayPart !== null);
    // Eine unbrauchbar gespeicherte Konfiguration würde die Umsetzung unlesbar
    // machen — dann lieber mit den Vorgaben weiterarbeiten.
    if (validateDayParts(normalized).length > 0) return initialDayParts;
    return sortedDayParts(normalized);
  } catch {
    return initialDayParts;
  }
};

/**
 * Die Tageszeiten werden beim Rendern der Planung und der Umsetzung laufend
 * gebraucht — darum einmal laden und erst beim Speichern auffrischen.
 */
let cachedDayParts: DayPartDefinition[] | null = null;

export const getDayParts = (): DayPartDefinition[] =>
  (cachedDayParts ??= loadDayParts());

export const saveDayParts = (dayParts: DayPartDefinition[]) => {
  const sorted = sortedDayParts(dayParts);
  cachedDayParts = sorted;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAY_PARTS_STORAGE_KEY, JSON.stringify(sorted));
};

export const invalidateDayPartsCache = () => {
  cachedDayParts = null;
};

/**
 * Wo eine Tageszeit verwendet wird. Geprüft werden Handlungsvorlagen sowie geplante
 * und ungeplante Handlungen. Bestätigte Durchführungen zählen nicht: deren Tageszeit
 * ist als Snapshot festgehalten und bleibt darum lesbar (siehe ActionConfirmation).
 */
export interface DayPartUsage {
  templateNames: string[];
  actionTitles: string[];
}

const collectUsedDayPartIds = (): Map<string, DayPartUsage> => {
  const usage = new Map<string, DayPartUsage>();
  const add = (id: string, kind: keyof DayPartUsage, label: string) => {
    const entry = usage.get(id) ?? { templateNames: [], actionTitles: [] };
    if (!entry[kind].includes(label)) entry[kind].push(label);
    usage.set(id, entry);
  };

  if (typeof window === "undefined") return usage;

  // Vorlagen: das Feld "tageszeit" enthält im Tageszeit-Modus die Titel.
  try {
    const raw = window.localStorage.getItem(APPLICATION_BROWSER_STORAGE_KEYS[1]);
    const templates: Array<{ name?: string; fields?: Record<string, string> }> = raw
      ? JSON.parse(raw)
      : [];
    const known = loadDayParts();
    for (const template of Array.isArray(templates) ? templates : []) {
      const value = template.fields?.tageszeit;
      if (!value || value === "none") continue;
      for (const part of value.split(",").map((entry) => entry.trim())) {
        const match =
          findDayPartByTitle(part, known) ?? findDayPartById(LEGACY_DAY_PART_IDS[part], known);
        if (match) add(match.id, "templateNames", template.name ?? "Unbenannte Vorlage");
      }
    }
  } catch {
    // Unlesbare Vorlagen sperren nichts — die Prüfung ist eine Hilfe, kein Vertrag.
  }

  // Geplante und ungeplante Handlungen aus dem Zwischenspeicher.
  try {
    const raw = window.localStorage.getItem(APPLICATION_BROWSER_STORAGE_KEYS[0]);
    const parsed = raw ? JSON.parse(raw) : null;
    const clients: Array<{
      topics?: Array<{ targets?: Array<{ actions?: Array<{ title?: string; dayPart?: string }> }> }>;
    }> = parsed?.clients ?? [];
    for (const client of clients) {
      for (const topic of client.topics ?? []) {
        for (const target of topic.targets ?? []) {
          for (const action of target.actions ?? []) {
            if (action.dayPart) add(action.dayPart, "actionTitles", action.title ?? "Handlung");
          }
        }
      }
    }
  } catch {
    // dito
  }

  return usage;
};

/**
 * Vorlagen referenzieren Tageszeiten über den Titel (lesbar im CSV) — beim Umbenennen
 * werden sie darum mitgezogen, sonst zeigten sie auf einen Titel, den es nicht gibt.
 */
export const applyDayPartRenamesToTemplates = (
  renames: Array<{ from: string; to: string }>,
): void => {
  if (typeof window === "undefined" || renames.length === 0) return;
  const key = APPLICATION_BROWSER_STORAGE_KEYS[1];
  const raw = window.localStorage.getItem(key);
  if (!raw) return;

  try {
    const templates = JSON.parse(raw);
    if (!Array.isArray(templates)) return;
    const byOldTitle = new Map(
      renames.map(({ from, to }) => [from.trim().toLocaleLowerCase("de"), to]),
    );
    const updated = templates.map((template) => {
      const value: unknown = template?.fields?.tageszeit;
      if (typeof value !== "string" || !value || value === "none") return template;
      const parts = value.split(",").map((entry) => entry.trim());
      const next = parts.map((part) => byOldTitle.get(part.toLocaleLowerCase("de")) ?? part);
      if (next.join(",") === value) return template;
      return { ...template, fields: { ...template.fields, tageszeit: next.join(",") } };
    });
    window.localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Unlesbare Vorlagen werden nicht angefasst.
  }
};

export const getDayPartUsage = (dayPartId: string): DayPartUsage | undefined =>
  collectUsedDayPartIds().get(dayPartId);

export const getAllDayPartUsage = (): Map<string, DayPartUsage> => collectUsedDayPartIds();
