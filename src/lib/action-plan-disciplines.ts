import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";

export interface ActionPlanDiscipline {
  id: string;
  title: string;
  authorizedRoleIds: string[];
}

export interface ActionPlanAuthorizedRoleOption {
  id: string;
  label: string;
}

export const ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS: ActionPlanAuthorizedRoleOption[] =
  [
    {
      id: "kl-handlungen-planen-bestaetigen-ergotherapie",
      label: "KL: Handlungen Planen und Bestätigen, Ergotherapie",
    },
    {
      id: "kl-handlungen-planen-bestaetigen-ihp",
      label: "KL: Handlungen Planen und Bestätigen, IHP",
    },
    {
      id: "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
      label: "KL: Handlungen Planen und Bestätigen, Inhouse-Spitex, A",
    },
    {
      id: "kl-handlungen-planen-bestaetigen-inhouse-spitex-b",
      label: "KL: Handlungen Planen und Bestätigen, Inhouse-Spitex, B",
    },
    {
      id: "kl-handlungen-planen-bestaetigen-inhouse-spitex-c",
      label: "KL: Handlungen Planen und Bestätigen, Inhouse-Spitex, C",
    },
    {
      id: "kl-handlungen-bestaetigen-inhouse-spitex-b",
      label: "KL: Handlungen Bestätigen, Inhouse-Spitex, B",
    },
    {
      id: "kl-handlungen-bestaetigen-inhouse-spitex-c",
      label: "KL: Handlungen Bestätigen, Inhouse-Spitex, C",
    },
    {
      id: "kl-alle-handlungen-sehen-inhouse-spitex-b",
      label: "KL: Alle Handlungen sehen, Inhouse-Spitex, B",
    },
    {
      id: "kl-alle-handlungen-sehen-inhouse-spitex-c",
      label: "KL: Alle Handlungen sehen, Inhouse-Spitex, C",
    },
    {
      id: "kl-handlungen-planen-bestaetigen-kja-foerderplanung",
      label: "KL: Handlungen Planen und Bestätigen, KJA Förderplanung",
    },
    {
      id: "kl-handlungen-planen-bestaetigen-physiotherapie",
      label: "KL: Handlungen Planen und Bestätigen, Physiotherapie",
    },
  ];

export const INHOUSE_SPITEX_DEFAULT_AUTHORIZED_ROLE_IDS = [
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-a",
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-b",
  "kl-handlungen-planen-bestaetigen-inhouse-spitex-c",
];

export const ACTION_PLAN_DISCIPLINES_STORAGE_KEY =
  APPLICATION_BROWSER_STORAGE_KEYS[2];

export const initialActionPlanDisciplines: ActionPlanDiscipline[] = [
  {
    id: "discipline-inhouse-spitex",
    title: "Inhouse-Spitex",
    authorizedRoleIds: INHOUSE_SPITEX_DEFAULT_AUTHORIZED_ROLE_IDS,
  },
  { id: "discipline-ihp", title: "IHP", authorizedRoleIds: [] },
  {
    id: "discipline-physiotherapie",
    title: "Physiotherapie",
    authorizedRoleIds: [],
  },
  {
    id: "discipline-ergotherapie",
    title: "Ergotherapie",
    authorizedRoleIds: [],
  },
  {
    id: "discipline-kja-foerderplanung",
    title: "KJA Förderplanung",
    authorizedRoleIds: [],
  },
];

const normalizeDiscipline = (
  discipline: Partial<ActionPlanDiscipline>,
  index: number,
) => {
  const title =
    typeof discipline.title === "string" ? discipline.title.trim() : "";
  if (!title) return null;

  const id =
    typeof discipline.id === "string" && discipline.id.trim()
      ? discipline.id
      : `discipline-${index}`;
  const validRoleIds = new Set(
    ACTION_PLAN_AUTHORIZED_ROLE_OPTIONS.map((option) => option.id),
  );
  const authorizedRoleIds = Array.isArray(discipline.authorizedRoleIds)
    ? discipline.authorizedRoleIds.filter(
        (roleId): roleId is string =>
          typeof roleId === "string" && validRoleIds.has(roleId),
      )
    : id === "discipline-inhouse-spitex" || title === "Inhouse-Spitex"
      ? INHOUSE_SPITEX_DEFAULT_AUTHORIZED_ROLE_IDS
      : [];

  return {
    id,
    title,
    authorizedRoleIds,
  };
};

export const loadActionPlanDisciplines = (): ActionPlanDiscipline[] => {
  if (typeof window === "undefined") return initialActionPlanDisciplines;
  const raw = window.localStorage.getItem(ACTION_PLAN_DISCIPLINES_STORAGE_KEY);
  if (!raw) return initialActionPlanDisciplines;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialActionPlanDisciplines;
    return parsed
      .map((discipline, index) => normalizeDiscipline(discipline, index))
      .filter(
        (discipline): discipline is ActionPlanDiscipline => discipline !== null,
      );
  } catch {
    return initialActionPlanDisciplines;
  }
};

export const saveActionPlanDisciplines = (
  disciplines: ActionPlanDiscipline[],
) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACTION_PLAN_DISCIPLINES_STORAGE_KEY,
    JSON.stringify(disciplines),
  );
};
