/**
 * Eine Handlung kann erst bestätigt werden, wenn ihr Termin erreicht ist — was noch
 * nicht stattgefunden hat, lässt sich nicht rückmelden. Geprüft wird bewusst nur
 * tagesgenau: eine Handlung am heutigen Abend darf am Morgen bereits bestätigt werden.
 *
 * Die Neuplanung (postponed) ist davon ausgenommen, sie bleibt für zukünftige
 * Termine im Fenster von +/- 1 Woche möglich (siehe reschedule.ts).
 */
export const isFutureConfirmationDate = (dueDate: string, today: string) => dueDate > today;

/**
 * Vorbelegtes Datum beim Erfassen in der Umsetzung: der Tag im Fokus, aber nie
 * ausserhalb des angezeigten Zeitraums. Im Modus "letzte N Tage" richtet sich der
 * Zeitraum nach heute und nicht nach dem gewählten Datum — ohne diese Klammer
 * schlüge der Dialog dort einen Tag vor, der gar nicht sichtbar ist.
 * ISO-Datumsangaben sind lexikografisch vergleichbar.
 */
export const clampDateToRange = (date: string, start: string, end: string) =>
  date < start ? start : date > end ? end : date;
