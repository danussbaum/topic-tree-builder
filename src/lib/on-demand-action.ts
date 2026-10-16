import { isTargetClosed } from "@/lib/target-status";
import type { ActionNode, TargetNode } from "@/types/assessment";

const uid = () => Math.random().toString(36).slice(2, 10);

/** Nach-Bedarf-Handlung aus dem Plan (nicht die daraus erzeugte Durchführung) */
export const isOnDemandPlanAction = (action: ActionNode): boolean =>
  action.recurrence === "on_demand" && !action.isOnDemandOccurrence;

export interface OnDemandCandidate {
  disciplineId?: string;
  targetId: string;
  targetTitle: string;
  action: ActionNode;
}

/**
 * Alle Nach-Bedarf-Handlungen, die am gegebenen Datum zum Plan hinzugefügt werden dürfen:
 * Gültig ab/bis muss das Datum einschliessen und das Ziel darf nicht abgeschlossen sein.
 */
export const collectOnDemandCandidates = (
  targets: TargetNode[],
  date: string,
): OnDemandCandidate[] => {
  const candidates: OnDemandCandidate[] = [];
  for (const target of targets) {
    if (isTargetClosed(target)) continue;
    for (const action of target.actions) {
      if (!isOnDemandPlanAction(action)) continue;
      if (action.validFrom && date < action.validFrom) continue;
      if (action.validTo && date > action.validTo) continue;
      candidates.push({
        disciplineId: target.disciplineId,
        targetId: target.id,
        targetTitle: target.title,
        action,
      });
    }
  }
  return candidates;
};

/**
 * Erzeugt aus einer Nach-Bedarf-Handlung eine Durchführung für genau einen Tag.
 * Wie bei ungeplanten Handlungen entsteht pro Durchführung eine eigene ActionNode mit
 * eigener groupId — so ist dieselbe Handlung mehrmals am selben Tag erfassbar. Die
 * Wiederholung wird auf "daily" gesetzt, damit die Node an genau diesem Tag fällig ist.
 */
export const buildOnDemandOccurrence = (
  source: ActionNode,
  date: string,
  dayPart: string | "none",
  scheduledTime?: string,
): ActionNode => ({
  ...source,
  id: uid(),
  groupId: uid(),
  // Strikte Trennung: mit Uhrzeit wird die Tageszeit abgeleitet, nicht gespeichert.
  dayPart: scheduledTime?.trim() || dayPart === "none" ? undefined : dayPart,
  scheduledTime,
  validFrom: date,
  validTo: date,
  recurrence: "daily",
  recurrenceWeekdays: undefined,
  recurrenceMonthlyPattern: undefined,
  confirmations: undefined,
  status: "open",
  done: false,
  isUnplanned: false,
  isOnDemandOccurrence: true,
  onDemandSourceActionId: source.id,
});
