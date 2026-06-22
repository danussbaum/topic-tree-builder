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
): ActionPlanTemplate => ({
  id,
  name,
  disciplineIds: [],
  fields: {
    ...buildDefaultTemplateFields(),
    kategorie,
    leistungsart,
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
      ["Alle", "Alpha", "KLV C", "Spitex, KLV c"],
      ["Alle", "Beta", "KLV A", "Spitex, KLV a"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Klassifizierung/i }));

    expect(getRowTexts()).toEqual([
      ["Alle", "Beta", "KLV A", "Spitex, KLV a"],
      ["Alle", "Alpha", "KLV C", "Spitex, KLV c"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Leistungsart/i }));

    expect(getRowTexts()).toEqual([
      ["Alle", "Beta", "KLV A", "Spitex, KLV a"],
      ["Alle", "Alpha", "KLV C", "Spitex, KLV c"],
    ]);
  });
});
