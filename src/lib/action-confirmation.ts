import type { ActionNode, ConfirmedOptionalService } from "@/types/assessment";
import type { DayPartDefinition } from "@/lib/day-parts";
import { effectiveDayPart } from "@/lib/day-part-rollover";

/**
 * Was beim Bestätigen einer Durchführung aus der Umsetzung gemeldet wird. Die
 * Varianten unterscheiden sich in den Pflichtangaben: eine Abweichung braucht eine
 * Begründung, eine Neuplanung ein Ziel-Datum bzw. eine Ziel-Uhrzeit.
 */
export type ConfirmationPayload =
  | {
      status: "done_as_planned";
      result?: string;
      observations?: string;
      optionalServices?: ConfirmedOptionalService[];
    }
  | {
      status: "done_with_deviation";
      actualMinutes?: number;
      actualPersons?: number;
      reason: string;
      result?: string;
      observations?: string;
      optionalServices?: ConfirmedOptionalService[];
    }
  | { status: "not_done"; reason: string }
  | { status: "postponed"; postponedToDate?: string; postponedToTime?: string; postponedReason: string }
  | { status: "open" };

export interface ConfirmationAudit {
  confirmedBy: string;
  confirmedAt: string;
}

/**
 * Schreibt die Bestätigung eines einzelnen Termins in die Historie einer Handlung.
 *
 * Zwei Dinge werden dabei bewusst festgehalten statt später abgeleitet:
 * - die **Tageszeit** — im Uhrzeit-Modus ergibt sie sich laufend aus der
 *   Konfiguration, als Snapshot bleibt die Historie von späteren Änderungen an den
 *   Stammdaten unabhängig;
 * - bei „wie geplant" **geplante Zeit und geplante Anzahl Personen** als tatsächliche
 *   Werte — genau das heisst „wie geplant", und die Auswertung rechnet damit weiter,
 *   auch wenn der Plan danach angepasst wird.
 *
 * Eine bestehende Neuplanung (postponed…) bleibt erhalten: sie dokumentiert, wie der
 * Termin zustande kam, und darf durch die Rückmeldung nicht verloren gehen.
 * `status: "open"` entfernt die Bestätigung wieder.
 */
export const applyConfirmationToAction = (
  action: ActionNode,
  date: string,
  payload: ConfirmationPayload,
  audit: ConfirmationAudit,
  dayParts?: DayPartDefinition[],
): ActionNode => {
  const nextConfirmations = { ...(action.confirmations ?? {}) };
  const dayPartSnapshot = effectiveDayPart(action, dayParts);

  const existing = nextConfirmations[date];
  const postponementAudit = existing
    ? {
        postponedToDate: existing.postponedToDate,
        postponedToTime: existing.postponedToTime,
        postponedBy: existing.postponedBy,
        postponedAt: existing.postponedAt,
      }
    : {};

  if (payload.status === "open") {
    delete nextConfirmations[date];
  } else if (payload.status === "done_as_planned") {
    nextConfirmations[date] = {
      status: "done_as_planned",
      serviceType: action.serviceType,
      dayPartSnapshot,
      done: true,
      actualMinutes: action.plannedMinutes,
      actualPersons: action.requiredPersons,
      result: payload.result,
      observations: payload.observations,
      optionalServices: payload.optionalServices,
      ...postponementAudit,
      ...audit,
    };
  } else if (payload.status === "done_with_deviation") {
    nextConfirmations[date] = {
      status: "done_with_deviation",
      serviceType: action.serviceType,
      dayPartSnapshot,
      done: true,
      actualMinutes: payload.actualMinutes,
      actualPersons: payload.actualPersons,
      reason: payload.reason,
      result: payload.result,
      observations: payload.observations,
      optionalServices: payload.optionalServices,
      ...postponementAudit,
      ...audit,
    };
  } else if (payload.status === "not_done") {
    nextConfirmations[date] = {
      status: "not_done",
      dayPartSnapshot,
      done: true,
      reason: payload.reason,
      ...postponementAudit,
      ...audit,
    };
  } else if (payload.status === "postponed") {
    nextConfirmations[date] = {
      ...existing,
      status: "postponed",
      serviceType: undefined,
      done: false,
      postponedToDate: payload.postponedToDate,
      postponedToTime: payload.postponedToTime,
      postponedReason: payload.postponedReason,
      postponedBy: audit.confirmedBy,
      postponedAt: audit.confirmedAt,
    };
  }

  return { ...action, confirmations: nextConfirmations };
};
