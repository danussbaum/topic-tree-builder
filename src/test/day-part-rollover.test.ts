import { describe, it, expect } from "vitest";
import { rollsToNextDay, formatScheduledTime, shiftISODate } from "@/lib/day-part-rollover";
import { parseTageszeit, serializeTageszeit } from "@/lib/action-plan-templates";
import { withPositionalIds, sortDayPartEntries } from "@/lib/day-part-entries";

describe("rollsToNextDay", () => {
  it("verschiebt Nacht-Einträge vor 12:00 auf den Folgetag", () => {
    expect(rollsToNextDay({ dayPart: "night", scheduledTime: "01:00" })).toBe(true);
    expect(rollsToNextDay({ dayPart: "night", scheduledTime: "04:00" })).toBe(true);
    expect(rollsToNextDay({ dayPart: "night", scheduledTime: "00:00" })).toBe(true);
  });

  it("lässt Nacht-Einträge ab 12:00 am Planungstag", () => {
    expect(rollsToNextDay({ dayPart: "night", scheduledTime: "22:00" })).toBe(false);
    expect(rollsToNextDay({ dayPart: "night", scheduledTime: "12:00" })).toBe(false);
  });

  it("verschiebt nur die Tageszeit Nacht", () => {
    expect(rollsToNextDay({ dayPart: "morning", scheduledTime: "01:00" })).toBe(false);
    expect(rollsToNextDay({ dayPart: "evening", scheduledTime: "01:00" })).toBe(false);
  });

  it("verschiebt Nacht-Einträge ohne Uhrzeit nicht", () => {
    expect(rollsToNextDay({ dayPart: "night" })).toBe(false);
    expect(rollsToNextDay({ dayPart: "night", scheduledTime: "  " })).toBe(false);
  });

  it("kennzeichnet die verschobene Uhrzeit in der Anzeige", () => {
    expect(formatScheduledTime({ dayPart: "night", scheduledTime: "01:00" })).toBe("01:00 (+1 Tag)");
    expect(formatScheduledTime({ dayPart: "night", scheduledTime: "22:00" })).toBe("22:00");
    expect(formatScheduledTime({ dayPart: "morning" })).toBe("");
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

describe("Tageszeit-Vorlagenfeld mit Mehrfach-Zeiten", () => {
  it("überlebt einen Round-Trip mit mehreren Uhrzeiten derselben Tageszeit", () => {
    const raw = "night(22:00),night(01:00),night(04:00)";
    const parsed = parseTageszeit(raw);
    expect(parsed).toHaveLength(3);
    expect(serializeTageszeit(parsed)).toBe(raw);
  });

  it("vergibt stabile IDs je Position innerhalb der Tageszeit", () => {
    const entries = withPositionalIds(parseTageszeit("night(22:00),morning(07:00),night(01:00)"));
    expect(entries.map((e) => e.id)).toEqual(["night#0", "morning#0", "night#1"]);
    // Uhrzeit ändern lässt die ID unverändert — das Eingabefeld behält den Fokus.
    const changed = withPositionalIds(parseTageszeit("night(23:00),morning(07:00),night(01:00)"));
    expect(changed.map((e) => e.id)).toEqual(entries.map((e) => e.id));
  });
});

describe("sortDayPartEntries", () => {
  it("sortiert nach Tageszeit und innerhalb der Tageszeit nach Uhrzeit", () => {
    const sorted = sortDayPartEntries([
      { id: "c", dayPart: "night", scheduledTime: "04:00" },
      { id: "a", dayPart: "morning", scheduledTime: "07:00" },
      { id: "b", dayPart: "night", scheduledTime: "01:00" },
      { id: "d", dayPart: "night" },
    ]);
    // Einträge ohne Uhrzeit stehen innerhalb der Tageszeit hinten.
    expect(sorted.map((e) => e.id)).toEqual(["a", "b", "c", "d"]);
  });
});
