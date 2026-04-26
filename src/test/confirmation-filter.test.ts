import { describe, expect, it } from "vitest";
import { matchesConfirmationFilter } from "@/lib/confirmation-filter";
import type { ActionNode, ConfirmationFilter } from "@/types/assessment";

const baseAction: ActionNode = {
  id: "a1",
  title: "Handlung",
  notes: "",
  plannedMinutes: 60,
  requiredPersons: 2,
  dayPart: "morning",
  status: "open",
  done: false,
  confirmations: {
    "2026-04-20": {
      status: "done_with_deviation",
      actualMinutes: 90,
      result: "Resultat vorhanden",
      done: true,
    },
    "2026-04-21": {
      status: "done_as_planned",
      result: "",
      done: true,
    },
  },
};

const defaultFilter: ConfirmationFilter = {
  statuses: ["open"],
};

describe("matchesConfirmationFilter", () => {
  it("matched Status mit ODER-Logik", () => {
    const filter: ConfirmationFilter = {
      ...defaultFilter,
      statuses: ["open", "done_with_deviation"],
    };
    expect(matchesConfirmationFilter(baseAction, "done_with_deviation", "2026-04-20", filter)).toBe(
      true,
    );
  });

  it("verknüpft Kriterien mit UND", () => {
    const filter: ConfirmationFilter = {
      statuses: ["done_with_deviation"],
      plannedMinutes: { op: "eq", value: 60 },
      actualMinutes: { op: "eq", value: 90 },
      dayPart: "morning",
      persons: { kind: "exact", value: 2 },
      result: "with_result",
    };
    expect(matchesConfirmationFilter(baseAction, "done_with_deviation", "2026-04-20", filter)).toBe(
      true,
    );

    const failingFilter: ConfirmationFilter = {
      ...filter,
      persons: { kind: "exact", value: 3 },
    };
    expect(
      matchesConfirmationFilter(baseAction, "done_with_deviation", "2026-04-20", failingFilter),
    ).toBe(false);
  });

  it("berechnet Differenz absolut und Prozent nach Formel A", () => {
    const matchingFilter: ConfirmationFilter = {
      statuses: ["done_with_deviation"],
      differenceMinutes: 30,
      differencePercent: 50,
    };
    expect(
      matchesConfirmationFilter(baseAction, "done_with_deviation", "2026-04-20", matchingFilter),
    ).toBe(true);

    const notMatchingFilter: ConfirmationFilter = {
      ...matchingFilter,
      differencePercent: 40,
    };
    expect(
      matchesConfirmationFilter(baseAction, "done_with_deviation", "2026-04-20", notMatchingFilter),
    ).toBe(false);
  });

  it("liefert 0% bei Differenz 0", () => {
    const filter: ConfirmationFilter = {
      statuses: ["done_as_planned"],
      differenceMinutes: 0,
      differencePercent: 0,
    };
    expect(matchesConfirmationFilter(baseAction, "done_as_planned", "2026-04-21", filter)).toBe(true);
  });

  it("interpretiert Resultat-Filter auf erfasstem Bestätigungsresultat", () => {
    const withResult: ConfirmationFilter = {
      statuses: ["done_with_deviation"],
      result: "with_result",
    };
    expect(matchesConfirmationFilter(baseAction, "done_with_deviation", "2026-04-20", withResult)).toBe(
      true,
    );

    const noneResult: ConfirmationFilter = {
      statuses: ["done_as_planned"],
      result: "none",
    };
    expect(matchesConfirmationFilter(baseAction, "done_as_planned", "2026-04-21", noneResult)).toBe(
      true,
    );
  });
});
