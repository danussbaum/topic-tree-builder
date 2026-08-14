import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";
import {
  buildDefaultTemplateEditable,
  buildDefaultTemplateFields,
  buildDefaultTemplateRequired,
  saveActionPlanTemplates,
} from "@/lib/action-plan-templates";

const topics: TopicNode[] = [
  {
    id: "topic-1",
    title: "Mobilität erhalten",
    notes: "",
    disciplineId: "discipline-ihp",
    targets: [
      {
        id: "goal-a",
        title: "Ziel A",
        notes: "",
        validFrom: "2026-06-01",
        actions: [],
      },
    ],
  },
];

const openNewActionPanel = async (onAddAction = vi.fn()) => {
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
      onAddAction={onAddAction}
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
  return { panel: within(await screen.findByRole("dialog")), onAddAction };
};

describe("Zeitplan-Pflicht in der Planung", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("verweigert das Speichern ohne Bezeichnung", async () => {
    const { panel, onAddAction } = await openNewActionPanel();

    fireEvent.click(panel.getByRole("button", { name: /Ohne Vorlage/ }));
    fireEvent.click(panel.getByRole("button", { name: /^Speichern$/ }));

    expect(onAddAction).not.toHaveBeenCalled();
    expect(panel.getByText("Eine Bezeichnung ist zwingend.")).toBeInTheDocument();
  });

  it("verweigert das Speichern ohne Wiederholung", async () => {
    const { panel, onAddAction } = await openNewActionPanel();

    fireEvent.click(panel.getByRole("button", { name: /Ohne Vorlage/ }));
    fireEvent.change(panel.getByPlaceholderText("Handlung…"), { target: { value: "Ohne Plan" } });
    fireEvent.click(panel.getByRole("button", { name: /^Speichern$/ }));

    expect(onAddAction).not.toHaveBeenCalled();
    expect(
      panel.getByText(/Wiederholung ist zwingend/),
    ).toBeInTheDocument();
  });
});

describe("Vorbelegung der Zeitangabe in der Planung", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const saveTemplate = (name: string, tageszeit: string) => {
    saveActionPlanTemplates([
      {
        id: "tpl-1",
        name,
        disciplineIds: ["discipline-ihp"],
        fields: { ...buildDefaultTemplateFields(), titel: name, tageszeit },
        editable: buildDefaultTemplateEditable(true),
        required: buildDefaultTemplateRequired(),
      },
    ]);
  };

  const modeIsSelected = (panel: ReturnType<typeof within>, label: string) =>
    panel.getByRole("button", { name: label }).getAttribute("aria-pressed") === "true";

  it("belegt ohne Vorlage nichts vor", async () => {
    const { panel } = await openNewActionPanel();

    fireEvent.click(panel.getByRole("button", { name: /Ohne Vorlage/ }));

    expect(modeIsSelected(panel, "Ohne Zeitangabe")).toBe(true);
    expect(panel.queryByRole("button", { name: "Morgen" })).not.toBeInTheDocument();
  });

  it("übernimmt 'Ohne Zeitangabe' aus der Handlungsart", async () => {
    // Regression: hier wurde die erste Tageszeit (Morgen) vorbelegt und damit der
    // Handlungsart widersprochen, die bewusst keine Zeitangabe vorgibt.
    saveTemplate("Ohne Zeit", "none");
    const { panel } = await openNewActionPanel();

    fireEvent.change(panel.getByPlaceholderText(/Vorlage/i), { target: { value: "Ohne Zeit" } });
    fireEvent.click(await panel.findByText("Ohne Zeit"));

    expect(modeIsSelected(panel, "Ohne Zeitangabe")).toBe(true);
    expect(panel.queryByRole("button", { name: "Morgen" })).not.toBeInTheDocument();
  });

  it("übernimmt die Tageszeiten der Handlungsart", async () => {
    saveTemplate("Mit Tageszeit", "Abend");
    const { panel } = await openNewActionPanel();

    fireEvent.change(panel.getByPlaceholderText(/Vorlage/i), { target: { value: "Mit Tageszeit" } });
    fireEvent.click(await panel.findByText("Mit Tageszeit"));

    expect(modeIsSelected(panel, "Tageszeiten")).toBe(true);
    expect(panel.getByRole("button", { name: "Abend" })).toHaveAttribute("aria-pressed", "true");
    expect(panel.getByRole("button", { name: "Morgen" })).toHaveAttribute("aria-pressed", "false");
  });

  it("übernimmt die Uhrzeiten der Handlungsart", async () => {
    saveTemplate("Mit Uhrzeit", "07:30,11:00");
    const { panel } = await openNewActionPanel();

    fireEvent.change(panel.getByPlaceholderText(/Vorlage/i), { target: { value: "Mit Uhrzeit" } });
    fireEvent.click(await panel.findByText("Mit Uhrzeit"));

    expect(modeIsSelected(panel, "Uhrzeiten")).toBe(true);
    expect(panel.getByLabelText("Uhrzeit 1")).toHaveValue("07:30");
    expect(panel.getByLabelText("Uhrzeit 2")).toHaveValue("11:00");
  });
});
