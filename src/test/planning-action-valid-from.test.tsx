import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";

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

  fireEvent.click(screen.getByRole("button", { name: /Neue Handlung erfassen/ }));
  return within(await screen.findByRole("dialog"));
};

describe("Gültig ab bei neuer geplanter Handlung", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("behält das Gültig-ab des Ziels bei Auswahl einer Vorlage", async () => {
    const panel = await openNewActionPanel();

    // Vorbelegung aus dem Ziel.
    expect(panel.getAllByDisplayValue("01.06.2026").length).toBeGreaterThan(0);

    panel.getByPlaceholderText(/Vorlage/i).focus();
    fireEvent.change(panel.getByPlaceholderText(/Vorlage/i), { target: { value: "Morgen" } });
    fireEvent.click(await panel.findByText("Morgenroutine"));

    // Die Vorlage überschreibt Titel & Co. (Titelfeld + Vorlagenfeld tragen den Namen),
    // das Datum bleibt stehen.
    expect(panel.getAllByDisplayValue("Morgenroutine").length).toBeGreaterThan(0);
    expect(panel.getByDisplayValue("Pflegeutensilien bereitstellen.")).toBeInTheDocument();
    expect(panel.getAllByDisplayValue("01.06.2026").length).toBeGreaterThan(0);
  });

  it("behält das Gültig-ab beim Wechsel auf «Ohne Vorlage»", async () => {
    const panel = await openNewActionPanel();

    fireEvent.click(panel.getByRole("button", { name: /Ohne Vorlage/ }));

    expect(panel.getAllByDisplayValue("01.06.2026").length).toBeGreaterThan(0);
  });
});
