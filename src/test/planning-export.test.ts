import { describe, expect, it } from "vitest";
import {
  buildPlanningExportRows,
  PLANNING_EXPORT_HEADERS,
} from "@/lib/planning-export";
import { DAY_PART_SEED_IDS, initialDayParts } from "@/lib/day-parts";
import { initialActionPlanResources } from "@/lib/action-plan-resources";
import { initialActionPlanDisciplines } from "@/lib/action-plan-disciplines";
import type { ActionNode, Client } from "@/types/assessment";

const options = {
  disciplines: initialActionPlanDisciplines,
  resources: initialActionPlanResources,
  dayParts: initialDayParts,
};

const action = (overrides: Partial<ActionNode> & { id: string; groupId: string }): ActionNode => ({
  title: "Handlung",
  notes: "",
  status: "open",
  done: false,
  recurrence: "daily",
  ...overrides,
});

const client = (overrides: Partial<Client> = {}): Client => ({
  id: "c1",
  firstName: "Anna",
  lastName: "Muster",
  topics: [],
  ...overrides,
});

const withPlan = (actions: ActionNode[], disciplineId = initialActionPlanDisciplines[0].id) =>
  client({
    topics: [
      {
        id: "t1",
        title: "Mobilität",
        notes: "",
        disciplineId,
        targets: [
          {
            id: "tg1",
            title: "Selbständig gehen",
            notes: "Ziel-Notiz",
            validFrom: "2026-01-01",
            validTo: "2026-06-30",
            actions,
          },
        ],
      },
    ],
  });

describe("buildPlanningExportRows", () => {
  it("gibt für jede Handlungsgruppe eine Zeile mit den Basisdaten aus", () => {
    const rows = buildPlanningExportRows(
      [
        withPlan([
          action({
            id: "a1",
            groupId: "g1",
            title: "Gehtraining",
            notes: "Mit Rollator",
            dayPart: DAY_PART_SEED_IDS.morning,
            validFrom: "2026-01-01",
            plannedMinutes: 20,
            requiredPersons: 2,
            category: "b",
            resultRequirement: "required",
          }),
        ]),
      ],
      options,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      "Klient/in": "Anna Muster",
      Schwerpunkt: "Mobilität",
      Ziel: "Selbständig gehen",
      Zielbeschreibung: "Ziel-Notiz",
      "Ziel gültig ab": "2026-01-01",
      "Ziel gültig bis": "2026-06-30",
      Handlung: "Gehtraining",
      Beschreibung: "Mit Rollator",
      Planungsart: "Geplant",
      Wiederholung: "Täglich",
      Tageszeiten: "Morgen",
      "Gültig ab": "2026-01-01",
      Klassifizierung: "KLV B",
      "Minuten geplant": 20,
      Personen: 2,
      "Resultat erforderlich": "Ja",
    });
  });

  it("fasst mehrere Tageszeiten einer Gruppe in einer Zeile zusammen und zählt Durchführungen", () => {
    const rows = buildPlanningExportRows(
      [
        withPlan([
          action({ id: "a1", groupId: "g1", dayPart: DAY_PART_SEED_IDS.morning }),
          action({ id: "a2", groupId: "g1", dayPart: DAY_PART_SEED_IDS.morning }),
          action({ id: "a3", groupId: "g1", dayPart: DAY_PART_SEED_IDS.evening }),
        ]),
      ],
      options,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].Tageszeiten).toBe("2 × Morgen | Abend");
  });

  it("nimmt Uhrzeiten der Gruppe auf und leitet die Tageszeit daraus ab", () => {
    const rows = buildPlanningExportRows(
      [
        withPlan([
          action({ id: "a1", groupId: "g1", scheduledTime: "07:30" }),
          action({ id: "a2", groupId: "g1", scheduledTime: "19:00" }),
        ]),
      ],
      options,
    );

    expect(rows[0].Uhrzeit).toBe("07:30 | 19:00");
    expect(rows[0].Tageszeiten).toBe("Morgen | Abend");
  });

  it("kennzeichnet Nach-Bedarf-Handlungen und exportiert Wochentage nur bei wöchentlicher Wiederholung", () => {
    const rows = buildPlanningExportRows(
      [
        withPlan([
          action({ id: "a1", groupId: "g1", title: "Bedarf", recurrence: "on_demand" }),
          action({
            id: "a2",
            groupId: "g2",
            title: "Wöchentlich",
            recurrence: "weekly",
            recurrenceWeekdays: ["friday", "monday"],
          }),
        ]),
      ],
      options,
    );

    const bedarf = rows.find((row) => row.Handlung === "Bedarf");
    const weekly = rows.find((row) => row.Handlung === "Wöchentlich");
    expect(bedarf).toMatchObject({ Planungsart: "Nach Bedarf", Wiederholung: "Nach Bedarf", Wochentage: "" });
    expect(weekly).toMatchObject({ Planungsart: "Geplant", Wiederholung: "Wöchentlich", Wochentage: "Mo, Fr" });
  });

  it("filtert ungeplante Handlungen und Bedarfs-Durchführungen aus", () => {
    const rows = buildPlanningExportRows(
      [
        withPlan([
          action({ id: "a1", groupId: "g1", title: "Geplant" }),
          action({ id: "a2", groupId: "g2", title: "Ungeplant", isUnplanned: true }),
          action({ id: "a3", groupId: "g3", title: "Durchführung", isOnDemandOccurrence: true }),
        ]),
      ],
      options,
    );

    expect(rows.map((row) => row.Handlung)).toEqual(["Geplant"]);
  });

  it("gibt Ziele ohne Handlung und Schwerpunkte ohne Ziel mit leeren Spalten aus", () => {
    const rows = buildPlanningExportRows(
      [
        client({
          topics: [
            { id: "t1", title: "Ohne Ziel", notes: "", targets: [] },
            {
              id: "t2",
              title: "Mit Ziel",
              notes: "",
              targets: [{ id: "tg1", title: "Ziel ohne Handlung", notes: "", actions: [] }],
            },
          ],
        }),
      ],
      options,
    );

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.Schwerpunkt === "Ohne Ziel")).toMatchObject({ Ziel: "" });
    const ohneHandlung = rows.find((row) => row.Schwerpunkt === "Mit Ziel");
    expect(ohneHandlung).toMatchObject({ Ziel: "Ziel ohne Handlung" });
    // Handlungs-Spalten bleiben leer und werden beim Download zu leeren Zellen
    expect(ohneHandlung?.Handlung ?? "").toBe("");
  });

  it("sortiert nach Klient/in und innerhalb des Ziels nach Zeitplan", () => {
    const rows = buildPlanningExportRows(
      [
        withPlan([
          action({ id: "a1", groupId: "g1", title: "Abendhandlung", dayPart: DAY_PART_SEED_IDS.evening }),
          action({ id: "a2", groupId: "g2", title: "Morgenhandlung", dayPart: DAY_PART_SEED_IDS.morning }),
        ]),
        client({ id: "c2", firstName: "Bea", lastName: "Aebi" }),
      ],
      options,
    );

    expect(rows.map((row) => row.Handlung)).toEqual(["Morgenhandlung", "Abendhandlung"]);
  });

  it("exportiert Hilfsmittel aus Katalog und Freitext", () => {
    const resource = initialActionPlanResources[0];
    const rows = buildPlanningExportRows(
      [
        withPlan([
          action({ id: "a1", groupId: "g1", resourceIds: [resource.id], requiredResources: "Handtuch" }),
        ]),
      ],
      options,
    );

    expect(rows[0].Hilfsmittel).toBe(`${resource.name}, Handtuch`);
  });

  it("liefert Zeilen, die genau die Export-Header abdecken", () => {
    const rows = buildPlanningExportRows(
      [withPlan([action({ id: "a1", groupId: "g1" })])],
      options,
    );

    expect(Object.keys(rows[0]).every((key) => PLANNING_EXPORT_HEADERS.includes(key as never))).toBe(true);
  });
});
