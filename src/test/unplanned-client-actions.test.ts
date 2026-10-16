import { describe, expect, it } from "vitest";
import {
  UNPLANNED_TARGET_ID,
  buildUnplannedTarget,
  isUnplannedTargetId,
} from "@/lib/unplanned-action";
import type { ActionNode } from "@/types/assessment";

const action = (id: string, overrides: Partial<ActionNode> = {}): ActionNode => ({
  id,
  groupId: `grp-${id}`,
  title: `Handlung ${id}`,
  notes: "",
  status: "open",
  done: false,
  validFrom: "2026-05-12",
  validTo: "2026-05-12",
  recurrence: "daily",
  ...overrides,
});

describe("buildUnplannedTarget", () => {
  it("baut ein virtuelles Ziel mit den ungeplanten Handlungen des Klienten", () => {
    const target = buildUnplannedTarget({
      id: "c1",
      firstName: "A",
      lastName: "B",
      targets: [],
      unplannedActions: [action("a1", { isUnplanned: true })],
    });

    expect(target.id).toBe(UNPLANNED_TARGET_ID);
    expect(isUnplannedTargetId(target.id)).toBe(true);
    // Ohne validTo, damit der Abschluss-Filter der Umsetzung nicht greift.
    expect(target.validTo).toBeUndefined();
    // Ohne Disziplin: eine ungeplante Handlung ist keinem Ziel zugeordnet.
    expect(target.disciplineId).toBeUndefined();
    expect(target.actions.map((a) => a.id)).toEqual(["a1"]);
  });

  it("ist ohne ungeplante Handlungen leer", () => {
    const target = buildUnplannedTarget({ id: "c1", firstName: "A", lastName: "B", targets: [] });
    expect(target.actions).toEqual([]);
  });
});
