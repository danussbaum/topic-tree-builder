import { PLANNING_GROUPING_SESSION_KEY } from "@/lib/application-storage";
import { initialActionPlanDisciplines } from "@/lib/action-plan-disciplines";

/**
 * Standard der Planung ist «Nach Kategorien». Tests, die die Ziel-Navigation
 * prüfen, stellen die bekannten Disziplinen auf «Nach Thema / Ziel» um.
 */
export const preferTargetGrouping = () => {
  const disciplineIds = [...initialActionPlanDisciplines.map((d) => d.id), "discipline-physio"];
  window.sessionStorage.setItem(
    PLANNING_GROUPING_SESSION_KEY,
    JSON.stringify(Object.fromEntries(disciplineIds.map((id) => [id, "targets"]))),
  );
};
