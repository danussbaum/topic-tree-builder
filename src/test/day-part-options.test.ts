import { describe, expect, it } from "vitest";
import { DAY_PART_LABEL, DAY_PART_ORDER, DAY_PART_SELECT_OPTIONS } from "@/types/assessment";

describe("Tageszeit Optionen", () => {
  it("enthält Nachmittag zwischen Mittag und Abend", () => {
    expect(DAY_PART_LABEL.afternoon).toBe("Nachmittag");
    expect(DAY_PART_ORDER).toEqual([
      "none",
      "morning",
      "noon",
      "afternoon",
      "evening",
      "night",
    ]);
    expect(DAY_PART_SELECT_OPTIONS.map((option) => option.value)).toEqual(DAY_PART_ORDER);
  });
});
