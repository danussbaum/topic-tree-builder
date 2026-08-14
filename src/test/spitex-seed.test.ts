import { describe, it, expect } from "vitest";
import { buildInhouseSpitexSeedTopics } from "@/lib/inhouse-spitex-seed";
import { rollsToNextDay } from "@/lib/day-part-rollover";

describe("Beispielplanung Inhouse-Spitex", () => {
  const actions = buildInhouseSpitexSeedTopics()
    .flatMap((topic) => topic.targets)
    .flatMap((target) => target.actions);

  const umlagern = actions.filter((a) => a.title === "10501 Lagerung der Klientin im Bett");

  it("plant das nächtliche Umlagern dreimal pro Nacht in einer Gruppe", () => {
    expect(umlagern).toHaveLength(3);
    expect(new Set(umlagern.map((a) => a.groupId)).size).toBe(1);
    expect(umlagern.map((a) => a.scheduledTime).sort()).toEqual(["01:00", "04:00", "22:00"]);
    expect(umlagern.every((a) => a.dayPart === "night")).toBe(true);
    expect(umlagern.every((a) => a.recurrence === "daily")).toBe(true);
    // Jede Durchführung ist ein eigener Knoten und damit einzeln bestätigbar.
    expect(new Set(umlagern.map((a) => a.id)).size).toBe(3);
  });

  it("verschiebt 01:00 und 04:00 auf den Folgetag, 22:00 nicht", () => {
    const rolled = umlagern.filter(rollsToNextDay).map((a) => a.scheduledTime).sort();
    expect(rolled).toEqual(["01:00", "04:00"]);
  });

  it("gibt allen übrigen Handlungen weiterhin eine eigene Gruppe", () => {
    const others = actions.filter((a) => a.title !== "10501 Lagerung der Klientin im Bett");
    expect(new Set(others.map((a) => a.groupId)).size).toBe(others.length);
  });
});
