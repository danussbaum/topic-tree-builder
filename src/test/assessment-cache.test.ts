import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASSESSMENT_CACHE_KEY,
  loadCachedAssessmentState,
  saveCachedAssessmentState,
  type CachedAssessmentState,
} from "@/lib/assessment-cache";

const fallbackFilter = { statuses: ["open" as const] };

const cachedState: CachedAssessmentState = {
  viewMode: "confirmation",
  selectedDate: "2026-05-07",
  confirmationPeriod: "week",
  clients: [
    {
      id: "client-1",
      firstName: "Test",
      lastName: "Person",
      topics: [
        {
          id: "topic-1",
          title: "Schwerpunkt",
          notes: "",
          targets: [
            {
              id: "target-1",
              title: "Ziel",
              notes: "",
              actions: [
                {
                  id: "action-1",
                  title: "Handlung",
                  notes: "",
                  plannedMinutes: 30,
                  validFrom: "2026-05-07",
                  recurrence: "daily",
                  status: "open",
                  done: false,
                  confirmations: {
                    "2026-05-07": {
                      status: "done_as_planned",
                      actualMinutes: 30,
                      done: true,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selectedClientIds: ["client-1"],
  confirmationFilter: fallbackFilter,
  showCompletedTargets: true,
};

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("assessment browser cache", () => {
  it("speichert und lädt geplante sowie bestätigte Handlungen vollständig", () => {
    saveCachedAssessmentState(cachedState);

    expect(loadCachedAssessmentState("2026-01-01", fallbackFilter)).toEqual(cachedState);
  });

  it("verhindert App-Abbrüche, wenn der Browser-Speicher nicht schreiben kann", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => saveCachedAssessmentState(cachedState)).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
  });

  it("nutzt Fallbacks für fehlende optionale Cache-Felder, ohne vorhandene Clients zu verwerfen", () => {
    window.localStorage.setItem(
      ASSESSMENT_CACHE_KEY,
      JSON.stringify({ clients: cachedState.clients, selectedClientIds: ["client-1"] }),
    );

    expect(loadCachedAssessmentState("2026-01-01", fallbackFilter)).toMatchObject({
      viewMode: "planning",
      selectedDate: "2026-01-01",
      confirmationPeriod: "day",
      clients: cachedState.clients,
      selectedClientIds: ["client-1"],
      confirmationFilter: fallbackFilter,
      showCompletedTargets: false,
    });
  });
});
