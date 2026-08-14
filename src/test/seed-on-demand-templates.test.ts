import { describe, expect, it } from "vitest";
import { initialTemplates } from "@/lib/action-plan-templates";

/**
 * Fachlich festgelegte Handlungsarten der Inhouse-Spitex, die nach Bedarf erfasst
 * werden — sie haben keine zwingende Wiederholung. Die Liste ist die Referenz:
 * genau diese Nummern (und keine anderen) tragen die Wiederholung "Nach Bedarf".
 */
const ON_DEMAND_NUMBERS = [
  "10001", "10002", "10003", "10004", "10005", "10006", "10007", "10008", "10009",
  "10010", "10011", "10012", "10013", "10014", "10015", "10016",
  "10204", "10205",
  "10303", "10304", "10305",
  "10401", "10402", "10403", "10404", "10405", "10406", "10407", "10408", "10409",
  "10410", "10411", "10412", "10413", "10414", "10415", "10417", "10419", "10420",
  "10503", "10504", "10507",
  "10601", "10602", "10603", "10604", "10605", "10606", "10607", "10608", "10609",
  "10610", "10612", "10613", "10614", "10615", "10618",
  "10701", "10702", "10703", "10704",
  "10801", "10802", "10803", "10804", "10805", "10806", "10808", "10809", "10810",
  "10811", "10812",
  "10902", "10905", "10906", "10908", "10909", "10910", "10911", "10912",
  "20001", "20032", "20033", "20034", "20035", "20036", "20038", "20042", "20043",
];

const spitexTemplates = initialTemplates.filter((template) =>
  template.disciplineIds.includes("discipline-inhouse-spitex"),
);

const numberOf = (name: string) => /^(\d{5})\b/.exec(name)?.[1] ?? null;

describe("Nach-Bedarf-Handlungsarten im Inhouse-Spitex-Seed", () => {
  it("kennt jede geforderte Nummer als Handlungsart", () => {
    const existing = new Set(
      spitexTemplates.map((template) => numberOf(template.name)).filter(Boolean),
    );
    const missing = ON_DEMAND_NUMBERS.filter((number) => !existing.has(number));

    expect(missing).toEqual([]);
  });

  it("setzt genau bei diesen Nummern die Wiederholung auf Nach Bedarf", () => {
    const actual = spitexTemplates
      .filter((template) => template.fields.wiederholung === "on_demand")
      .map((template) => numberOf(template.name))
      .sort();

    expect(actual).toEqual([...ON_DEMAND_NUMBERS].sort());
  });

  it("lässt die Wiederholung dieser Handlungsarten in der Planung verändern", () => {
    const notEditable = spitexTemplates
      .filter((template) => template.fields.wiederholung === "on_demand")
      .filter((template) => !template.editable.wiederholung)
      .map((template) => template.name);

    expect(notEditable).toEqual([]);
  });

  it("lässt alle übrigen Handlungsarten unverändert wiederkehrend", () => {
    const wanted = new Set(ON_DEMAND_NUMBERS);
    const others = spitexTemplates.filter((template) => {
      const number = numberOf(template.name);
      return !number || !wanted.has(number);
    });

    expect(others.length).toBeGreaterThan(0);
    expect(others.every((template) => template.fields.wiederholung !== "on_demand")).toBe(true);
  });
});
