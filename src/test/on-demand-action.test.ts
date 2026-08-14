import { describe, expect, it } from "vitest";
import {
  buildOnDemandOccurrence,
  collectOnDemandCandidates,
  isOnDemandPlanAction,
} from "@/lib/on-demand-action";
import { getScheduleIssues } from "@/lib/action-schedule";
import { getTemplateRecurrenceIssues } from "@/lib/action-plan-templates";
import type { ActionNode, TopicNode } from "@/types/assessment";

const onDemandAction: ActionNode = {
  id: "action-1",
  groupId: "group-1",
  title: "Bedarfsmedikation",
  notes: "Bei Schmerzen",
  status: "open",
  done: false,
  plannedMinutes: 15,
  dayPart: "noon",
  validFrom: "2026-05-01",
  validTo: "2026-05-31",
  recurrence: "on_demand",
};

const buildTopics = (actions: ActionNode[], targetValidTo?: string): TopicNode[] => [
  {
    id: "topic-1",
    title: "Schwerpunkt",
    notes: "",
    targets: [
      { id: "target-1", title: "Ziel", notes: "", validTo: targetValidTo, actions },
    ],
  },
];

describe("Nach-Bedarf-Handlungen", () => {
  it("erkennt die Plan-Handlung, nicht die Durchführung", () => {
    expect(isOnDemandPlanAction(onDemandAction)).toBe(true);
    expect(
      isOnDemandPlanAction(buildOnDemandOccurrence(onDemandAction, "2026-05-12", "noon")),
    ).toBe(false);
  });

  it("gilt als vollständig geplant — Wiederholung genügt ohne Wochentage", () => {
    expect(getScheduleIssues(onDemandAction)).toEqual([]);
  });

  it("ist in Handlungsvorlagen ein gültiger Wiederholungswert", () => {
    expect(
      getTemplateRecurrenceIssues(
        { wiederholung: "on_demand", wiederholungWochentage: "", wiederholungMonatlich: "none" },
        { wiederholungWochentage: false, wiederholungMonatlich: false },
      ),
    ).toEqual([]);
  });

  it("listet nur Handlungen innerhalb des Gültigkeitszeitraums auf", () => {
    const topics = buildTopics([onDemandAction]);

    expect(collectOnDemandCandidates(topics, "2026-05-12")).toHaveLength(1);
    expect(collectOnDemandCandidates(topics, "2026-04-30")).toHaveLength(0);
    expect(collectOnDemandCandidates(topics, "2026-06-01")).toHaveLength(0);
  });

  it("blendet abgeschlossene Ziele und wiederkehrende Handlungen aus", () => {
    expect(
      collectOnDemandCandidates(buildTopics([onDemandAction], "2026-05-10"), "2026-05-12"),
    ).toHaveLength(0);
    expect(
      collectOnDemandCandidates(
        buildTopics([{ ...onDemandAction, recurrence: "daily" }]),
        "2026-05-12",
      ),
    ).toHaveLength(0);
  });

  it("erzeugt eine Durchführung für genau einen Tag mit den Plan-Werten", () => {
    const occurrence = buildOnDemandOccurrence(onDemandAction, "2026-05-12", "evening", "18:30");

    expect(occurrence.validFrom).toBe("2026-05-12");
    expect(occurrence.validTo).toBe("2026-05-12");
    expect(occurrence.recurrence).toBe("daily");
    expect(occurrence.dayPart).toBe("evening");
    expect(occurrence.scheduledTime).toBe("18:30");
    // Geplante Zeit stammt aus dem Plan — "Erledigt wie geplant" bleibt darum möglich.
    expect(occurrence.plannedMinutes).toBe(15);
    expect(occurrence.isOnDemandOccurrence).toBe(true);
    expect(occurrence.isUnplanned).toBe(false);
    expect(occurrence.onDemandSourceActionId).toBe("action-1");
    expect(occurrence.status).toBe("open");
    expect(occurrence.confirmations).toBeUndefined();
  });

  it("erzeugt pro Durchführung eine eigene Node — mehrfach am selben Tag möglich", () => {
    const first = buildOnDemandOccurrence(onDemandAction, "2026-05-12", "noon");
    const second = buildOnDemandOccurrence(onDemandAction, "2026-05-12", "noon");

    expect(first.id).not.toBe(second.id);
    expect(first.groupId).not.toBe(second.groupId);
  });
});
