import { afterEach, describe, expect, it } from "vitest";
import {
  ACTION_PLAN_DISCIPLINES_STORAGE_KEY,
  INHOUSE_SPITEX_DEFAULT_AUTHORIZED_ROLE_IDS,
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
    const disciplines = [
      { id: "discipline-custom", title: "Logopädie", authorizedRoleIds: [] },
    ];

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

  it("hinterlegt berechtigte Rollen nur für Inhouse-Spitex als Default", () => {
    expect(loadActionPlanDisciplines()).toEqual([
      expect.objectContaining({
        title: "Inhouse-Spitex",
        authorizedRoleIds: INHOUSE_SPITEX_DEFAULT_AUTHORIZED_ROLE_IDS,
      }),
      expect.objectContaining({ title: "IHP", authorizedRoleIds: [] }),
      expect.objectContaining({
        title: "Physiotherapie",
        authorizedRoleIds: [],
      }),
      expect.objectContaining({ title: "Ergotherapie", authorizedRoleIds: [] }),
      expect.objectContaining({
        title: "KJA Förderplanung",
        authorizedRoleIds: [],
      }),
    ]);
  });

  it("ergänzt ältere Disziplinen ohne Rollenfeld passend zu den Defaults", () => {
    window.localStorage.setItem(
      ACTION_PLAN_DISCIPLINES_STORAGE_KEY,
      JSON.stringify([
        { id: "discipline-inhouse-spitex", title: "Inhouse-Spitex" },
        { id: "discipline-ihp", title: "IHP" },
      ]),
    );

    expect(loadActionPlanDisciplines()).toEqual([
      {
        id: "discipline-inhouse-spitex",
        title: "Inhouse-Spitex",
        authorizedRoleIds: INHOUSE_SPITEX_DEFAULT_AUTHORIZED_ROLE_IDS,
      },
      { id: "discipline-ihp", title: "IHP", authorizedRoleIds: [] },
    ]);
  });

  it("fällt bei gelöschtem Cache auf die Default-Disziplinen zurück", () => {
    saveActionPlanDisciplines([
      { id: "discipline-custom", title: "Logopädie", authorizedRoleIds: [] },
    ]);

    window.localStorage.removeItem(ACTION_PLAN_DISCIPLINES_STORAGE_KEY);

    expect(loadActionPlanDisciplines()).toEqual(initialActionPlanDisciplines);
  });
});
