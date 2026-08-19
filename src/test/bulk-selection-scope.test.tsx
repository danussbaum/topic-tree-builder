import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentOutline } from "@/components/assessment/AssessmentOutline";
import type { TopicNode } from "@/types/assessment";

const DATE = "2026-08-19";

const topics: TopicNode[] = [
  {
    id: "topic-1",
    title: "Schwerpunkt",
    notes: "",
    targets: [
      {
        id: "target-1",
        title: "Ziel",
        notes: "",
        actions: ["A", "B", "C"].map((name) => ({
          id: `action-${name}`,
          title: `Handlung ${name}`,
          notes: "",
          status: "open" as const,
          done: false,
          validFrom: DATE,
          recurrence: "daily" as const,
          plannedMinutes: 30,
        })),
      },
    ],
  },
];

const renderOutline = (onConfirmAction: ReturnType<typeof vi.fn>, mode: "notDone" | "done") =>
  render(
    <AssessmentOutline
      viewMode="confirmation"
      selectedDate={DATE}
      onSelectedDateChange={vi.fn()}
      confirmationPeriod="day"
      clientName="Test Klient"
      topics={topics}
      hideConfirmationHeader
      filterModel={{ statuses: ["open", "postponed"] }}
      bulkNotDoneMode={mode === "notDone"}
      onBulkNotDoneModeChange={vi.fn()}
      bulkDoneAsPlannedMode={mode === "done"}
      onBulkDoneAsPlannedModeChange={vi.fn()}
      onUpdateTopic={vi.fn()}
      onUpdateTarget={vi.fn()}
      onUpdateAction={vi.fn()}
      onUpdateActionField={vi.fn()}
      onConfirmAction={onConfirmAction}
      onAddTarget={vi.fn()}
      onAddAction={vi.fn()}
      onAddTopic={vi.fn()}
      onDeleteTopic={vi.fn()}
      onDeleteTarget={vi.fn()}
      onDeleteAction={vi.fn()}
    />,
  );

const selectRow = (title: string) => {
  const row = screen.getByText(title).closest("tr")!;
  fireEvent.click(within(row).getByLabelText(`Handlung ${title} für Mehrfachbestätigung auswählen`));
};

describe("Mehrfachauswahl bestätigt nur die ausgewählten Handlungen", () => {
  beforeEach(() => window.localStorage.clear());

  it("nicht durchgeführt: genau die zwei ausgewählten", () => {
    const onConfirmAction = vi.fn();
    renderOutline(onConfirmAction, "notDone");
    selectRow("Handlung A");
    selectRow("Handlung C");
    fireEvent.click(screen.getByRole("button", { name: /Ausgewählte als .Nicht durchgeführt/ }));
    fireEvent.change(screen.getByLabelText("Begründung"), { target: { value: "Grund" } });
    fireEvent.click(screen.getByRole("button", { name: /2 als .Nicht durchgeführt/ }));
    expect(onConfirmAction.mock.calls.map((c) => c[2]).sort()).toEqual(["action-A", "action-C"]);
  });

  it("erledigt wie geplant: genau die zwei ausgewählten", () => {
    const onConfirmAction = vi.fn();
    renderOutline(onConfirmAction, "done");
    selectRow("Handlung A");
    selectRow("Handlung C");
    fireEvent.click(screen.getByRole("button", { name: /Ausgewählte als .Erledigt wie geplant/ }));
    fireEvent.click(screen.getByRole("button", { name: /2 als .Erledigt wie geplant/ }));
    expect(onConfirmAction.mock.calls.map((c) => c[2]).sort()).toEqual(["action-A", "action-C"]);
  });
});
