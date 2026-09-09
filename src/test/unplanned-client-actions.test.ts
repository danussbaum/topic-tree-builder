import { describe, expect, it } from "vitest";
import {
  UNPLANNED_TARGET_ID,
  UNPLANNED_TARGET_TITLE,
  UNPLANNED_TOPIC_ID,
  UNPLANNED_TOPIC_TITLE,
  buildUnplannedTopic,
  isUnplannedTopicId,
} from "@/lib/unplanned-action";
import { migrateUnplannedActionsToClient } from "@/lib/assessment-cache";
import type { ActionNode, Client } from "@/types/assessment";

const action = (id: string, overrides: Partial<ActionNode> = {}): ActionNode => ({
  id,
  groupId: `grp-${id}`,
  title: `Handlung ${id}`,
  notes: "",
  status: "open",
  done: false,
  validFrom: "2026-05-12",
  validTo: "2026-05-12",
  recurrence: "daily",
  ...overrides,
});

const clientWithLegacyTree = (): Client => ({
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
          actions: [action("a1"), action("a2", { isUnplanned: true })],
        },
      ],
    },
    {
      id: "topic-unplanned",
      title: UNPLANNED_TOPIC_TITLE,
      notes: "",
      targets: [
        {
          id: "target-unplanned",
          title: UNPLANNED_TARGET_TITLE,
          notes: "",
          actions: [action("a3", { isUnplanned: true })],
        },
      ],
    },
  ],
});

describe("buildUnplannedTopic", () => {
  it("baut ein virtuelles Thema/Ziel mit den ungeplanten Handlungen des Klienten", () => {
    const topic = buildUnplannedTopic({
      id: "c1",
      firstName: "A",
      lastName: "B",
      topics: [],
      unplannedActions: [action("a1", { isUnplanned: true })],
    });

    expect(topic.id).toBe(UNPLANNED_TOPIC_ID);
    expect(isUnplannedTopicId(topic.id)).toBe(true);
    expect(topic.targets).toHaveLength(1);
    expect(topic.targets[0].id).toBe(UNPLANNED_TARGET_ID);
    // Ohne validTo, damit der Abschluss-Filter der Umsetzung nicht greift.
    expect(topic.targets[0].validTo).toBeUndefined();
    // Ohne Disziplin: eine ungeplante Handlung hat keinen Schwerpunkt.
    expect(topic.disciplineId).toBeUndefined();
    expect(topic.targets[0].actions.map((a) => a.id)).toEqual(["a1"]);
  });

  it("ist ohne ungeplante Handlungen leer", () => {
    const topic = buildUnplannedTopic({ id: "c1", firstName: "A", lastName: "B", topics: [] });
    expect(topic.targets[0].actions).toEqual([]);
  });
});

describe("migrateUnplannedActionsToClient", () => {
  it("zieht ungeplante Handlungen aus dem Baum an den Klienten", () => {
    const [client] = migrateUnplannedActionsToClient([clientWithLegacyTree()]);

    expect(client.unplannedActions?.map((a) => a.id)).toEqual(["a2", "a3"]);
    // Das synthetische Thema ist weg, das echte Thema bleibt mit seiner Plan-Handlung.
    expect(client.topics.map((t) => t.id)).toEqual(["topic-1"]);
    expect(client.topics[0].targets[0].actions.map((a) => a.id)).toEqual(["a1"]);
  });

  it("ist idempotent", () => {
    const once = migrateUnplannedActionsToClient([clientWithLegacyTree()]);
    const twice = migrateUnplannedActionsToClient(once);

    expect(twice[0].unplannedActions?.map((a) => a.id)).toEqual(["a2", "a3"]);
    expect(twice[0]).toEqual(once[0]);
  });

  it("lässt Klienten ohne ungeplante Handlungen unverändert", () => {
    const clean: Client = {
      id: "client-2",
      firstName: "Ohne",
      lastName: "Ungeplant",
      topics: [
        { id: "t1", title: "Schwerpunkt", notes: "", targets: [{ id: "g1", title: "Ziel", notes: "", actions: [action("a1")] }] },
      ],
    };

    expect(migrateUnplannedActionsToClient([clean])[0]).toBe(clean);
  });

  it("räumt ein leeres synthetisches Thema ohne ungeplante Handlungen nicht weg", () => {
    // Kein isUnplanned-Node vorhanden: der Klient bleibt unangetastet, auch wenn
    // jemand ein echtes Thema so benannt hat.
    const named: Client = {
      id: "client-3",
      firstName: "Eigenes",
      lastName: "Thema",
      topics: [
        {
          id: "t1",
          title: UNPLANNED_TOPIC_TITLE,
          notes: "",
          targets: [{ id: "g1", title: "Ziel", notes: "", actions: [action("a1")] }],
        },
      ],
    };

    expect(migrateUnplannedActionsToClient([named])[0]).toBe(named);
  });
});
