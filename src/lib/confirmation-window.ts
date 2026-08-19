/**
 * Eine Handlung kann erst bestätigt werden, wenn ihr Termin erreicht ist — was noch
 * nicht stattgefunden hat, lässt sich nicht rückmelden. Geprüft wird bewusst nur
 * tagesgenau: eine Handlung am heutigen Abend darf am Morgen bereits bestätigt werden.
 *
 * Die Neuplanung (postponed) ist davon ausgenommen, sie bleibt für zukünftige
 * Termine im Fenster von +/- 1 Woche möglich (siehe reschedule.ts).
 */
export const isFutureConfirmationDate = (dueDate: string, today: string) => dueDate > today;
