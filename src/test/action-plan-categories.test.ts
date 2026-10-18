import { afterEach, describe, expect, it } from "vitest";
import {
  getCategoryIdForTemplateName,
  initialActionPlanCategories,
  loadActionPlanCategories,
  saveActionPlanCategories,
} from "@/lib/action-plan-categories";
import {
  initialActionPlanDisciplines,
  loadActionPlanDisciplines,
  saveActionPlanDisciplines,
} from "@/lib/action-plan-disciplines";
import {
  getAvailableCategories,
  initialTemplates,
  resolveTemplateCategoryId,
} from "@/lib/action-plan-templates";

afterEach(() => {
  window.localStorage.clear();
});

describe("Kategorien", () => {
  it("seedet exakt die vorgegebenen Kategorien", () => {
    expect(initialActionPlanCategories.map((c) => `${c.code} ${c.name}`)).toEqual([
      "100 Psychiatrische Leistungen",
      "101 Hygiene und Komfort",
      "102 Atmung",
      "103 Ernährung / Diäten",
      "104 Ausscheidung",
      "105 Mobilisation",
      "106 Therapien",
      "107 Verbände und Hilfsmittel",
      "108 Messung Vitalzeichen / Pflegehandlungen für Diagnostik",
      "109 Abklärung, Koordination / Anleitung, Prävention, Beratung, Begleitung",
      "200 Wohnen / Haushalten / Verpflegung / Diverses",
    ]);
  });

  it("ordnet alle Seed-Kategorien der Inhouse-Spitex zu, sonst keiner Disziplin", () => {
    const [spitex, ...others] = initialActionPlanDisciplines;
    expect(spitex.title).toBe("Inhouse-Spitex");
    expect(spitex.categoryIds).toEqual(initialActionPlanCategories.map((c) => c.id));
    others.forEach((discipline) => expect(discipline.categoryIds).toEqual([]));
  });

  it("leitet die Kategorie aus dem Zahlencode der Vorlage ab", () => {
    expect(getCategoryIdForTemplateName("10101 Ganzwäsche")).toBe("category-101");
    expect(getCategoryIdForTemplateName("20099 Diverses")).toBe("category-200");
    expect(getCategoryIdForTemplateName("Morgenroutine")).toBeUndefined();
  });

  it("ergänzt alle Seed-Vorlagen mit Code um die passende Kategorie", () => {
    initialTemplates.forEach((template) => {
      const code = /^(\d{3})\d{2}/.exec(template.code)?.[1];
      expect(template.categoryId).toBe(code ? `category-${code}` : undefined);
    });
    expect(initialTemplates.filter((t) => t.categoryId).length).toBe(151);
  });

  it("bietet die Vereinigung der Kategorien der gewählten Disziplinen an", () => {
    const disciplines = [
      { id: "d1", title: "A", authorizedRoleIds: [], categoryIds: ["category-105", "category-101"] },
      { id: "d2", title: "B", authorizedRoleIds: [], categoryIds: ["category-101", "category-200"] },
      { id: "d3", title: "C", authorizedRoleIds: [], categoryIds: ["category-102"] },
    ];
    expect(
      getAvailableCategories(["d1", "d2"], disciplines, initialActionPlanCategories).map((c) => c.code),
    ).toEqual(["101", "105", "200"]);
    expect(getAvailableCategories([], disciplines, initialActionPlanCategories)).toEqual([]);
  });

  it("löst importierte Kategorien über Code oder Bezeichnung auf", () => {
    expect(resolveTemplateCategoryId("102", initialActionPlanCategories)).toEqual({ categoryId: "category-102", invalid: false });
    expect(resolveTemplateCategoryId("Atmung", initialActionPlanCategories)).toEqual({ categoryId: "category-102", invalid: false });
    expect(resolveTemplateCategoryId("", initialActionPlanCategories)).toEqual({ invalid: false });
    expect(resolveTemplateCategoryId("999", initialActionPlanCategories)).toEqual({ invalid: true });
  });

  it("entfernt gelöschte Kategorien aus den Disziplinen", () => {
    saveActionPlanDisciplines(initialActionPlanDisciplines);
    saveActionPlanCategories(initialActionPlanCategories.filter((c) => c.code !== "102"));

    expect(loadActionPlanCategories()).toHaveLength(10);
    expect(loadActionPlanDisciplines()[0].categoryIds).not.toContain("category-102");
    expect(loadActionPlanDisciplines()[0].categoryIds).toHaveLength(10);
  });
});
