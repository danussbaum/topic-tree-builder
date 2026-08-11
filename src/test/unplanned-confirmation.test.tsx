import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline, UnplannedActionDialog } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";

const topicsWith = (isUnplanned: boolean): TopicNode[] => [
  {
    id: "topic-1",
    title: "Schwerpunkt",
    notes: "",
    targets: [
      {
        id: "target-1",
        title: "Ziel",
        notes: "",
        actions: [
          {
            id: "action-1",
            groupId: "group-1",
            title: "Spontane Begleitung",
            notes: "",
            status: "open",
            done: false,
            validFrom: "2026-05-12",
            validTo: "2026-05-12",
            recurrence: "daily",
            plannedMinutes: isUnplanned ? 0 : 30,
            isUnplanned: isUnplanned || undefined,
          },
        ],
      },
    ],
  },
];

const renderOutline = (isUnplanned: boolean) =>
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate="2026-05-12"
      onSelectedDateChange={vi.fn()}
      confirmationPeriod="day"
      clientName="Test Klient"
      topics={topicsWith(isUnplanned)}
      hideConfirmationHeader
      filterModel={{ statuses: ["open", "postponed"] }}
      onUpdateTopic={vi.fn()}
      onUpdateTarget={vi.fn()}
      onUpdateAction={vi.fn()}
      onUpdateActionField={vi.fn()}
      onConfirmAction={vi.fn()}
      onAddTarget={vi.fn()}
      onAddAction={vi.fn()}
      onAddTopic={vi.fn()}
      onDeleteTopic={vi.fn()}
      onDeleteTarget={vi.fn()}
      onDeleteAction={vi.fn()}
    />,
  );

describe("Ungeplante Handlungen ohne geplante Zeit", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("bietet im Erfassen-Dialog keine geplante Zeit an", async () => {
    render(
      <UnplannedActionDialog
        target={{ dueDate: "2026-05-12", dayPart: "none" }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.queryByText("Geplante Minuten")).not.toBeInTheDocument();
  });

  it("sperrt „Erledigt wie geplant“ bei einer ungeplanten Handlung", () => {
    renderOutline(true);

    expect(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]).toBeDisabled();
    // Die Abweichungs-Variante bleibt der gültige Weg.
    expect(screen.getAllByRole("button", { name: "Erledigt mit Abweichung" })[0]).toBeEnabled();
  });

  it("lässt „Erledigt wie geplant“ bei einer geplanten Handlung zu", () => {
    renderOutline(false);

    expect(screen.getAllByRole("button", { name: "Erledigt wie geplant" })[0]).toBeEnabled();
  });
});
