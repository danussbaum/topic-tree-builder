import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";
import {
  ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS,
  type ActionPlanAuthorizedRoleOption,
} from "@/lib/action-plan-disciplines";
import type { ActionClassification } from "@/types/assessment";

export interface ActionPlanClassificationPermission {
  id: ActionClassification;
  name: string;
  authorizedRoleIds: string[];
}

export const ACTION_PLAN_CURRENT_USER_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
];

export const ACTION_PLAN_CLASSIFICATION_STORAGE_KEY = APPLICATION_BROWSER_STORAGE_KEYS[3];

const CLASSIFICATION_A_AUTHORIZED_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
  "kl-alle-handlungen-sehen-inhouse-spitex-b",
  "kl-alle-handlungen-sehen-inhouse-spitex-c",
];

const CLASSIFICATION_B_AUTHORIZED_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
  "kl-handlungen-bestaetigen-inhouse-spitex-b",
  "kl-alle-handlungen-sehen-inhouse-spitex-c",
];

const CLASSIFICATION_C_AUTHORIZED_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
  "kl-handlungen-bestaetigen-inhouse-spitex-b",
  "kl-handlungen-bestaetigen-inhouse-spitex-c",
];

export const initialActionPlanClassificationPermissions: ActionPlanClassificationPermission[] = [
  { id: "a", name: "KLV A", authorizedRoleIds: CLASSIFICATION_A_AUTHORIZED_ROLE_IDS },
  { id: "b", name: "KLV B", authorizedRoleIds: CLASSIFICATION_B_AUTHORIZED_ROLE_IDS },
  { id: "c", name: "KLV C", authorizedRoleIds: CLASSIFICATION_C_AUTHORIZED_ROLE_IDS },
];

const validClassificationIds = new Set<ActionClassification>(["a", "b", "c"]);
const validRoleIds = new Set(
  ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.map((option) => option.id),
);

const normalizeClassificationPermission = (
  classification: Partial<ActionPlanClassificationPermission>,
  index: number,
) => {
  const fallback = initialActionPlanClassificationPermissions[index];
  const id =
    typeof classification.id === "string" && validClassificationIds.has(classification.id as ActionClassification)
      ? (classification.id as ActionClassification)
      : fallback?.id;
  if (!id) return null;

  const defaultClassification = initialActionPlanClassificationPermissions.find((entry) => entry.id === id);
  const storedName =
    typeof classification.name === "string" && classification.name.trim()
      ? classification.name.trim()
      : null;
  // Prototyp: alte Bezeichnungen ("A"/"B"/"C") auf die neuen Defaults ("KLV A"...) migrieren.
  const isLegacyName = storedName === id.toUpperCase();
  const name =
    storedName && !isLegacyName
      ? storedName
      : (defaultClassification?.name ?? `KLV ${id.toUpperCase()}`);
  const authorizedRoleIds = Array.isArray(classification.authorizedRoleIds)
    ? Array.from(
        new Set(
          classification.authorizedRoleIds.filter(
            (roleId): roleId is string =>
              typeof roleId === "string" && validRoleIds.has(roleId),
          ),
        ),
      )
    : (defaultClassification?.authorizedRoleIds ?? []);

  return { id, name, authorizedRoleIds };
};

export const loadActionPlanClassificationPermissions = (): ActionPlanClassificationPermission[] => {
  if (typeof window === "undefined") return initialActionPlanClassificationPermissions;
  const raw = window.localStorage.getItem(ACTION_PLAN_CLASSIFICATION_STORAGE_KEY);
  if (!raw) return initialActionPlanClassificationPermissions;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialActionPlanClassificationPermissions;
    const normalized = parsed
      .map((classification, index) => normalizeClassificationPermission(classification, index))
      .filter(
        (classification): classification is ActionPlanClassificationPermission => classification !== null,
      );

    return initialActionPlanClassificationPermissions.map(
      (defaultClassification) =>
        normalized.find((classification) => classification.id === defaultClassification.id) ?? defaultClassification,
    );
  } catch {
    return initialActionPlanClassificationPermissions;
  }
};

export const saveActionPlanClassificationPermissions = (
  categories: ActionPlanClassificationPermission[],
) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACTION_PLAN_CLASSIFICATION_STORAGE_KEY,
    JSON.stringify(categories),
  );
};

export const getAuthorizedRoleLabels = (
  authorizedRoleIds: string[],
  roleOptions: ActionPlanAuthorizedRoleOption[] = ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS,
) => {
  const labelById = new Map(roleOptions.map((role) => [role.id, role.label]));
  return authorizedRoleIds.map((roleId) => labelById.get(roleId) ?? roleId);
};

export const canConfirmActionClassification = (
  classificationId: ActionClassification | undefined,
  classificationPermissions: ActionPlanClassificationPermission[],
  currentUserRoleIds: string[] = ACTION_PLAN_CURRENT_USER_ROLE_IDS,
) => {
  if (!classificationId) return true;

  const classification = classificationPermissions.find((entry) => entry.id === classificationId);
  if (!classification || classification.authorizedRoleIds.length === 0) return true;

  return classification.authorizedRoleIds.some((roleId) => currentUserRoleIds.includes(roleId));
};
