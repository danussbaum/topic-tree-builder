import { beforeEach, describe, expect, it } from "vitest";
import {
  formatActionResources,
  getResourceNames,
  initialActionPlanResources,
  loadActionPlanResources,
  parseResourceIds,
  resolveResourceIdsByName,
  saveActionPlanResources,
  serializeResourceIds,
  type ActionPlanResource,
} from "@/lib/action-plan-resources";
import { initialTemplates } from "@/lib/action-plan-templates";

describe("Hilfsmittel-Katalog", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("liefert den Seed-Katalog, solange nichts gespeichert ist", () => {
    expect(loadActionPlanResources()).toEqual(initialActionPlanResources);
  });

  it("speichert und lädt Hilfsmittel", () => {
    const resources: ActionPlanResource[] = [
      { id: "resource-x", name: "Testhilfsmittel", description: "Beschreibung", disciplineIds: [] },
    ];
    saveActionPlanResources(resources);
    expect(loadActionPlanResources()).toEqual(resources);
  });

  it("verwirft Einträge ohne Name beim Laden", () => {
    window.localStorage.setItem(
      "action-plan-resources-v1",
      JSON.stringify([{ id: "a", name: "" }, { id: "b", name: "Gültig" }]),
    );
    expect(loadActionPlanResources().map((entry) => entry.name)).toEqual(["Gültig"]);
  });

  it("serialisiert und liest IDs wieder ein", () => {
    const ids = ["resource-rutschbrett", "resource-rutschtuch"];
    expect(parseResourceIds(serializeResourceIds(ids))).toEqual(ids);
    expect(parseResourceIds("")).toEqual([]);
    expect(parseResourceIds("a|a|b")).toEqual(["a", "b"]);
  });

  it("bildet Namen aus dem CSV zurück auf IDs und meldet Unbekanntes", () => {
    const { resourceIds, invalidEntries } = resolveResourceIdsByName(
      "Rutschbrett, Gibt es nicht",
      initialActionPlanResources,
    );
    expect(resourceIds).toEqual(["resource-rutschbrett"]);
    expect(invalidEntries).toEqual(["Gibt es nicht"]);
  });

  it("stellt gewählte Hilfsmittel und Freitext gemeinsam dar", () => {
    const text = formatActionResources(
      { resourceIds: ["resource-rutschbrett"], requiredResources: "Eigenes Kissen" },
      initialActionPlanResources,
    );
    expect(text).toBe("Rutschbrett, Eigenes Kissen");
    expect(formatActionResources({}, initialActionPlanResources)).toBe("");
  });

  it("referenziert in den Vorlagen nur Hilfsmittel, die es im Katalog gibt", () => {
    const known = new Set(initialActionPlanResources.map((resource) => resource.id));
    const unknown = initialTemplates.flatMap((template) =>
      parseResourceIds(template.fields.hilfsmittel).filter((id) => !known.has(id)),
    );
    expect(unknown).toEqual([]);
  });

  it("hat für die Inhouse-Spitex-Handlungsarten Hilfsmittel hinterlegt", () => {
    const verband = initialTemplates.find((template) =>
      template.name.startsWith("10702"),
    );
    expect(
      getResourceNames(
        parseResourceIds(verband?.fields.hilfsmittel ?? ""),
        initialActionPlanResources,
      ),
    ).toContain("Verbandmaterial mittel");
  });

  it("hat zu jedem Hilfsmittel eine Beschreibung", () => {
    const ohneBeschreibung = initialActionPlanResources.filter(
      (resource) => resource.description.trim() === "",
    );
    expect(ohneBeschreibung).toEqual([]);
  });
});
