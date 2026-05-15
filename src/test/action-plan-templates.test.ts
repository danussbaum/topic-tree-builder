import { afterEach, describe, expect, it } from "vitest";
import { DAY_PART_SELECT_OPTIONS } from "@/types/assessment";
import {
  ACTION_PLAN_TEMPLATES_STORAGE_KEY,
  buildDefaultTemplateEditable,
  buildDefaultTemplateFields,
  loadActionPlanTemplates,
  normalizeTemplateSelectValue,
} from "@/lib/action-plan-templates";

afterEach(() => {
  window.localStorage.clear();
});

describe("normalizeTemplateSelectValue", () => {
  it("normalisiert importierte Tageszeit-Labels auf gespeicherte Werte", () => {
    expect(normalizeTemplateSelectValue("Nachmittag", DAY_PART_SELECT_OPTIONS)).toBe("afternoon");
    expect(normalizeTemplateSelectValue(" nachmittag ", DAY_PART_SELECT_OPTIONS)).toBe("afternoon");
  });

  it("behält bereits exportierte Tageszeit-Werte bei", () => {
    expect(normalizeTemplateSelectValue("afternoon", DAY_PART_SELECT_OPTIONS)).toBe("afternoon");
  });

  it("normalisiert leere Select-Importe auf den internen Leerwert", () => {
    expect(normalizeTemplateSelectValue("", [{ value: "none", label: "<leer>" }])).toBe("none");
  });
});

describe("action plan template fields", () => {
  it("stellt Uhrzeit als neues optionales Vorlagenfeld bereit", () => {
    expect(buildDefaultTemplateFields().uhrzeit).toBe("");
  });

  it("stellt Leistungsart als internes Vorlagenfeld ohne Veränderbarkeit bereit", () => {
    expect(buildDefaultTemplateFields().leistungsart).toBe("none");
    expect(buildDefaultTemplateEditable(true).leistungsart).toBe(false);
  });

  it("ergänzt geladene ältere Vorlagen um das Uhrzeit-Feld", () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "tpl-alt",
          name: "Alt",
          fields: { titel: "Alte Handlung" },
          editable: { titel: false },
        },
      ]),
    );

    expect(loadActionPlanTemplates()[0]).toMatchObject({
      fields: { titel: "Alte Handlung", uhrzeit: "", leistungsart: "none" },
      editable: { titel: false, uhrzeit: true, leistungsart: false },
    });
  });
});
