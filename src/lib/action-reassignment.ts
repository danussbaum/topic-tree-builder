import type { ActionNode, TargetNode } from "@/types/assessment";

/** Liegt das Datum im Gültigkeitszeitraum des Ziels? Leere Grenzen sind offen. */
const isWithinTarget = (date: string, target: Pick<TargetNode, "validFrom" | "validTo">) =>
  (!target.validFrom || date >= target.validFrom) && (!target.validTo || date <= target.validTo);

/**
 * Bestätigte Daten der Handlungsgruppe, die ausserhalb des Ziels lägen. Sind welche
 * vorhanden, darf die Gruppe nicht in dieses Ziel verschoben werden — die
 * Bestätigungen gehörten sonst zu einem Zeitraum, den das Ziel gar nicht abdeckt.
 */
export const getConfirmationDatesOutsideTarget = (
  groupNodes: ActionNode[],
  target: Pick<TargetNode, "validFrom" | "validTo">,
): string[] =>
  Array.from(
    new Set(groupNodes.flatMap((node) => Object.keys(node.confirmations ?? {}))),
  )
    .filter((date) => !isWithinTarget(date, target))
    .sort();

/**
 * Reicht die geplante Gültigkeit der Gruppe über das Ziel hinaus? Das ist erlaubt,
 * wird beim Verschieben aber als Warnung angezeigt.
 */
export const isPlanningOutsideTarget = (
  groupNodes: ActionNode[],
  target: Pick<TargetNode, "validFrom" | "validTo">,
): boolean => {
  const froms = groupNodes.map((node) => node.validFrom);
  const tos = groupNodes.map((node) => node.validTo);
  const startsBefore =
    !!target.validFrom && froms.some((from) => !from || from < target.validFrom!);
  const endsAfter = !!target.validTo && tos.some((to) => !to || to > target.validTo!);
  return startsBefore || endsAfter;
};

export const isCategoryLocked = (action: Pick<ActionNode, "templateLockedFields">) =>
  action.templateLockedFields?.includes("categoryId") ?? false;

/** Verschiebt ganze Handlungsgruppen in ein anderes Ziel desselben Dossiers. */
export const moveActionGroupsToTarget = (
  targets: TargetNode[],
  groupIds: Set<string>,
  toTargetId: string,
): TargetNode[] => {
  const moved = targets.flatMap((target) =>
    target.id === toTargetId ? [] : target.actions.filter((action) => groupIds.has(action.groupId)),
  );
  if (moved.length === 0) return targets;
  return targets.map((target) =>
    target.id === toTargetId
      ? { ...target, actions: [...target.actions, ...moved] }
      : { ...target, actions: target.actions.filter((action) => !groupIds.has(action.groupId)) },
  );
};

/**
 * Teilt Handlungsgruppen eine Kategorie zu; gesperrte Handlungen bleiben unverändert.
 * "" steht für «Ohne Kategorie» und verhindert den Rückfall auf die Vorlage.
 */
export const assignCategoryToActionGroups = (
  targets: TargetNode[],
  groupIds: Set<string>,
  categoryId: string,
): TargetNode[] =>
  targets.map((target) => ({
    ...target,
    actions: target.actions.map((action) =>
      groupIds.has(action.groupId) && !isCategoryLocked(action) ? { ...action, categoryId } : action,
    ),
  }));
