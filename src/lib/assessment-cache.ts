import type { Client, TopicNode } from "@/types/assessment";
import type { AssessmentFilterModel } from "@/types/assessment-filter";
import {
  APPLICATION_BROWSER_STORAGE_KEYS,
  finishApplicationLogoutClearing,
  isApplicationLogoutClearing,
} from "@/lib/application-storage";

const uid = () => Math.random().toString(36).slice(2, 10);

export const migrateActionNodeGroupIds = (clients: Client[]): Client[] =>
  clients.map((client) => ({
    ...client,
    topics: client.topics.map((topic) => ({
      ...topic,
      targets: topic.targets.map((target) => ({
        ...target,
        actions: target.actions.map((action) =>
          // Unplanned actions always get their own unique groupId
          (action.isUnplanned || !action.groupId) ? { ...action, groupId: uid() } : action,
        ),
      })),
    })),
  }));

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
  viewMode: "planning" | "confirmation" | "review";
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
      viewMode: parsed.viewMode === "confirmation" ? "confirmation" : parsed.viewMode === "review" ? "review" : "planning",
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
      clients: migrateActionNodeGroupIds(migrateCachedTopicsToDisciplines(parsed.clients as Client[])),
      selectedClientIds: parsed.selectedClientIds,
      confirmationFilter: parsed.confirmationFilter ?? fallbackConfirmationFilter,
    };
  } catch {
    return null;
  }
};
