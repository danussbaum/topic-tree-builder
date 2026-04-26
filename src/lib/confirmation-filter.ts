import type { ActionNode, ActionStatus, ConfirmationFilter, NumericComparisonOperator } from "@/types/assessment";

const compareNumber = (
  actual: number | undefined,
  op: NumericComparisonOperator,
  expected: number,
) => {
  if (actual == null || !Number.isFinite(actual)) return false;
  if (op === "gt") return actual > expected;
  if (op === "lt") return actual < expected;
  return actual === expected;
};

export const getDifferencePercent = (planned: number, difference: number) => {
  if (difference === 0) return 0;
  if (planned <= 0) return Number.POSITIVE_INFINITY;
  return (difference / planned) * 100;
};

export const getActualMinutesForStatus = (
  action: ActionNode,
  status: ActionStatus,
  dueDate: string,
) => {
  if (status === "done_as_planned") return action.plannedMinutes;
  return action.confirmations?.[dueDate]?.actualMinutes;
};

export const matchesConfirmationFilter = (
  action: ActionNode,
  status: ActionStatus,
  dueDate: string,
  filter: ConfirmationFilter,
) => {
  if (!filter.statuses.includes(status)) return false;

  const confirmation = action.confirmations?.[dueDate];
  const planned = action.plannedMinutes;
  const actual = getActualMinutesForStatus(action, status, dueDate);

  if (
    filter.plannedMinutes &&
    !compareNumber(planned, filter.plannedMinutes.op, filter.plannedMinutes.value)
  ) {
    return false;
  }

  if (
    filter.actualMinutes &&
    !compareNumber(actual, filter.actualMinutes.op, filter.actualMinutes.value)
  ) {
    return false;
  }

  if (filter.dayPart && (action.dayPart ?? "none") !== filter.dayPart) return false;

  if (filter.persons) {
    if (filter.persons.kind === "none") {
      if (action.requiredPersons !== undefined) return false;
    } else if (action.requiredPersons !== filter.persons.value) {
      return false;
    }
  }

  if (filter.result) {
    const hasResult = Boolean(confirmation?.result?.trim());
    if (filter.result === "none" && hasResult) return false;
    if (filter.result === "with_result" && !hasResult) return false;
  }

  const hasDifferenceFilter =
    filter.differenceMinutes !== undefined || filter.differencePercent !== undefined;
  if (hasDifferenceFilter) {
    if (planned == null || actual == null) return false;
    const difference = Math.abs(actual - planned);
    if (filter.differenceMinutes !== undefined && difference !== filter.differenceMinutes) {
      return false;
    }
    if (filter.differencePercent !== undefined) {
      const percent = getDifferencePercent(planned, difference);
      if (percent !== filter.differencePercent) return false;
    }
  }

  return true;
};
