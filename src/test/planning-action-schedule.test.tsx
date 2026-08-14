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
