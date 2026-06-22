import { afterEach, describe, expect, it } from "vitest";
import {
  ACTION_PLAN_CATEGORY_STORAGE_KEY,
  ACTION_PLAN_CURRENT_USER_ROLE_IDS,
  canConfirmActionCategory,
  initialActionPlanCategoryPermissions,
  loadActionPlanCategoryPermissions,
  saveActionPlanCategoryPermissions,
} from "@/lib/action-plan-categories";

afterEach(() => {
  window.localStorage.clear();
});

describe("action plan categories", () => {
  it("liefert die geforderten Default-Rollen pro Kategorie", () => {
    expect(loadActionPlanCategoryPermissions()).toEqual(initialActionPlanCategoryPermissions);
    expect(loadActionPlanCategoryPermissions()).toEqual([
      {
        id: "a",
        name: "KLV A",
        authorizedRoleIds: [
          "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
          "kl-alle-handlungen-sehen-inhouse-spitex-b",
          "kl-alle-handlungen-sehen-inhouse-spitex-c",
        ],
      },
      {
        id: "b",
        name: "KLV B",
        authorizedRoleIds: [
          "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
          "kl-handlungen-bestaetigen-inhouse-spitex-b",
          "kl-alle-handlungen-sehen-inhouse-spitex-c",
        ],
      },
      {
        id: "c",
        name: "KLV C",
        authorizedRoleIds: [
          "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
          "kl-handlungen-bestaetigen-inhouse-spitex-b",
          "kl-handlungen-bestaetigen-inhouse-spitex-c",
        ],
      },
    ]);
  });

  it("simuliert die Inhouse-Spitex-A-Rolle für den eingeloggten Benutzer", () => {
    expect(ACTION_PLAN_CURRENT_USER_ROLE_IDS).toEqual([
      "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
    ]);
    expect(canConfirmActionCategory("a", initialActionPlanCategoryPermissions)).toBe(true);
    expect(canConfirmActionCategory("b", initialActionPlanCategoryPermissions)).toBe(true);
    expect(canConfirmActionCategory("c", initialActionPlanCategoryPermissions)).toBe(true);
  });

  it("erlaubt Bestätigungen für Handlungen ohne Kategorie", () => {
    expect(canConfirmActionCategory(undefined, initialActionPlanCategoryPermissions)).toBe(true);
  });

  it("persistiert angepasste Kategorie-Rollen im Browser-Cache", () => {
    const categories = [
      { id: "a" as const, name: "KLV A", authorizedRoleIds: [] },
      { id: "b" as const, name: "KLV B", authorizedRoleIds: [] },
      { id: "c" as const, name: "KLV C", authorizedRoleIds: [] },
    ];

    saveActionPlanCategoryPermissions(categories);

    expect(window.localStorage.getItem(ACTION_PLAN_CATEGORY_STORAGE_KEY)).toBe(
      JSON.stringify(categories),
    );
    expect(loadActionPlanCategoryPermissions()).toEqual(categories);
  });
});
