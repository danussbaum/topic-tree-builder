import { afterEach, describe, expect, it } from "vitest";
import {
  ACTION_PLAN_DISCIPLINES_STORAGE_KEY,
  initialActionPlanDisciplines,
  loadActionPlanDisciplines,
  saveActionPlanDisciplines,
} from "@/lib/action-plan-disciplines";

afterEach(() => {
  window.localStorage.clear();
});

describe("action plan disciplines", () => {
  it("liefert die geforderten Default-Disziplinen", () => {
    expect(loadActionPlanDisciplines()).toEqual(initialActionPlanDisciplines);
    expect(
      loadActionPlanDisciplines().map((discipline) => discipline.title),
    ).toEqual([
      "Inhouse-Spitex",
      "IHP",
      "Physiotherapie",
      "Ergotherapie",
      "KJA Förderplanung",
    ]);
  });

  it("persistiert angepasste Disziplinen im Browser-Cache", () => {
    const disciplines = [{ id: "discipline-custom", title: "Logopädie" }];

    saveActionPlanDisciplines(disciplines);

    expect(
      window.localStorage.getItem(ACTION_PLAN_DISCIPLINES_STORAGE_KEY),
    ).toBe(JSON.stringify(disciplines));
    expect(loadActionPlanDisciplines()).toEqual(disciplines);
  });

  it("persistiert auch eine vollständig geleerte Disziplinenliste", () => {
    saveActionPlanDisciplines([]);

    expect(loadActionPlanDisciplines()).toEqual([]);
  });

  it("fällt bei gelöschtem Cache auf die Default-Disziplinen zurück", () => {
    saveActionPlanDisciplines([
      { id: "discipline-custom", title: "Logopädie" },
    ]);

    window.localStorage.removeItem(ACTION_PLAN_DISCIPLINES_STORAGE_KEY);

    expect(loadActionPlanDisciplines()).toEqual(initialActionPlanDisciplines);
  });
});
