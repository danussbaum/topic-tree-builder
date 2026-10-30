import type { ScheduledAction } from "@/lib/day-part-schedule";
import type { ActionConfirmation } from "@/types/assessment";

/** Termin einer Zeile der Umsetzung, wie er für die Quittier-Sperre zählt. */
export interface ConfirmationTiming {
  /** Kalendertag der Zeile: bei einer Verschiebung bereits der effektive. */
  dueDate: string;
  action: ScheduledAction;
  /** Bestätigung am Originaltermin — liefert bei einer Neuplanung die neue Uhrzeit. */
  confirmation?: Pick<ActionConfirmation, "postponedToTime">;
}

/**
 * Frühester Zeitpunkt, ab dem quittiert werden darf: die (neu) geplante Uhrzeit,
 * sonst der Beginn des Tages. Die Tageszeit allein hat kein Zeitfenster.
 */
export const getConfirmationStart = ({ dueDate, action, confirmation }: ConfirmationTiming): Date => {
  const time = confirmation?.postponedToTime?.trim() || action.scheduledTime?.trim() || "00:00";
  return new Date(`${dueDate}T${time}:00`);
};

/**
 * Was noch nicht stattgefunden hat, lässt sich nicht rückmelden: erst nach Erreichen
 * von Datum *und* Uhrzeit darf als erledigt wie geplant, erledigt mit Abweichung oder
 * nicht durchgeführt quittiert werden. Nach oben gibt es keine Frist — später erfassen
 * ist immer erlaubt.
 *
 * Die Neuplanung (postponed) ist davon ausgenommen, sie bleibt für zukünftige Termine
 * im Fenster von +/- 1 Woche möglich (siehe reschedule.ts).
 */
export const isBeforeConfirmationStart = (timing: ConfirmationTiming, now: Date) =>
  now < getConfirmationStart(timing);

/**
 * Vorbelegtes Datum beim Erfassen in der Umsetzung: der Tag im Fokus, aber nie
 * ausserhalb des angezeigten Zeitraums. Im Modus "letzte N Tage" richtet sich der
 * Zeitraum nach heute und nicht nach dem gewählten Datum — ohne diese Klammer
 * schlüge der Dialog dort einen Tag vor, der gar nicht sichtbar ist.
 * ISO-Datumsangaben sind lexikografisch vergleichbar.
 */
export const clampDateToRange = (date: string, start: string, end: string) =>
  date < start ? start : date > end ? end : date;
