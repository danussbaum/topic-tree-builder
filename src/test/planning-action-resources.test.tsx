import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import { saveActionPlanResources } from "@/lib/action-plan-resources";
import {
  buildDefaultTemplateEditable,
  buildDefaultTemplateFields,
  buildDefaultTemplateRequired,
  saveActionPlanTemplates,
} from "@/lib/action-plan-templates";
import type { TopicNode } from "@/types/assessment";

const topics: TopicNode[] = [
  {
    id: "topic-1",
    title: "Mobilität erhalten",
    notes: "",
    disciplineId: "discipline-ihp",
    targets: [{ id: "goal-a", title: "Ziel A", notes: "", validFrom: "2026-06-01", actions: [] }],
  },
];

const openNewActionPanel = async () => {
  render(
    <AssessmentOutline
      viewMode="planning"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      topics={topics}
      disciplines={[{ id: "discipline-ihp", title: "IHP", authorizedRoleIds: [] }]}
      onUpdateTopic={vi.fn()}
      onUpdateTarget={vi.fn()}
      onUpdateAction={vi.fn()}
      onUpdateActionField={vi.fn()}
      onConfirmAction={vi.fn()}
      onAddTarget={vi.fn()}
      onAddAction={vi.fn()}
      onUpdateActionGroup={vi.fn()}
      onAddTopic={vi.fn()}
      onUpdateTopicDiscipline={vi.fn()}
      onDeleteTopic={vi.fn()}
      onDeleteTarget={vi.fn()}
      onReactivateTarget={vi.fn()}
      onDeleteAction={vi.fn()}
      onDeleteActionGroup={vi.fn()}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /Mobilität erhalten/ }));
  fireEvent.click(screen.getByRole("button", { name: /Neue Handlung erfassen/ }));
  return within(await screen.findByRole("dialog"));
};

const openResourceDropdown = (panel: ReturnType<typeof within>) => {
  fireEvent.click(panel.getByLabelText("Hilfsmittel anzeigen"));
};

describe("Hilfsmittel-Auswahl in der Planung", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveActionPlanResources([
      { id: "r-ihp", name: "IHP-Hilfsmittel", description: "", disciplineIds: ["discipline-ihp"] },
      { id: "r-spitex", name: "Spitex-Hilfsmittel", description: "", disciplineIds: ["discipline-spitex"] },
      { id: "r-alle", name: "Allgemeines Hilfsmittel", description: "", disciplineIds: [] },
    ]);
    saveActionPlanTemplates([
      {
        id: "template-1",
        name: "Testvorlage",
        disciplineIds: ["discipline-ihp"],
        fields: { ...buildDefaultTemplateFields(), titel: "Testvorlage", hilfsmittel: "r-ihp" },
        editable: buildDefaultTemplateEditable(true),
        required: buildDefaultTemplateRequired(),
      },
    ]);
  });

  it("bietet ohne Vorlage nur Hilfsmittel der Disziplin des Themas an", async () => {
    const panel = await openNewActionPanel();
    fireEvent.click(panel.getByRole("button", { name: /Ohne Vorlage/ }));
    openResourceDropdown(panel);

    expect(panel.getByRole("button", { name: "IHP-Hilfsmittel" })).toBeInTheDocument();
    expect(panel.getByRole("button", { name: "Allgemeines Hilfsmittel" })).toBeInTheDocument();
    expect(panel.queryByRole("button", { name: "Spitex-Hilfsmittel" })).not.toBeInTheDocument();
  });

  it("bietet mit Vorlage nur die der Handlungsart zugeteilten Hilfsmittel an", async () => {
    const panel = await openNewActionPanel();

    fireEvent.change(panel.getByPlaceholderText(/Vorlage/i), { target: { value: "Testvorlage" } });
    fireEvent.click(await panel.findByText("Testvorlage"));

    openResourceDropdown(panel);

    // Das Hilfsmittel der Vorlage ist bereits gewählt (Badge), also nicht mehr in der Liste;
    // entscheidend ist, dass kein weiteres Hilfsmittel angeboten wird.
    expect(panel.getByLabelText("IHP-Hilfsmittel entfernen")).toBeInTheDocument();
    expect(panel.queryByRole("button", { name: "Allgemeines Hilfsmittel" })).not.toBeInTheDocument();
    expect(panel.queryByRole("button", { name: "Spitex-Hilfsmittel" })).not.toBeInTheDocument();
  });
});
