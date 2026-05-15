import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";

export interface ActionPlanDiscipline {
  id: string;
  title: string;
}

export const ACTION_PLAN_DISCIPLINES_STORAGE_KEY =
  APPLICATION_BROWSER_STORAGE_KEYS[2];

export const initialActionPlanDisciplines: ActionPlanDiscipline[] = [
  { id: "discipline-inhouse-spitex", title: "Inhouse-Spitex" },
  { id: "discipline-ihp", title: "IHP" },
  { id: "discipline-physiotherapie", title: "Physiotherapie" },
  { id: "discipline-ergotherapie", title: "Ergotherapie" },
  { id: "discipline-kja-foerderplanung", title: "KJA Förderplanung" },
];

const normalizeDiscipline = (
  discipline: Partial<ActionPlanDiscipline>,
  index: number,
) => {
  const title =
    typeof discipline.title === "string" ? discipline.title.trim() : "";
  if (!title) return null;

  return {
    id:
      typeof discipline.id === "string" && discipline.id.trim()
        ? discipline.id
        : `discipline-${index}`,
    title,
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
