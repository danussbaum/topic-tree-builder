import { describe, expect, it } from "vitest";
import { DAY_PART_SELECT_OPTIONS } from "@/types/assessment";
import { normalizeTemplateSelectValue } from "@/lib/action-plan-templates";

describe("normalizeTemplateSelectValue", () => {
  it("normalisiert importierte Tageszeit-Labels auf gespeicherte Werte", () => {
    expect(normalizeTemplateSelectValue("Nachmittag", DAY_PART_SELECT_OPTIONS)).toBe("afternoon");
    expect(normalizeTemplateSelectValue(" nachmittag ", DAY_PART_SELECT_OPTIONS)).toBe("afternoon");
  });

  it("behält bereits exportierte Tageszeit-Werte bei", () => {
    expect(normalizeTemplateSelectValue("afternoon", DAY_PART_SELECT_OPTIONS)).toBe("afternoon");
  });
});
