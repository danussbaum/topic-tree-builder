import { beforeEach, describe, expect, it } from "vitest";
import {
  DAY_PARTS_STORAGE_KEY,
  DAY_PART_SEED_IDS,
  findDayPartByTitle,
  getDayParts,
  initialDayParts,
  invalidateDayPartsCache,
  loadDayParts,
  resolveDayPart,
  saveDayParts,
  sortedDayParts,
  spansMidnight,
  validateDayParts,
  type DayPartDefinition,
} from "@/lib/day-parts";

const dayPart = (
  id: string,
  title: string,
  from: string,
  to: string,
): DayPartDefinition => ({ id, title, from, to });

describe("Tageszeiten: Vorgaben", () => {
  it("deckt den Tag lückenlos ab", () => {
    expect(validateDayParts(initialDayParts)).toEqual([]);
  });

  it("legt die Nacht über Mitternacht", () => {
    const night = initialDayParts.find((entry) => entry.id === DAY_PART_SEED_IDS.night)!;
    expect(spansMidnight(night)).toBe(true);
    expect(initialDayParts.filter(spansMidnight)).toHaveLength(1);
  });

  it("ordnet die Uhrzeit der Seed-Vorlage dem Morgen zu", () => {
    expect(resolveDayPart("07:30", initialDayParts)?.title).toBe("Morgen");
  });
});

describe("Tageszeiten: Auflösung einer Uhrzeit", () => {
  it("behandelt bis als exklusiv", () => {
    expect(resolveDayPart("06:00", initialDayParts)?.title).toBe("Morgen");
    expect(resolveDayPart("10:59", initialDayParts)?.title).toBe("Morgen");
    expect(resolveDayPart("11:00", initialDayParts)?.title).toBe("Mittag");
  });

  it("ordnet Uhrzeiten nach Mitternacht der Nacht zu", () => {
    expect(resolveDayPart("22:00", initialDayParts)?.title).toBe("Nacht");
    expect(resolveDayPart("00:00", initialDayParts)?.title).toBe("Nacht");
    expect(resolveDayPart("05:59", initialDayParts)?.title).toBe("Nacht");
  });

  it("liefert ohne oder mit ungültiger Uhrzeit nichts", () => {
    expect(resolveDayPart(undefined, initialDayParts)).toBeUndefined();
    expect(resolveDayPart("", initialDayParts)).toBeUndefined();
    expect(resolveDayPart("24:00", initialDayParts)).toBeUndefined();
    expect(resolveDayPart("7:30", initialDayParts)).toBeUndefined();
  });
});

describe("Tageszeiten: Validierung", () => {
  it("verlangt mindestens eine Tageszeit", () => {
    expect(validateDayParts([])).toEqual([
      { message: "Es muss mindestens eine Tageszeit erfasst sein." },
    ]);
  });

  it("meldet eine Lücke", () => {
    const errors = validateDayParts([
      dayPart("a", "Tag", "06:00", "12:00"),
      dayPart("b", "Nacht", "13:00", "06:00"),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("12:00");
    expect(errors[0].message).toContain("13:00");
  });

  it("meldet eine Überlappung", () => {
    const errors = validateDayParts([
      dayPart("a", "Tag", "06:00", "13:00"),
      dayPart("b", "Nacht", "12:00", "06:00"),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("überlappt");
  });

  it("akzeptiert eine lückenlose Kette mit Über-Mitternacht-Tageszeit", () => {
    expect(
      validateDayParts([
        dayPart("a", "Tag", "06:00", "22:00"),
        dayPart("b", "Nacht", "22:00", "06:00"),
      ]),
    ).toEqual([]);
  });

  it("lehnt zwei Über-Mitternacht-Tageszeiten ab, weil sie sich um 00:00 überlappen", () => {
    const errors = validateDayParts([
      dayPart("a", "Spätdienst", "22:00", "02:00"),
      dayPart("b", "Nachtdienst", "23:00", "01:00"),
      dayPart("c", "Tag", "02:00", "22:00"),
    ]);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("erlaubt aufeinanderfolgende Nachtdienste ohne Überlappung", () => {
    expect(
      validateDayParts([
        dayPart("a", "Spätdienst", "22:00", "02:00"),
        dayPart("b", "Nachtdienst", "02:00", "06:00"),
        dayPart("c", "Tag", "06:00", "22:00"),
      ]),
    ).toEqual([]);
  });

  it("lehnt doppelte Titel ab, weil der Vorlagen-Import über den Titel matcht", () => {
    const errors = validateDayParts([
      dayPart("a", "Nacht", "06:00", "22:00"),
      dayPart("b", "nacht", "22:00", "06:00"),
    ]);
    expect(errors).toEqual([
      { dayPartId: "b", field: "title", message: 'Der Titel "nacht" ist bereits vergeben.' },
    ]);
  });

  it("lehnt fehlende Titel und ungültige Uhrzeiten ab", () => {
    const errors = validateDayParts([
      dayPart("a", "  ", "06:00", "22:00"),
      dayPart("b", "Nacht", "22:00", "24:00"),
      dayPart("c", "Gleich", "08:00", "08:00"),
    ]);
    expect(errors.map((error) => [error.dayPartId, error.field])).toEqual([
      ["a", "title"],
      ["b", "to"],
      ["c", "to"],
    ]);
  });
});

describe("Tageszeiten: Sortierung und Titel-Auflösung", () => {
  it("sortiert nach Uhrzeit von", () => {
    const sorted = sortedDayParts([
      dayPart("b", "Nacht", "22:00", "06:00"),
      dayPart("a", "Morgen", "06:00", "22:00"),
    ]);
    expect(sorted.map((entry) => entry.title)).toEqual(["Morgen", "Nacht"]);
  });

  it("löst Titel unabhängig von Gross-/Kleinschreibung auf", () => {
    expect(findDayPartByTitle(" nachmittag ", initialDayParts)?.id).toBe(
      DAY_PART_SEED_IDS.afternoon,
    );
    expect(findDayPartByTitle("Nachtdienst", initialDayParts)).toBeUndefined();
    expect(findDayPartByTitle("  ", initialDayParts)).toBeUndefined();
  });
});

describe("Tageszeiten: Persistenz", () => {
  beforeEach(() => {
    window.localStorage.clear();
    invalidateDayPartsCache();
  });

  it("liefert ohne gespeicherte Daten die Vorgaben", () => {
    expect(loadDayParts()).toEqual(initialDayParts);
  });

  it("speichert sortiert und liest zurück", () => {
    saveDayParts([
      dayPart("b", "Nacht", "22:00", "06:00"),
      dayPart("a", "Tag", "06:00", "22:00"),
    ]);
    invalidateDayPartsCache();
    expect(loadDayParts().map((entry) => entry.title)).toEqual(["Tag", "Nacht"]);
  });

  it("fällt bei ungültig gespeicherter Konfiguration auf die Vorgaben zurück", () => {
    window.localStorage.setItem(
      DAY_PARTS_STORAGE_KEY,
      JSON.stringify([dayPart("a", "Tag", "06:00", "12:00")]),
    );
    expect(loadDayParts()).toEqual(initialDayParts);
  });

  it("frischt den Zwischenspeicher erst beim Speichern auf", () => {
    expect(getDayParts()).toEqual(initialDayParts);
    window.localStorage.setItem(
      DAY_PARTS_STORAGE_KEY,
      JSON.stringify([dayPart("a", "Ganztags", "00:00", "24:00")]),
    );
    expect(getDayParts()).toEqual(initialDayParts);

    const custom = [dayPart("a", "Tag", "06:00", "22:00"), dayPart("b", "Nacht", "22:00", "06:00")];
    saveDayParts(custom);
    expect(getDayParts()).toEqual(custom);
  });
});
