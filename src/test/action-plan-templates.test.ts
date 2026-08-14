import { afterEach, describe, expect, it } from "vitest";
import { DAY_PART_SEED_IDS } from "@/lib/day-parts";
import {
  ACTION_PLAN_TEMPLATES_STORAGE_KEY,
  ACTION_SERVICE_TYPE_SELECT_OPTIONS,
  buildDefaultTemplateEditable,
  buildDefaultTemplateFields,
  getActionServiceTypeLabel,
  getTemplateLockedActionFields,
  loadActionPlanTemplates,
  parseOptionalLeistungsarten,
  serializeOptionalLeistungsarten,
  parseTageszeit,
  resolveTemplateDisciplineIds,
  serializeTageszeit,
  templateMatchesDiscipline,
  normalizeTemplateSelectValue,
} from "@/lib/action-plan-templates";

afterEach(() => {
  window.localStorage.clear();
});

describe("normalizeTemplateSelectValue", () => {
  it("normalisiert importierte Labels auf gespeicherte Werte", () => {
    const options = [{ value: "a", label: "KLV A" }, { value: "b", label: "KLV B" }];
    expect(normalizeTemplateSelectValue("KLV B", options)).toBe("b");
    expect(normalizeTemplateSelectValue(" klv b ", options)).toBe("b");
  });

  it("behält bereits exportierte Werte bei", () => {
    expect(normalizeTemplateSelectValue("b", [{ value: "b", label: "KLV B" }])).toBe("b");
  });

  it("normalisiert leere Select-Importe auf den internen Leerwert", () => {
    expect(normalizeTemplateSelectValue("", [{ value: "none", label: "<leer>" }])).toBe("none");
  });
});

describe("action plan template fields", () => {
  it("codiert die Zeitangabe als einzelnen Modus im tageszeit-Feld", () => {
    // Die Uhrzeit ist kein eigenes Vorlagenfeld, sondern steckt im tageszeit-Wert.
    expect(buildDefaultTemplateFields()).not.toHaveProperty("uhrzeit");

    // Uhrzeit-Modus: nur Uhrzeiten, keine Tageszeit.
    expect(serializeTageszeit([{ scheduledTime: "14:00" }])).toBe("14:00");
    expect(parseTageszeit("14:00")).toEqual([{ scheduledTime: "14:00" }]);

    // Tageszeit-Modus: Titel, damit der Wert im CSV lesbar bleibt.
    expect(serializeTageszeit([{ dayPart: DAY_PART_SEED_IDS.afternoon }])).toBe("Nachmittag");
    expect(parseTageszeit("Nachmittag")).toEqual([{ dayPart: DAY_PART_SEED_IDS.afternoon }]);
  });

  it("stellt Leistungsart als internes Vorlagenfeld ohne Veränderbarkeit bereit", () => {
    expect(buildDefaultTemplateFields().leistungsart).toBe("none");
    expect(buildDefaultTemplateEditable(true).leistungsart).toBe(false);
    expect(ACTION_SERVICE_TYPE_SELECT_OPTIONS).toEqual([
      { value: "none", label: "<leer>" },
      { value: "spitex-klv-a", label: "Spitex, KLV a" },
      { value: "spitex-klv-b", label: "Spitex, KLV b" },
      { value: "spitex-klv-c", label: "Spitex, KLV c" },
      { value: "material-tape-1m", label: "Verbrauchsmaterial Tape 1m" },
      { value: "material-elektrodenset-4", label: "Verbrauchsmaterial Elektrodenset (4)" },
      { value: "zuschlag-physio", label: "Zuschlag Physio" },
    ]);
  });

  it("führt optionale Leistungsarten als eigenes, nicht veränderbares Vorlagenfeld", () => {
    expect(buildDefaultTemplateFields().optionaleLeistungsarten).toBe("");
    expect(buildDefaultTemplateEditable(true).optionaleLeistungsarten).toBe(false);
  });

  it("serialisiert optionale Leistungsarten ohne Anzahl und verwirft Unbekanntes", () => {
    expect(serializeOptionalLeistungsarten(["material-tape-1m", "zuschlag-physio"])).toBe(
      "material-tape-1m|zuschlag-physio",
    );
    expect(parseOptionalLeistungsarten("material-tape-1m|zuschlag-physio")).toEqual([
      "material-tape-1m",
      "zuschlag-physio",
    ]);
    // Leerwerte, Duplikate und unbekannte Typen fallen weg.
    expect(parseOptionalLeistungsarten("")).toEqual([]);
    expect(parseOptionalLeistungsarten("none")).toEqual([]);
    expect(parseOptionalLeistungsarten("material-tape-1m|material-tape-1m|quatsch")).toEqual([
      "material-tape-1m",
    ]);
  });

  it("ermittelt gesperrte Handlungsfelder aus nicht veränderbaren Vorlagenfeldern", () => {
    expect(
      getTemplateLockedActionFields({
        editable: {
          ...buildDefaultTemplateEditable(true),
          kategorie: false,
          beschreibung: false,
        },
      }),
    ).toEqual(["notes", "category", "serviceEntries", "optionalServiceTypes"]);
  });

  it("liefert Export-Labels für Leistungsarten", () => {
    expect(getActionServiceTypeLabel("spitex-klv-b")).toBe("Spitex, KLV b");
    expect(getActionServiceTypeLabel("none")).toBe("");
    expect(getActionServiceTypeLabel()).toBe("");
  });

  it("überführt die Uhrzeit älterer Vorlagen in das Tageszeit-Feld", () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        {
          id: "tpl-alt",
          name: "Alt",
          fields: { titel: "Alte Handlung", tageszeit: "afternoon", uhrzeit: "14:00" },
          editable: { titel: false },
        },
      ]),
    );

    const loaded = loadActionPlanTemplates()[0];
    // Das separate uhrzeit-Feld wird in tageszeit zusammengeführt und verworfen.
    expect(loaded.fields).not.toHaveProperty("uhrzeit");
    expect(loaded).toMatchObject({
      disciplineIds: [],
      fields: { titel: "Alte Handlung", tageszeit: "afternoon(14:00)", leistungsart: "none" },
      editable: { titel: false, leistungsart: false },
    });
  });
});

describe("action plan template disciplines", () => {
  const disciplines = [
    { id: "discipline-ihp", title: "IHP", authorizedRoleIds: [] },
    { id: "discipline-physio", title: "Physiotherapie", authorizedRoleIds: [] },
  ];

  it("zeigt Vorlagen ohne Disziplin für alle Planungs-Disziplinen an", () => {
    expect(templateMatchesDiscipline({ disciplineIds: [] }, "discipline-ihp")).toBe(true);
    expect(templateMatchesDiscipline({ disciplineIds: [] }, "discipline-physio")).toBe(true);
  });

  it("zeigt Vorlagen mit Disziplin nur für passende Planungs-Disziplinen an", () => {
    expect(templateMatchesDiscipline({ disciplineIds: ["discipline-ihp"] }, "discipline-ihp")).toBe(true);
    expect(templateMatchesDiscipline({ disciplineIds: ["discipline-ihp"] }, "discipline-physio")).toBe(false);
  });

  it("löst importierte Disziplinen über Titel und IDs auf", () => {
    expect(resolveTemplateDisciplineIds("IHP, discipline-physio, Unbekannt", disciplines)).toEqual({
      disciplineIds: ["discipline-ihp", "discipline-physio"],
      invalidEntries: ["Unbekannt"],
    });
  });
});
