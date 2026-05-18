import { describe, expect, it } from "vitest";
import { matchesAssessmentFilter, type AssessmentFilterModel } from "@/types/assessment-filter";
import type { ActionNode } from "@/types/assessment";

const action: ActionNode = {
  id: "action-1",
  title: "Test",
  notes: "",
  status: "open",
  done: false,
  category: "b",
};

describe("matchesAssessmentFilter / category", () => {
  it("matched definierte Kategorie", () => {
    const filter: AssessmentFilterModel = {
      statuses: ["open"],
      category: "b",
    };
    expect(matchesAssessmentFilter({ action, status: "open" }, filter)).toBe(true);
  });

  it("matched keine Kategorie nur wenn keine gesetzt ist", () => {
    const filter: AssessmentFilterModel = {
      statuses: ["open"],
      category: "none",
    };
    expect(matchesAssessmentFilter({ action, status: "open" }, filter)).toBe(false);
    expect(
      matchesAssessmentFilter(
        { action: { ...action, category: undefined }, status: "open" },
        filter,
      ),
    ).toBe(true);
  });
});


describe("matchesAssessmentFilter / unplanned", () => {
  it("filtert geplante und ungeplante Handlungen getrennt", () => {
    const plannedFilter: AssessmentFilterModel = {
      statuses: ["open"],
      unplanned: "planned",
    };
    const unplannedFilter: AssessmentFilterModel = {
      statuses: ["open"],
      unplanned: "unplanned",
    };

    expect(matchesAssessmentFilter({ action, status: "open" }, plannedFilter)).toBe(true);
    expect(matchesAssessmentFilter({ action: { ...action, isUnplanned: true }, status: "open" }, plannedFilter)).toBe(false);
    expect(matchesAssessmentFilter({ action, status: "open" }, unplannedFilter)).toBe(false);
    expect(matchesAssessmentFilter({ action: { ...action, isUnplanned: true }, status: "open" }, unplannedFilter)).toBe(true);
  });
});
