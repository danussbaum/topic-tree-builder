import type { ActionConfirmation, ActionNode, ActionStatus, DayPart } from "@/types/assessment";

export type NumericComparison = {
  op: "gt" | "lt" | "eq";
  value: number;
};

export type PersonsFilter = { kind: "none" } | { kind: "exact"; value: number };

export type NumericRange = {
  min?: number;
  max?: number;
};

export interface AssessmentFilterModel {
  statuses: ActionStatus[];
  plannedMinutes?: NumericComparison;
  actualMinutes?: NumericComparison;
  differenceMinutes?: NumericRange;
  differencePercent?: NumericRange;
  dayPart?: DayPart | "none";
  persons?: PersonsFilter;
  result?: "none" | "with_result";
}

export const DEFAULT_ASSESSMENT_FILTER: AssessmentFilterModel = {
  statuses: ["open"],
};

interface FilterInput {
  action: ActionNode;
  status: ActionStatus;
  confirmation?: ActionConfirmation;
}

const matchesNumericComparison = (value: number | undefined, comparison?: NumericComparison) => {
  if (!comparison) return true;
  if (value == null) return false;

  if (comparison.op === "gt") return value > comparison.value;
  if (comparison.op === "lt") return value < comparison.value;
  return value === comparison.value;
};

const getDifferenceMinutes = (plannedMinutes?: number, actualMinutes?: number) => {
  if (plannedMinutes == null || actualMinutes == null) return undefined;
  return actualMinutes - plannedMinutes;
};

const getDifferencePercent = (plannedMinutes?: number, actualMinutes?: number) => {
  if (plannedMinutes == null || actualMinutes == null || plannedMinutes === 0) return undefined;
  return ((actualMinutes - plannedMinutes) / plannedMinutes) * 100;
};

export const matchesAssessmentFilter = (
  { action, status, confirmation }: FilterInput,
  filter: AssessmentFilterModel,
) => {
  if (!filter.statuses.includes(status)) return false;

  const plannedMinutes = action.plannedMinutes;
  const actualMinutes = confirmation?.actualMinutes;

  if (!matchesNumericComparison(plannedMinutes, filter.plannedMinutes)) return false;
  if (!matchesNumericComparison(actualMinutes, filter.actualMinutes)) return false;

  const differenceMinutes = getDifferenceMinutes(plannedMinutes, actualMinutes);
  if (!matchesNumericRange(differenceMinutes, filter.differenceMinutes)) return false;

  const differencePercent = getDifferencePercent(plannedMinutes, actualMinutes);
  if (!matchesNumericRange(differencePercent, filter.differencePercent)) return false;

  if (filter.dayPart != null) {
    const dayPart = action.dayPart ?? "none";
    if (dayPart !== filter.dayPart) return false;
  }

  if (filter.persons) {
    const persons = action.requiredPersons;
    if (filter.persons.kind === "none") {
      if (persons != null) return false;
    } else if (persons !== filter.persons.value) {
      return false;
    }
  }

  if (filter.result === "none" && confirmation?.result) return false;
  if (filter.result === "with_result" && !confirmation?.result) return false;

  return true;
};
