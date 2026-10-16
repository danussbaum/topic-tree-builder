import { afterEach, describe, expect, it } from "vitest";
import {
  ACTION_PLAN_CLASSIFICATION_STORAGE_KEY,
  ACTION_PLAN_CURRENT_USER_ROLE_IDS,
  canConfirmActionClassification,
  initialActionPlanClassificationPermissions,
  loadActionPlanClassificationPermissions,
  saveActionPlanClassificationPermissions,
} from "@/lib/action-plan-classifications";

afterEach(() => {
  window.localStorage.clear();
});

describe("action plan categories", () => {
  it("liefert die geforderten Default-Rollen pro Kategorie", () => {
    expect(loadActionPlanClassificationPermissions()).toEqual(initialActionPlanClassificationPermissions);
    expect(loadActionPlanClassificationPermissions()).toEqual([
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
    expect(canConfirmActionClassification("a", initialActionPlanClassificationPermissions)).toBe(true);
    expect(canConfirmActionClassification("b", initialActionPlanClassificationPermissions)).toBe(true);
    expect(canConfirmActionClassification("c", initialActionPlanClassificationPermissions)).toBe(true);
  });

  it("erlaubt Bestätigungen für Handlungen ohne Kategorie", () => {
    expect(canConfirmActionClassification(undefined, initialActionPlanClassificationPermissions)).toBe(true);
  });

  it("persistiert angepasste Kategorie-Rollen im Browser-Cache", () => {
    const categories = [
      { id: "a" as const, name: "KLV A", authorizedRoleIds: [] },
      { id: "b" as const, name: "KLV B", authorizedRoleIds: [] },
      { id: "c" as const, name: "KLV C", authorizedRoleIds: [] },
    ];

    saveActionPlanClassificationPermissions(categories);

    expect(window.localStorage.getItem(ACTION_PLAN_CLASSIFICATION_STORAGE_KEY)).toBe(
      JSON.stringify(categories),
    );
    expect(loadActionPlanClassificationPermissions()).toEqual(categories);
  });
});
