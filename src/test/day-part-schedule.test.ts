import { describe, it, expect } from "vitest";
import {
  confirmationDayPartKey,
  confirmationDayPartOrder,
  dayPartSectionLabel,
  effectiveDayPart,
  formatScheduledTime,
  NO_DAY_PART_KEY,
  scheduleOf,
  scheduleSortKey,
  shiftISODate,
} from "@/lib/day-part-schedule";
import { DAY_PART_SEED_IDS, DAY_PARTS } from "@/lib/day-parts";
import { parseTageszeit, serializeTageszeit } from "@/lib/action-plan-templates";
import {
  scheduleEntriesError,
  sortDayPartEntries,
  withPositionalIds,
} from "@/lib/day-part-entries";

const { morning, noon, afternoon, evening, night } = DAY_PART_SEED_IDS;

describe("feste Tageszeiten", () => {
  it("bietet Morgen bis Nacht in fester Reihenfolge an", () => {
    expect(DAY_PARTS.map((dayPart) => dayPart.title)).toEqual([
      "Morgen",
      "Mittag",
      "Nachmittag",
      "Abend",
      "Nacht",
    ]);
  });
});

describe("effectiveDayPart", () => {
  it("nimmt die gesetzte Tageszeit, auch mit unplausibler Uhrzeit", () => {
    expect(effectiveDayPart({ dayPart: noon, scheduledTime: "23:30" })?.title).toBe("Mittag");
  });

  it("liefert ohne Tageszeit nichts", () => {
    expect(effectiveDayPart({})).toBeUndefined();
  });

  it("zeigt die Uhrzeit ohne Hinweis auf einen Folgetag", () => {
    expect(formatScheduledTime({ dayPart: night, scheduledTime: "02:00" })).toBe("02:00");
  });
});

describe("Abschnitte der Umsetzung", () => {
  it("ordnet ohne Zeitangabe, Nacht, Morgen, Mittag, Nachmittag, Abend", () => {
    expect(confirmationDayPartOrder()).toEqual([NO_DAY_PART_KEY, night, morning, noon, afternoon, evening]);
  });

  it("ordnet Handlungen ihrem Abschnitt zu", () => {
    expect(confirmationDayPartKey({ dayPart: night, scheduledTime: "02:00" })).toBe(night);
    expect(confirmationDayPartKey({})).toBe(NO_DAY_PART_KEY);
  });

  it("benennt die Abschnitte", () => {
    expect(dayPartSectionLabel(NO_DAY_PART_KEY)).toBe("Ohne Zeitangabe");
    expect(dayPartSectionLabel(night)).toBe("Nacht");
  });

  it("sortiert innerhalb eines Abschnitts Uhrzeiten vor Handlungen ohne Uhrzeit", () => {
    const keys = [
      { dayPart: morning },
      { dayPart: morning, scheduledTime: "09:00" },
      { dayPart: night, scheduledTime: "23:00" },
    ].map(scheduleSortKey);
    expect([...keys].sort()).toEqual([keys[2], keys[1], keys[0]]);
  });
});

describe("scheduleOf", () => {
  it("nimmt nach einer Neuplanung die neue Tageszeit und Uhrzeit", () => {
    expect(
      scheduleOf({ dayPart: morning, scheduledTime: "07:00" }, { postponedToDayPart: evening, postponedToTime: "18:00" }),
    ).toEqual({ dayPart: evening, scheduledTime: "18:00" });
  });

  it("verwirft die Uhrzeit, wenn auf ohne Zeitangabe verschoben wurde", () => {
    expect(
      scheduleOf({ dayPart: morning, scheduledTime: "07:00" }, { postponedToDayPart: "none", postponedToTime: "18:00" }),
    ).toEqual({ dayPart: undefined, scheduledTime: undefined });
  });

  it("behält ohne Neuplanung die geplante Zeitangabe", () => {
    expect(scheduleOf({ dayPart: morning, scheduledTime: "07:00" })).toEqual({ dayPart: morning, scheduledTime: "07:00" });
  });
});

describe("shiftISODate", () => {
  it("rechnet über Monats- und Jahresgrenzen", () => {
    expect(shiftISODate("2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftISODate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftISODate("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("Tageszeit-Vorlagenfeld", () => {
  it("überlebt einen Round-Trip mit Tageszeiten und Uhrzeiten", () => {
    const value = "Morgen 07:30,Morgen 09:00,Abend";
    const entries = parseTageszeit(value);
    expect(entries).toEqual([
      { dayPart: morning, scheduledTime: "07:30" },
      { dayPart: morning, scheduledTime: "09:00" },
      { dayPart: evening },
    ]);
    expect(serializeTageszeit(entries)).toBe(value);
  });

  it("liest alte Tageszeit-Schlüssel", () => {
    expect(parseTageszeit("morning,night")).toEqual([{ dayPart: morning }, { dayPart: night }]);
  });

  it("behält eine Uhrzeit ohne Tageszeit, damit die Prüfung sie meldet", () => {
    const entries = withPositionalIds(parseTageszeit("07:30"));
    expect(entries[0].dayPart).toBeUndefined();
    expect(scheduleEntriesError(entries)).toBe("Eine Uhrzeit braucht eine Tageszeit.");
  });

  it("serialisiert eine leere Angabe als none", () => {
    expect(serializeTageszeit([])).toBe("none");
    expect(parseTageszeit("none")).toEqual([]);
  });

  it("vergibt stabile IDs je Position", () => {
    const entries = withPositionalIds(parseTageszeit("Morgen 07:30,Abend"));
    expect(entries.map((entry) => entry.id)).toEqual([`${morning}#0`, `${evening}#1`]);
  });
});

describe("scheduleEntriesError", () => {
  it("erlaubt ohne Zeitangabe und eine Tageszeit ohne Uhrzeit", () => {
    expect(scheduleEntriesError([])).toBeNull();
    expect(scheduleEntriesError([{ id: "a", dayPart: morning }])).toBeNull();
  });

  it("verlangt bei mehreren Durchführungen einer Tageszeit unterschiedliche Uhrzeiten", () => {
    expect(
      scheduleEntriesError([
        { id: "a", dayPart: morning, scheduledTime: "07:00" },
        { id: "b", dayPart: morning },
      ]),
    ).toMatch(/eigene, unterschiedliche Uhrzeit/);
    expect(
      scheduleEntriesError([
        { id: "a", dayPart: morning, scheduledTime: "07:00" },
        { id: "b", dayPart: morning, scheduledTime: "09:00" },
      ]),
    ).toBeNull();
  });
});

describe("sortDayPartEntries", () => {
  it("sortiert nach Tageszeit, darin nach Uhrzeit", () => {
    const sorted = sortDayPartEntries([
      { id: "a", dayPart: night },
      { id: "b", dayPart: morning, scheduledTime: "09:00" },
      { id: "c", dayPart: morning },
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(["c", "b", "a"]);
  });
});

describe("scheduleEntriesError mit Durchführung ohne Zeitangabe", () => {
  it("akzeptiert genau eine Durchführung ohne Tageszeit", () => {
    expect(scheduleEntriesError([{ id: "a" }])).toBeNull();
  });

  it("meldet eine Uhrzeit ohne Tageszeit", () => {
    expect(scheduleEntriesError([{ id: "a", scheduledTime: "12:00" }])).toBe("Eine Uhrzeit braucht eine Tageszeit.");
  });
});
