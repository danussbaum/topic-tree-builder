import { APPLICATION_BROWSER_STORAGE_KEYS } from "@/lib/application-storage";

export interface ActionPlanResource {
  id: string;
  name: string;
  description: string;
  disciplineIds: string[];
}

export const ACTION_PLAN_RESOURCES_STORAGE_KEY =
  APPLICATION_BROWSER_STORAGE_KEYS[4];

const INHOUSE_SPITEX = ["discipline-inhouse-spitex"];

export const initialActionPlanResources: ActionPlanResource[] = [
  // Transfer & Mobilität
  { id: "resource-elektrorollstuhl", name: "Elektrorollstuhl", description: "Elektrisch angetriebener Rollstuhl für Innen- und Aussenbereich.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-duschrollstuhl", name: "Duschrollstuhl", description: "Wasserfester Rollstuhl für Dusche und Nassbereich.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-rutschbrett", name: "Rutschbrett", description: "Brett zur Überbrückung beim Transfer im Sitzen.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-rutschtuch", name: "Rutschtuch", description: "Gleittuch für Umlagerung und Positionswechsel im Bett.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-kinaesthetik-block", name: "Kinästhetik-Block (schwarz)", description: "Fester Block zur Unterstützung kinästhetischer Bewegungsführung.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-drehscheibe", name: "Drehscheibe", description: "Drehteller für den Transfer im Stehen.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-patientenlifter", name: "Patientenlifter", description: "Mechanischer Lifter für Transfers mit Gurt.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-rollator", name: "Rollator", description: "Gehhilfe mit Rädern und Bremsen.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-gehstock", name: "Gehstock", description: "Einfache Gehhilfe zur Gangstabilisierung.", disciplineIds: INHOUSE_SPITEX },

  // Lagerung
  { id: "resource-lagerungskissen", name: "Lagerungskissen", description: "Kissen zur Positionierung und Druckentlastung.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-antidekubitus-matratze", name: "Antidekubitus-Matratze", description: "Wechseldruckmatratze zur Dekubitusprophylaxe.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-bettgalgen", name: "Bettgalgen", description: "Haltegriff über dem Bett zum Aufrichten.", disciplineIds: INHOUSE_SPITEX },

  // Wundversorgung
  { id: "resource-verbandmaterial-klein", name: "Verbandmaterial klein", description: "Set für kleine Wunden bis rund 5 cm.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-verbandmaterial-mittel", name: "Verbandmaterial mittel", description: "Set für mittlere Wunden bis rund 15 cm.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-verbandmaterial-gross", name: "Verbandmaterial gross", description: "Set für grossflächige oder mehrschichtige Verbände.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-wundauflage-steril", name: "Sterile Wundauflage", description: "Sterile Auflage für den direkten Wundkontakt.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-kompressen", name: "Kompressen", description: "Saugende Kompressen zur Wundreinigung und -abdeckung.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-fixierbinde", name: "Fixierbinde", description: "Binde zur Fixierung von Auflagen und Verbänden.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-einmalhandschuhe", name: "Einmalhandschuhe", description: "Unsterile Schutzhandschuhe zum Einmalgebrauch.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-desinfektionsmittel", name: "Desinfektionsmittel", description: "Mittel zur Haut- und Händedesinfektion.", disciplineIds: INHOUSE_SPITEX },

  // Atmung
  { id: "resource-inhalationsgeraet", name: "Inhalationsgerät", description: "Vernebler für die Inhalationstherapie.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-sauerstoffkonzentrator", name: "Sauerstoffkonzentrator", description: "Gerät zur Sauerstoffverabreichung.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-absauggeraet", name: "Absauggerät", description: "Gerät zum Absaugen von Sekret aus den Atemwegen.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-luftbefeuchter", name: "Luftbefeuchter", description: "Gerät zur Befeuchtung der Raumluft.", disciplineIds: INHOUSE_SPITEX },

  // Körperpflege
  { id: "resource-waschschuessel", name: "Waschschüssel", description: "Schüssel für die Körperpflege im Bett.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-duschstuhl", name: "Duschstuhl", description: "Sitzhilfe für die Dusche.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-einmalwaschlappen", name: "Einmalwaschlappen", description: "Waschlappen zum Einmalgebrauch.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-nagelset", name: "Nagelset", description: "Schere, Zange und Feile für die Nagelpflege.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-zahnpflegeset", name: "Zahnpflegeset", description: "Zahnbürste, Zahnpasta und Mundspülung.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-kompressionsstruempfe", name: "Kompressionsstrümpfe", description: "Medizinische Strümpfe gegen Ödeme und Thrombosen.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-anziehhilfe", name: "Anziehhilfe für Kompressionsstrümpfe", description: "Hilfe zum Anziehen von Kompressionsstrümpfen.", disciplineIds: INHOUSE_SPITEX },

  // Ausscheidung
  { id: "resource-steckbecken", name: "Steckbecken", description: "Bettpfanne für die Ausscheidung im Bett.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-urinflasche", name: "Urinflasche", description: "Urinflasche für die Ausscheidung im Liegen.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-katheterset", name: "Katheterset", description: "Steriles Set zum Legen und Pflegen von Blasenkathetern.", disciplineIds: INHOUSE_SPITEX },
  { id: "resource-stomamaterial", name: "Stomamaterial", description: "Beutel, Platten und Zubehör für die Stomaversorgung.", disciplineIds: INHOUSE_SPITEX },
];

const normalizeResource = (
  resource: Partial<ActionPlanResource>,
  index: number,
): ActionPlanResource | null => {
  const name = typeof resource.name === "string" ? resource.name.trim() : "";
  if (!name) return null;

  return {
    id:
      typeof resource.id === "string" && resource.id.trim()
        ? resource.id
        : `resource-${index}`,
    name,
    description:
      typeof resource.description === "string" ? resource.description : "",
    disciplineIds: Array.isArray(resource.disciplineIds)
      ? resource.disciplineIds.filter(
          (id): id is string => typeof id === "string" && id.trim() !== "",
        )
      : [],
  };
};

export const loadActionPlanResources = (): ActionPlanResource[] => {
  if (typeof window === "undefined") return initialActionPlanResources;
  const raw = window.localStorage.getItem(ACTION_PLAN_RESOURCES_STORAGE_KEY);
  if (!raw) return initialActionPlanResources;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialActionPlanResources;
    return parsed
      .map((resource, index) => normalizeResource(resource, index))
      .filter((resource): resource is ActionPlanResource => resource !== null);
  } catch {
    return initialActionPlanResources;
  }
};

/**
 * Der Katalog wird beim Rendern von Handlungszeilen oft gebraucht — darum einmal
 * laden und erst beim Speichern in den Einstellungen wieder auffrischen.
 */
let cachedResources: ActionPlanResource[] | null = null;

export const getActionPlanResources = (): ActionPlanResource[] =>
  (cachedResources ??= loadActionPlanResources());

export const saveActionPlanResources = (resources: ActionPlanResource[]) => {
  cachedResources = resources;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACTION_PLAN_RESOURCES_STORAGE_KEY,
    JSON.stringify(resources),
  );
};

/** Hilfsmittel-IDs werden wie die Leistungsarten pipe-getrennt in der Vorlage abgelegt. */
export const serializeResourceIds = (resourceIds: string[]): string =>
  resourceIds.join("|");

export const parseResourceIds = (value: string): string[] => {
  if (!value || value === "none") return [];
  const seen = new Set<string>();
  return value
    .split("|")
    .map((part) => part.trim())
    .filter((id) => {
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
};

/** Nur Hilfsmittel behalten, die es im Katalog (noch) gibt. */
export const filterKnownResourceIds = (
  resourceIds: string[],
  resources: ActionPlanResource[],
): string[] => {
  const known = new Set(resources.map((resource) => resource.id));
  return resourceIds.filter((id) => known.has(id));
};

export const getResourceNames = (
  resourceIds: string[],
  resources: ActionPlanResource[],
): string[] =>
  resourceIds
    .map((id) => resources.find((resource) => resource.id === id)?.name)
    .filter((name): name is string => !!name);

/** Für den CSV-Import der Vorlagen: Namen (kommagetrennt) zurück auf IDs abbilden. */
export const resolveResourceIdsByName = (
  value: string,
  resources: ActionPlanResource[],
): { resourceIds: string[]; invalidEntries: string[] } => {
  const resourceIds: string[] = [];
  const invalidEntries: string[] = [];
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((name) => {
      const match = resources.find(
        (resource) =>
          resource.name.localeCompare(name, "de", { sensitivity: "base" }) === 0,
      );
      if (!match) invalidEntries.push(name);
      else if (!resourceIds.includes(match.id)) resourceIds.push(match.id);
    });
  return { resourceIds, invalidEntries };
};

/**
 * Hilfsmittel einer Handlung als Text — ausgewählte Katalog-Einträge plus Freitext.
 * Umsetzung, Detailzeilen und Export zeigen damit überall dasselbe Format.
 */
export const formatActionResources = (
  action: { resourceIds?: string[]; requiredResources?: string },
  resources: ActionPlanResource[],
): string => {
  const names = getResourceNames(action.resourceIds ?? [], resources);
  const freeText = action.requiredResources?.trim();
  return [...names, ...(freeText ? [freeText] : [])].join(", ");
};

/** Hilfsmittel, die zu den Disziplinen einer Vorlage passen (leere Zuordnung = überall). */
export const getResourcesForDisciplines = (
  resources: ActionPlanResource[],
  disciplineIds: string[],
): ActionPlanResource[] => {
  if (disciplineIds.length === 0) return resources;
  return resources.filter(
    (resource) =>
      resource.disciplineIds.length === 0 ||
      resource.disciplineIds.some((id) => disciplineIds.includes(id)),
  );
};
