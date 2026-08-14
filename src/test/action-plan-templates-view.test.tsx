import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ActionPlanTemplatesView } from "@/components/settings/ActionPlanTemplatesView";
import {
  ACTION_PLAN_TEMPLATES_STORAGE_KEY,
  buildDefaultTemplateEditable,
  buildDefaultTemplateFields,
  type ActionPlanTemplate,
} from "@/lib/action-plan-templates";

const createTemplate = (
  id: string,
  name: string,
  kategorie: string,
  leistungsart: string,
  wiederholung = "daily",
): ActionPlanTemplate => ({
  id,
  name,
  disciplineIds: [],
  fields: {
    ...buildDefaultTemplateFields(),
    kategorie,
    leistungsart,
    wiederholung,
  },
  editable: buildDefaultTemplateEditable(true),
});

const getTemplateRows = () => screen.getAllByRole("row").slice(1);

const getRowTexts = () =>
  getTemplateRows().map((row) =>
    within(row)
      .getAllByRole("cell")
      .map((cell) => cell.textContent),
  );

afterEach(() => {
  window.localStorage.clear();
});

describe("ActionPlanTemplatesView", () => {
  it("zeigt Klassifizierung und Leistungsart in der Übersicht und sortiert danach", () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        createTemplate("tpl-alpha", "Alpha", "c", "spitex-klv-c"),
        createTemplate("tpl-beta", "Beta", "a", "spitex-klv-a"),
      ]),
    );

    render(<ActionPlanTemplatesView searchQuery="" />);

    expect(screen.getByRole("button", { name: /Klassifizierung/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Leistungsart/i })).toBeInTheDocument();
    expect(getRowTexts()).toEqual([
      ["Alle", "Alpha", "KLV C", "Spitex, KLV c", "Täglich"],
      ["Alle", "Beta", "KLV A", "Spitex, KLV a", "Täglich"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Klassifizierung/i }));

    expect(getRowTexts()).toEqual([
      ["Alle", "Beta", "KLV A", "Spitex, KLV a", "Täglich"],
      ["Alle", "Alpha", "KLV C", "Spitex, KLV c", "Täglich"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Leistungsart/i }));

    expect(getRowTexts()).toEqual([
      ["Alle", "Beta", "KLV A", "Spitex, KLV a", "Täglich"],
      ["Alle", "Alpha", "KLV C", "Spitex, KLV c", "Täglich"],
    ]);
  });

  it("zeigt die Wiederholung in der Übersicht und sortiert danach", () => {
    window.localStorage.setItem(
      ACTION_PLAN_TEMPLATES_STORAGE_KEY,
      JSON.stringify([
        createTemplate("tpl-alpha", "Alpha", "c", "spitex-klv-c", "on_demand"),
        createTemplate("tpl-beta", "Beta", "a", "spitex-klv-a", "weekly"),
        createTemplate("tpl-gamma", "Gamma", "b", "spitex-klv-b", "monthly"),
      ]),
    );

    render(<ActionPlanTemplatesView searchQuery="" />);

    expect(getRowTexts().map((cells) => cells[4])).toEqual([
      "Nach Bedarf",
      "Wöchentlich",
      "Monatlich",
    ]);

    // Sortiert wird nach der angezeigten Bezeichnung, nicht nach dem internen Wert.
    fireEvent.click(screen.getByRole("button", { name: /Wiederholung/i }));

    expect(getRowTexts().map((cells) => [cells[1], cells[4]])).toEqual([
      ["Gamma", "Monatlich"],
      ["Alpha", "Nach Bedarf"],
      ["Beta", "Wöchentlich"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Wiederholung/i }));

    expect(getRowTexts().map((cells) => cells[4])).toEqual([
      "Wöchentlich",
      "Nach Bedarf",
      "Monatlich",
    ]);
  });

  describe("Zeitangabe einer Handlungsvorlage", () => {
    const openPanel = () => {
      window.localStorage.setItem(
        ACTION_PLAN_TEMPLATES_STORAGE_KEY,
        JSON.stringify([createTemplate("tpl-alpha", "Alpha", "none", "none")]),
      );
      render(<ActionPlanTemplatesView searchQuery="" />);
      fireEvent.click(screen.getByText("Alpha"));
    };

    it("bietet die Zeitangabe nicht als zwingend an", () => {
      openPanel();

      // Es ist immer ein Modus gewählt — "zwingend" wäre wirkungslos.
      expect(screen.queryByLabelText("Tageszeit zwingend")).not.toBeInTheDocument();
      // Bei einem gewöhnlichen Feld bleibt die Möglichkeit bestehen.
      expect(screen.getByLabelText("Klassifizierung zwingend")).toBeInTheDocument();
    });

    it("legt im Uhrzeit-Modus über den Link eine weitere Uhrzeit an", () => {
      openPanel();

      fireEvent.click(screen.getByRole("button", { name: "Uhrzeiten" }));
      expect(screen.getByLabelText("Uhrzeit 1")).toBeInTheDocument();

      // Regression: die neue Zeile wurde aus dem Vorlagen-String abgeleitet und
      // verschwand darum sofort wieder, weil eine leere Uhrzeit dort fehlt.
      fireEvent.click(screen.getByRole("button", { name: "Weitere Uhrzeit" }));
      expect(screen.getByLabelText("Uhrzeit 2")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Uhrzeit 1"), { target: { value: "07:30" } });
      fireEvent.change(screen.getByLabelText("Uhrzeit 2"), { target: { value: "11:00" } });
      fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

      const stored = JSON.parse(window.localStorage.getItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY)!);
      expect(stored[0].fields.tageszeit).toBe("07:30,11:00");
    });

    it("verweigert das Speichern einer leeren Uhrzeit", () => {
      openPanel();

      fireEvent.click(screen.getByRole("button", { name: "Uhrzeiten" }));
      fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

      expect(screen.getByText(/Tageszeit: .*unterschiedliche Uhrzeit/)).toBeInTheDocument();
      const stored = JSON.parse(window.localStorage.getItem(ACTION_PLAN_TEMPLATES_STORAGE_KEY)!);
      expect(stored[0].fields.tageszeit).toBe("none");
    });
  });
});
