import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";
import {
  ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS,
  type ActionPlanAuthorizedRoleOption,
} from "@/lib/action-plan-disciplines";
import type { ActionCategory } from "@/types/assessment";

export interface ActionPlanCategoryPermission {
  id: ActionCategory;
  name: string;
  authorizedRoleIds: string[];
}

export const ACTION_PLAN_CURRENT_USER_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
];

export const ACTION_PLAN_CATEGORY_STORAGE_KEY = APPLICATION_BROWSER_STORAGE_KEYS[3];

const CATEGORY_A_AUTHORIZED_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
  "kl-alle-handlungen-sehen-inhouse-spitex-b",
  "kl-alle-handlungen-sehen-inhouse-spitex-c",
];

const CATEGORY_B_AUTHORIZED_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
  "kl-handlungen-bestaetigen-inhouse-spitex-b",
  "kl-alle-handlungen-sehen-inhouse-spitex-c",
];

const CATEGORY_C_AUTHORIZED_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
  "kl-handlungen-bestaetigen-inhouse-spitex-b",
  "kl-handlungen-bestaetigen-inhouse-spitex-c",
];

export const initialActionPlanCategoryPermissions: ActionPlanCategoryPermission[] = [
  { id: "a", name: "A", authorizedRoleIds: CATEGORY_A_AUTHORIZED_ROLE_IDS },
  { id: "b", name: "B", authorizedRoleIds: CATEGORY_B_AUTHORIZED_ROLE_IDS },
  { id: "c", name: "C", authorizedRoleIds: CATEGORY_C_AUTHORIZED_ROLE_IDS },
];

const validCategoryIds = new Set<ActionCategory>(["a", "b", "c"]);
const validRoleIds = new Set(
  ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.map((option) => option.id),
);

const normalizeCategoryPermission = (
  category: Partial<ActionPlanCategoryPermission>,
  index: number,
) => {
  const fallback = initialActionPlanCategoryPermissions[index];
  const id =
    typeof category.id === "string" && validCategoryIds.has(category.id as ActionCategory)
      ? (category.id as ActionCategory)
      : fallback?.id;
  if (!id) return null;

  const defaultCategory = initialActionPlanCategoryPermissions.find((entry) => entry.id === id);
  const name =
    typeof category.name === "string" && category.name.trim()
      ? category.name.trim()
      : (defaultCategory?.name ?? id.toUpperCase());
  const authorizedRoleIds = Array.isArray(category.authorizedRoleIds)
    ? Array.from(
        new Set(
          category.authorizedRoleIds.filter(
            (roleId): roleId is string =>
              typeof roleId === "string" && validRoleIds.has(roleId),
          ),
        ),
      )
    : (defaultCategory?.authorizedRoleIds ?? []);

  return { id, name, authorizedRoleIds };
};

export const loadActionPlanCategoryPermissions = (): ActionPlanCategoryPermission[] => {
  if (typeof window === "undefined") return initialActionPlanCategoryPermissions;
  const raw = window.localStorage.getItem(ACTION_PLAN_CATEGORY_STORAGE_KEY);
  if (!raw) return initialActionPlanCategoryPermissions;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialActionPlanCategoryPermissions;
    const normalized = parsed
      .map((category, index) => normalizeCategoryPermission(category, index))
      .filter(
        (category): category is ActionPlanCategoryPermission => category !== null,
      );

    return initialActionPlanCategoryPermissions.map(
      (defaultCategory) =>
        normalized.find((category) => category.id === defaultCategory.id) ?? defaultCategory,
    );
  } catch {
    return initialActionPlanCategoryPermissions;
  }
};

export const saveActionPlanCategoryPermissions = (
  categories: ActionPlanCategoryPermission[],
) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACTION_PLAN_CATEGORY_STORAGE_KEY,
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

export const canConfirmActionCategory = (
  categoryId: ActionCategory | undefined,
  categoryPermissions: ActionPlanCategoryPermission[],
  currentUserRoleIds: string[] = ACTION_PLAN_CURRENT_USER_ROLE_IDS,
) => {
  if (!categoryId) return true;

  const category = categoryPermissions.find((entry) => entry.id === categoryId);
  if (!category || category.authorizedRoleIds.length === 0) return true;

  return category.authorizedRoleIds.some((roleId) => currentUserRoleIds.includes(roleId));
};
