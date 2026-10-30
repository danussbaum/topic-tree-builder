import { describe, expect, it } from "vitest";
import { applyConfirmationToAction } from "@/lib/action-confirmation";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";
import type { ActionConfirmation, ActionNode } from "@/types/assessment";

const audit = { confirmedBy: "danuss", confirmedAt: "2026-05-12T08:30:00Z" };
const DATE = "2026-05-12";

const action = (overrides: Partial<ActionNode> = {}): ActionNode => ({
  id: "action-1",
  groupId: "group-1",
  title: "Morgentoilette",
  notes: "",
  status: "open",
  done: false,
  plannedMinutes: 30,
  requiredPersons: 2,
  serviceType: "spitex-klv-b",
  dayPart: DAY_PART_SEED_IDS.morning,
  validFrom: "2026-05-01",
  recurrence: "daily",
  ...overrides,
});

const confirm = (
  node: ActionNode,
  payload: Parameters<typeof applyConfirmationToAction>[2],
): ActionConfirmation | undefined =>
  applyConfirmationToAction(node, DATE, payload, audit).confirmations?.[DATE];

describe("applyConfirmationToAction — erledigt wie geplant", () => {
  it("hält geplante Zeit und geplante Anzahl Personen als tatsächliche Werte fest", () => {
    const result = confirm(action(), { status: "done_as_planned" });

    expect(result).toMatchObject({
      status: "done_as_planned",
      done: true,
      actualMinutes: 30,
      actualPersons: 2,
      serviceType: "spitex-klv-b",
      confirmedBy: "danuss",
      confirmedAt: "2026-05-12T08:30:00Z",
    });
  });

  it("lässt die Werte offen, wenn die Handlung keine Zeit und keine Personen vorsieht", () => {
    const result = confirm(
      action({ plannedMinutes: undefined, requiredPersons: undefined }),
      { status: "done_as_planned" },
    );

    expect(result?.actualMinutes).toBeUndefined();
    expect(result?.actualPersons).toBeUndefined();
  });

  it("hält die Tageszeit als Snapshot fest", () => {
    const result = confirm(action(), { status: "done_as_planned" });

    expect(result?.dayPartSnapshot).toMatchObject({ id: DAY_PART_SEED_IDS.morning, title: "Morgen" });
  });

  it("nimmt die Tageszeit als Snapshot, unabhängig von der Uhrzeit", () => {
    const result = confirm(
      action({ dayPart: DAY_PART_SEED_IDS.noon, scheduledTime: "23:30" }),
      { status: "done_as_planned" },
    );

    expect(result?.dayPartSnapshot).toMatchObject({ id: DAY_PART_SEED_IDS.noon, title: "Mittag" });
  });
});

describe("applyConfirmationToAction — erledigt mit Abweichung", () => {
  it("übernimmt die gemeldeten Werte statt der geplanten", () => {
    const result = confirm(action(), {
      status: "done_with_deviation",
      actualMinutes: 45,
      actualPersons: 3,
      reason: "Zweite Person nötig",
    });

    expect(result).toMatchObject({
      status: "done_with_deviation",
      done: true,
      actualMinutes: 45,
      actualPersons: 3,
      reason: "Zweite Person nötig",
    });
  });

  it("lässt die Anzahl Personen leer, wenn keine gemeldet wurde", () => {
    const result = confirm(action(), {
      status: "done_with_deviation",
      actualMinutes: 45,
      reason: "Länger gedauert",
    });

    expect(result?.actualPersons).toBeUndefined();
  });
});

describe("applyConfirmationToAction — weitere Varianten", () => {
  it("erfasst 'nicht durchgeführt' ohne Zeitwerte", () => {
    const result = confirm(action(), { status: "not_done", reason: "Klient abwesend" });

    expect(result).toMatchObject({ status: "not_done", done: true, reason: "Klient abwesend" });
    expect(result?.actualMinutes).toBeUndefined();
    expect(result?.actualPersons).toBeUndefined();
  });

  it("erfasst eine Neuplanung mit Verschiebungs-Audit", () => {
    const result = confirm(action(), {
      status: "postponed",
      postponedToDate: "2026-05-13",
      postponedToTime: "09:00",
      postponedReason: "Termin verschoben",
    });

    expect(result).toMatchObject({
      status: "postponed",
      done: false,
      postponedToDate: "2026-05-13",
      postponedToTime: "09:00",
      postponedReason: "Termin verschoben",
      postponedBy: "danuss",
      postponedAt: "2026-05-12T08:30:00Z",
    });
    expect(result?.serviceType).toBeUndefined();
  });

  it("behält das Verschiebungs-Audit, wenn ein verschobener Termin bestätigt wird", () => {
    const postponed = applyConfirmationToAction(
      action(),
      DATE,
      { status: "postponed", postponedToDate: "2026-05-13", postponedReason: "Termin verschoben" },
      audit,
    );

    const result = applyConfirmationToAction(
      postponed,
      DATE,
      { status: "done_as_planned" },
      { confirmedBy: "danuss", confirmedAt: "2026-05-13T07:00:00Z" },
    ).confirmations?.[DATE];

    expect(result).toMatchObject({
      status: "done_as_planned",
      postponedToDate: "2026-05-13",
      postponedBy: "danuss",
      postponedAt: "2026-05-12T08:30:00Z",
      confirmedAt: "2026-05-13T07:00:00Z",
    });
  });

  it("entfernt die Bestätigung bei 'offen' und lässt andere Termine unberührt", () => {
    const withTwo = applyConfirmationToAction(
      applyConfirmationToAction(action(), DATE, { status: "done_as_planned" }, audit),
      "2026-05-13",
      { status: "not_done", reason: "Klient abwesend" },
      audit,
    );

    const reopened = applyConfirmationToAction(
      withTwo,
      DATE,
      { status: "open" },
      audit,
    );

    expect(reopened.confirmations?.[DATE]).toBeUndefined();
    expect(reopened.confirmations?.["2026-05-13"]).toMatchObject({ status: "not_done" });
  });

  it("verändert die übergebene Handlung nicht", () => {
    const original = action();
    applyConfirmationToAction(original, DATE, { status: "done_as_planned" }, audit);

    expect(original.confirmations).toBeUndefined();
  });
});

describe("applyConfirmationToAction — Neu planen mit Tageszeit", () => {
  it("hält die neue Tageszeit fest und nimmt sie beim Bestätigen als Snapshot", () => {
    const postponed = applyConfirmationToAction(
      action(),
      DATE,
      {
        status: "postponed",
        postponedToDayPart: DAY_PART_SEED_IDS.evening,
        postponedToTime: "18:00",
        postponedReason: "Termin verschoben",
      },
      audit,
    );
    expect(postponed.confirmations?.[DATE]).toMatchObject({
      postponedToDayPart: DAY_PART_SEED_IDS.evening,
      postponedToTime: "18:00",
    });

    const done = applyConfirmationToAction(postponed, DATE, { status: "done_as_planned" }, audit).confirmations?.[DATE];
    expect(done?.dayPartSnapshot).toMatchObject({ id: DAY_PART_SEED_IDS.evening, title: "Abend" });
    // Die Neuplanung bleibt als Herkunft des Termins erhalten.
    expect(done?.postponedToDayPart).toBe(DAY_PART_SEED_IDS.evening);
  });
});
