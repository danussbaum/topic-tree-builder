import { describe, it, expect } from "vitest";
import { buildInhouseSpitexSeedTopics } from "@/lib/inhouse-spitex-seed";
import { effectiveDayPart, rollsToNextDay } from "@/lib/day-part-rollover";
import { collectOnDemandCandidates, isOnDemandPlanAction } from "@/lib/on-demand-action";
import { initialTemplates } from "@/lib/action-plan-templates";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";

describe("Beispielplanung Inhouse-Spitex", () => {
  const actions = buildInhouseSpitexSeedTopics()
    .flatMap((topic) => topic.targets)
    .flatMap((target) => target.actions);

  const umlagern = actions.filter((a) => a.title === "10501 Lagerung der Klientin im Bett");

  it("plant das nächtliche Umlagern dreimal pro Nacht in einer Gruppe", () => {
    expect(umlagern).toHaveLength(3);
    expect(new Set(umlagern.map((a) => a.groupId)).size).toBe(1);
    expect(umlagern.map((a) => a.scheduledTime).sort()).toEqual(["01:00", "04:00", "22:00"]);
    // Uhrzeit-Modus: die Tageszeit wird abgeleitet und nicht gespeichert.
    expect(umlagern.every((a) => a.dayPart === undefined)).toBe(true);
    expect(umlagern.every((a) => effectiveDayPart(a)?.title === "Nacht")).toBe(true);
    expect(umlagern.every((a) => a.recurrence === "daily")).toBe(true);
    // Jede Durchführung ist ein eigener Knoten und damit einzeln bestätigbar.
    expect(new Set(umlagern.map((a) => a.id)).size).toBe(3);
  });

  it("verschiebt 01:00 und 04:00 auf den Folgetag, 22:00 nicht", () => {
    const rolled = umlagern.filter((a) => rollsToNextDay(a)).map((a) => a.scheduledTime).sort();
    expect(rolled).toEqual(["01:00", "04:00"]);
  });

  it("gibt allen übrigen Handlungen weiterhin eine eigene Gruppe", () => {
    const others = actions.filter((a) => a.title !== "10501 Lagerung der Klientin im Bett");
    expect(new Set(others.map((a) => a.groupId)).size).toBe(others.length);
  });

  describe("Handlungen nach Bedarf", () => {
    const topics = buildInhouseSpitexSeedTopics();
    const onDemand = actions.filter(isOnDemandPlanAction);

    it("stellt die fachlich passenden Handlungsarten nach Bedarf bereit", () => {
      expect(onDemand.map((a) => a.title).sort()).toEqual([
        "10419 Begleitung bei Toilettengang",
        "10603 Medikamentenverabreichung",
        "10701 Kleiner Verband",
        "10909 Pflegeanleitung/Beratung Klientin oder Angehörige",
      ]);
    });

    it("nutzt dieselbe Klassifizierung wie die Handlungsart in den Vorlagen", () => {
      const categoryByTitle = new Map(
        initialTemplates.map((template) => [template.name, template.fields.kategorie]),
      );
      for (const action of onDemand) {
        expect(action.category).toBe(categoryByTitle.get(action.title));
      }
    });

    it("wird nie automatisch fällig, steht aber im Gültigkeitszeitraum zur Auswahl", () => {
      // Ohne Wiederholung erscheint keine der Handlungen von selbst in der Umsetzung.
      expect(onDemand.every((a) => a.recurrence === "on_demand")).toBe(true);

      const candidates = collectOnDemandCandidates(topics, "2026-08-05");
      expect(candidates.map((entry) => entry.action.title).sort()).toEqual(
        onDemand.map((a) => a.title).sort(),
      );
    });

    it("steht vor dem Planungsbeginn noch nicht zur Auswahl", () => {
      expect(collectOnDemandCandidates(topics, "2026-07-31")).toEqual([]);
    });

    it("belegt die Zeitangabe nur dort vor, wo sie fachlich feststeht", () => {
      const byTitle = new Map(onDemand.map((a) => [a.title, a]));
      // Die Anleitung der Angehörigen findet nachmittags statt.
      expect(byTitle.get("10909 Pflegeanleitung/Beratung Klientin oder Angehörige")?.dayPart).toBe(
        DAY_PART_SEED_IDS.afternoon,
      );
      // Verbandwechsel, Schmerzreserve und Toilettengang können jederzeit anfallen.
      for (const title of [
        "10419 Begleitung bei Toilettengang",
        "10603 Medikamentenverabreichung",
        "10701 Kleiner Verband",
      ]) {
        expect(byTitle.get(title)?.dayPart).toBeUndefined();
        expect(byTitle.get(title)?.scheduledTime).toBeUndefined();
      }
    });
  });
});
