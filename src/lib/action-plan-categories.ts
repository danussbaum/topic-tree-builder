import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";

export interface ActionPlanCategory {
  id: string;
  code: string;
  name: string;
}

export const ACTION_PLAN_CATEGORIES_STORAGE_KEY = APPLICATION_BROWSER_STORAGE_KEYS[6];

const seedCategory = (code: string, name: string): ActionPlanCategory => ({
  id: `category-${code}`,
  code,
  name,
});

export const initialActionPlanCategories: ActionPlanCategory[] = [
  seedCategory("100", "Psychiatrische Leistungen"),
  seedCategory("101", "Hygiene und Komfort"),
  seedCategory("102", "Atmung"),
  seedCategory("103", "Ernährung / Diäten"),
  seedCategory("104", "Ausscheidung"),
  seedCategory("105", "Mobilisation"),
  seedCategory("106", "Therapien"),
  seedCategory("107", "Verbände und Hilfsmittel"),
  seedCategory("108", "Messung Vitalzeichen / Pflegehandlungen für Diagnostik"),
  seedCategory("109", "Abklärung, Koordination / Anleitung, Prävention, Beratung, Begleitung"),
  seedCategory("200", "Wohnen / Haushalten / Verpflegung / Diverses"),
];

export const formatActionPlanCategory = (category: ActionPlanCategory) =>
  category.code ? `${category.code} ${category.name}` : category.name;

export const sortActionPlanCategories = (categories: ActionPlanCategory[]) =>
  [...categories].sort(
    (a, b) =>
      a.code.localeCompare(b.code, "de", { numeric: true }) ||
      a.name.localeCompare(b.name, "de"),
  );

// Die Seed-Vorlagen tragen eine 5-stellige Leistungsnummer, im Code mit
// Katalog-Präfix ("HC-LK-10101") oder im Titel vorne ("10101 ..."). Deren erste
// drei Ziffern entsprechen dem Code der Kategorie.
export const getCategoryIdForTemplateName = (
  name: string,
  categories: ActionPlanCategory[] = initialActionPlanCategories,
): string | undefined => {
  const match = /^(?:[A-Za-z]+-)*(\d{3})\d{2}\b/.exec(name.trim());
  if (!match) return undefined;
  return categories.find((category) => category.code === match[1])?.id;
};

const normalizeCategory = (category: Partial<ActionPlanCategory>, index: number) => {
  const name = typeof category.name === "string" ? category.name.trim() : "";
  if (!name) return null;
  return {
    id: typeof category.id === "string" && category.id.trim() ? category.id : `category-${index}`,
    code: typeof category.code === "string" ? category.code.trim() : "",
    name,
  };
};

export const loadActionPlanCategories = (): ActionPlanCategory[] => {
  if (typeof window === "undefined") return initialActionPlanCategories;
  const raw = window.localStorage.getItem(ACTION_PLAN_CATEGORIES_STORAGE_KEY);
  if (!raw) return initialActionPlanCategories;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialActionPlanCategories;
    return parsed
      .map((category, index) => normalizeCategory(category, index))
      .filter((category): category is ActionPlanCategory => category !== null);
  } catch {
    return initialActionPlanCategories;
  }
};

export const saveActionPlanCategories = (categories: ActionPlanCategory[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTION_PLAN_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
};
