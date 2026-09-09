import { describe, expect, it } from "vitest";
import { clampDateToRange } from "@/lib/confirmation-window";

describe("clampDateToRange", () => {
  it("lässt ein Datum im Zeitraum unverändert", () => {
    expect(clampDateToRange("2026-08-14", "2026-08-10", "2026-08-16")).toBe("2026-08-14");
  });

  it("klammert auf den Beginn des Zeitraums", () => {
    expect(clampDateToRange("2026-08-05", "2026-08-10", "2026-08-16")).toBe("2026-08-10");
  });

  it("klammert auf das Ende des Zeitraums", () => {
    expect(clampDateToRange("2026-08-20", "2026-08-10", "2026-08-16")).toBe("2026-08-16");
  });

  it("gibt bei einem Ein-Tag-Zeitraum genau diesen Tag zurück", () => {
    expect(clampDateToRange("2026-08-14", "2026-08-14", "2026-08-14")).toBe("2026-08-14");
  });
});
