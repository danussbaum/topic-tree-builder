import { describe, expect, it } from "vitest";
import { buildUnplannedActionNodes, type UnplannedActionDraft } from "@/lib/unplanned-action";

const baseDraft = (overrides: Partial<UnplannedActionDraft> = {}): UnplannedActionDraft => ({
  title: "20033 Morgen- und Abendessen zubereiten",
  notes: "",
  dayPart: "none",
  dateFrom: "2026-07-08",
  dateTo: "2026-07-08",
  ...overrides,
});

describe("buildUnplannedActionNodes", () => {
  it("verwendet die übergebene Tageszeit, wenn der Draft nur 'none' trägt (Chip-Selektor)", () => {
    // Regression: früher gewann draft.dayPart="none" via ?? und verwarf die
    // eigentliche Tageszeit — die Handlung landete unter "OHNE TAGESZEIT".
    const morning = buildUnplannedActionNodes("morning", baseDraft(), "2026-07-08");
    const afternoon = buildUnplannedActionNodes("afternoon", baseDraft(), "2026-07-08");

    expect(morning).toHaveLength(1);
    expect(morning[0].dayPart).toBe("morning");
    expect(afternoon[0].dayPart).toBe("afternoon");
  });

  it("behält eine echte Tageszeit im Draft bei und ignoriert das Fallback-Argument", () => {
    const nodes = buildUnplannedActionNodes("morning", baseDraft({ dayPart: "evening" }), "2026-07-08");
    expect(nodes[0].dayPart).toBe("evening");
  });

  it("mappt 'none' auf undefined (keine Tageszeit)", () => {
    const nodes = buildUnplannedActionNodes("none", baseDraft(), "2026-07-08");
    expect(nodes[0].dayPart).toBeUndefined();
  });

  it("erzeugt je Tag im Von-Bis-Bereich eine Handlung mit eigener groupId", () => {
    const nodes = buildUnplannedActionNodes(
      "morning",
      baseDraft({ dateFrom: "2026-07-08", dateTo: "2026-07-10" }),
      "2026-07-08",
    );

    expect(nodes.map((n) => n.validFrom)).toEqual(["2026-07-08", "2026-07-09", "2026-07-10"]);
    nodes.forEach((n) => expect(n.validFrom).toBe(n.validTo));
    expect(new Set(nodes.map((n) => n.groupId)).size).toBe(3);
    expect(nodes.every((n) => n.isUnplanned && n.recurrence === "daily")).toBe(true);
  });

  it("fällt auf dueDate zurück, wenn kein Von-Datum vorhanden ist", () => {
    const nodes = buildUnplannedActionNodes(
      "morning",
      baseDraft({ dateFrom: undefined, dateTo: undefined }),
      "2026-07-15",
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0].validFrom).toBe("2026-07-15");
  });

  it("übernimmt Vorlagen-Metadaten (Name, gesperrte Felder) in jede Handlung", () => {
    const nodes = buildUnplannedActionNodes(
      "morning",
      baseDraft({
        dateFrom: "2026-07-08",
        dateTo: "2026-07-09",
        templateName: "20033 Morgen- und Abendessen zubereiten",
        templateLockedFields: ["title", "notes"],
      }),
      "2026-07-08",
    );
    expect(nodes).toHaveLength(2);
    nodes.forEach((n) => {
      expect(n.templateName).toBe("20033 Morgen- und Abendessen zubereiten");
      expect(n.templateLockedFields).toEqual(["title", "notes"]);
    });
  });
});
