import type { Client } from "@/types/assessment";
import type { AssessmentFilterModel } from "@/types/assessment-filter";

export type ConfirmationPeriod = "day" | "week" | "month";

export const ASSESSMENT_CACHE_KEY = "assessment:cached-state:v1";

export interface CachedAssessmentState {
  viewMode: "planning" | "confirmation";
  selectedDate: string;
  confirmationPeriod: ConfirmationPeriod;
  clients: Client[];
  selectedClientIds: string[];
  confirmationFilter: AssessmentFilterModel;
  showCompletedTargets: boolean;
}

export const saveCachedAssessmentState = (state: CachedAssessmentState) => {
  if (typeof window === "undefined") return;

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
  try {
    const raw = window.localStorage.getItem(ASSESSMENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedAssessmentState>;
    if (!Array.isArray(parsed.clients) || !Array.isArray(parsed.selectedClientIds)) return null;
    return {
      viewMode: parsed.viewMode === "confirmation" ? "confirmation" : "planning",
      selectedDate:
        typeof parsed.selectedDate === "string" ? parsed.selectedDate : fallbackSelectedDate,
      confirmationPeriod:
        parsed.confirmationPeriod === "week" || parsed.confirmationPeriod === "month"
          ? parsed.confirmationPeriod
          : "day",
      clients: parsed.clients,
      selectedClientIds: parsed.selectedClientIds,
      confirmationFilter: parsed.confirmationFilter ?? fallbackConfirmationFilter,
      showCompletedTargets: Boolean(parsed.showCompletedTargets),
    };
  } catch {
    return null;
  }
};
