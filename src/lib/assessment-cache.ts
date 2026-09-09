import type { ActionNode, Client, TopicNode } from "@/types/assessment";
import type { AssessmentFilterModel } from "@/types/assessment-filter";
import { LEGACY_DAY_PART_IDS } from "@/lib/day-parts";
import { UNPLANNED_TARGET_TITLE, UNPLANNED_TOPIC_TITLE } from "@/lib/unplanned-action";
import {
  APPLICATION_BROWSER_STORAGE_KEYS,
  finishApplicationLogoutClearing,
  isApplicationLogoutClearing,
} from "@/lib/application-storage";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Wendet eine Handlungs-Migration auf alle Handlungen eines Klienten an — im
 * Themenbaum und bei den ungeplanten Handlungen, die direkt am Klienten hängen.
 */
const mapClientActions = (
  clients: Client[],
  mapAction: (action: ActionNode) => ActionNode,
): Client[] =>
  clients.map((client) => ({
    ...client,
    topics: client.topics.map((topic) => ({
      ...topic,
      targets: topic.targets.map((target) => ({
        ...target,
        actions: target.actions.map(mapAction),
      })),
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

/**
 * Früher lagen ungeplante Handlungen in einem synthetischen Thema/Ziel im Baum.
 * Sie gehören direkt an den Klienten; das leergeräumte synthetische Thema wird
 * entfernt. Idempotent: ohne isUnplanned-Nodes im Baum bleibt alles unverändert.
 */
export const migrateUnplannedActionsToClient = (clients: Client[]): Client[] =>
  clients.map((client) => {
    const extracted: ActionNode[] = [];
    const topics = client.topics
      .map((topic) => ({
        ...topic,
        targets: topic.targets
          .map((target) => {
            const remaining = target.actions.filter((action) => {
              if (!action.isUnplanned) return true;
              extracted.push(action);
              return false;
            });
            return { ...target, actions: remaining };
          })
          // Nur das synthetische Ziel bzw. Thema wegräumen, keine echten Plan-Knoten.
          .filter(
            (target) =>
              target.actions.length > 0 || target.title !== UNPLANNED_TARGET_TITLE,
          ),
      }))
      .filter((topic) => topic.targets.length > 0 || topic.title !== UNPLANNED_TOPIC_TITLE);

    if (extracted.length === 0) return client;
    return {
      ...client,
      topics,
      unplannedActions: [...(client.unplannedActions ?? []), ...extracted],
    };
  });

export type ConfirmationPeriod = "day" | "week" | "month" | "lastNDays";

export const DEFAULT_LAST_N_DAYS = 3;

export const ASSESSMENT_CACHE_KEY = APPLICATION_BROWSER_STORAGE_KEYS[0];

export const DEFAULT_CACHED_DISCIPLINE_ID = "discipline-inhouse-spitex";

const migrateCachedTopicsToDisciplines = (clients: Client[]): Client[] =>
  clients.map((client) => ({
    ...client,
    topics: Array.isArray(client.topics)
      ? client.topics.map((topic: TopicNode) => ({
          ...topic,
          disciplineId:
            typeof topic.disciplineId === "string" && topic.disciplineId.trim()
              ? topic.disciplineId
              : DEFAULT_CACHED_DISCIPLINE_ID,
        }))
      : [],
  }));

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
        migrateActionNodeGroupIds(
          migrateUnplannedActionsToClient(
            migrateCachedTopicsToDisciplines(parsed.clients as Client[]),
          ),
        ),
      ),
      selectedClientIds: parsed.selectedClientIds,
      confirmationFilter: parsed.confirmationFilter ?? fallbackConfirmationFilter,
    };
  } catch {
    return null;
  }
};
