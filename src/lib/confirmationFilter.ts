import type { ActionStatus } from "@/types/assessment";

export interface ConfirmationFilter {
  statuses?: ActionStatus[];
  plannedMinutesMin?: number;
  plannedMinutesMax?: number;
  actualMinutesMin?: number;
  actualMinutesMax?: number;
}

export interface ConfirmationFilterRow {
  status: ActionStatus;
  plannedMinutes?: number;
  actualMinutes?: number;
}

const hasNumber = (value: number | undefined): value is number => typeof value === "number";

export const matchesConfirmationFilter = (
  row: ConfirmationFilterRow,
  filter: ConfirmationFilter,
): boolean => {
  const hasStatusFilter = Boolean(filter.statuses?.length);
  if (hasStatusFilter && !filter.statuses!.includes(row.status)) {
    return false;
  }

  if (hasNumber(filter.plannedMinutesMin) && (!hasNumber(row.plannedMinutes) || row.plannedMinutes < filter.plannedMinutesMin)) {
    return false;
  }

  if (hasNumber(filter.plannedMinutesMax) && (!hasNumber(row.plannedMinutes) || row.plannedMinutes > filter.plannedMinutesMax)) {
    return false;
  }

  const hasActualMinutesFilter = hasNumber(filter.actualMinutesMin) || hasNumber(filter.actualMinutesMax);
  if (hasActualMinutesFilter && !hasNumber(row.actualMinutes)) {
    return false;
  }

  if (hasNumber(filter.actualMinutesMin) && row.actualMinutes! < filter.actualMinutesMin) {
    return false;
  }

  if (hasNumber(filter.actualMinutesMax) && row.actualMinutes! > filter.actualMinutesMax) {
    return false;
  }

  return true;
};

export const getConfirmationFilterForShowConfirmed = (
  showConfirmed: boolean,
): ConfirmationFilter => {
  if (showConfirmed) return {};
  return { statuses: ["open"] };
};
