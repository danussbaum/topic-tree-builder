import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASSESSMENT_CACHE_KEY,
  loadCachedAssessmentState,
  saveCachedAssessmentState,
  type CachedAssessmentState,
} from "@/lib/assessment-cache";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";

const fallbackFilter = { statuses: ["open" as const] };

const cachedState: CachedAssessmentState = {
  viewMode: "confirmation",
  selectedDate: "2026-05-07",
  confirmationPeriod: "week",
  lastNDays: 5,
  clients: [
    {
      id: "client-1",
      firstName: "Test",
      lastName: "Person",
      topics: [
        {
          id: "topic-1",
          title: "Schwerpunkt",
          disciplineId: "discipline-kja-foerderplanung",
          notes: "",
          targets: [
            {
              id: "target-1",
              title: "Ziel",
              notes: "",
              actions: [
                {
                  id: "action-1",
                  groupId: "group-1",
                  title: "Handlung",
                  notes: "",
                  plannedMinutes: 30,
                  serviceType: "spitex-klv-b",
                  validFrom: "2026-05-07",
                  recurrence: "daily",
                  status: "open",
                  done: false,
                  confirmations: {
                    "2026-05-07": {
                      status: "done_as_planned",
                      serviceType: "spitex-klv-b",
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
      lastNDays: 3,
      clients: cachedState.clients,
      selectedClientIds: ["client-1"],
      confirmationFilter: fallbackFilter,
    });
  });

  it("migriert bestehende Cache-Planungen einmalig zur Inhouse-Spitex", () => {
    const legacyClients = [
      {
        ...cachedState.clients[0],
        topics: cachedState.clients[0].topics.map(({ disciplineId: _disciplineId, ...topic }) => topic),
      },
    ];

    window.localStorage.setItem(
      ASSESSMENT_CACHE_KEY,
      JSON.stringify({ ...cachedState, clients: legacyClients }),
    );

    expect(loadCachedAssessmentState("2026-01-01", fallbackFilter)?.clients[0].topics[0].disciplineId).toBe(
      "discipline-inhouse-spitex",
    );
  });

  it("lädt den Zeitraum Letzte N Tage aus dem Cache", () => {
    window.localStorage.setItem(
      ASSESSMENT_CACHE_KEY,
      JSON.stringify({
        ...cachedState,
        confirmationPeriod: "lastNDays",
        lastNDays: 7,
      }),
    );

    expect(loadCachedAssessmentState("2026-01-01", fallbackFilter)).toMatchObject({
      confirmationPeriod: "lastNDays",
      lastNDays: 7,
    });
  });

  describe("Migration der Zeitangaben", () => {
    const withActions = (actions: Array<Record<string, unknown>>) => ({
      ...cachedState,
      clients: [
        {
          id: "client-1",
          firstName: "Test",
          lastName: "Person",
          topics: [
            {
              id: "topic-1",
              title: "Schwerpunkt",
              disciplineId: "discipline-inhouse-spitex",
              notes: "",
              targets: [{ id: "target-1", title: "Ziel", notes: "", actions }],
            },
          ],
        },
      ],
    });

    const loadActions = () =>
      loadCachedAssessmentState("2026-01-01", fallbackFilter)!.clients[0].topics[0].targets[0]
        .actions;

    it("überführt Tageszeit plus Uhrzeit in den Uhrzeit-Modus", () => {
      window.localStorage.setItem(
        ASSESSMENT_CACHE_KEY,
        JSON.stringify(
          withActions([
            {
              id: "a1",
              groupId: "g1",
              title: "Umlagern",
              notes: "",
              status: "open",
              done: false,
              dayPart: "night",
              scheduledTime: "01:00",
            },
          ]),
        ),
      );

      expect(loadActions()[0]).toMatchObject({ dayPart: undefined, scheduledTime: "01:00" });
    });

    it("bildet alte Tageszeit-Schlüssel ohne Uhrzeit auf die Tageszeit-ID ab", () => {
      window.localStorage.setItem(
        ASSESSMENT_CACHE_KEY,
        JSON.stringify(
          withActions([
            {
              id: "a2",
              groupId: "g2",
              title: "Nachmittagsspaziergang",
              notes: "",
              status: "open",
              done: false,
              dayPart: "afternoon",
            },
          ]),
        ),
      );

      expect(loadActions()[0]).toMatchObject({ dayPart: DAY_PART_SEED_IDS.afternoon });
    });

    it("lässt Handlungen ohne Zeitangabe unverändert", () => {
      window.localStorage.setItem(
        ASSESSMENT_CACHE_KEY,
        JSON.stringify(
          withActions([
            { id: "a3", groupId: "g3", title: "Gespräch", notes: "", status: "open", done: false },
          ]),
        ),
      );

      const action = loadActions()[0];
      expect(action.dayPart).toBeUndefined();
      expect(action.scheduledTime).toBeUndefined();
    });
  });
});
