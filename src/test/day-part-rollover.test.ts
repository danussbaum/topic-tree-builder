import { describe, it, expect } from "vitest";
import {
  confirmationDayPartKey,
  confirmationDayPartOrder,
  dayPartSectionLabel,
  effectiveDayPart,
  formatScheduledTime,
  previousDayKey,
  rollsToNextDay,
  scheduleSortKey,
  shiftISODate,
} from "@/lib/day-part-rollover";
import { DAY_PART_SEED_IDS, initialDayParts } from "@/lib/day-parts";
import { parseTageszeit, serializeTageszeit } from "@/lib/action-plan-templates";
import { withPositionalIds, sortDayPartEntries } from "@/lib/day-part-entries";

// Vorgaben: Morgen 06:00-11:00, Mittag 11:00-14:00, Nachmittag 14:00-17:00,
// Abend 17:00-22:00, Nacht 22:00-06:00.
const dayParts = initialDayParts;

describe("rollsToNextDay", () => {
  it("verschiebt Uhrzeiten im Teil nach Mitternacht auf den Folgetag", () => {
    expect(rollsToNextDay({ scheduledTime: "01:00" }, dayParts)).toBe(true);
    expect(rollsToNextDay({ scheduledTime: "04:00" }, dayParts)).toBe(true);
    expect(rollsToNextDay({ scheduledTime: "00:00" }, dayParts)).toBe(true);
  });

  it("lässt Uhrzeiten vor Mitternacht am Planungstag", () => {
    expect(rollsToNextDay({ scheduledTime: "22:00" }, dayParts)).toBe(false);
    expect(rollsToNextDay({ scheduledTime: "23:59" }, dayParts)).toBe(false);
  });

  it("verschiebt nur Uhrzeiten in der über-Mitternacht-Tageszeit", () => {
    expect(rollsToNextDay({ scheduledTime: "07:00" }, dayParts)).toBe(false);
    expect(rollsToNextDay({ scheduledTime: "12:00" }, dayParts)).toBe(false);
    // 06:00 ist der Beginn des Morgens, gehört also nicht mehr zur Nacht.
    expect(rollsToNextDay({ scheduledTime: "06:00" }, dayParts)).toBe(false);
  });

  it("verschiebt Handlungen im Tageszeit-Modus nie", () => {
    expect(rollsToNextDay({ dayPart: DAY_PART_SEED_IDS.night }, dayParts)).toBe(false);
    expect(rollsToNextDay({ dayPart: DAY_PART_SEED_IDS.night, scheduledTime: "  " }, dayParts)).toBe(
      false,
    );
  });

  it("folgt der Konfiguration statt einer festen Grenze", () => {
    // Andere Nacht (23:00-05:00): 05:30 gehört nun zum Morgen und rollt nicht mehr.
    const custom = [
      { id: "tag", title: "Tag", from: "05:00", to: "23:00" },
      { id: "nacht", title: "Nacht", from: "23:00", to: "05:00" },
    ];
    expect(rollsToNextDay({ scheduledTime: "04:00" }, custom)).toBe(true);
    expect(rollsToNextDay({ scheduledTime: "05:30" }, custom)).toBe(false);
  });

  it("kennzeichnet die verschobene Uhrzeit in der Anzeige", () => {
    expect(formatScheduledTime({ scheduledTime: "01:00" }, dayParts)).toBe("01:00 (+1 Tag)");
    expect(formatScheduledTime({ scheduledTime: "22:00" }, dayParts)).toBe("22:00");
    expect(formatScheduledTime({ dayPart: DAY_PART_SEED_IDS.morning }, dayParts)).toBe("");
  });
});

describe("effectiveDayPart", () => {
  it("nimmt im Tageszeit-Modus die gesetzte Tageszeit", () => {
    expect(effectiveDayPart({ dayPart: DAY_PART_SEED_IDS.evening }, dayParts)?.title).toBe("Abend");
  });

  it("leitet im Uhrzeit-Modus aus der Uhrzeit ab", () => {
    expect(effectiveDayPart({ scheduledTime: "15:00" }, dayParts)?.title).toBe("Nachmittag");
  });

  it("liefert ohne Zeitangabe nichts", () => {
    expect(effectiveDayPart({}, dayParts)).toBeUndefined();
  });
});

describe("Abschnitte der Umsetzung", () => {
  it("stellt vorgezogene Einträge vor die erste Tageszeit", () => {
    expect(confirmationDayPartOrder(dayParts)).toEqual([
      "none",
      previousDayKey(DAY_PART_SEED_IDS.night),
      DAY_PART_SEED_IDS.morning,
      DAY_PART_SEED_IDS.noon,
      DAY_PART_SEED_IDS.afternoon,
      DAY_PART_SEED_IDS.evening,
      DAY_PART_SEED_IDS.night,
    ]);
  });

  it("ordnet Handlungen ihrem Abschnitt zu", () => {
    expect(confirmationDayPartKey({ scheduledTime: "01:00" }, dayParts)).toBe(
      previousDayKey(DAY_PART_SEED_IDS.night),
    );
    expect(confirmationDayPartKey({ scheduledTime: "22:00" }, dayParts)).toBe(
      DAY_PART_SEED_IDS.night,
    );
    expect(confirmationDayPartKey({ scheduledTime: "07:30" }, dayParts)).toBe(
      DAY_PART_SEED_IDS.morning,
    );
    expect(confirmationDayPartKey({ dayPart: DAY_PART_SEED_IDS.noon }, dayParts)).toBe(
      DAY_PART_SEED_IDS.noon,
    );
    expect(confirmationDayPartKey({}, dayParts)).toBe("none");
    // Eine Tageszeit, die es nicht mehr gibt, fällt in den Abschnitt ohne Zeitangabe.
    expect(confirmationDayPartKey({ dayPart: "gelöscht" }, dayParts)).toBe("none");
  });

  it("benennt die Abschnitte", () => {
    expect(dayPartSectionLabel("none", dayParts)).toBe("Ohne Zeitangabe");
    expect(dayPartSectionLabel(DAY_PART_SEED_IDS.night, dayParts)).toBe("Nacht");
    expect(dayPartSectionLabel(previousDayKey(DAY_PART_SEED_IDS.night), dayParts)).toBe(
      "Nacht (Vortag)",
    );
  });

  it("sortiert innerhalb eines Abschnitts Uhrzeiten vor Handlungen ohne Uhrzeit", () => {
    const sorted = [
      { dayPart: DAY_PART_SEED_IDS.morning },
      { scheduledTime: "08:15" },
      { scheduledTime: "07:30" },
    ].sort((a, b) => scheduleSortKey(a, dayParts).localeCompare(scheduleSortKey(b, dayParts)));
    expect(sorted).toEqual([
      { scheduledTime: "07:30" },
      { scheduledTime: "08:15" },
      { dayPart: DAY_PART_SEED_IDS.morning },
    ]);
  });

  it("stellt die vorgezogene Nacht an den Tagesbeginn und die eigene an das Ende", () => {
    const sorted = [
      { scheduledTime: "22:00" },
      { scheduledTime: "07:30" },
      { scheduledTime: "01:00" },
    ].sort((a, b) => scheduleSortKey(a, dayParts).localeCompare(scheduleSortKey(b, dayParts)));
    expect(sorted.map((entry) => entry.scheduledTime)).toEqual(["01:00", "07:30", "22:00"]);
  });
});

describe("shiftISODate", () => {
  it("rechnet über Monats- und Jahresgrenzen", () => {
    expect(shiftISODate("2026-08-31", 1)).toBe("2026-09-01");
    expect(shiftISODate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftISODate("2027-01-01", -1)).toBe("2026-12-31");
    expect(shiftISODate("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("Tageszeit-Vorlagenfeld", () => {
  it("überlebt einen Round-Trip mit mehreren Uhrzeiten", () => {
    const raw = "22:00,01:00,04:00";
    const parsed = parseTageszeit(raw, dayParts);
    expect(parsed).toEqual([
      { scheduledTime: "22:00" },
      { scheduledTime: "01:00" },
      { scheduledTime: "04:00" },
    ]);
    expect(serializeTageszeit(parsed, dayParts)).toBe(raw);
  });

  it("überlebt einen Round-Trip mit Tageszeit-Titeln", () => {
    const raw = "Morgen,Abend";
    const parsed = parseTageszeit(raw, dayParts);
    expect(parsed).toEqual([
      { dayPart: DAY_PART_SEED_IDS.morning },
      { dayPart: DAY_PART_SEED_IDS.evening },
    ]);
    expect(serializeTageszeit(parsed, dayParts)).toBe(raw);
  });

  it("vergibt stabile IDs je Position", () => {
    const entries = withPositionalIds(parseTageszeit("22:00,07:00,01:00", dayParts));
    expect(entries.map((e) => e.id)).toEqual(["time#0", "time#1", "time#2"]);
    // Uhrzeit ändern lässt die ID unverändert — das Eingabefeld behält den Fokus.
    const changed = withPositionalIds(parseTageszeit("23:00,07:00,01:00", dayParts));
    expect(changed.map((e) => e.id)).toEqual(entries.map((e) => e.id));
  });

  it("liest die alte Kombiform und behält die Uhrzeit", () => {
    // Früher trug eine Tageszeit eine optionale Uhrzeit — dabei gewinnt die Uhrzeit.
    expect(parseTageszeit("night(22:00),night(01:00)", dayParts)).toEqual([
      { scheduledTime: "22:00" },
      { scheduledTime: "01:00" },
    ]);
  });

  it("liest alte Tageszeit-Schlüssel ohne Uhrzeit", () => {
    expect(parseTageszeit("morning,evening", dayParts)).toEqual([
      { dayPart: DAY_PART_SEED_IDS.morning },
      { dayPart: DAY_PART_SEED_IDS.evening },
    ]);
  });

  it("serialisiert eine leere Angabe als none", () => {
    expect(serializeTageszeit([], dayParts)).toBe("none");
    expect(parseTageszeit("none", dayParts)).toEqual([]);
  });
});

describe("sortDayPartEntries", () => {
  it("sortiert im Uhrzeit-Modus nach Uhrzeit", () => {
    const sorted = sortDayPartEntries(
      [
        { id: "c", scheduledTime: "04:00" },
        { id: "a", scheduledTime: "01:00" },
        { id: "b", scheduledTime: "02:00" },
      ],
      dayParts,
    );
    expect(sorted.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("sortiert im Tageszeit-Modus nach dem Beginn der Tageszeit", () => {
    const sorted = sortDayPartEntries(
      [
        { id: "c", dayPart: DAY_PART_SEED_IDS.night },
        { id: "a", dayPart: DAY_PART_SEED_IDS.morning },
        { id: "b", dayPart: DAY_PART_SEED_IDS.afternoon },
      ],
      dayParts,
    );
    expect(sorted.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });
});
