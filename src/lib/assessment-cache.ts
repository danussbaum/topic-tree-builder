import type { ActionNode, Client } from "@/types/assessment";
import type { AssessmentFilterModel } from "@/types/assessment-filter";
import { LEGACY_DAY_PART_IDS } from "@/lib/day-parts";
import {
  APPLICATION_BROWSER_STORAGE_KEYS,
  finishApplicationLogoutClearing,
  isApplicationLogoutClearing,
} from "@/lib/application-storage";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Wendet eine Handlungs-Migration auf alle Handlungen eines Klienten an — im
 * Zielbaum und bei den ungeplanten Handlungen, die direkt am Klienten hängen.
 */
const mapClientActions = (
  clients: Client[],
  mapAction: (action: ActionNode) => ActionNode,
): Client[] =>
  clients.map((client) => ({
    ...client,
    targets: client.targets.map((target) => ({
      ...target,
      actions: target.actions.map(mapAction),
    })),
    ...(client.unplannedActions
      ? { unplannedActions: client.unplannedActions.map(mapAction) }
      : {}),
  }));

export const migrateActionNodeGroupIds = (clients: Client[]): Client[] =>
  // Unplanned actions always get their own unique groupId
  mapClientActions(clients, (action) =>
    (action.isUnplanned || !action.groupId) ? { ...action, groupId: uid() } : action,
  );

/**
 * Früher trug eine Handlung eine Tageszeit UND optional eine Uhrzeit. Seit der
 * strikten Trennung gilt: Ist eine Uhrzeit erfasst, gewinnt sie und die Tageszeit
 * entfällt (sie wird bei der Anzeige abgeleitet). Reine Tageszeit-Handlungen
 * behalten ihre Angabe, deren alter Schlüssel wird auf die Tageszeit-ID abgebildet.
 */
const migrateCachedDayParts = (clients: Client[]): Client[] =>
  mapClientActions(clients, (action) => {
    if (action.scheduledTime?.trim()) {
      return action.dayPart ? { ...action, dayPart: undefined } : action;
    }
    if (!action.dayPart) return action;
    const mapped = LEGACY_DAY_PART_IDS[action.dayPart];
    return mapped ? { ...action, dayPart: mapped } : action;
  });

export type ConfirmationPeriod = "day" | "week" | "month" | "lastNDays";

export const DEFAULT_LAST_N_DAYS = 3;

export const ASSESSMENT_CACHE_KEY = APPLICATION_BROWSER_STORAGE_KEYS[0];

export const DEFAULT_CACHED_DISCIPLINE_ID = "discipline-inhouse-spitex";

const migrateCachedTargetsToDisciplines = (clients: Client[]): Client[] =>
  clients.map((client) => ({
    ...client,
    targets: client.targets.map((target) => ({
      ...target,
      disciplineId:
        typeof target.disciplineId === "string" && target.disciplineId.trim()
          ? target.disciplineId
          : DEFAULT_CACHED_DISCIPLINE_ID,
    })),
  }));

/**
 * Früher hingen Ziele unter Schwerpunkten (client.topics). Ein solcher Cache wird
 * bewusst nicht migriert, sondern verworfen — es greift dann der Seed.
 */
const hasCurrentClientShape = (clients: unknown[]): clients is Client[] =>
  clients.every(
    (client) =>
      typeof client === "object" &&
      client !== null &&
      Array.isArray((client as Partial<Client>).targets),
  );

export interface CachedAssessmentState {
  viewMode: "planning" | "confirmation" | "evaluation" | "auswertungen";
  selectedDate: string;
  confirmationPeriod: ConfirmationPeriod;
  lastNDays: number;
  clients: Client[];
  selectedClientIds: string[];
  confirmationFilter: AssessmentFilterModel;
}

export const saveCachedAssessmentState = (state: CachedAssessmentState) => {
  if (typeof window === "undefined" || isApplicationLogoutClearing()) return;

  try {
    window.localStorage.setItem(ASSESSMENT_CACHE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Assessment state could not be saved in browser storage.", error);
  }
};

export const loadCachedAssessmentState = (
  fallbackSelectedDate: string,
  fallbackConfirmationFilter: AssessmentFilterModel,
): CachedAssessmentState | null => {
  if (typeof window === "undefined") return null;
  finishApplicationLogoutClearing();
  try {
    const raw = window.localStorage.getItem(ASSESSMENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedAssessmentState>;
    if (!Array.isArray(parsed.clients) || !Array.isArray(parsed.selectedClientIds)) return null;
    if (!hasCurrentClientShape(parsed.clients)) return null;
    return {
      viewMode:
        parsed.viewMode === "confirmation"
          ? "confirmation"
          : parsed.viewMode === "evaluation"
            ? "evaluation"
            : parsed.viewMode === "auswertungen"
              ? "auswertungen"
              : "planning",
      selectedDate:
        typeof parsed.selectedDate === "string" ? parsed.selectedDate : fallbackSelectedDate,
      confirmationPeriod:
        parsed.confirmationPeriod === "week" ||
        parsed.confirmationPeriod === "month" ||
        parsed.confirmationPeriod === "lastNDays"
          ? parsed.confirmationPeriod
          : "day",
      lastNDays:
        typeof parsed.lastNDays === "number" && Number.isFinite(parsed.lastNDays) && parsed.lastNDays > 0
          ? Math.floor(parsed.lastNDays)
          : DEFAULT_LAST_N_DAYS,
      clients: migrateCachedDayParts(
        migrateActionNodeGroupIds(migrateCachedTargetsToDisciplines(parsed.clients)),
      ),
      selectedClientIds: parsed.selectedClientIds,
      confirmationFilter: parsed.confirmationFilter ?? fallbackConfirmationFilter,
    };
  } catch {
    return null;
  }
};
