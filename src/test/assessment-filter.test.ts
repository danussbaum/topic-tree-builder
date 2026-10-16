import { describe, expect, it } from "vitest";
import { matchesAssessmentFilter, type AssessmentFilterModel } from "@/types/assessment-filter";
import type { ActionNode } from "@/types/assessment";

const action: ActionNode = {
  id: "action-1",
  groupId: "action-1",
  title: "Test",
  notes: "",
  status: "open",
  done: false,
  classification: "b",
};

describe("matchesAssessmentFilter / classification", () => {
  it("matched definierte Kategorie", () => {
    const filter: AssessmentFilterModel = {
      statuses: ["open"],
      classification: "b",
    };
    expect(matchesAssessmentFilter({ action, status: "open" }, filter)).toBe(true);
  });

  it("matched keine Kategorie nur wenn keine gesetzt ist", () => {
    const filter: AssessmentFilterModel = {
      statuses: ["open"],
      classification: "none",
    };
    expect(matchesAssessmentFilter({ action, status: "open" }, filter)).toBe(false);
    expect(
      matchesAssessmentFilter(
        { action: { ...action, classification: undefined }, status: "open" },
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
