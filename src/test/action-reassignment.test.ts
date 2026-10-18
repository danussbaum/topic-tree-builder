import { describe, expect, it } from "vitest";
import {
  assignCategoryToActionGroups,
  getConfirmationDatesOutsideTarget,
  isPlanningOutsideTarget,
  moveActionGroupsToTarget,
} from "@/lib/action-reassignment";
import { buildDefaultTemplateFields, getActionCategoryId, getTemplateLockedActionFields, initialTemplates } from "@/lib/action-plan-templates";
import type { ActionConfirmation, ActionNode, TargetNode } from "@/types/assessment";

const node = (overrides: Partial<ActionNode> = {}): ActionNode => ({
  id: "a1",
  groupId: "g1",
  title: "Handlung",
  notes: "",
  status: "open",
  done: false,
  ...overrides,
});

const confirmed = (...dates: string[]) =>
  Object.fromEntries(dates.map((date) => [date, { status: "done_as_planned" } as ActionConfirmation]));

describe("getConfirmationDatesOutsideTarget", () => {
  const target = { validFrom: "2026-03-01", validTo: "2026-03-31" };

  it("akzeptiert Bestätigungen genau auf den Grenzen", () => {
    expect(getConfirmationDatesOutsideTarget([node({ confirmations: confirmed("2026-03-01", "2026-03-31") })], target)).toEqual([]);
  });

  it("meldet Bestätigungen vor dem Beginn und nach dem Ende, über alle Tageszeiten der Gruppe", () => {
    expect(
      getConfirmationDatesOutsideTarget(
        [
          node({ id: "a1", confirmations: confirmed("2026-02-28", "2026-03-10") }),
          node({ id: "a2", confirmations: confirmed("2026-04-01", "2026-02-28") }),
        ],
        target,
      ),
    ).toEqual(["2026-02-28", "2026-04-01"]);
  });

  it("behandelt leere Grenzen des Ziels als offen", () => {
    expect(getConfirmationDatesOutsideTarget([node({ confirmations: confirmed("2020-01-01", "2099-12-31") })], {})).toEqual([]);
    expect(getConfirmationDatesOutsideTarget([node({ confirmations: confirmed("2099-12-31") })], { validFrom: "2026-01-01" })).toEqual([]);
  });
});

describe("isPlanningOutsideTarget", () => {
  const target = { validFrom: "2026-03-01", validTo: "2026-03-31" };

  it("warnt bei Beginn vor oder Ende nach dem Ziel, auch bei offenem Ende", () => {
    expect(isPlanningOutsideTarget([node({ validFrom: "2026-03-01", validTo: "2026-03-31" })], target)).toBe(false);
    expect(isPlanningOutsideTarget([node({ validFrom: "2026-02-01", validTo: "2026-03-10" })], target)).toBe(true);
    expect(isPlanningOutsideTarget([node({ validFrom: "2026-03-05" })], target)).toBe(true);
    expect(isPlanningOutsideTarget([node({ validFrom: "2026-03-05" })], { validFrom: "2026-03-01" })).toBe(false);
  });
});

describe("Verschieben und Zuteilen", () => {
  const targets: TargetNode[] = [
    { id: "t1", title: "A", notes: "", actions: [node({ id: "a1", groupId: "g1" }), node({ id: "a2", groupId: "g1" }), node({ id: "a3", groupId: "g2" })] },
    { id: "t2", title: "B", notes: "", actions: [] },
  ];

  it("verschiebt ganze Gruppen inklusive aller Tageszeiten", () => {
    const result = moveActionGroupsToTarget(targets, new Set(["g1"]), "t2");
    expect(result[0].actions.map((a) => a.id)).toEqual(["a3"]);
    expect(result[1].actions.map((a) => a.id)).toEqual(["a1", "a2"]);
  });

  it("lässt gesperrte Kategorien unverändert und setzt «Ohne Kategorie» ohne Rückfall auf die Vorlage", () => {
    const withLock: TargetNode[] = [
      {
        id: "t1",
        title: "A",
        notes: "",
        actions: [
          node({ id: "a1", groupId: "g1", categoryId: "category-101", templateLockedFields: ["categoryId"] }),
          node({ id: "a2", groupId: "g2", templateId: "tpl-x" }),
        ],
      },
    ];
    const result = assignCategoryToActionGroups(withLock, new Set(["g1", "g2"]), "");
    expect(result[0].actions[0].categoryId).toBe("category-101");
    expect(result[0].actions[1].categoryId).toBe("");
    expect(getActionCategoryId(result[0].actions[1], [{ id: "tpl-x", fields: buildDefaultTemplateFields(), categoryId: "category-102" }])).toBeUndefined();
  });
});

describe("Sperre der Kategorie in Vorlagen", () => {
  it("sperrt geseedete Vorlagen mit Kategorie, die übrigen bleiben veränderbar", () => {
    for (const template of initialTemplates) {
      expect(template.categoryEditable).toBe(!template.categoryId);
    }
    const seeded = initialTemplates.find((t) => t.categoryId)!;
    expect(getTemplateLockedActionFields(seeded)).toContain("categoryId");
    expect(getTemplateLockedActionFields({ ...seeded, categoryEditable: true })).not.toContain("categoryId");
  });
});
