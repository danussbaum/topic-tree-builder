import { addDays, format, parseISO } from "date-fns";

export const RESCHEDULE_MAX_SHIFT_DAYS = 7;

/**
 * Erlaubtes Fenster für eine Neuplanung: max. 1 Woche früher oder später als das geplante Datum,
 * dabei nie vor dem heutigen Tag. Liegt das geplante Datum mehr als eine Woche zurück, fällt das
 * ganze Fenster in die Vergangenheit — dann ist keine Neuplanung mehr möglich (`isAvailable`).
 */
export const getRescheduleWindow = (plannedDate: string, today: string) => {
  const earliestByShift = format(addDays(parseISO(plannedDate), -RESCHEDULE_MAX_SHIFT_DAYS), "yyyy-MM-dd");
  const minDate = earliestByShift < today ? today : earliestByShift;
  const maxDate = format(addDays(parseISO(plannedDate), RESCHEDULE_MAX_SHIFT_DAYS), "yyyy-MM-dd");
  return { minDate, maxDate, isAvailable: minDate <= maxDate };
};
